package codegen

import (
	"fmt"
	"strings"

	"spine/internal/model"
)

// Generate returns formatted HTML and CSS for the given tree. CSS rules are
// emitted in DOM order so the output reads top-down like the markup.
func Generate(root *model.Node) (html string, css string) {
	var hb, cb strings.Builder
	classes := map[string]string{}
	cc, ic := 0, 0

	var assign func(n *model.Node)
	assign = func(n *model.Node) {
		if n.Kind == model.KindContainer {
			cc++
			classes[n.ID] = fmt.Sprintf("box-%d", cc)
		} else {
			ic++
			classes[n.ID] = fmt.Sprintf("item-%d", ic)
		}
		for _, c := range n.Children {
			assign(c)
		}
	}
	assign(root)

	var emitHTML func(n *model.Node, depth int)
	emitHTML = func(n *model.Node, depth int) {
		ind := strings.Repeat("  ", depth)
		cls := classes[n.ID]
		if len(n.Children) == 0 {
			label := n.Props.Label
			if label == "" {
				label = cls
			}
			fmt.Fprintf(&hb, "%s<div class=\"%s\">%s</div>\n", ind, cls, label)
			return
		}
		fmt.Fprintf(&hb, "%s<div class=\"%s\">\n", ind, cls)
		for _, c := range n.Children {
			emitHTML(c, depth+1)
		}
		fmt.Fprintf(&hb, "%s</div>\n", ind)
	}
	emitHTML(root, 0)

	// DOM order: walk the tree again, collecting ids depth-first.
	ids := make([]string, 0, len(classes))
	nodeByID := map[string]*model.Node{}
	var collect func(n *model.Node)
	collect = func(n *model.Node) {
		nodeByID[n.ID] = n
		ids = append(ids, n.ID)
		for _, c := range n.Children {
			collect(c)
		}
	}
	collect(root)

	for _, id := range ids {
		n := nodeByID[id]
		rules := ruleset(n)
		if len(rules) == 0 {
			continue
		}
		fmt.Fprintf(&cb, ".%s {\n", classes[id])
		for _, r := range rules {
			fmt.Fprintf(&cb, "  %s;\n", r)
		}
		cb.WriteString("}\n\n")
	}

	return hb.String(), strings.TrimSpace(cb.String()) + "\n"
}

func ruleset(n *model.Node) []string {
	var r []string
	if n.Kind == model.KindContainer {
		if n.Mode == model.ModeFlex {
			r = append(r,
				"display: flex",
				"flex-direction: "+n.Props.FlexDirection,
				"flex-wrap: "+n.Props.FlexWrap,
				"justify-content: "+n.Props.JustifyContent,
				"align-items: "+n.Props.AlignItems,
				"gap: "+n.Props.Gap,
			)
		} else {
			r = append(r,
				"display: grid",
				"grid-template-columns: "+n.Props.GridTemplateColumns,
				"grid-template-rows: "+n.Props.GridTemplateRows,
				"grid-auto-flow: "+n.Props.GridAutoFlow,
				"gap: "+n.Props.Gap,
			)
		}
	}
	if n.Props.FlexGrow != 0 {
		r = append(r, fmt.Sprintf("flex-grow: %d", n.Props.FlexGrow))
	}
	if n.Props.Order != 0 {
		r = append(r, fmt.Sprintf("order: %d", n.Props.Order))
	}
	return r
}
