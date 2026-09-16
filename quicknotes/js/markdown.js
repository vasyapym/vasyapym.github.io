// Minimal, XSS-safe markdown renderer with [[wiki-links]].
// Strategy: HTML-escape everything first, then only inject markup we generate ourselves.

const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = u => /^(https?:|mailto:)/i.test(u.trim()) ? u.trim() : "#";

function inline(raw, ctx) {
  let s = esc(raw);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(`<code>${c}</code>`); return `\u0001${codes.length - 1}\u0001`; });

  // [[Title]] or [[Title|label]]
  s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, label) => {
    const title = t.trim();
    const missing = ctx && ctx.exists && !ctx.exists(title) ? " missing" : "";
    return `<a class="wiki${missing}" href="#" data-wiki="${title}">${label || title}</a>`;
  });
  // ![alt](src)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img alt="${a}" src="${safeUrl(u)}">`);
  // [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`);
  // bare URLs
  s = s.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (_, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
       .replace(/__(.+?)__/g, "<strong>$1</strong>")
       .replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, "$1<em>$2</em>")
       .replace(/(^|[^_\w])_([^_\n]+?)_(?!\w)/g, "$1<em>$2</em>")
       .replace(/~~(.+?)~~/g, "<del>$1</del>");

  return s.replace(/\u0001(\d+)\u0001/g, (_, i) => codes[i]);
}

export function render(md, ctx = {}) {
  const blocks = [];
  let src = (md || "").replace(/\r\n?/g, "\n");
  src = src.replace(/```([\w-]*)[^\n]*\n([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre><code class="lang-${esc(lang)}">${esc(code)}</code></pre>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  const out = [];
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "), ctx)}</p>`); para = []; } };
  const flushList = () => {
    if (!list) return;
    out.push(`<${list.tag}>` + list.items.map(i => {
      const m = i.match(/^\[( |x|X)\]\s+(.*)$/);
      if (m) return `<li class="task"><input type="checkbox" disabled${m[1] !== " " ? " checked" : ""}> ${inline(m[2], ctx)}</li>`;
      return `<li>${inline(i, ctx)}</li>`;
    }).join("") + `</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote>${inline(quote.join(" "), ctx)}</blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const line of src.split("\n")) {
    const t = line.trim();
    let m;
    if (/^\u0000\d+\u0000$/.test(t)) { flushAll(); out.push(t); continue; }
    if (!t) { flushAll(); continue; }
    if ((m = t.match(/^(#{1,6})\s+(.*)$/))) { flushAll(); out.push(`<h${m[1].length}>${inline(m[2], ctx)}</h${m[1].length}>`); continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { flushAll(); out.push("<hr>"); continue; }
    if ((m = t.match(/^>\s?(.*)$/))) { flushPara(); flushList(); quote.push(m[1]); continue; }
    if ((m = t.match(/^[-*+]\s+(.*)$/))) { flushPara(); flushQuote(); if (list && list.tag !== "ul") flushList(); list = list || { tag: "ul", items: [] }; list.items.push(m[1]); continue; }
    if ((m = t.match(/^\d+[.)]\s+(.*)$/))) { flushPara(); flushQuote(); if (list && list.tag !== "ol") flushList(); list = list || { tag: "ol", items: [] }; list.items.push(m[1]); continue; }
    flushList(); flushQuote(); para.push(t);
  }
  flushAll();
  return out.join("\n").replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
}
