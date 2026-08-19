import { useState, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_TEXT_LENS_API_URL ?? "http://localhost:8081";
const SAMPLE_TEXT =
  "Хорошие инструменты помогают удерживать сложные идеи. Линза текста показывает форму текста и даёт несколько ориентиров для работы. Она намеренно небольшая: спокойный инструмент для следующей правки.";

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
        throw new Error("error" in payload ? payload.error : "Анализатор не смог прочитать этот текст.");
      }

      setAnalysis(payload);
      setRequestState("idle");
    } catch (error) {
      setRequestState("error");
      setErrorMessage(
        error instanceof Error
          ? `${error.message} Запустите Go-анализатор командой «cd portfolio/projects/text-lens/service && go run .».`
          : "Анализатор недоступен. Запустите Go-сервис и попробуйте снова.",
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
          <p className="eyebrow accent-eyebrow">ЛИНЗА ТЕКСТА / 001</p>
          <h1 id="text-lens-title">Увидьте форму<br /><span>внутри текста.</span></h1>
        </div>
        <p className="sample-intro">
          Небольшой инструмент для чтения. Вставьте черновик и получите несколько ориентиров
          по его темпу, структуре и повторяющимся идеям — без превращения текста в оценку.
        </p>
      </div>

      <form className="analysis-workspace" onSubmit={analyze}>
        <div className="workspace-toolbar">
          <span className="workspace-label">Ваш текст</span>
          <button className="sample-button" type="button" onClick={useSample}>
            Попробовать пример <span aria-hidden="true">↗</span>
          </button>
        </div>
        <textarea
          aria-label="Текст для анализа"
          className="text-input"
          onChange={(event) => setText(event.target.value)}
          placeholder="Вставьте абзац, заметку или первую строку чего-то нового…"
          rows={9}
          value={text}
        />
        <div className="workspace-footer">
          <span className="input-hint">Go-анализатор работает локально на порту 8081.</span>
          <button className="analyze-button" disabled={requestState === "loading"} type="submit">
            {requestState === "loading" ? "Анализируем…" : "Анализировать текст"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {requestState === "error" && <p className="error-message" role="alert">{errorMessage}</p>}

      {analysis && (
        <section className="analysis-results" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="eyebrow accent-eyebrow">СИГНАЛ</p>
              <h2 id="results-title">Первый понятный срез.</h2>
            </div>
            <span className="results-caption">{analysis.paragraphs} {paragraphLabel(analysis.paragraphs)}</span>
          </div>

          <div className="metrics-grid">
            <Metric label="Слова" value={analysis.words} />
            <Metric label="Предложения" value={analysis.sentences} />
            <Metric label="Символы" value={analysis.characters} />
            <Metric label="Время чтения" value={`${analysis.readingTimeMinutes} мин`} />
          </div>

          <div className="frequency-panel">
            <div className="frequency-heading">
              <h3>Повторяющиеся идеи</h3>
              <span>пять самых частых слов</span>
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
              <p className="empty-frequency">Здесь появятся самые частые слова, когда проявятся закономерности.</p>
            )}
          </div>
        </section>
      )}
    </section>
  );
}

function paragraphLabel(count: number) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return "абзац";
  }
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return "абзаца";
  }
  return "абзацев";
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}
