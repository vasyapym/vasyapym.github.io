package main

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

const (
	defaultLayoutTokens = 700
	maxLayoutTokens     = 4000
)

type SourceRequest struct {
	Source    string
	Language  string
	Filename  string
	MaxTokens int
}

type LayoutResult struct {
	Version      string          `json:"version"`
	Language     string          `json:"language"`
	Confidence   float64         `json:"confidence"`
	LineCount    int             `json:"lineCount"`
	Summary      string          `json:"summary"`
	Declarations []Declaration   `json:"declarations"`
	Dependencies []Dependency    `json:"dependencies"`
	Relations    []Relation      `json:"relations"`
	Architecture Architecture    `json:"architecture"`
	Bitrix       *BitrixInsights `json:"bitrix,omitempty"`
	Diagnostics  []string        `json:"diagnostics,omitempty"`
}

type Declaration struct {
	Kind       string   `json:"kind"`
	Name       string   `json:"name"`
	Signature  string   `json:"signature"`
	Owner      string   `json:"owner,omitempty"`
	Extends    string   `json:"extends,omitempty"`
	Implements []string `json:"implements,omitempty"`
	Visibility string   `json:"visibility,omitempty"`
	Line       int      `json:"line"`
}

type Dependency struct {
	Kind     string `json:"kind"`
	Name     string `json:"name"`
	Detail   string `json:"detail,omitempty"`
	External bool   `json:"external"`
}

type Relation struct {
	From string `json:"from"`
	To   string `json:"to"`
	Kind string `json:"kind"`
}

type Architecture struct {
	EntryPoints []string `json:"entryPoints,omitempty"`
	Roles       []string `json:"roles,omitempty"`
	Flow        []string `json:"flow,omitempty"`
	Layers      []string `json:"layers,omitempty"`
	Notes       []string `json:"notes,omitempty"`
}

type BitrixInsights struct {
	Component bool     `json:"component"`
	D7        bool     `json:"d7"`
	Modules   []string `json:"modules,omitempty"`
	Lifecycle []string `json:"lifecycle,omitempty"`
	APIs      []string `json:"apis,omitempty"`
}

type languageDetection struct {
	Language   string
	Confidence float64
}

type parsedDeclaration struct {
	Declaration
	start     int
	bodyStart int
	bodyEnd   int
}

type extraction struct {
	Detection    languageDetection
	Declarations []parsedDeclaration
	Dependencies []Dependency
	Bitrix       *BitrixInsights
	Diagnostics  []string
}

type languageAdapter interface {
	Detect(request SourceRequest) languageDetection
	Extract(request SourceRequest, detection languageDetection) extraction
}

type sourceAnalyzer struct {
	adapters []languageAdapter
}

var defaultSourceAnalyzer = sourceAnalyzer{
	adapters: []languageAdapter{phpBitrixAdapter{}, genericAdapter{}},
}

func SummarizeSource(request SourceRequest) LayoutResult {
	return defaultSourceAnalyzer.Summarize(request)
}

func (analyzer sourceAnalyzer) Summarize(request SourceRequest) LayoutResult {
	if strings.TrimSpace(request.Source) == "" {
		return LayoutResult{
			Version:     "layout-v1",
			Language:    "unknown",
			Confidence:  0,
			LineCount:   0,
			Summary:     "layout:v1 lang:unknown confidence:0.00 lines:0\nnotes:\n  error: empty source",
			Diagnostics: []string{"empty source"},
		}
	}

	bestAdapter := analyzer.adapters[len(analyzer.adapters)-1]
	bestDetection := bestAdapter.Detect(request)
	for _, adapter := range analyzer.adapters {
		detection := adapter.Detect(request)
		if detection.Confidence > bestDetection.Confidence {
			bestAdapter = adapter
			bestDetection = detection
		}
	}

	extracted := bestAdapter.Extract(request, bestDetection)
	code := maskNonCode(request.Source)
	relations := inferRelations(extracted.Declarations, code)
	dependencies := dependenciesWithInternalReferences(extracted.Dependencies, relations, extracted.Declarations)
	architecture := inferArchitecture(extracted.Declarations, dependencies, relations, extracted.Bitrix)
	confidence := extracted.Detection.Confidence
	if len(extracted.Declarations) == 0 {
		confidence -= 0.12
		extracted.Diagnostics = append(extracted.Diagnostics, "no declarations confidently recognized")
	}
	if strings.Contains(request.Source, "<<<") {
		confidence -= 0.04
		extracted.Diagnostics = append(extracted.Diagnostics, "heredoc/nowdoc may reduce extraction confidence")
	}
	confidence = clamp(confidence, 0, 1)

	result := LayoutResult{
		Version:      "layout-v1",
		Language:     extracted.Detection.Language,
		Confidence:   confidence,
		LineCount:    strings.Count(request.Source, "\n") + 1,
		Declarations: declarationsForResult(extracted.Declarations),
		Dependencies: dependencies,
		Relations:    relations,
		Architecture: architecture,
		Bitrix:       extracted.Bitrix,
		Diagnostics:  uniqueStrings(extracted.Diagnostics),
	}
	result.Summary = renderCompact(result, request.MaxTokens)
	return result
}

// PHP/Bitrix is the first real language adapter. It owns framework semantics;
// the generic adapter never needs to know what executeComponent means.
type phpBitrixAdapter struct{}

func (phpBitrixAdapter) Detect(request SourceRequest) languageDetection {
	if isPHPSource(request) {
		return languageDetection{Language: "php", Confidence: 0.98}
	}
	return languageDetection{}
}

func (phpBitrixAdapter) Extract(request SourceRequest, detection languageDetection) extraction {
	code := maskNonCode(request.Source)
	comments := maskComments(request.Source)
	parsed := make([]parsedDeclaration, 0)

	for _, match := range phpClassPattern.FindAllStringSubmatchIndex(code, -1) {
		start, end := match[0], match[1]
		kind := submatch(code, match, 1)
		name := submatch(code, match, 2)
		record := parsedDeclaration{
			Declaration: Declaration{
				Kind:       kind,
				Name:       name,
				Signature:  normalizeWhitespace(code[start:end]),
				Extends:    strings.TrimSpace(submatch(code, match, 3)),
				Implements: splitNames(submatch(code, match, 4)),
				Line:       lineNumber(request.Source, start),
			},
			start: start,
		}
		record.bodyStart, record.bodyEnd = findBodyBounds(code, end)
		parsed = append(parsed, record)
	}

	for _, match := range phpFunctionPattern.FindAllStringSubmatchIndex(code, -1) {
		start, end := match[0], match[1]
		name := submatch(code, match, 1)
		record := parsedDeclaration{
			Declaration: Declaration{
				Kind:       "function",
				Name:       name,
				Signature:  normalizeWhitespace(code[start:end]),
				Visibility: visibilityOf(code[start:end]),
				Line:       lineNumber(request.Source, start),
			},
			start: start,
		}
		record.bodyStart, record.bodyEnd = findBodyBounds(code, end)
		record.Owner = ownerAt(parsed, start)
		parsed = append(parsed, record)
	}

	for index := range parsed {
		if parsed[index].Owner == "" && parsed[index].Kind == "function" {
			parsed[index].Owner = ownerAt(parsed, parsed[index].start)
		}
	}
	sort.Slice(parsed, func(left, right int) bool { return parsed[left].start < parsed[right].start })

	dependencies := make([]Dependency, 0)
	for _, match := range phpUsePattern.FindAllStringSubmatchIndex(comments, -1) {
		addDependency(&dependencies, Dependency{
			Kind:     "use",
			Name:     normalizeWhitespace(submatch(comments, match, 1)),
			Detail:   "namespace",
			External: true,
		})
	}
	for _, match := range includePattern.FindAllStringSubmatchIndex(comments, -1) {
		addDependency(&dependencies, Dependency{
			Kind:     submatch(comments, match, 1),
			Name:     submatch(comments, match, 2),
			External: true,
		})
	}
	for _, match := range bitrixModulePattern.FindAllStringSubmatchIndex(comments, -1) {
		addDependency(&dependencies, Dependency{
			Kind:     "module",
			Name:     submatch(comments, match, 1),
			Detail:   "Bitrix module loader",
			External: true,
		})
	}

	bitrix := bitrixInsights(request.Source, parsed, dependencies)
	return extraction{
		Detection:    detection,
		Declarations: parsed,
		Dependencies: dependencies,
		Bitrix:       bitrix,
		Diagnostics:  []string{"internal references are limited to this pasted source block"},
	}
}

// Generic lexical extraction is deliberately conservative. It gives unknown
// languages useful structure without pretending to be a compiler parser.
type genericAdapter struct{}

func (genericAdapter) Detect(request SourceRequest) languageDetection {
	return detectLanguage(request)
}

func (genericAdapter) Extract(request SourceRequest, detection languageDetection) extraction {
	code := maskNonCode(request.Source)
	parsed := make([]parsedDeclaration, 0)
	for _, match := range genericTypePattern.FindAllStringSubmatchIndex(code, -1) {
		start, end := match[0], match[1]
		record := parsedDeclaration{
			Declaration: Declaration{
				Kind:       submatch(code, match, 1),
				Name:       submatch(code, match, 2),
				Signature:  normalizeWhitespace(code[start:end]),
				Extends:    normalizeWhitespace(submatch(code, match, 3)),
				Implements: splitNames(submatch(code, match, 4)),
				Line:       lineNumber(request.Source, start),
			},
			start: start,
		}
		record.bodyStart, record.bodyEnd = findBodyBounds(code, end)
		parsed = append(parsed, record)
	}

	appendFunctions := func(matches [][]int, nameGroup int) {
		for _, match := range matches {
			start, end := match[0], match[1]
			name := submatch(code, match, nameGroup)
			if name == "" || isControlKeyword(name) {
				continue
			}
			signature := strings.TrimSuffix(normalizeWhitespace(code[start:end]), " {")
			record := parsedDeclaration{
				Declaration: Declaration{
					Kind:      "function",
					Name:      name,
					Signature: signature,
					Line:      lineNumber(request.Source, start),
				},
				start: start,
			}
			record.bodyStart, record.bodyEnd = findBodyBounds(code, end)
			record.Owner = ownerAt(parsed, start)
			parsed = append(parsed, record)
		}
	}
	appendFunctions(genericFunctionPattern.FindAllStringSubmatchIndex(code, -1), 2)
	appendFunctions(genericMethodPattern.FindAllStringSubmatchIndex(code, -1), 1)
	appendFunctions(goMethodPattern.FindAllStringSubmatchIndex(code, -1), 2)
	for index := range parsed {
		if parsed[index].Owner == "" && parsed[index].Kind == "function" {
			parsed[index].Owner = ownerAt(parsed, parsed[index].start)
		}
	}
	parsed = uniqueDeclarations(parsed)
	sort.Slice(parsed, func(left, right int) bool { return parsed[left].start < parsed[right].start })

	return extraction{
		Detection:    detection,
		Declarations: parsed,
		Dependencies: genericDependencies(request.Source),
		Diagnostics: []string{
			"generic extraction is lexical best-effort; use a language hint for better confidence",
			"internal references are limited to this pasted source block",
		},
	}
}

var (
	phpClassPattern        = regexp.MustCompile(`(?m)(?:(?:abstract|final|readonly)\s+)*(class|interface|trait|enum)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:extends\s+([\\A-Za-z_][\\A-Za-z0-9_]*))?\s*(?:implements\s+([^{\n]+))?`)
	phpFunctionPattern     = regexp.MustCompile(`(?m)(?:(?:(?:public|protected|private|static|final|abstract|readonly)\s+)*function\s*&?\s+)([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?::\s*([^{\s]+))?`)
	phpUsePattern          = regexp.MustCompile(`(?mi)^\s*use\s+([^;]+);`)
	includePattern         = regexp.MustCompile(`(?mi)\b(require|include)(?:_once)?\s*(?:\(\s*)?["']([^"']+)["']`)
	bitrixModulePattern    = regexp.MustCompile(`(?i)(?:Loader::includeModule|CModule::IncludeModule)\s*\(\s*["']([^"']+)["']`)
	genericTypePattern     = regexp.MustCompile(`(?m)\b(class|interface|struct|trait|enum|type)\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+extends\s+([A-Za-z_][A-Za-z0-9_:.<>]*))?(?:\s+implements\s+([^\{\n]+))?`)
	genericFunctionPattern = regexp.MustCompile(`(?m)\b(function|def|func)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)(?:\s*(?::|->)\s*([^\{\n]+))?`)
	genericMethodPattern   = regexp.MustCompile(`(?m)^\s*(?:(?:public|private|protected|static|async|export|override)\s+)*([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)(?:\s*:\s*([^;{\n]+))?\s*\{`)
	goMethodPattern        = regexp.MustCompile(`(?m)\b(func)\s+\([^)]*\)\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)(?:\s*\([^)]*\)|\s*[A-Za-z_][A-Za-z0-9_.*\[\]]*)?`)
	jsImportPattern        = regexp.MustCompile(`(?m)\bimport\s+(?:[^;\n]*?\s+from\s+)?["']([^"']+)["']`)
	pythonFromPattern      = regexp.MustCompile(`(?m)^\s*from\s+([A-Za-z0-9_./-]+)\s+import\s+`)
	pythonImportPattern    = regexp.MustCompile(`(?m)^\s*import\s+([A-Za-z0-9_.,\s]+)`)
	requirePattern         = regexp.MustCompile(`(?m)\brequire\s*\(\s*["']([^"']+)["']`)
	usingPattern           = regexp.MustCompile(`(?m)^\s*using\s+([^;]+);`)
	includePathPattern     = regexp.MustCompile(`(?m)#include\s*[<"]([^>"]+)[>"]`)
)

func detectLanguage(request SourceRequest) languageDetection {
	hint := normalizeLanguage(request.Language)
	if hint != "" && hint != "auto" {
		return languageDetection{Language: hint, Confidence: 0.86}
	}

	extension := strings.ToLower(filenameExtension(request.Filename))
	if mapped := languageFromExtension(extension); mapped != "" {
		return languageDetection{Language: mapped, Confidence: 0.8}
	}

	source := request.Source
	switch {
	case strings.Contains(source, "<?php"):
		return languageDetection{Language: "php", Confidence: 0.98}
	case regexp.MustCompile(`(?m)^\s*package\s+\w+`).MatchString(source) && strings.Contains(source, "func "):
		return languageDetection{Language: "go", Confidence: 0.74}
	case regexp.MustCompile(`(?m)^\s*(import|from)\s+`).MatchString(source) && strings.Contains(source, "def "):
		return languageDetection{Language: "python", Confidence: 0.7}
	case strings.Contains(source, "interface ") || strings.Contains(source, "const ") && strings.Contains(source, "=>"):
		return languageDetection{Language: "typescript", Confidence: 0.55}
	default:
		return languageDetection{Language: "unknown", Confidence: 0.25}
	}
}

func isPHPSource(request SourceRequest) bool {
	language := normalizeLanguage(request.Language)
	if language == "php" {
		return true
	}
	if language != "" && language != "auto" {
		return false
	}
	extension := strings.ToLower(filenameExtension(request.Filename))
	return extension == "php" || strings.Contains(request.Source, "<?php") || strings.Contains(request.Source, "CBitrixComponent") || strings.Contains(request.Source, "Bitrix\\")
}

func normalizeLanguage(language string) string {
	value := strings.ToLower(strings.TrimSpace(language))
	value = strings.TrimPrefix(value, ".")
	switch value {
	case "js":
		return "javascript"
	case "ts":
		return "typescript"
	case "py":
		return "python"
	case "golang":
		return "go"
	case "cs":
		return "csharp"
	default:
		return value
	}
}

func languageFromExtension(extension string) string {
	switch extension {
	case "php", "phtml", "inc":
		return "php"
	case "js", "jsx", "mjs", "cjs":
		return "javascript"
	case "ts", "tsx":
		return "typescript"
	case "py":
		return "python"
	case "go":
		return "go"
	case "java":
		return "java"
	case "cs":
		return "csharp"
	case "rb":
		return "ruby"
	case "rs":
		return "rust"
	case "sql":
		return "sql"
	default:
		return ""
	}
}

func filenameExtension(filename string) string {
	parts := strings.Split(strings.ToLower(strings.TrimSpace(filename)), ".")
	if len(parts) < 2 {
		return ""
	}
	return parts[len(parts)-1]
}

func genericDependencies(source string) []Dependency {
	comments := maskComments(source)
	dependencies := make([]Dependency, 0)
	for _, match := range jsImportPattern.FindAllStringSubmatchIndex(comments, -1) {
		addDependency(&dependencies, Dependency{Kind: "import", Name: submatch(comments, match, 1), External: !isRelativePath(submatch(comments, match, 1))})
	}
	for _, match := range pythonFromPattern.FindAllStringSubmatchIndex(comments, -1) {
		name := submatch(comments, match, 1)
		addDependency(&dependencies, Dependency{Kind: "import", Name: name, External: !isRelativePath(name)})
	}
	for _, match := range pythonImportPattern.FindAllStringSubmatchIndex(comments, -1) {
		for _, name := range strings.Split(submatch(comments, match, 1), ",") {
			name = strings.TrimSpace(name)
			if name != "" {
				addDependency(&dependencies, Dependency{Kind: "import", Name: name, External: true})
			}
		}
	}
	for _, match := range requirePattern.FindAllStringSubmatchIndex(comments, -1) {
		name := submatch(comments, match, 1)
		addDependency(&dependencies, Dependency{Kind: "require", Name: name, External: !isRelativePath(name)})
	}
	for _, match := range usingPattern.FindAllStringSubmatchIndex(comments, -1) {
		addDependency(&dependencies, Dependency{Kind: "using", Name: normalizeWhitespace(submatch(comments, match, 1)), External: true})
	}
	for _, match := range includePathPattern.FindAllStringSubmatchIndex(source, -1) {
		name := submatch(source, match, 1)
		addDependency(&dependencies, Dependency{Kind: "include", Name: name, External: false})
	}
	for _, match := range goImportPattern.FindAllStringSubmatchIndex(comments, -1) {
		name := submatch(comments, match, 1)
		addDependency(&dependencies, Dependency{Kind: "import", Name: name, External: !isRelativePath(name)})
	}
	return dependencies
}

var goImportPattern = regexp.MustCompile(`(?m)\bimport\s*["']([^"']+)["']`)

func bitrixInsights(source string, declarations []parsedDeclaration, dependencies []Dependency) *BitrixInsights {
	if !strings.Contains(source, "Bitrix") && !strings.Contains(source, "CBitrix") && !strings.Contains(source, "CIBlock") && !strings.Contains(source, "Loader::") {
		return nil
	}

	insights := &BitrixInsights{
		Component: strings.Contains(source, "CBitrixComponent"),
		D7:        strings.Contains(source, "Bitrix\\Main") || strings.Contains(source, "Loader::"),
	}
	for _, dependency := range dependencies {
		if dependency.Kind == "module" {
			insights.Modules = append(insights.Modules, dependency.Name)
		}
	}
	for _, declaration := range declarations {
		switch declaration.Name {
		case "executeComponent", "onPrepareComponentParams", "getResult":
			insights.Lifecycle = append(insights.Lifecycle, declaration.Name)
		}
	}
	for _, name := range []string{"CIBlockElement", "CBitrixComponent", "EventManager", "AddEventHandler", "IncludeComponent", "Loader"} {
		if strings.Contains(source, name) {
			insights.APIs = append(insights.APIs, name)
		}
	}
	insights.Modules = uniqueStrings(insights.Modules)
	insights.Lifecycle = uniqueStrings(insights.Lifecycle)
	insights.APIs = uniqueStrings(insights.APIs)
	return insights
}

func inferRelations(declarations []parsedDeclaration, code string) []Relation {
	relations := make([]Relation, 0)
	seen := make(map[string]bool)
	for _, declaration := range declarations {
		from := displayName(declaration.Declaration)
		if declaration.Extends != "" {
			addRelation(&relations, seen, Relation{From: from, To: declaration.Extends, Kind: "extends"})
		}
		for _, implemented := range declaration.Implements {
			addRelation(&relations, seen, Relation{From: from, To: implemented, Kind: "implements"})
		}
		if declaration.bodyStart < 0 || declaration.bodyEnd <= declaration.bodyStart || declaration.bodyEnd > len(code) {
			continue
		}
		body := code[declaration.bodyStart:declaration.bodyEnd]
		for _, target := range declarations {
			if target.Name == declaration.Name && target.Owner == declaration.Owner {
				continue
			}
			if !containsSymbol(body, target.Name) {
				continue
			}
			kind := "references"
			if containsCall(body, target.Name) {
				kind = "calls"
			}
			addRelation(&relations, seen, Relation{From: from, To: displayName(target.Declaration), Kind: kind})
		}
	}
	return relations
}

func inferArchitecture(declarations []parsedDeclaration, dependencies []Dependency, relations []Relation, bitrix *BitrixInsights) Architecture {
	architecture := Architecture{}
	roles := make(map[string]bool)
	for _, declaration := range declarations {
		lower := strings.ToLower(declaration.Name)
		if lower == "main" || lower == "run" || lower == "handle" || lower == "index" || lower == "executecomponent" || strings.HasPrefix(lower, "on") {
			architecture.EntryPoints = append(architecture.EntryPoints, displayName(declaration.Declaration))
		}
		for _, role := range []string{"controller", "service", "repository", "factory", "handler", "view", "dto", "model"} {
			if strings.Contains(lower, role) {
				roles[role] = true
			}
		}
		if declaration.Extends != "" && strings.Contains(strings.ToLower(declaration.Extends), "component") {
			roles["component"] = true
		}
	}
	if bitrix != nil {
		if bitrix.Component {
			roles["bitrix component"] = true
		}
		if len(bitrix.Modules) > 0 {
			roles["framework module loader"] = true
		}
	}
	if len(architecture.EntryPoints) == 0 && len(declarations) > 0 {
		architecture.EntryPoints = []string{displayName(declarations[0].Declaration) + "?"}
	}
	for role := range roles {
		architecture.Roles = append(architecture.Roles, role)
	}
	sort.Strings(architecture.EntryPoints)
	sort.Strings(architecture.Roles)
	if len(dependencies) > 0 {
		architecture.Flow = append(architecture.Flow, "dependencies -> declarations")
	}
	if len(relations) > 0 {
		architecture.Flow = append(architecture.Flow, "declarations -> in-file relations")
	}
	if len(architecture.Flow) == 0 {
		architecture.Flow = []string{"source -> declarations"}
	}
	architecture.Layers = []string{"imports", "declarations", "behavior"}
	if bitrix != nil && bitrix.Component {
		architecture.Layers = []string{"framework lifecycle", "data/module loading", "component presentation"}
		architecture.Notes = append(architecture.Notes, "framework conventions are inferred from Bitrix names and lifecycle methods")
	}
	return architecture
}

func renderCompact(result LayoutResult, maxTokens int) string {
	maxTokens = normalizeMaxTokens(maxTokens)
	lines := []string{
		fmt.Sprintf("layout:v1 lang:%s confidence:%.2f lines:1-%d", result.Language, result.Confidence, result.LineCount),
	}
	if len(result.Declarations) == 0 {
		lines = append(lines, "", "decl: none")
	} else {
		lines = append(lines, "", "decl:")
		for _, declaration := range result.Declarations {
			label := displayName(declaration)
			if declaration.Owner == "" {
				label = declaration.Name
			}
			line := fmt.Sprintf("  %s %s [L%d]", label, declaration.Signature, declaration.Line)
			if declaration.Extends != "" {
				line += " extends:" + declaration.Extends
			}
			if len(declaration.Implements) > 0 {
				line += " implements:" + strings.Join(declaration.Implements, ",")
			}
			lines = append(lines, line)
		}
	}
	if len(result.Dependencies) > 0 {
		lines = append(lines, "", "deps:")
		for _, dependency := range result.Dependencies {
			kind := "ext"
			if !dependency.External {
				kind = "int"
			}
			lines = append(lines, fmt.Sprintf("  %s %s [%s]", kind, dependency.Name, dependency.Kind))
		}
	}
	if len(result.Relations) > 0 {
		lines = append(lines, "", "relations:")
		for _, relation := range result.Relations {
			lines = append(lines, fmt.Sprintf("  %s -> %s [%s]", relation.From, relation.To, relation.Kind))
		}
	}
	lines = append(lines, "", "arch:")
	if len(result.Architecture.EntryPoints) > 0 {
		lines = append(lines, "  entry "+strings.Join(result.Architecture.EntryPoints, ", "))
	}
	if len(result.Architecture.Roles) > 0 {
		lines = append(lines, "  role "+strings.Join(result.Architecture.Roles, ", "))
	}
	for _, flow := range result.Architecture.Flow {
		lines = append(lines, "  flow "+flow)
	}
	if len(result.Architecture.Layers) > 0 {
		lines = append(lines, "  layers "+strings.Join(result.Architecture.Layers, " | "))
	}
	if result.Bitrix != nil {
		lines = append(lines, "", "bitrix:")
		if result.Bitrix.Component {
			lines = append(lines, "  component: yes")
		}
		if result.Bitrix.D7 {
			lines = append(lines, "  d7: yes")
		}
		if len(result.Bitrix.Modules) > 0 {
			lines = append(lines, "  modules: "+strings.Join(result.Bitrix.Modules, ","))
		}
		if len(result.Bitrix.Lifecycle) > 0 {
			lines = append(lines, "  lifecycle: "+strings.Join(result.Bitrix.Lifecycle, ","))
		}
		if len(result.Bitrix.APIs) > 0 {
			lines = append(lines, "  apis: "+strings.Join(result.Bitrix.APIs, ","))
		}
	}
	if len(result.Diagnostics) > 0 || len(result.Architecture.Notes) > 0 {
		lines = append(lines, "", "notes:")
		for _, note := range append(result.Diagnostics, result.Architecture.Notes...) {
			lines = append(lines, "  "+note)
		}
	}
	return fitTokenBudget(lines, maxTokens)
}

func fitTokenBudget(lines []string, maxTokens int) string {
	limit := normalizeMaxTokens(maxTokens) * 4
	var builder strings.Builder
	truncated := false
	for _, line := range lines {
		addition := line + "\n"
		if builder.Len()+len(addition) > limit {
			truncated = true
			break
		}
		builder.WriteString(addition)
	}
	if truncated {
		builder.WriteString("notes:\n  truncated: maxTokens budget\n")
	}
	return strings.TrimSpace(builder.String())
}

func normalizeMaxTokens(maxTokens int) int {
	if maxTokens <= 0 {
		return defaultLayoutTokens
	}
	if maxTokens > maxLayoutTokens {
		return maxLayoutTokens
	}
	return maxTokens
}

func declarationsForResult(parsed []parsedDeclaration) []Declaration {
	result := make([]Declaration, 0, len(parsed))
	for _, declaration := range parsed {
		result = append(result, declaration.Declaration)
	}
	return result
}

func isControlKeyword(name string) bool {
	switch name {
	case "if", "for", "while", "switch", "catch", "return", "throw":
		return true
	default:
		return false
	}
}

func ownerAt(declarations []parsedDeclaration, position int) string {
	owner := ""
	shortest := int(^uint(0) >> 1)
	for _, declaration := range declarations {
		if declaration.Kind == "function" || declaration.bodyStart < 0 || position <= declaration.bodyStart || position >= declaration.bodyEnd {
			continue
		}
		width := declaration.bodyEnd - declaration.bodyStart
		if width < shortest {
			owner = declaration.Name
			shortest = width
		}
	}
	return owner
}

func findBodyBounds(code string, from int) (int, int) {
	for index := from; index < len(code); index++ {
		switch code[index] {
		case '{':
			return index, matchingBrace(code, index)
		case ';':
			return -1, -1
		case '\n':
			if index-from > 1000 {
				return -1, -1
			}
		}
	}
	return -1, -1
}

func matchingBrace(code string, open int) int {
	depth := 0
	for index := open; index < len(code); index++ {
		switch code[index] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return index + 1
			}
		}
	}
	return len(code)
}

func containsSymbol(source string, symbol string) bool {
	if symbol == "" {
		return false
	}
	pattern := regexp.MustCompile(`\b` + regexp.QuoteMeta(symbol) + `\b`)
	return pattern.MatchString(source)
}

func containsCall(source string, symbol string) bool {
	if symbol == "" {
		return false
	}
	pattern := regexp.MustCompile(`\b` + regexp.QuoteMeta(symbol) + `\s*(?:\(|::|->)`)
	return pattern.MatchString(source)
}

func displayName(declaration Declaration) string {
	if declaration.Owner == "" {
		return declaration.Name
	}
	return declaration.Owner + "::" + declaration.Name
}

func addRelation(relations *[]Relation, seen map[string]bool, relation Relation) {
	key := relation.From + "|" + relation.To + "|" + relation.Kind
	if seen[key] {
		return
	}
	seen[key] = true
	*relations = append(*relations, relation)
}

func dependenciesWithInternalReferences(dependencies []Dependency, relations []Relation, declarations []parsedDeclaration) []Dependency {
	known := make(map[string]bool)
	for _, declaration := range declarations {
		known[displayName(declaration.Declaration)] = true
	}

	result := append([]Dependency(nil), dependencies...)
	for _, relation := range relations {
		if relation.Kind != "calls" && relation.Kind != "references" || !known[relation.To] {
			continue
		}
		addDependency(&result, Dependency{
			Kind:     "reference",
			Name:     relation.To,
			Detail:   relation.Kind,
			External: false,
		})
	}
	return result
}

func addDependency(dependencies *[]Dependency, dependency Dependency) {
	for _, existing := range *dependencies {
		if existing.Kind == dependency.Kind && existing.Name == dependency.Name {
			return
		}
	}
	*dependencies = append(*dependencies, dependency)
}

func uniqueDeclarations(declarations []parsedDeclaration) []parsedDeclaration {
	seen := make(map[string]bool)
	result := make([]parsedDeclaration, 0, len(declarations))
	for _, declaration := range declarations {
		key := fmt.Sprintf("%s|%s|%d", declaration.Kind, declaration.Name, declaration.start)
		if seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, declaration)
	}
	return result
}

func splitNames(value string) []string {
	value = normalizeWhitespace(value)
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

func visibilityOf(signature string) string {
	for _, visibility := range []string{"public", "protected", "private"} {
		if strings.Contains(signature, visibility) {
			return visibility
		}
	}
	return ""
}

func submatch(source string, match []int, group int) string {
	index := group * 2
	if index+1 >= len(match) || match[index] < 0 || match[index+1] < 0 {
		return ""
	}
	return source[match[index]:match[index+1]]
}

func normalizeWhitespace(value string) string {
	return strings.Join(strings.Fields(value), " ")
}

func lineNumber(source string, position int) int {
	if position < 0 || position > len(source) {
		return 1
	}
	return strings.Count(source[:position], "\n") + 1
}

func isRelativePath(path string) bool {
	return strings.HasPrefix(path, "./") || strings.HasPrefix(path, "../") || strings.HasPrefix(path, "/")
}

func clamp(value, min, max float64) float64 {
	return minFloat(max, maxFloat(min, value))
}

func minFloat(left, right float64) float64 {
	if left < right {
		return left
	}
	return right
}

func maxFloat(left, right float64) float64 {
	if left > right {
		return left
	}
	return right
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]bool)
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value == "" || seen[value] {
			continue
		}
		seen[value] = true
		result = append(result, value)
	}
	return result
}

func maskNonCode(source string) string {
	return maskSource(source, true)
}

func maskComments(source string) string {
	return maskSource(source, false)
}

func maskSource(source string, maskStrings bool) string {
	output := []byte(source)
	state := byte(0)
	for index := 0; index < len(source); index++ {
		current := source[index]
		next := byte(0)
		if index+1 < len(source) {
			next = source[index+1]
		}

		switch state {
		case 1:
			if current == '\n' {
				state = 0
			} else {
				output[index] = ' '
			}
		case 2:
			if current == '*' && next == '/' {
				output[index], output[index+1] = ' ', ' '
				index++
				state = 0
			} else if current != '\n' {
				output[index] = ' '
			}
		case 3, 4, 5:
			quote := byte('"')
			if state == 3 {
				quote = '\''
			} else if state == 5 {
				quote = '`'
			}
			if current == '\\' && index+1 < len(source) {
				if maskStrings {
					output[index] = ' '
					if source[index+1] != '\n' {
						output[index+1] = ' '
					}
				}
				index++
				continue
			}
			if current == quote {
				if maskStrings {
					output[index] = ' '
				}
				state = 0
			} else if maskStrings && current != '\n' {
				output[index] = ' '
			}
		default:
			if current == '/' && next == '/' {
				output[index], output[index+1] = ' ', ' '
				index++
				state = 1
			} else if current == '/' && next == '*' {
				output[index], output[index+1] = ' ', ' '
				index++
				state = 2
			} else if current == '#' && next != '[' && (index == 0 || unicode.IsSpace(rune(source[index-1]))) {
				output[index] = ' '
				state = 1
			} else if current == '\'' {
				if maskStrings {
					output[index] = ' '
				}
				state = 3
			} else if current == '"' {
				if maskStrings {
					output[index] = ' '
				}
				state = 4
			} else if current == '`' {
				if maskStrings {
					output[index] = ' '
				}
				state = 5
			}
		}
	}
	return string(output)
}
