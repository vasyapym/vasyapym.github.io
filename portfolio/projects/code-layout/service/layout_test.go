package main

import (
	"strings"
	"testing"
)

func TestSummarizeSourceExtractsBitrixStructure(t *testing.T) {
	source := `<?php
namespace Local\Catalog;

use Bitrix\Main\Loader;

class ProductComponent extends CBitrixComponent
{
    public function executeComponent(): bool
    {
        Loader::includeModule('iblock');
        $items = $this->loadItems();
        $this->arResult = array_map('normalizeProduct', $items);
        return $this->includeComponentTemplate();
    }

    protected function loadItems(): array
    {
        return CIBlockElement::GetList([], [])->FetchAll();
    }
}

function normalizeProduct(array $row): array
{
    return $row;
}`

	result := SummarizeSource(SourceRequest{Source: source, Filename: "component.php"})

	if result.Language != "php" {
		t.Fatalf("Language = %q, want php", result.Language)
	}
	if result.Bitrix == nil || !result.Bitrix.Component || !result.Bitrix.D7 {
		t.Fatalf("Bitrix = %#v, want component and D7", result.Bitrix)
	}
	if !containsDeclaration(result.Declarations, "class", "ProductComponent") {
		t.Fatalf("declarations = %#v, want ProductComponent", result.Declarations)
	}
	if !containsDeclaration(result.Declarations, "function", "executeComponent") {
		t.Fatalf("declarations = %#v, want executeComponent", result.Declarations)
	}
	if !containsDependency(result.Dependencies, "module", "iblock") {
		t.Fatalf("dependencies = %#v, want iblock module", result.Dependencies)
	}
	if !containsDependency(result.Dependencies, "reference", "ProductComponent::loadItems") {
		t.Fatalf("dependencies = %#v, want in-file loadItems reference", result.Dependencies)
	}
	if !containsRelation(result.Relations, "ProductComponent::executeComponent", "ProductComponent::loadItems", "calls") {
		t.Fatalf("relations = %#v, want executeComponent -> loadItems", result.Relations)
	}
	if !strings.Contains(result.Summary, "bitrix:") || !strings.Contains(result.Summary, "component: yes") {
		t.Fatalf("summary = %q, want Bitrix section", result.Summary)
	}
}

func TestSummarizeSourceUsesGenericFallback(t *testing.T) {
	source := `import { readFile } from "node:fs/promises";

export class Reader {
  read(path: string): Promise<string> {
    return readFile(path, "utf8");
  }
}

export function createReader(): Reader {
  return new Reader();
}`

	result := SummarizeSource(SourceRequest{Source: source, Language: "typescript", Filename: "reader.ts"})

	if result.Language != "typescript" {
		t.Fatalf("Language = %q, want typescript", result.Language)
	}
	if !containsDeclaration(result.Declarations, "class", "Reader") {
		t.Fatalf("declarations = %#v, want Reader", result.Declarations)
	}
	if !containsDeclaration(result.Declarations, "function", "createReader") {
		t.Fatalf("declarations = %#v, want createReader", result.Declarations)
	}
	if !containsDeclaration(result.Declarations, "function", "read") {
		t.Fatalf("declarations = %#v, want Reader.read", result.Declarations)
	}
	if !containsDependency(result.Dependencies, "import", "node:fs/promises") {
		t.Fatalf("dependencies = %#v, want node import", result.Dependencies)
	}
}

func TestSummarizeSourceKeepsOutputWithinBudget(t *testing.T) {
	source := strings.Repeat("function one(): void {}\n", 80)
	result := SummarizeSource(SourceRequest{Source: source, Language: "php", MaxTokens: 80})

	if len(result.Summary) > 80*4+80 {
		t.Fatalf("summary length = %d, want compact output", len(result.Summary))
	}
	if !strings.Contains(result.Summary, "truncated:") {
		t.Fatalf("summary = %q, want truncation note", result.Summary)
	}
}

func TestSummarizeSourceHandlesIncompleteCode(t *testing.T) {
	result := SummarizeSource(SourceRequest{
		Source:   "<?php class Broken extends CBitrixComponent { public function executeComponent(:",
		Language: "php",
	})

	if result.Language != "php" {
		t.Fatalf("Language = %q, want php", result.Language)
	}
	if result.Summary == "" {
		t.Fatal("Summary should still be produced")
	}
}

func containsDeclaration(declarations []Declaration, kind string, name string) bool {
	for _, declaration := range declarations {
		if declaration.Kind == kind && declaration.Name == name {
			return true
		}
	}
	return false
}

func containsDependency(dependencies []Dependency, kind string, name string) bool {
	for _, dependency := range dependencies {
		if dependency.Kind == kind && dependency.Name == name {
			return true
		}
	}
	return false
}

func containsRelation(relations []Relation, from string, to string, kind string) bool {
	for _, relation := range relations {
		if relation.From == from && relation.To == to && relation.Kind == kind {
			return true
		}
	}
	return false
}
