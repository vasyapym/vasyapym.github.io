import { useRef, useState, type FormEvent, type PointerEvent } from "react";

const API_URL = import.meta.env.VITE_CODE_LAYOUT_API_URL ?? "http://localhost:8082";

const SAMPLE_SOURCE = `<?php
namespace Local\\Catalog;

use Bitrix\\Main\\Loader;

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
}`;

type Declaration = {
  kind: string;
  name: string;
  signature: string;
  owner?: string;
  line: number;
};

type Dependency = {
  kind: string;
  name: string;
  external: boolean;
};

type Relation = {
  from: string;
  to: string;
  kind: string;
};

type LayoutResult = {
  language: string;
  confidence: number;
  lineCount: number;
  summary: string;
  declarations: Declaration[];
  dependencies: Dependency[];
  relations: Relation[];
  architecture: {
    entryPoints?: string[];
    roles?: string[];
    flow?: string[];
    layers?: string[];
  };
  bitrix?: {
    component: boolean;
    d7: boolean;
    modules?: string[];
    lifecycle?: string[];
    apis?: string[];
  };
};

type RequestState = "idle" | "loading" | "error";

export default function CodeLayoutPage() {
  const [source, setSource] = useState(SAMPLE_SOURCE);
  const [language, setLanguage] = useState("auto");
  const [filename, setFilename] = useState("component.php");
  const [maxTokens, setMaxTokens] = useState("700");
  const [result, setResult] = useState<LayoutResult | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const artifactRef = useRef<HTMLDivElement>(null);

  const handleArtifactPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !artifactRef.current) {
      return;
    }

    const bounds = artifactRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
    artifactRef.current.style.setProperty("--layout-tilt-x", `${x}deg`);
    artifactRef.current.style.setProperty("--layout-tilt-y", `${y}deg`);
  };

  const resetArtifactPointer = () => {
    artifactRef.current?.style.setProperty("--layout-tilt-x", "0deg");
    artifactRef.current?.style.setProperty("--layout-tilt-y", "0deg");
  };

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestState("loading");
    setErrorMessage("");
    setCopied(false);

    try {
      const response = await fetch(`${API_URL}/layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          language: language === "auto" ? "" : language,
          filename,
          maxTokens: Number(maxTokens) || 700,
        }),
      });
      const payload = (await response.json()) as LayoutResult | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "The layout service could not read this source.");
      }

      setResult(payload);
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(
        error instanceof Error
          ? `${error.message} Start the Code Layout service with “cd portfolio/projects/code-layout/service && go run .”.`
          : "The Code Layout service is unavailable. Start it and try again.",
      );
    }
  };

  const useSample = () => {
    setSource(SAMPLE_SOURCE);
    setLanguage("auto");
    setFilename("component.php");
    setResult(null);
    setRequestState("idle");
    setErrorMessage("");
    setCopied(false);
  };

  const copySummary = async () => {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.summary);
    setCopied(true);
  };

  return (
    <section className="code-layout-page section-shell" aria-labelledby="code-layout-title">
      <div className="code-layout-hero">
        <div className="code-layout-hero-copy">
          <p className="eyebrow accent-eyebrow">Code Layout · source reading</p>
          <h1 id="code-layout-title">
            Understand a source file
            <span>faster.</span>
          </h1>
          <p className="code-layout-intro">
            Paste a source file to see its declarations, dependencies, relationships, and architecture in one compact view.
          </p>
          <a className="code-layout-enter" href="#code-layout-workspace">
            Open Code Layout <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="code-layout-artifact-panel" aria-describedby="code-layout-artifact-caption">
          <div className="code-layout-artifact-note" aria-hidden="true">
            <span>Declarations / dependencies</span>
            <span>Source structure</span>
          </div>
          <div
            ref={artifactRef}
            className="code-layout-artifact"
            role="img"
            aria-label="A layered code structure artifact with declarations, dependencies, and architecture"
            onPointerMove={handleArtifactPointerMove}
            onPointerLeave={resetArtifactPointer}
          >
            <span className="code-layout-artifact-plate code-layout-artifact-plate-back">architecture</span>
            <span className="code-layout-artifact-plate code-layout-artifact-plate-middle">dependencies</span>
            <span className="code-layout-artifact-plate code-layout-artifact-plate-front">declarations</span>
            <span className="code-layout-artifact-spine" />
          </div>
          <p className="code-layout-artifact-caption" id="code-layout-artifact-caption">
            A compact view of the source structure.
          </p>
        </div>
      </div>

      <form className="code-layout-workspace" id="code-layout-workspace" onSubmit={analyze}>
        <div className="code-layout-toolbar">
          <label>
            Language
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="auto">Auto detect</option>
              <option value="php">PHP / Bitrix</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="sql">SQL</option>
            </select>
          </label>
          <label>
            Filename
            <input value={filename} onChange={(event) => setFilename(event.target.value)} placeholder="component.php" />
          </label>
          <label>
            Output budget
            <input
              min="100"
              max="4000"
              step="50"
              type="number"
              value={maxTokens}
              onChange={(event) => setMaxTokens(event.target.value)}
            />
          </label>
          <button className="code-layout-sample" type="button" onClick={useSample}>
            Try Bitrix example <span aria-hidden="true">↗</span>
          </button>
        </div>
        <textarea
          aria-label="Source code to summarize"
          className="code-layout-input"
          onChange={(event) => setSource(event.target.value)}
          placeholder="Paste a PHP, JavaScript, Python, Go, or other source file…"
          rows={18}
          value={source}
        />
        <div className="code-layout-workspace-footer">
          <span>Source stays in this browser · nothing is executed.</span>
          <button className="analyze-button" disabled={requestState === "loading"} type="submit">
            {requestState === "loading" ? "Analyzing…" : "Analyze source"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {requestState === "error" && <p className="code-layout-error" role="alert">{errorMessage}</p>}

      {result && (
        <section className="code-layout-results" aria-labelledby="layout-results-title">
          <div className="code-layout-results-heading">
            <div>
              <p className="eyebrow accent-eyebrow">Layout · {result.language}</p>
              <h2 id="layout-results-title">A compact structural read.</h2>
            </div>
            <div className="code-layout-result-meta">
              <span>{result.lineCount} lines</span>
              <span>{Math.round(result.confidence * 100)}% confidence</span>
              <button className="code-layout-copy" type="button" onClick={copySummary}>
                {copied ? "Copied" : "Copy layout"}
              </button>
            </div>
          </div>

          <pre className="code-layout-summary"><code>{result.summary}</code></pre>

          <div className="code-layout-insights">
            <InsightList title="Declarations" values={result.declarations.map((item) => `${item.owner ? `${item.owner}::` : ""}${item.name} — ${item.signature}`)} />
            <InsightList title="Dependencies" values={result.dependencies.map((item) => `${item.external ? "external" : "internal"} · ${item.name}`)} />
            <InsightList title="Relations" values={result.relations.map((item) => `${item.from} → ${item.to} · ${item.kind}`)} />
            <InsightList title="Architecture" values={[
              ...(result.architecture.entryPoints ?? []).map((item) => `entry · ${item}`),
              ...(result.architecture.roles ?? []).map((item) => `role · ${item}`),
              ...(result.architecture.flow ?? []).map((item) => `flow · ${item}`),
            ]} />
          </div>
        </section>
      )}
    </section>
  );
}

function InsightList({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="code-layout-insight" aria-labelledby={`insight-${title.toLowerCase()}`}>
      <h3 id={`insight-${title.toLowerCase()}`}>{title}</h3>
      {values.length > 0 ? (
        <ul>
          {values.slice(0, 12).map((value) => <li key={value}>{value}</li>)}
        </ul>
      ) : (
        <p>None detected.</p>
      )}
    </section>
  );
}
