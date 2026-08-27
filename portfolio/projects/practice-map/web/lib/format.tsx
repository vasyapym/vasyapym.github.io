import { Fragment, type ReactNode } from "react";
import type { SectionBlock } from "../curriculum";

// Hand-rolled inline markup, deliberately dependency-free: **bold**,
// *italic*, `code`. A single alternation regex tokenises the string so
// nested or overlapping marks are impossible by construction — authoring
// discipline, not parser complexity.
const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g;

export function InlineText({ text }: { text: string }) {
  const parts = text.split(INLINE_PATTERN);
  return (
    <>
      {parts.map((part, index) => {
        if (part.length < 3) {
          return <Fragment key={index}>{part}</Fragment>;
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

export function Blocks({ blocks }: { blocks: readonly SectionBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineText text={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "callout":
            return (
              <aside className={`practice-callout is-${block.variant}`} key={index}>
                <span className="practice-callout-title">
                  {block.title ?? (block.variant === "warning" ? "ловушка" : "главное")}
                </span>
                <p>
                  <InlineText text={block.text} />
                </p>
              </aside>
            );
          default:
            return (
              <p key={index}>
                <InlineText text={block.text} />
              </p>
            );
        }
      })}
    </>
  );
}
