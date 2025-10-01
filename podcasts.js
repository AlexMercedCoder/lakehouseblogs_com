async function initPodcasts() {
  const root = document.getElementById("podcasts-root");
  const searchInput = document.getElementById("search");
  const yearFilter = document.getElementById("yearFilter");

  try {
    const res = await fetch("podcasts.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch podcasts.json: ${res.status}`);
    const episodes = await res.json();

    // Normalize
    const items = episodes.map(ep => ({
      ...ep,
      year: (ep.publication_date || "").slice(0, 4),
      _search: [
        ep.episode_title,
        ep.podcast_title,
        ep.publication_date,
        ep.url
      ].filter(Boolean).join(" ").toLowerCase()
    }));

    // Build year list
    const years = [...new Set(items.map(i => i.year).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a));
    years.forEach(y => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearFilter.appendChild(opt);
    });

    function groupByYear(list) {
      const by = {};
      for (const it of list) {
        const y = it.year || "Unknown";
        if (!by[y]) by[y] = [];
        by[y].push(it);
      }
      // sort each year by date asc/desc? Use desc for convenience
      for (const y of Object.keys(by)) {
        by[y].sort((a, b) => (b.publication_date || "").localeCompare(a.publication_date || ""));
      }
      return by;
    }

    function render(filterYear = "", q = "") {
      const query = (q || "").toLowerCase().trim();
      const filtered = items.filter(it => {
        const okYear = !filterYear || it.year === filterYear;
        const okSearch = !query || it._search.includes(query);
        return okYear && okSearch;
      });

      const grouped = groupByYear(filtered);
      const orderedYears = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

      root.innerHTML = "";
      for (const y of orderedYears) {
        const section = document.createElement("section");
        section.className = "year-section";

        const header = document.createElement("div");
        header.className = "year-header";
        header.innerHTML = `<h2 class="year-title">${y}</h2><div class="year-count">${grouped[y].length} episodes</div>`;
        section.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "cards";

        grouped[y].forEach(ep => {
          const card = document.createElement("article");
          card.className = "card";

          const titleHTML = ep.url
            ? `<a href="${ep.url}" target="_blank" rel="noopener">${escapeHtml(ep.episode_title)}</a>`
            : escapeHtml(ep.episode_title);

          card.innerHTML = `
            <div class="meta">
              <time datetime="${ep.publication_date || ""}">${fmtDate(ep.publication_date)}</time>
              <span class="sep">·</span>
              <span class="podcast">${escapeHtml(ep.podcast_title || "")}</span>
            </div>
            <h3 class="card-title">${titleHTML}</h3>
          `;
          grid.appendChild(card);
        });

        section.appendChild(grid);
        root.appendChild(section);
      }

      if (!orderedYears.length) {
        root.innerHTML = `
          <div class="empty">
            <p>No episodes match your filters.</p>
          </div>`;
      }
    }

    // Utils
    function fmtDate(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d)) return iso;
      return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    }
    function escapeHtml(s = "") {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // Events
    yearFilter.addEventListener("change", () => {
      render(yearFilter.value, searchInput.value);
    });
    searchInput.addEventListener("input", () => {
      render(yearFilter.value, searchInput.value);
    });

    // Initial render
    render();

  } catch (err) {
    console.error(err);
    root.innerHTML = `
      <div class="error">
        <strong>Couldn’t load podcasts.</strong>
        <div>${escapeHtml(err.message || String(err))}</div>
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", initPodcasts);
