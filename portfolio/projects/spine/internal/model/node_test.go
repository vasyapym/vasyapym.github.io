package model

import "testing"

func TestInsertRemove(t *testing.T) {
	root := NewContainer()
	a, b, c := NewItem("a"), NewItem("b"), NewItem("c")
	root.InsertChild(a, 0)
	root.InsertChild(c, 1)
	root.InsertChild(b, 1) // between a and c

	if got := []string{root.Children[0].Props.Label, root.Children[1].Props.Label, root.Children[2].Props.Label}; got[0] != "a" || got[1] != "b" || got[2] != "c" {
		t.Fatalf("unexpected order: %v", got)
	}
	if removed := root.RemoveChild(b.ID); removed != b {
		t.Fatalf("remove returned wrong node")
	}
	if root.IndexOf(b.ID) != -1 {
		t.Fatalf("b should be gone")
	}
}

func TestFindAndAncestor(t *testing.T) {
	root := NewContainer()
	inner := NewContainer()
	leaf := NewItem("x")
	inner.InsertChild(leaf, 0)
	root.InsertChild(inner, 0)

	node, parent := root.Find(leaf.ID)
	if node != leaf || parent != inner {
		t.Fatalf("find failed")
	}
	if !inner.IsAncestorOf(leaf.ID) {
		t.Fatalf("expected ancestor relationship")
	}
	if leaf.IsAncestorOf(root.ID) {
		t.Fatalf("leaf is not ancestor of root")
	}
}

func TestCloneIsDeep(t *testing.T) {
	root := NewContainer()
	root.InsertChild(NewItem("a"), 0)
	cp := root.Clone()
	cp.Children[0].Props.Label = "changed"
	if root.Children[0].Props.Label == "changed" {
		t.Fatalf("clone was shallow")
	}
}
