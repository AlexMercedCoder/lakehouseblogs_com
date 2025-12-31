```javascript
const state = {
  episodes: [],
  query: "",
  year: ""
};

const $ = (s) => document.querySelector(s);

async function init() {
  const container = $("#podcasts-root");
  const searchInput = $("#search");
  const yearFilter = $("#yearFilter");

  if (!container || !searchInput || !yearFilter) return;

  const isPreRendered = container.children.length > 0;

  try {
    const res = await fetch("podcasts.json", { cache: "no-store" });
    state.episodes = await res.json();

    // Populate Year Filter
    const years = [...new Set(state.episodes.map(e => (e.publication_date||"").slice(0, 4)).filter(Boolean))].sort().reverse();
    yearFilter.innerHTML = `<option value="">All Years</option>`;
    years.forEach(y => {
       const opt = document.createElement("option");
       opt.value = y;
       opt.textContent = y;
       yearFilter.appendChild(opt);
    });

    if (isPreRendered) {
      console.log("Hydrated static content.");
    } else {
      render(state.year, state.query);
    }

    // Bind
    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value.toLowerCase();
      render(state.year, state.query);
    });
    yearFilter.addEventListener("change", (e) => {
      state.year = e.target.value;
      render(state.year, state.query);
    });

  } catch (err) {
    console.error(err);
    if (!isPreRendered) container.innerHTML = "<p>Error loading podcasts.</p>";
  }
}

function render(filterYear, filterQuery) {
  const container = $("#podcasts-root");
  container.innerHTML = "";

  const items = state.episodes.map(ep => ({
     ...ep,
     year: (ep.publication_date||"").slice(0, 4),
     _search: [ep.episode_title, ep.podcast_title, ep.publication_date].join(" ").toLowerCase()
  }));

  const filtered = items.filter(ep => {
     const okYear = !filterYear || ep.year === filterYear;
     const okSearch = !filterQuery || ep._search.includes(filterQuery);
     return okYear && okSearch;
  });

  const groups = {};
  filtered.forEach(ep => {
      const y = ep.year || "Unknown";
      if (!groups[y]) groups[y] = [];
      groups[y].push(ep);
  });

  const years = Object.keys(groups).sort().reverse();

  if (!years.length) {
     container.innerHTML = `<div style="padding:1rem;">No episodes match.</div>`;
     return;
  }

  years.forEach(y => {
     const section = document.createElement("section");
     section.className = "year-section";
     section.innerHTML = `
        <div class="year-header">
           <h2 class="year-title">${y}</h2>
           <div class="year-count">${groups[y].length} episodes</div>
        </div>
        <div class="links-grid"></div>
     `;
     const grid = section.querySelector(".links-grid");
     groups[y].forEach(ep => grid.appendChild(createCard(ep)));
     container.appendChild(section);
  });
}

function createCard(ep) {
  const card = document.createElement("article");
  card.className = "card reveal is-visible";
  
  const titleHtml = ep.url 
     ? `<a href="${ep.url}" target="_blank" rel="noopener">${escapeHtml(ep.episode_title)}</a>` 
     : escapeHtml(ep.episode_title);

  const dateStr = ep.publication_date 
     ? new Date(ep.publication_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) 
     : "";

  card.innerHTML = `
    <div class="card__meta">
       <time datetime="${ep.publication_date}">${dateStr}</time> · <span>${escapeHtml(ep.podcast_title)}</span>
    </div>
    <h3 class="card__title">${titleHtml}</h3>
    <div class="card__footer">
       <span class="source">Podcast</span>
       <span class="badges"></span>
    </div>
  `;
  return card;
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", init);
```
