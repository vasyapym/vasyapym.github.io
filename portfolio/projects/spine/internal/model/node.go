package model

import (
	"fmt"
	"sync/atomic"
)

type Kind int

const (
	KindContainer Kind = iota
	KindItem
)

type Mode int

const (
	ModeFlex Mode = iota
	ModeGrid
)

// Props holds every editable layout attribute. Not all apply to every node;
// the renderer and codegen decide which are meaningful per Kind/Mode.
type Props struct {
	Label string

	// Flex container
	JustifyContent string
	AlignItems     string
	FlexDirection  string
	FlexWrap       string
	Gap            string

	// Grid container
	GridTemplateColumns string
	GridTemplateRows    string
	GridAutoFlow        string

	// Item
	Order    int
	FlexGrow int
}

// Node is a container or leaf item in the layout tree.
type Node struct {
	ID       string  `json:"id"`
	Kind     Kind    `json:"kind"`
	Mode     Mode    `json:"mode"`
	Props    Props   `json:"props"`
	Children []*Node `json:"children,omitempty"`
}

var idCounter int64

// NewID returns a process-unique node identifier.
func NewID(prefix string) string {
	n := atomic.AddInt64(&idCounter, 1)
	return fmt.Sprintf("%s-%d", prefix, n)
}

func DefaultContainerProps() Props {
	return Props{
		Label:          "container",
		JustifyContent: "flex-start",
		AlignItems:     "stretch",
		FlexDirection:  "row",
		// Demo-friendly default: children wrap to new lines instead of
		// overflowing the container (CSS's own default is nowrap, which
		// shrinks items to their minimum and then lets them spill out).
		FlexWrap:            "wrap",
		Gap:                 "8px",
		GridTemplateColumns: "1fr 1fr",
		GridTemplateRows:    "auto",
		GridAutoFlow:        "row",
		FlexGrow:            0,
	}
}

func DefaultItemProps(label string) Props {
	return Props{Label: label, FlexGrow: 0}
}

func NewContainer() *Node {
	return &Node{ID: NewID("c"), Kind: KindContainer, Mode: ModeFlex, Props: DefaultContainerProps()}
}

func NewItem(label string) *Node {
	return &Node{ID: NewID("i"), Kind: KindItem, Props: DefaultItemProps(label)}
}

// Clone deep-copies a node (used by commands for reliable revert).
func (n *Node) Clone() *Node {
	if n == nil {
		return nil
	}
	cp := *n
	cp.Children = make([]*Node, len(n.Children))
	for i, c := range n.Children {
		cp.Children[i] = c.Clone()
	}
	return &cp
}

// Find returns the node with the given id and its parent (nil parent for root).
func (n *Node) Find(id string) (node, parent *Node) {
	if n.ID == id {
		return n, nil
	}
	return n.findWithParent(id, nil)
}

func (n *Node) findWithParent(id string, parent *Node) (*Node, *Node) {
	if n.ID == id {
		return n, parent
	}
	for _, c := range n.Children {
		if found, p := c.findWithParent(id, n); found != nil {
			return found, p
		}
	}
	return nil, nil
}

// IndexOf returns the position of child id within n, or -1.
func (n *Node) IndexOf(id string) int {
	for i, c := range n.Children {
		if c.ID == id {
			return i
		}
	}
	return -1
}

// InsertChild inserts child at index (clamped).
func (n *Node) InsertChild(child *Node, index int) {
	if index < 0 {
		index = 0
	}
	if index > len(n.Children) {
		index = len(n.Children)
	}
	n.Children = append(n.Children, nil)
	copy(n.Children[index+1:], n.Children[index:])
	n.Children[index] = child
}

// RemoveChild removes child id from n and returns it.
func (n *Node) RemoveChild(id string) *Node {
	i := n.IndexOf(id)
	if i < 0 {
		return nil
	}
	removed := n.Children[i]
	n.Children = append(n.Children[:i], n.Children[i+1:]...)
	return removed
}

// IsAncestorOf reports whether n is an ancestor of (or equal to) target id.
func (n *Node) IsAncestorOf(id string) bool {
	if n.ID == id {
		return true
	}
	for _, c := range n.Children {
		if c.IsAncestorOf(id) {
			return true
		}
	}
	return false
}
