package codegen

import (
	"strings"
	"testing"

	"spine/internal/model"
)

func TestGenerateFlexTree(t *testing.T) {
	root := model.NewContainer()
	root.Props.Label = "root"
	inner := model.NewContainer()
	inner.Props.FlexDirection = "column"
	inner.InsertChild(model.NewItem("B"), 0)
	root.InsertChild(model.NewItem("A"), 0)
	root.InsertChild(inner, 1)

	html, css := Generate(root)

	if !strings.Contains(html, "<div class=\"box-1\">") || !strings.Contains(html, "<div class=\"item-1\">A</div>") {
		t.Fatalf("unexpected HTML:\n%s", html)
	}
	if strings.Count(css, "display: flex") != 2 {
		t.Fatalf("expected two flex containers in CSS:\n%s", css)
	}
	if !strings.Contains(css, "flex-direction: column") {
		t.Fatalf("inner direction missing:\n%s", css)
	}
}

func TestCSSFollowsDOMOrder(t *testing.T) {
	root := model.NewContainer()
	// Ten items appended in order; each gets a rule so it shows up in CSS.
	for i := 0; i < 10; i++ {
		item := model.NewItem("x")
		item.Props.Order = 1
		root.InsertChild(item, i)
	}
	_, css := Generate(root)
	i2 := strings.Index(css, ".item-2 {")
	i10 := strings.Index(css, ".item-10 {")
	if i2 == -1 || i10 == -1 {
		t.Fatalf("rules missing:\n%s", css)
	}
	// Lexicographic class sorting would place item-10 right after item-1.
	if i10 < i2 {
		t.Fatalf("item-10 sorted before item-2 (lexicographic leak):\n%s", css)
	}
}

func TestGridRuleset(t *testing.T) {
	root := model.NewContainer()
	root.Mode = model.ModeGrid
	root.Props.GridTemplateColumns = "repeat(3, 1fr)"
	_, css := Generate(root)
	for _, want := range []string{"display: grid", "grid-template-columns: repeat(3, 1fr)", "grid-auto-flow: row"} {
		if !strings.Contains(css, want) {
			t.Fatalf("missing %q in:\n%s", want, css)
		}
	}
}

func TestItemRulesOmittedWhenZero(t *testing.T) {
	root := model.NewContainer()
	root.InsertChild(model.NewItem("x"), 0)
	_, css := Generate(root)
	if strings.Contains(css, "order:") || strings.Contains(css, "flex-grow:") {
		t.Fatalf("zero-valued item rules should be omitted:\n%s", css)
	}
}
