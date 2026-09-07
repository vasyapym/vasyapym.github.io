//go:build js && wasm

package main

import (
	"strconv"
	"syscall/js"

	"spine/internal/codegen"
	"spine/internal/command"
	"spine/internal/model"
	"spine/internal/serialize"
)

var (
	doc          js.Value
	history      *command.History
	selectedID   string
	dragID       string
	dropTargetEl js.Value

	// Pointer-drag state. Touch/pen only — mouse still rides the HTML5
	// drag path, which works and is already smoke-tested.
	ptrID       int
	ptrActive   bool
	ptrEngaged  bool
	ptrStartX   float64
	ptrStartY   float64
	ptrCandID   string
	justDragged bool
)

// ptrDragThreshold is the slop below which a touch is a tap, not a drag;
// staying below it keeps the gesture a plain selection.
const ptrDragThreshold = 8.0

func main() {
	doc = js.Global().Get("document")

	root := loadInitial()
	history = command.NewHistory(root)
	selectedID = root.ID
	history.OnChange = onChange

	// The React shell may unmount/remount this page (SPA navigation,
	// StrictMode double-mount). Re-binding is cheaper than re-instantiating
	// the wasm module: the tree and history live on in Go. Binding happens
	// ONLY through this hook — the loader fires it exactly once per mount
	// (a mount-sequence guard dedupes StrictMode's double invoke), so the
	// same DOM is never wired twice.
	js.Global().Set("spineRebind", js.FuncOf(func(_ js.Value, _ []js.Value) any {
		bindUI()
		return nil
	}))

	js.Global().Set("spineReady", true)
	select {} // keep the Go runtime alive
}

func bindUI() {
	wireDelegation()
	wireToolbar()
	wireInspector()
	render()
}

func loadInitial() *model.Node {
	hash := js.Global().Get("location").Get("hash").String()
	if len(hash) > 1 {
		if r, err := serialize.Decode(hash[1:]); err == nil {
			return r
		}
	}
	return demoTree()
}

func demoTree() *model.Node {
	root := model.NewContainer()
	root.Props.Label = "root"
	root.Props.Gap = "12px"
	root.InsertChild(model.NewItem("A"), 0)
	inner := model.NewContainer()
	inner.Props.FlexDirection = "column"
	inner.InsertChild(model.NewItem("B"), 0)
	inner.InsertChild(model.NewItem("C"), 1)
	root.InsertChild(inner, 1)
	root.InsertChild(model.NewItem("D"), 2)
	return root
}

// ---- Event delegation on the canvas root ----

func wireDelegation() {
	canvas := doc.Call("getElementById", "spine-canvas")
	if !canvas.Truthy() {
		return
	}

	canvas.Call("addEventListener", "click", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		// After an engaged pointer drag the browser still emits a click
		// (retargeted to the canvas) — swallow it so a drop never also
		// reselects.
		if justDragged {
			justDragged = false
			return nil
		}
		el := e.Get("target").Call("closest", "[data-id]")
		if el.Truthy() {
			e.Call("stopPropagation")
			selectedID = el.Get("dataset").Get("id").String()
			render()
		}
		return nil
	}))

	canvas.Call("addEventListener", "dragstart", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		el := e.Get("target").Call("closest", "[data-id]")
		if el.Truthy() {
			dragID = el.Get("dataset").Get("id").String()
			// Dim the source explicitly so the translucent drag ghost
			// reads as "this box is being carried", not as a glitch.
			el.Get("classList").Call("add", "dragging")
			e.Get("dataTransfer").Set("effectAllowed", "move")
		}
		return nil
	}))

	canvas.Call("addEventListener", "dragover", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		e.Call("preventDefault") // required for the drop event to fire
		el := e.Get("target").Call("closest", "[data-id]")
		if !el.Truthy() {
			return nil
		}
		id := el.Get("dataset").Get("id").String()
		if id == dragID {
			return nil // no drop-target theatre on the dragged box itself
		}
		current := ""
		if dropTargetEl.Truthy() {
			current = dropTargetEl.Get("dataset").Get("id").String()
		}
		if id != current {
			clearDropTarget()
			dropTargetEl = el
			el.Get("classList").Call("add", "drop-target")
		}
		return nil
	}))

	canvas.Call("addEventListener", "dragleave", js.FuncOf(func(_ js.Value, a []js.Value) any {
		related := a[0].Get("relatedTarget")
		// dragleave fires between children all the time; only clear when
		// the pointer truly left the canvas.
		if !related.Truthy() || !canvas.Call("contains", related).Truthy() {
			clearDropTarget()
		}
		return nil
	}))

	canvas.Call("addEventListener", "drop", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		e.Call("preventDefault")
		clearDropTarget()
		if dragID == "" {
			return nil
		}
		el := e.Get("target").Call("closest", "[data-id]")
		if el.Truthy() {
			targetID := el.Get("dataset").Get("id").String()
			handleDrop(dragID, targetID)
		}
		dragID = ""
		return nil
	}))

	// dragend fires on the source after a drop or a cancelled drag. The
	// source element may already have been replaced by a re-render, so
	// sweep any leftover marker class off whatever is in the canvas now.
	canvas.Call("addEventListener", "dragend", js.FuncOf(func(_ js.Value, _ []js.Value) any {
		dragID = ""
		clearDropTarget()
		marked := canvas.Call("querySelectorAll", ".dragging")
		for i := 0; i < marked.Length(); i++ {
			marked.Index(i).Get("classList").Call("remove", "dragging")
		}
		return nil
	}))

	// --- Pointer path: touch/pen only. HTML5 drag events never fire on
	// touch devices, which left the core interaction dead on phones.
	// Capture engages at pointerdown, not at first movement: events then
	// retarget to the canvas no matter where the finger wanders, so a lift
	// over the topbar can never strand the state machine in ARMED.

	canvas.Call("addEventListener", "pointerdown", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		if e.Get("pointerType").String() == "mouse" {
			return nil // desktop keeps the native drag path
		}
		if ptrActive {
			return nil // one finger owns the gesture; ignore the rest
		}
		el := e.Get("target").Call("closest", "[data-id]")
		if !el.Truthy() {
			return nil
		}
		// Deliberately no preventDefault: cancelling here would kill the
		// synthesised click that mouse-style input still relies on.
		ptrActive = true
		ptrEngaged = false
		ptrID = e.Get("pointerId").Int()
		ptrStartX = e.Get("clientX").Float()
		ptrStartY = e.Get("clientY").Float()
		ptrCandID = el.Get("dataset").Get("id").String()
		// Capture on the canvas, not the node: the canvas is never
		// replaced (only its innerHTML), so the capture survives, and
		// every later move/up/cancel lands here even off-canvas.
		safeCapture(canvas, ptrID)
		return nil
	}))

	canvas.Call("addEventListener", "pointermove", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		if !ptrActive || e.Get("pointerId").Int() != ptrID {
			return nil
		}
		x := e.Get("clientX").Float()
		y := e.Get("clientY").Float()
		if !ptrEngaged {
			dx := x - ptrStartX
			dy := y - ptrStartY
			if dx*dx+dy*dy < ptrDragThreshold*ptrDragThreshold {
				return nil // still a tap
			}
			ptrEngaged = true
			dragID = ptrCandID
			src := canvas.Call("querySelector", "[data-id=\""+dragID+"\"]")
			if src.Truthy() {
				src.Get("classList").Call("add", "dragging")
			}
		}
		e.Call("preventDefault") // once engaged, the gesture is ours

		// Capture redirects events to the canvas, so the event target is
		// useless for hit-testing — ask the document what is under the finger.
		hit := doc.Call("elementFromPoint", x, y)
		if !hit.Truthy() {
			clearDropTarget()
			return nil
		}
		el := hit.Call("closest", "[data-id]")
		if !el.Truthy() {
			clearDropTarget()
			return nil
		}
		id := el.Get("dataset").Get("id").String()
		if id == dragID {
			return nil // no drop-target theatre on the dragged box itself
		}
		current := ""
		if dropTargetEl.Truthy() {
			current = dropTargetEl.Get("dataset").Get("id").String()
		}
		if id != current {
			clearDropTarget()
			dropTargetEl = el
			el.Get("classList").Call("add", "drop-target")
		}
		return nil
	}))

	canvas.Call("addEventListener", "pointerup", js.FuncOf(func(_ js.Value, a []js.Value) any {
		e := a[0]
		if !ptrActive || e.Get("pointerId").Int() != ptrID {
			return nil
		}
		if !ptrEngaged {
			// A tap. Capture retargets the derived click to the canvas,
			// where closest("[data-id]") fails — so selection happens
			// here, explicitly, instead of riding the click.
			selectedID = ptrCandID
			endPointerDrag(canvas)
			render()
			return nil
		}
		targetID := ""
		if dropTargetEl.Truthy() {
			targetID = dropTargetEl.Get("dataset").Get("id").String()
		}
		src := dragID
		justDragged = true
		endPointerDrag(canvas)
		if src != "" && targetID != "" {
			handleDrop(src, targetID) // re-renders through the command layer
		}
		return nil
	}))

	canvas.Call("addEventListener", "pointercancel", js.FuncOf(func(_ js.Value, a []js.Value) any {
		if ptrActive && a[0].Get("pointerId").Int() == ptrID {
			endPointerDrag(canvas)
		}
		return nil
	}))

	// The OS can steal a capture (system gesture, page switch); treat it as
	// an abort rather than leaving marker classes stuck on the tree. The
	// explicit release in endPointerDrag also fires this; ptrActive is
	// already false by then, so the handler is a no-op.
	canvas.Call("addEventListener", "lostpointercapture", js.FuncOf(func(_ js.Value, a []js.Value) any {
		if ptrActive && a[0].Get("pointerId").Int() == ptrID {
			endPointerDrag(canvas)
		}
		return nil
	}))
}

// safeCapture swallows the InvalidPointerId that setPointerCapture throws
// for pointer ids the browser is not tracking (synthetic events in tests,
// pointers already released). A failed capture only costs us out-of-canvas
// moves, so it must never abort the gesture.
func safeCapture(el js.Value, id int) {
	defer func() { _ = recover() }()
	el.Call("setPointerCapture", id)
}

// safeRelease mirrors safeCapture for the same reason.
func safeRelease(el js.Value, id int) {
	defer func() { _ = recover() }()
	if el.Call("hasPointerCapture", id).Truthy() {
		el.Call("releasePointerCapture", id)
	}
}

// endPointerDrag returns to IDLE and sweeps marker classes off the whole
// canvas — the source ref may be stale after a re-render, the classes may not.
func endPointerDrag(canvas js.Value) {
	if ptrActive {
		safeRelease(canvas, ptrID)
	}
	ptrActive = false
	ptrEngaged = false
	ptrCandID = ""
	dragID = ""
	clearDropTarget()
	marked := canvas.Call("querySelectorAll", ".dragging, .drop-target")
	for i := 0; i < marked.Length(); i++ {
		cl := marked.Index(i).Get("classList")
		cl.Call("remove", "dragging")
		cl.Call("remove", "drop-target")
	}
}

// clearDropTarget removes the highlight from the tracked drop target (the
// element may already be detached after a re-render — removing a class from
// a detached node is harmless).
func clearDropTarget() {
	if dropTargetEl.Truthy() {
		dropTargetEl.Get("classList").Call("remove", "drop-target")
	}
	dropTargetEl = js.Value{}
}

func handleDrop(srcID, targetID string) {
	if srcID == targetID {
		return
	}
	root := history.Root()
	src, _ := root.Find(srcID)
	target, targetParent := root.Find(targetID)
	if src == nil || target == nil {
		return
	}
	if src.IsAncestorOf(targetID) {
		return // no cycles
	}
	if target.Kind == model.KindContainer {
		// Drop into a container → append as last child.
		history.Do(&command.Move{NodeID: srcID, ToParent: targetID, ToIndex: len(target.Children)})
		return
	}
	// Drop onto an item → insert before it in its parent.
	if targetParent != nil {
		idx := targetParent.IndexOf(targetID)
		history.Do(&command.Move{NodeID: srcID, ToParent: targetParent.ID, ToIndex: idx})
	}
}

// ---- Toolbar ----

func wireToolbar() {
	on("spine-btn-add-item", "click", func(js.Value) {
		if p := selectedContainer(); p != nil {
			history.Do(&command.Add{ParentID: p.ID, Index: len(p.Children), New: model.NewItem("item")})
		}
	})
	on("spine-btn-add-container", "click", func(js.Value) {
		if p := selectedContainer(); p != nil {
			history.Do(&command.Add{ParentID: p.ID, Index: len(p.Children), New: model.NewContainer()})
		}
	})
	on("spine-btn-delete", "click", func(js.Value) {
		if selectedID != history.Root().ID {
			history.Do(&command.Remove{NodeID: selectedID})
			selectedID = history.Root().ID
		}
	})
	on("spine-btn-undo", "click", func(js.Value) { history.Undo() })
	on("spine-btn-redo", "click", func(js.Value) { history.Redo() })
	on("spine-btn-reset", "click", func(js.Value) {
		history.Do(command.NewReplaceTree(demoTree()))
		selectedID = history.Root().ID // selection back to the fresh root
		render()                       // re-renders + re-syncs the URL hash
	})
	on("spine-btn-copy", "click", func(js.Value) {
		html := doc.Call("getElementById", "spine-code-html").Get("textContent").String()
		css := doc.Call("getElementById", "spine-code-css").Get("textContent").String()
		js.Global().Get("navigator").Get("clipboard").Call("writeText", html+"\n\n/* CSS */\n"+css)
		// Transient feedback: the copy used to be silent, so visitors could
		// not tell it fired. Swap the label for a beat, then restore it.
		btn := doc.Call("getElementById", "spine-btn-copy")
		btn.Set("textContent", "Copied")
		var restore js.Func
		restore = js.FuncOf(func(js.Value, []js.Value) any {
			btn.Set("textContent", "Copy")
			restore.Release()
			return nil
		})
		js.Global().Call("setTimeout", restore, 1200)
	})
}

// selectedContainer returns the selected node if it is a container, else root.
func selectedContainer() *model.Node {
	n, _ := history.Root().Find(selectedID)
	if n != nil && n.Kind == model.KindContainer {
		return n
	}
	return history.Root()
}

// ---- Inspector ----

var inspectorFields = []string{
	"justify-content", "align-items", "flex-direction", "flex-wrap", "gap",
	"grid-template-columns", "grid-template-rows", "grid-auto-flow",
	"flex-grow", "order", "mode",
}

func wireInspector() {
	for _, id := range inspectorFields {
		on("spine-f-"+id, "change", func(js.Value) { applyInspector() })
		on("spine-f-"+id, "input", func(js.Value) { applyInspector() })
	}
}

func applyInspector() {
	n, _ := history.Root().Find(selectedID)
	if n == nil {
		return
	}
	oldProps, oldMode := n.Props, n.Mode
	np := oldProps
	nm := oldMode

	// Container-only fields: only read them for containers, so stale values
	// from a previously selected container never leak into an item's props.
	if n.Kind == model.KindContainer {
		np.JustifyContent = val("spine-f-justify-content")
		np.AlignItems = val("spine-f-align-items")
		np.FlexDirection = val("spine-f-flex-direction")
		np.FlexWrap = val("spine-f-flex-wrap")
		np.GridTemplateColumns = val("spine-f-grid-template-columns")
		np.GridTemplateRows = val("spine-f-grid-template-rows")
		np.GridAutoFlow = val("spine-f-grid-auto-flow")
		if val("spine-f-mode") == "grid" {
			nm = model.ModeGrid
		} else {
			nm = model.ModeFlex
		}
	}
	np.Gap = val("spine-f-gap")
	np.FlexGrow = atoi(val("spine-f-flex-grow"))
	np.Order = atoi(val("spine-f-order"))

	if np == oldProps && nm == oldMode {
		return
	}
	history.Do(&command.SetProps{NodeID: n.ID, OldProps: oldProps, NewProps: np, OldMode: oldMode, NewMode: nm})
}

func populateInspector(n *model.Node) {
	setVal("spine-f-justify-content", n.Props.JustifyContent)
	setVal("spine-f-align-items", n.Props.AlignItems)
	setVal("spine-f-flex-direction", n.Props.FlexDirection)
	setVal("spine-f-flex-wrap", n.Props.FlexWrap)
	setVal("spine-f-gap", n.Props.Gap)
	setVal("spine-f-grid-template-columns", n.Props.GridTemplateColumns)
	setVal("spine-f-grid-template-rows", n.Props.GridTemplateRows)
	setVal("spine-f-grid-auto-flow", n.Props.GridAutoFlow)
	setVal("spine-f-flex-grow", strconv.Itoa(n.Props.FlexGrow))
	setVal("spine-f-order", strconv.Itoa(n.Props.Order))
	if n.Mode == model.ModeGrid {
		setVal("spine-f-mode", "grid")
	} else {
		setVal("spine-f-mode", "flex")
	}

	// Selection echo in the heading: runs every render (select, undo, redo,
	// add, delete), so the label never desyncs from the canvas outline.
	if el := doc.Call("getElementById", "spine-sel-label"); el.Truthy() {
		name := n.Props.Label
		if name == "" {
			if n.Kind == model.KindContainer {
				name = "container"
			} else {
				name = "item"
			}
		}
		el.Set("textContent", name)
	}

	isContainer := n.Kind == model.KindContainer
	toggleClass("spine-panel-flex", "hidden", !(isContainer && n.Mode == model.ModeFlex))
	toggleClass("spine-panel-grid", "hidden", !(isContainer && n.Mode == model.ModeGrid))
	toggleClass("spine-panel-mode", "hidden", !isContainer)
}

// ---- Rendering ----

func onChange() { render() }

func render() {
	root := history.Root()
	canvas := doc.Call("getElementById", "spine-canvas")
	if !canvas.Truthy() {
		return
	}
	canvas.Set("innerHTML", "")
	canvas.Call("appendChild", buildDOM(root))

	if n, _ := root.Find(selectedID); n != nil {
		populateInspector(n)
	}
	updateCode(root)
	updateHistoryButtons()
	syncHash(root)
}

func buildDOM(n *model.Node) js.Value {
	el := doc.Call("createElement", "div")
	el.Get("dataset").Set("id", n.ID)
	el.Call("setAttribute", "draggable", "true")

	cls := "node"
	if n.Kind == model.KindContainer {
		cls += " container"
	} else {
		cls += " item"
	}
	if n.ID == selectedID {
		cls += " selected"
	}
	el.Set("className", cls)

	style := el.Get("style")
	if n.Kind == model.KindContainer {
		if n.Mode == model.ModeFlex {
			style.Set("display", "flex")
			style.Set("flexDirection", n.Props.FlexDirection)
			style.Set("flexWrap", n.Props.FlexWrap)
			style.Set("justifyContent", n.Props.JustifyContent)
			style.Set("alignItems", n.Props.AlignItems)
		} else {
			style.Set("display", "grid")
			style.Set("gridTemplateColumns", n.Props.GridTemplateColumns)
			style.Set("gridTemplateRows", n.Props.GridTemplateRows)
			style.Set("gridAutoFlow", n.Props.GridAutoFlow)
		}
		style.Set("gap", n.Props.Gap)
	}
	if n.Props.FlexGrow != 0 {
		style.Set("flexGrow", strconv.Itoa(n.Props.FlexGrow))
	}
	if n.Props.Order != 0 {
		style.Set("order", strconv.Itoa(n.Props.Order))
	}

	if len(n.Children) == 0 {
		label := n.Props.Label
		if n.Kind == model.KindContainer {
			label = "empty " + label
		}
		el.Set("textContent", label)
	} else {
		for _, c := range n.Children {
			el.Call("appendChild", buildDOM(c))
		}
	}
	return el
}

func updateCode(root *model.Node) {
	html, cssOut := codegen.Generate(root)
	doc.Call("getElementById", "spine-code-html").Set("textContent", html)
	doc.Call("getElementById", "spine-code-css").Set("textContent", cssOut)
}

func updateHistoryButtons() {
	doc.Call("getElementById", "spine-btn-undo").Set("disabled", !history.CanUndo())
	doc.Call("getElementById", "spine-btn-redo").Set("disabled", !history.CanRedo())
}

func syncHash(root *model.Node) {
	if s, err := serialize.Encode(root); err == nil {
		js.Global().Get("history").Call("replaceState", nil, "", "#"+s)
	}
}

// ---- small DOM helpers ----

func on(id, event string, fn func(js.Value)) {
	el := doc.Call("getElementById", id)
	if !el.Truthy() {
		return
	}
	el.Call("addEventListener", event, js.FuncOf(func(_ js.Value, a []js.Value) any {
		fn(a[0])
		return nil
	}))
}

func val(id string) string {
	el := doc.Call("getElementById", id)
	if !el.Truthy() {
		return ""
	}
	return el.Get("value").String()
}

func setVal(id, v string) {
	el := doc.Call("getElementById", id)
	if !el.Truthy() {
		return
	}
	// Don't fight the user: skip the field they are typing in right now.
	if doc.Get("activeElement").Equal(el) {
		return
	}
	el.Set("value", v)
}

func toggleClass(id, cls string, add bool) {
	el := doc.Call("getElementById", id)
	if el.Truthy() {
		el.Get("classList").Call("toggle", cls, add)
	}
}

func atoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}
