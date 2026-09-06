package command

import (
	"testing"

	"spine/internal/model"
)

func TestUndoRedoProps(t *testing.T) {
	root := model.NewContainer()
	h := NewHistory(root)

	old := root.Props
	next := old
	next.JustifyContent = "space-between"

	h.Do(&SetProps{NodeID: root.ID, OldProps: old, NewProps: next, OldMode: root.Mode, NewMode: root.Mode})
	if root.Props.JustifyContent != "space-between" {
		t.Fatalf("apply failed")
	}
	h.Undo()
	if root.Props.JustifyContent != old.JustifyContent {
		t.Fatalf("undo failed")
	}
	h.Redo()
	if root.Props.JustifyContent != "space-between" {
		t.Fatalf("redo failed")
	}
}

func TestMoveUndoable(t *testing.T) {
	root := model.NewContainer()
	box := model.NewContainer()
	item := model.NewItem("x")
	root.InsertChild(box, 0)
	root.InsertChild(item, 1)
	h := NewHistory(root)

	h.Do(&Move{NodeID: item.ID, ToParent: box.ID, ToIndex: 0})
	if box.IndexOf(item.ID) != 0 || root.IndexOf(item.ID) != -1 {
		t.Fatalf("move failed")
	}
	h.Undo()
	if root.IndexOf(item.ID) != 1 {
		t.Fatalf("move undo failed")
	}
}

func TestMoveRejectsCycle(t *testing.T) {
	root := model.NewContainer()
	parent := model.NewContainer()
	child := model.NewContainer()
	parent.InsertChild(child, 0)
	root.InsertChild(parent, 0)
	h := NewHistory(root)

	h.Do(&Move{NodeID: parent.ID, ToParent: child.ID, ToIndex: 0})
	if child.IndexOf(parent.ID) != -1 {
		t.Fatalf("cycle should be rejected")
	}
}

func TestRemoveUndoable(t *testing.T) {
	root := model.NewContainer()
	a, b, c := model.NewItem("a"), model.NewItem("b"), model.NewItem("c")
	root.InsertChild(a, 0)
	root.InsertChild(b, 1)
	root.InsertChild(c, 2)
	h := NewHistory(root)

	h.Do(&Remove{NodeID: b.ID})
	if root.IndexOf(b.ID) != -1 || len(root.Children) != 2 {
		t.Fatalf("remove failed")
	}
	h.Undo()
	if root.IndexOf(b.ID) != 1 || len(root.Children) != 3 {
		t.Fatalf("remove undo lost position")
	}
}
