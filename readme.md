# LakehouseBlogs.com

A one-page, mobile-first **link aggregator** for Open Source data lakehouse projects:
**Apache Iceberg, Delta Lake, Apache Hudi, Apache Paimon, Apache Polaris (incubating), Apache Gravitino, Project Nessie**.

This site is static (HTML/CSS/JS) and **build-free**. All blog cards and year sections are **generated dynamically** from `blogs.json`.

---

## 🚀 Quick Start (Local)

```bash
# clone your fork
git clone https://github.com/<your-username>/lakehouseblogs_com.git
cd lakehouseblogs_com

# serve the folder with any static server you like:
# Option A: Python
python3 -m http.server 5173

# Option B: Node (if you have it)
npx serve -p 5173 .

# now open the site
# http://localhost:5173
The page fetches blogs.json at runtime. Serving over HTTP avoids browser CORS restrictions.
```

## 🗂 Repo Structure
```pgsql
/
├─ index.html        # Static shell; JS populates content dynamically
├─ index.css         # Design system, responsive layout, and components
├─ index.js          # Fetches blogs.json, groups by year, renders cards, search/filters
└─ blogs.json        # Single source of truth for all blog entries
```

##📦 Data Model (blogs.json)
All content lives in blogs.json under a single array blogs. Each entry:

```json
{
  "title": "What’s New in Apache Iceberg 1.10.0, and what comes next!",
  "date": "2025-09-12",
  "url": "https://www.example.com/post",
  "company": "Dremio",
  "author": "Alex Merced",
  "author_url": "https://www.alexmerced.com/data",
  "project_slugs": ["iceberg"],
  "tags": ["Apache Iceberg"]
}
```
## Field Requirements

**title:** String — the blog post title.

**date:** String — ISO format YYYY-MM-DD (required for correct year grouping & sorting).

**url:** String — canonical permalink to the post.

**company:** String — publisher or company.

**author:** String — one or more authors (comma-separated or joined with &).

**author_url:** String — author profile or company author page (optional but preferred).

**project_slugs:** Array<String> — normalized slugs used for filtering:

iceberg, delta, hudi, paimon, polaris, gravitino, nessie

(Additional tech slugs allowed if relevant: e.g., spark, flink, trino, hive, arrow, minio, java, orc, etc.)

**tags:** Array<String> — human-readable tags displayed on the card (e.g., "Apache Iceberg", "Apache Spark").

**Sorting:** The site sorts entries descending by date and auto-creates year banners from date.

## ➕ How to Add a Blog Post
- Fork the repo.

Edit blogs.json:

- Add a new object under "blogs": [ ... ].

- Ensure date is YYYY-MM-DD (Pad month/day with zeroes).

- Use normalized project_slugs (see list above).

- Keep tags readable and aligned with the slugs.

- Validate JSON (no trailing commas, valid quotes/braces).

- Preview locally (see Quick Start).

Commit & PR:

- Use a descriptive message, e.g., add: New blog on Iceberg clustering (2025-04-28).

- Open a Pull Request to the upstream repo with a short summary and (optionally) the blog’s one-liner.

#### Example Addition
```json
{
  "title": "Streaming Foo into Iceberg with Flink",
  "date": "2025-09-18",
  "url": "https://example.com/streaming-foo-into-iceberg",
  "company": "ACME Data",
  "author": "Jane Doe",
  "author_url": "https://www.linkedin.com/in/janedoe",
  "project_slugs": ["iceberg", "flink"],
  "tags": ["Apache Iceberg", "Apache Flink"]
}
```
## 🧭 Filters & Search

- Project filter chips map to project_slugs. If a post includes that slug, it appears when the chip is active.

- Search matches across title, company, author, tags, slugs, and URL (case-insensitive).

- If you introduce a new technology slug (e.g., arrow), consider adding a matching chip in index.html (Filters section) for quick filtering.

## ♿ Accessibility & UX
- - Keyboard focus states and high-contrast colors are included.

- - Cards use semantic elements (article, time) and accessible labels.

- - Sticky year nav highlights the active year as you scroll.

- - Cards animate in with a subtle reveal (prefers-reduced-motion users still get content).

## 🧪 Review Checklist for PRs
 - blogs.json validates as valid JSON (e.g., with jq or an online validator).

 - date uses ISO YYYY-MM-DD.

 - project_slugs are normalized (use provided canonical set).

 - Tags align with content (e.g., “Apache Iceberg” for iceberg).

 - Local preview looks correct (post is under the proper year, filters/search work).

 - External links open and are public.

## 🔗 Project Links (Footer)
- Apache Iceberg — https://iceberg.apache.org/

- Delta Lake — https://delta.io/

- Apache Hudi — https://hudi.apache.org/

- Apache Paimon — https://paimon.apache.org/

- Apache Polaris (incubating) — https://polaris.apache.org/

- Apache Gravitino — https://gravitino.apache.org/

- Project Nessie — https://projectnessie.org/

## 🛡 License
MIT © Contributors

## 🙌 Contributing
We welcome contributions! Open an issue to propose:

- New blog entries

- New filter chips / tags

- UI/UX improvements

- Accessibility and performance tweaks

Please keep PRs focused and small where possible. Thanks for helping the community discover great Lakehouse content!