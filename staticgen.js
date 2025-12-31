#!/usr/bin/env node
/**
 * staticgen.js
 * Unified Static Site Generator for LakehouseBlogs.com
 *
 * Capabilities:
 * - Builds index.html (Blogs), talk.html (Talks), podcasts.html (Podcasts)
 * - Normalizes data from different JSON schemas
 * - Generates feed.xml (RSS)
 * - Copies assets to dist/
 */

const fs = require("fs");
const path = require("path");

// ---- Config ----
const DIST_DIR = path.join(__dirname, "dist");
const ASSETS_TO_COPY = ["index.css", "robots.txt", "sitemap.xml", "og-image.png", "index.js", "talk.js", "podcasts.js", "blogs.json", "talks.json", "podcasts.json"]; // Add og-image.png if exists, otherwise handled gracefully
const FILES = {
  blog: { html: "index.html", json: "blogs.json", out: "index.html", type: "blog" },
  talk: { html: "talk.html", json: "talks.json", out: "talk.html", type: "talk" },
  podcast: { html: "podcasts.html", json: "podcasts.json", out: "podcasts.html", type: "podcast" },
};

// ---- Helpers ----
function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR);
}

function copyAssets() {
  ASSETS_TO_COPY.forEach((f) => {
    const src = path.join(__dirname, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, f));
    }
  });
  // Also copy any other existing images or folders if needed, e.g. 'other'
  if (fs.existsSync(path.join(__dirname, "other"))) {
     fs.cpSync(path.join(__dirname, "other"), path.join(DIST_DIR, "other"), { recursive: true });
  }
}

function readFile(p) {
  return fs.readFileSync(path.resolve(p), "utf8");
}

function writeFile(p, contents) {
  fs.writeFileSync(path.resolve(DIST_DIR, p), contents, "utf8");
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// ---- Normalization ----
function normalizeData(item, type) {
  // Target schema: { title, url, date, author, company, tags }
  if (type === "blog") {
    // Already in format, but ensure date
    return {
      title: item.title,
      url: item.url,
      date: item.date,
      author: item.author,
      company: item.company,
      tags: item.tags || [],
    };
  }
  if (type === "talk") {
    return {
      title: item.title,
      url: item.url,
      date: item.date,
      author: (item.speakers || []).join(", "),
      company: item.event || "Conference", // Map event to company slot
      tags: item.tags || [],
    };
  }
  if (type === "podcast") {
    return {
      title: item.episode_title,
      url: item.url,
      date: item.publication_date,
      author: item.podcast_title, // Map podcast name to author slot effectively
      company: "Podcast",
      tags: [],
    };
  }
  return item;
}

// ---- Rendering ----
function buildCard(item) {
  const safeTitle = escapeHtml(item.title);
  const safeUrl = item.url;
  const safeDate = fmtDate(item.date);
  const safeAuthor = escapeHtml(item.author);
  const safeCompany = escapeHtml(item.company);

  const tagsHtml = (item.tags || [])
    .map((t) => `<span class="badge">${escapeHtml(t)}</span>`)
    .join("");

  return `
    <article class="card reveal is-visible">
      <div class="card__meta">
        <time datetime="${item.date}">${safeDate}</time>
        ${safeCompany ? `· <span>${safeCompany}</span>` : ""}
      </div>
      <h3 class="card__title">
        <a href="${safeUrl}" target="_blank" rel="noopener">${safeTitle}</a>
      </h3>
      <div class="card__footer">
        <span class="source">${safeAuthor ? `By ${safeAuthor}` : ""}</span>
        <span class="badges">${tagsHtml}</span>
      </div>
    </article>`;
}

function buildYearSection(year, items) {
  const cards = items.map(buildCard).join("\n");
  return `
    <section id="${year}" class="year-section">
      <div class="year-header">
        <h2 class="year-title">${year}</h2>
        <div class="year-count">${items.length} posts</div>
      </div>
      <div class="links-grid">
        ${cards}
      </div>
    </section>`;
}
function buildPage(config) {
  console.log(`Building ${config.out}...`);
  const htmlRaw = readFile(config.html);
  const jsonRaw = readFile(config.json);
  
  let data;
  try {
     data = JSON.parse(jsonRaw);
     if (data.blogs) data = data.blogs; 
  } catch (e) {
    console.error(`Error parsing ${config.json}:`, e);
    return;
  }

  // 1. Normalize
  const items = data
    .map((item) => normalizeData(item, config.type))
    .filter((i) => i.title && i.url) 
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // 2. Group by Year
  const grouped = new Map();
  for (const item of items) {
    const y = new Date(item.date).getFullYear();
    if (!grouped.has(y)) grouped.set(y, []);
    grouped.get(y).push(item);
  }
  const yearsDesc = Array.from(grouped.keys()).sort((a, b) => b - a);

  // 3. Build HTML
  const contentHtml = yearsDesc
    .map((y) => buildYearSection(y, grouped.get(y)))
    .join("\n");

  // 4. Inject into container
  let out = htmlRaw;
  const targets = ["yearsRoot", "talks-root", "podcasts-root"];
  let injected = false;
  
  for (const t of targets) {
     const regex = new RegExp(`(<div[^>]*id="${t}"[^>]*>)([\\s\\S]*?)(</div>)`);
     if (regex.test(out)) {
       out = out.replace(regex, `$1${contentHtml}$3`);
       injected = true;
       break;
     }
  }
  
  if (!injected) {
    console.warn(`Warning: Could not find injection root in ${config.html}`);
  }

  // 5. Cleanup: DO NOT strip scripts anymore.
  // out = out.replace(/<script[^>]*src=["'](index|talk|podcasts)\.js["'][^>]*>[\s\S]*?<\/script>/g, "");
  
  // 6. Inject Generator Stamp
  const stamp = `<!-- Static build: ${new Date().toISOString()} -->`;
  out = out.replace("</body>", `${stamp}\n</body>`);

  writeFile(config.out, out);
}

// ---- RSS Generation ----
function generateRSS() {
  console.log("Generating RSS Feed...");
  const jsonRaw = readFile("blogs.json");
  const data = JSON.parse(jsonRaw);
  const blogs = (data.blogs || [])
     .map(b => normalizeData(b, "blog"))
     .sort((a, b) => new Date(b.date) - new Date(a.date))
     .slice(0, 50); // Top 50

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>LakehouseBlogs.com</title>
  <link>https://lakehouseblogs.com</link>
  <description>Latest open source data lakehouse blogs and tutorials.</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${blogs.map(b => `
  <item>
    <title>${escapeHtml(b.title)}</title>
    <link>${b.url}</link>
    <description>${escapeHtml(b.title)} - By ${escapeHtml(b.author)} at ${escapeHtml(b.company)}</description>
    <pubDate>${new Date(b.date).toUTCString()}</pubDate>
    <guid>${b.url}</guid>
  </item>`).join("")}
</channel>
</rss>`;

  writeFile("feed.xml", xml);
}

// ---- Main ----
(function main() {
  console.log("🚀 Starting unified static build...");
  cleanDist();
  copyAssets();
  
  buildPage(FILES.blog);
  buildPage(FILES.talk);
  buildPage(FILES.podcast);
  
  generateRSS();
  
  console.log("✅ Build complete! Output in dist/");
})();
