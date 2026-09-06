package command

import "spine/internal/model"

// Command mutates the tree reversibly.
type Command interface {
	Apply(root *model.Node)
	Revert(root *model.Node)
	Name() string
}

// History manages undo/redo stacks and fires a change callback.
type History struct {
	root     *model.Node
	undo     []Command
	redo     []Command
	OnChange func()
}

func NewHistory(root *model.Node) *History {
	return &History{root: root}
}

func (h *History) Root() *model.Node { return h.root }

func (h *History) Do(c Command) {
	c.Apply(h.root)
	h.undo = append(h.undo, c)
	h.redo = h.redo[:0]
	h.fire()
}

func (h *History) CanUndo() bool { return len(h.undo) > 0 }
func (h *History) CanRedo() bool { return len(h.redo) > 0 }

func (h *History) Undo() {
	if !h.CanUndo() {
		return
	}
	c := h.undo[len(h.undo)-1]
	h.undo = h.undo[:len(h.undo)-1]
	c.Revert(h.root)
	h.redo = append(h.redo, c)
	h.fire()
}

func (h *History) Redo() {
	if !h.CanRedo() {
		return
	}
	c := h.redo[len(h.redo)-1]
	h.redo = h.redo[:len(h.redo)-1]
	c.Apply(h.root)
	h.undo = append(h.undo, c)
	h.fire()
}

func (h *History) fire() {
	if h.OnChange != nil {
		h.OnChange()
	}
}

// ---- Concrete commands ----

// SetProps replaces a node's Props (and Mode) wholesale, snapshotting the old.
type SetProps struct {
	NodeID   string
	OldProps model.Props
	NewProps model.Props
	OldMode  model.Mode
	NewMode  model.Mode
}

func (c *SetProps) Name() string { return "edit properties" }

func (c *SetProps) Apply(root *model.Node) {
	if n, _ := root.Find(c.NodeID); n != nil {
		n.Props = c.NewProps
		n.Mode = c.NewMode
	}
}
func (c *SetProps) Revert(root *model.Node) {
	if n, _ := root.Find(c.NodeID); n != nil {
		n.Props = c.OldProps
		n.Mode = c.OldMode
	}
}

// Add inserts New under ParentID at Index.
type Add struct {
	ParentID string
	Index    int
	New      *model.Node
}

func (c *Add) Name() string { return "add node" }

func (c *Add) Apply(root *model.Node) {
	if p, _ := root.Find(c.ParentID); p != nil {
		p.InsertChild(c.New, c.Index)
	}
}
func (c *Add) Revert(root *model.Node) {
	if p, _ := root.Find(c.ParentID); p != nil {
		p.RemoveChild(c.New.ID)
	}
}

// Remove deletes NodeID, remembering where it was for revert.
type Remove struct {
	NodeID   string
	parentID string
	index    int
	removed  *model.Node
}

func (c *Remove) Name() string { return "delete node" }

func (c *Remove) Apply(root *model.Node) {
	n, p := root.Find(c.NodeID)
	if n == nil || p == nil {
		return
	}
	c.parentID = p.ID
	c.index = p.IndexOf(n.ID)
	c.removed = p.RemoveChild(n.ID)
}
func (c *Remove) Revert(root *model.Node) {
	if c.removed == nil {
		return
	}
	if p, _ := root.Find(c.parentID); p != nil {
		p.InsertChild(c.removed, c.index)
	}
}

// Move reparents/reorders NodeID to ToParent at ToIndex.
type Move struct {
	NodeID     string
	ToParent   string
	ToIndex    int
	fromParent string
	fromIndex  int
}

func (c *Move) Name() string { return "move node" }

func (c *Move) Apply(root *model.Node) {
	n, p := root.Find(c.NodeID)
	if n == nil || p == nil {
		return
	}
	c.fromParent = p.ID
	c.fromIndex = p.IndexOf(n.ID)

	target, _ := root.Find(c.ToParent)
	if target == nil || n.IsAncestorOf(c.ToParent) {
		return // never drop a node into its own subtree
	}
	p.RemoveChild(n.ID)
	idx := c.ToIndex
	if c.fromParent == c.ToParent && c.fromIndex < idx {
		idx-- // account for the just-removed slot
	}
	target.InsertChild(n, idx)
}
func (c *Move) Revert(root *model.Node) {
	n, p := root.Find(c.NodeID)
	if n == nil || p == nil {
		return
	}
	p.RemoveChild(n.ID)
	if from, _ := root.Find(c.fromParent); from != nil {
		from.InsertChild(n, c.fromIndex)
	}
}
