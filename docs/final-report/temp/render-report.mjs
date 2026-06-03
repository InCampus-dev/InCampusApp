import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve("docs/final-report");
const sourcePath = path.join(root, "final-report.md");
const outputPath = path.join(root, "temp", "final-report.html");
const markdown = readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function slug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function inline(text) {
  let value = esc(text);
  const code = [];
  value = value.replace(/`([^`]+)`/g, (_match, body) => {
    const token = `@@CODE${code.length}@@`;
    code.push(`<code>${body}</code>`);
    return token;
  });
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  code.forEach((html, index) => {
    value = value.replace(`@@CODE${index}@@`, html);
  });
  return value;
}

function isTableStart(lines, index) {
  return (
    lines[index]?.trim().startsWith("|") &&
    lines[index + 1]?.trim().startsWith("|") &&
    /\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?/.test(lines[index + 1].trim())
  );
}

function renderTable(lines, index) {
  const rows = [];
  let cursor = index;
  while (cursor < lines.length && lines[cursor].trim().startsWith("|")) {
    rows.push(lines[cursor].trim());
    cursor += 1;
  }
  const cells = (row) =>
    row
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  let html = "<table>\n<thead><tr>";
  head.forEach((cell) => {
    html += `<th>${inline(cell)}</th>`;
  });
  html += "</tr></thead>\n<tbody>\n";
  body.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => {
      html += `<td>${inline(cell)}</td>`;
    });
    html += "</tr>\n";
  });
  html += "</tbody>\n</table>";
  return { html, cursor };
}

function renderList(lines, index, ordered) {
  const tag = ordered ? "ol" : "ul";
  let cursor = index;
  let html = `<${tag}>`;
  const regex = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*-\s+(.*)$/;
  while (cursor < lines.length && regex.test(lines[cursor])) {
    const [, item] = lines[cursor].match(regex);
    html += `<li>${inline(item)}</li>`;
    cursor += 1;
  }
  html += `</${tag}>`;
  return { html, cursor };
}

function renderBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      i += 1;
      while (i < lines.length && lines[i].trim() !== "---") i += 1;
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      i += 1;
      const code = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(`<pre><code class="language-${esc(lang)}">${esc(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (trimmed.startsWith("<")) {
      const raw = [];
      while (i < lines.length && (lines[i].trim().startsWith("<") || lines[i].trim() === "")) {
        raw.push(lines[i]);
        i += 1;
        if (raw[raw.length - 1].trim() === "</div>") break;
      }
      blocks.push(raw.join("\n"));
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length;
      const textContent = trimmed.replace(/^#{1,6}\s+/, "");
      const id = slug(textContent);
      blocks.push(`<h${level} id="${id}">${inline(textContent)}</h${level}>`);
      i += 1;
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const [, alt, src] = imageMatch;
      blocks.push(`<figure><img src="${src}" alt="${esc(alt)}"><figcaption>${inline(alt)}</figcaption></figure>`);
      i += 1;
      continue;
    }

    if (isTableStart(lines, i)) {
      const rendered = renderTable(lines, i);
      blocks.push(rendered.html);
      i = rendered.cursor;
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const rendered = renderList(lines, i, true);
      blocks.push(rendered.html);
      i = rendered.cursor;
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const rendered = renderList(lines, i, false);
      blocks.push(rendered.html);
      i = rendered.cursor;
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s+/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("<") &&
      !/^!\[/.test(lines[i].trim()) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }

    const paragraph = para.join(" ");
    const className = /^Table\s+[A-Z0-9.]+:/.test(paragraph) ? ' class="table-caption"' : "";
    blocks.push(`<p${className}>${inline(paragraph)}</p>`);
  }
  return blocks.join("\n");
}

const body = renderBlocks(markdown);
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="../">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>InCampus Final Report</title>
  <link rel="stylesheet" href="assets/report.css">
</head>
<body>
  <main class="page">
${body}
  </main>
</body>
</html>
`;

writeFileSync(outputPath, html, "utf8");
console.log(outputPath);
