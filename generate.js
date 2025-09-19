#!/usr/bin/env node
/**
 * generate.js
 * Static renderer for LakehouseBlogs.com
 *
 * Usage:
 *   node generate.js                 # uses index.html + blogs.json -> blog.html
 *   node generate.js input.html data.json output.html
 *
 * Notes:
 * - No external dependencies required (Node 16+ recommended).
 * - Replaces #yearNav and #yearsRoot contents, removes templates and index.js script tag.
 */

const fs = require("fs");
const path = require("path");

// ---- CLI args ----
const INPUT_HTML = process.argv[2] || "index.html";
const INPUT_JSON = process.argv[3] || "blogs.json";
const OUTPUT_HTML = process.argv[4] || "blog.html";

// ---- Helpers ----
function readFile(p) {
  return fs.readFileSync(path.resolve(p), "utf8");
}

function writeFile(p, contents) {
  fs.writeFileSync(path.resolve(p), contents, "utf8");
}

function fmtDate(iso) {
  // Format to "Month D, YYYY"
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupByYear(blogs) {
  const map = new Map();
  for (const b of blogs) {
    const year = new Date(b.date).getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year).push({ ...b, year });
  }
  // sort blogs in each year desc
  for (const [y, arr] of map.entries()) {
    arr.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return map;
}

function buildBadges(tags = []) {
  return tags
    .map((t) => `<span class="badge">${escapeHtml(t)}</span>`)
    .join("");
}

function buildCard(blog) {
  const {
    title,
    date,
    url,
    company = "",
    author = "",
    author_url = "",
    project_slugs = [],
    tags = [],
  } = blog;

  const safeTitle = escapeHtml(title);
  const safeCompany = escapeHtml(company);
  const safeAuthor = escapeHtml(author);

  return `
    <article class="card">
      <div class="card__meta">
        <time datetime="${date}">${fmtDate(date)}</time> · <span>${safeCompany}</span>
      </div>
      <h3 class="card__title">
        <a href="${url}" target="_blank" rel="noopener">${safeTitle}</a>
      </h3>
      <div class="card__footer">
        <span class="source">By <a href="${author_url || url}" target="_blank" rel="noopener">${safeAuthor}</a></span>
        <span class="badges">${buildBadges(tags)}</span>
      </div>
    </article>`;
}

function buildYearSection(year, items) {
  const cards = items.map(buildCard).join("\n");
  const count = items.length;
  return `
    <section id="${year}" class="year-section">
      <div class="year-header">
        <h2 class="year-title">${year}</h2>
        <div class="year-count">${count} posts</div>
      </div>
      <div class="links-grid">
        ${cards}
      </div>
    </section>`;
}

function buildYearNav(yearsDesc) {
  return yearsDesc
    .map(
      (y, i) =>
        `<a href="#${y}" class="${i === 0 ? "is-active" : ""}" data-year="${y}">${y}</a>`
    )
    .join("");
}

// ---- Main ----
(function main() {
  try {
    // 1) Load files
    const html = readFile(INPUT_HTML);
    const jsonRaw = readFile(INPUT_JSON);
    const data = JSON.parse(jsonRaw);

    // 2) Normalize + sort blogs desc
    const blogs = (data.blogs || [])
      .map((b) => ({
        ...b,
        date: b.date,
      }))
      .filter((b) => b.title && b.date && b.url)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3) Group by year
    const grouped = groupByYear(blogs);
    const yearsDesc = Array.from(grouped.keys()).sort((a, b) => b - a);

    // 4) Build HTML chunks
    const navHTML = buildYearNav(yearsDesc);
    const yearsHTML = yearsDesc.map((y) => buildYearSection(y, grouped.get(y))).join("\n");

    // 5) Replace #yearNav inner HTML
    let out = html.replace(
      /<div class="year-nav__inner" id="yearNav">[\s\S]*?<\/div>/,
      `<div class="year-nav__inner" id="yearNav">${navHTML}</div>`
    );

    // 6) Replace #yearsRoot block
    out = out.replace(
      /<div id="yearsRoot"[^>]*>[\s\S]*?<\/div>/,
      `<div id="yearsRoot" role="region" aria-live="polite">
        ${yearsHTML}
      </div>`
    );

    // 7) Remove dynamic script include(s) to make page fully static
    out = out.replace(/<script[^>]*src=["']index\.js["'][^>]*>\s*<\/script>/g, "");

    // 8) Remove templates and noscript blocks (optional for cleanliness)
    out = out.replace(/<template[\s\S]*?<\/template>/g, "");
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");

    // 9) Insert generator stamp (HTML comment at end of body)
    out = out.replace(
      /<\/body>\s*<\/html>\s*$/i,
      `  <!-- Static build generated from ${path.basename(
        INPUT_HTML
      )} + ${path.basename(INPUT_JSON)} on ${new Date().toISOString()} -->
</body></html>`
    );

    // 10) Write output
    writeFile(OUTPUT_HTML, out);
    console.log(
      `✅ Static page generated: ${OUTPUT_HTML}\n   Source: ${INPUT_HTML} + ${INPUT_JSON}\n   Years: ${yearsDesc.join(
        ", "
      )}`
    );
  } catch (err) {
    console.error("❌ Failed to generate static page:", err.message || err);
    process.exit(1);
  }
})();
