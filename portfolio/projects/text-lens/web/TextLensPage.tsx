import { useState, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_TEXT_LENS_API_URL ?? "http://localhost:8081";
const SAMPLE_TEXT =
  "Good tools make complicated ideas easier to hold. Text Lens looks for the shape of a piece of writing, then gives you a few signals to work with. It is intentionally small: a quiet instrument for the next edit.";

type WordFrequency = {
  word: string;
  count: number;
};

type Analysis = {
  words: number;
  characters: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  frequentWords: WordFrequency[];
};

type ErrorResponse = {
  error: string;
};

type RequestState = "idle" | "loading" | "error";

export default function TextLensPage() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json()) as Analysis | ErrorResponse;

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "The analyzer could not read that text.");
      }

      setAnalysis(payload);
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(
        error instanceof Error
          ? `${error.message} Start the Go analyzer with “cd portfolio/projects/text-lens/service && go run .”.`
          : "The analyzer is unavailable. Start the Go service and try again.",
      );
    }
  };

  const useSample = () => {
    setText(SAMPLE_TEXT);
    setAnalysis(null);
    setRequestState("idle");
    setErrorMessage("");
  };

  const mostFrequentCount = analysis?.frequentWords[0]?.count ?? 1;

  return (
    <section className="text-lens-page section-shell" aria-labelledby="text-lens-title">
      <div className="sample-hero">
        <div>
          <p className="eyebrow accent-eyebrow">TEXT LENS / 001</p>
          <h1 id="text-lens-title">See the shape<br /><span>inside the words.</span></h1>
        </div>
        <p className="sample-intro">
          A small reading instrument. Paste in a draft and get a few signals about its pace,
          structure, and repeated ideas — without turning writing into a score.
        </p>
      </div>

      <form className="analysis-workspace" onSubmit={analyze}>
        <div className="workspace-toolbar">
          <span className="workspace-label">Your text</span>
          <button className="sample-button" type="button" onClick={useSample}>
            Try a sample <span aria-hidden="true">↗</span>
          </button>
        </div>
        <textarea
          aria-label="Text to analyze"
          className="text-input"
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a paragraph, a note, or the first line of something new…"
          rows={9}
          value={text}
        />
        <div className="workspace-footer">
          <span className="input-hint">The Go analyzer runs locally on port 8081.</span>
          <button className="analyze-button" disabled={requestState === "loading"} type="submit">
            {requestState === "loading" ? "Reading…" : "Analyze text"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {requestState === "error" && <p className="error-message" role="alert">{errorMessage}</p>}

      {analysis && (
        <section className="analysis-results" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="eyebrow accent-eyebrow">THE SIGNAL</p>
              <h2 id="results-title">A readable first pass.</h2>
            </div>
            <span className="results-caption">{analysis.paragraphs} {analysis.paragraphs === 1 ? "paragraph" : "paragraphs"}</span>
          </div>

          <div className="metrics-grid">
            <Metric label="Words" value={analysis.words} />
            <Metric label="Sentences" value={analysis.sentences} />
            <Metric label="Characters" value={analysis.characters} />
            <Metric label="Reading time" value={`${analysis.readingTimeMinutes} min`} />
          </div>

          <div className="frequency-panel">
            <div className="frequency-heading">
              <h3>Repeated ideas</h3>
              <span>top five words</span>
            </div>
            {analysis.frequentWords.length > 0 ? (
              <div className="frequency-list">
                {analysis.frequentWords.map((item) => (
                  <div className="frequency-row" key={item.word}>
                    <span className="frequency-word">{item.word}</span>
                    <span className="frequency-bar-track">
                      <span className="frequency-bar" style={{ width: `${Math.max(16, (item.count / mostFrequentCount) * 100)}%` }} />
                    </span>
                    <span className="frequency-count">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-frequency">Longer words will show up here as patterns emerge.</p>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}
