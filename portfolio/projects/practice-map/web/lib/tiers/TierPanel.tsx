import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import type { TierBand, TopicCard, Volume } from "./tiers";
import { pad, plural } from "./tiers";

// {id,name,band} per the contract, plus `volumes` — required to render folder
// faces, since `topics` arrives flat. Page passes it straight off the Tier.
export type TierInfo = { id: string; name: string; band: TierBand; volumes?: readonly Volume[] };
export type TierTopic = TopicCard & { index: number };

type TierPanelProps = {
  tier: TierInfo;
  topics: readonly TierTopic[];
  query: string;
  onQueryChange: (q: string) => void;
  activeVolume: string | null;
  onEnterVolume: (name: string) => void;
  onExitVolume: () => void;
  onOpenLesson: (topicId: string) => void;
  onOpenGraph: (topic: TierTopic) => void;
  flashTopicId: string | null;
  onOpenPalette: () => void;
};

function Card({
  topic,
  isFlash,
  onOpenLesson,
  onOpenGraph,
}: {
  topic: TierTopic;
  isFlash: boolean;
  onOpenLesson: (topicId: string) => void;
  onOpenGraph: (topic: TierTopic) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Repo law (n196): <=10 concepts all shown with no expander, >=11 capped
  // at 8 + toggle — same grace band as the previous card.
  const cap = 8;
  const shouldCap = topic.concepts.length > cap + 2;
  const shown = shouldCap && !expanded ? topic.concepts.slice(0, cap) : topic.concepts;
  const hiddenCount = topic.concepts.length - cap;

  return (
    <article className={`pg-card${isFlash ? " is-flash" : ""}`} data-topic-id={topic.id}>
      <div className="pg-topline">
        <span>{pad(topic.index)}</span>
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
      <div className="pg-chips">
        {shown.map((c) => (
          <span key={c} className="pg-chip">
            {c}
          </span>
        ))}
        {shouldCap && (
          <button
            type="button"
            className="pg-chip is-more"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "fewer" : `+${hiddenCount} more`}
          </button>
        )}
      </div>
      {/* Foot always renders: every card qualifies for the graph control
          (concepts exist regardless of topic.lesson); "open lesson" only
          when a reader exists. */}
      <div className="pg-card-foot">
        {topic.lesson && (
          <button className="pg-pill" type="button" onClick={() => onOpenLesson(topic.id)}>
            open lesson →
          </button>
        )}
        <button className="pg-card-graph" type="button" onClick={() => onOpenGraph(topic)}>
          concept graph ↗
        </button>
      </div>
    </article>
  );
}

export function TierPanel({
  tier,
  topics,
  query,
  onQueryChange,
  activeVolume,
  onEnterVolume,
  onExitVolume,
  onOpenLesson,
  onOpenGraph,
  flashTopicId,
  onOpenPalette,
}: TierPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  const byId = new Map<string, TierTopic>(topics.map((t) => [t.id, t]));
  const q = query.trim().toLowerCase();
  const hit = (t: TierTopic): boolean => !q || (t.title + " " + t.summary).toLowerCase().includes(q);

  useEffect(() => {
    if (!flashTopicId) return;
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-topic-id="${flashTopicId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [flashTopicId, activeVolume, query]);

  const emptyLine = <p className="pg-empty">no lessons match “{query.trim()}”</p>;
  const volumes = tier.volumes;

  let panelBody: ReactNode;

  if (volumes && activeVolume) {
    const vol = volumes.find((v) => v.name === activeVolume);
    const tps = vol ? vol.topicIds.map((id) => byId.get(id)).filter((t): t is TierTopic => Boolean(t)) : [];
    const vis = tps.filter(hit);
    panelBody = (
      <>
        <div className="pg-crumb">
          <button className="pg-crumb-back" type="button" onClick={onExitVolume}>
            <span className="pg-crumb-arrow" aria-hidden="true">←</span>
            go back
          </button>
          <span className="pg-crumb-title">{activeVolume}</span>
        </div>
        {vis.length ? (
          <div className="pg-cards">
            {vis.map((tp) => (
              <Card
                key={tp.id}
                topic={tp}
                isFlash={tp.id === flashTopicId}
                onOpenLesson={onOpenLesson}
                onOpenGraph={onOpenGraph}
              />
            ))}
          </div>
        ) : (
          emptyLine
        )}
      </>
    );
  } else {
    const head = (
      <div className="pg-tier-head">
        <h2>{tier.name}</h2>
      </div>
    );

    if (volumes) {
      const faces = volumes
        .map((v) => {
          const tps = v.topicIds.map((id) => byId.get(id)).filter((t): t is TierTopic => Boolean(t));
          const vis = tps.filter(hit);
          if (q && !vis.length) return null;
          const peek = tps.slice(0, 3);
          return (
            <section className="pg-face" key={v.name}>
              <button
                className="pg-face-head"
                type="button"
                aria-label={`enter ${v.name}`}
                onClick={() => onEnterVolume(v.name)}
              >
                <span className="pg-face-top">
                  <span className="pg-face-label">{v.name}</span>
                  <span className="pg-face-count">· {plural(tps.length, "lesson")}</span>
                  <span className="pg-face-mark">→</span>
                </span>
                <ul className="pg-peek">
                  {peek.map((tp) => (
                    <li key={tp.id}>{tp.title}</li>
                  ))}
                </ul>
              </button>
            </section>
          );
        })
        .filter((x): x is ReactElement => x !== null);

      panelBody = (
        <>
          {head}
          {faces.length ? <div className="pg-faces">{faces}</div> : emptyLine}
        </>
      );
    } else {
      const vis = topics.filter(hit);
      panelBody = (
        <>
          {head}
          {vis.length ? (
            <div className="pg-cards">
              {vis.map((tp) => (
                <Card
                  key={tp.id}
                  topic={tp}
                  isFlash={tp.id === flashTopicId}
                  onOpenLesson={onOpenLesson}
                  onOpenGraph={onOpenGraph}
                />
              ))}
            </div>
          ) : (
            emptyLine
          )}
        </>
      );
    }
  }

  return (
    <>
      <div className="pg-search">
        <input
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="filter lessons — name and description"
          aria-label="filter lessons"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button className="pg-pill" type="button" onClick={onOpenPalette}>
          ⌘k
        </button>
      </div>
      <section className="pg-tier-panel" aria-live="polite" ref={panelRef}>
        {panelBody}
      </section>
    </>
  );
}
