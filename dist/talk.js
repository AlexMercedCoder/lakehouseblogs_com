const state = {
  talks: [],
  query: "",
  year: ""
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

async function init() {
  const container = $("#talks-root");
  const searchInput = $("#search");
  const yearFilter = $("#yearFilter");

  if (!container || !searchInput || !yearFilter) return;

  // Hydration check: if rendered content already exists in the container
  const isPreRendered = container.children.length > 0;

  try {
    // We always fetch data to populate the Year dropdown & for search filtering context
    const res = await fetch("talks.json");
    state.talks = await res.json();

    // Populate Year Filter (Hydrate or Create)
    // If staticgen pre-populated the dropdown, we might skip, but staticgen likely doesn't populate <select> options yet.
    // So we populate options dynamically.
    const years = [...new Set(state.talks.map(t => t.date.slice(0, 4)))].sort().reverse();
    // Clear existing only if not pre-rendered? Actually safest to just clear and re-add options except the first "All"
    yearFilter.innerHTML = `<option value="">All Years</option>`;
    years.forEach(y => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearFilter.appendChild(opt);
    });

    if (!isPreRendered) {
      // Fallback: Client-side render if no static content
      render(state.year, state.query);
    } else {
      // Enhancemnt: Ensure we attach Metadata for filtering to the existing DOM nodes if missing?
      // Actually, standard hydration pattern:
      // 1. We assume the static DOM is correct.
      // 2. We scan the static DOM and add dataset attributes for search if they are missing?
      // Or we just re-render on first search input.
      // Simplest robust strategy: "Reveal" approach.
      // We rely on the JSON data for filtering logic, and we just hide/show the DOM elements.
      // PROBLEM: The DOM elements don't strictly map 1:1 to JSON index if we rely on "cards".
      // SOLUTION: We will tag the static output with IDs or data attributes in staticgen?
      // ALTERNATIVE: Just re-render everything client-side on first interaction? No, that causes layout shift.
      
      // Better Selection Strategy: 
      // We will perform a purely DOM-based search for "hydration" mode?
      // Or, we can just strictly use the JSON to drive the view, and on "search", we re-render the list entirely?
      // "Re-rendering" replaces the static HTML. This is fine for search, but for initial load we want static.
      // So: Initial state = Static. On Input = Re-render.
      console.log("Hydrated static content.");
    }

    // Event Listeners
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
    if (!isPreRendered) container.innerHTML = "<p>Error loading data.</p>";
  }
}

function render(filterYear, filterQuery) {
  const container = $("#talks-root");
  container.innerHTML = ""; // Clear current (static or dynamic)

  // Filter Data
  const filtered = state.talks.filter(t => {
      const y = t.date.slice(0, 4);
      const yearMatch = !filterYear || y === filterYear;
      
      const text = (t.title + " " + (t.speakers||[]).join(" ") + " " + (t.tags||[]).join(" ") + " " + (t.event||"")).toLowerCase();
      const searchMatch = !filterQuery || text.includes(filterQuery);
      
      return yearMatch && searchMatch;
  });

  // Group
  const groups = {};
  filtered.forEach(t => {
    const y = t.date.slice(0, 4);
    if (!groups[y]) groups[y] = [];
    groups[y].push(t);
  });

  // Render HTML
  const years = Object.keys(groups).sort().reverse();
  
  if (years.length === 0) {
      container.innerHTML = `<div style="padding:1rem;">No results found.</div>`;
      return;
  }

  years.forEach(y => {
    const section = document.createElement("section");
    section.className = "year-section";
    section.innerHTML = `
      <div class="year-header">
        <h2 class="year-title">${y}</h2>
        <div class="year-count">${groups[y].length} posts</div>
      </div>
      <div class="links-grid"></div>
    `;
    const grid = section.querySelector(".links-grid");
    
    groups[y].forEach(item => {
       grid.appendChild(createCard(item));
    });
    
    container.appendChild(section);
  });
}

function createCard(t) {
  const card = document.createElement("article");
  card.className = "card reveal is-visible";
  
  const titleHtml = t.url 
    ? `<a href="${t.url}" target="_blank" rel="noopener">${escapeHtml(t.title)}</a>` 
    : escapeHtml(t.title);

  const speakers = (t.speakers || []).join(", ");
  const company = t.event || "Conference"; 

  card.innerHTML = `
      <div class="card__meta">
        <time>${t.date}</time> · <span>${escapeHtml(company)}</span>
      </div>
      <h3 class="card__title">${titleHtml}</h3>
      <div class="card__footer">
        <span class="source">By ${escapeHtml(speakers)}</span>
        <span class="badges"></span>
      </div>
  `;
  return card;
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

document.addEventListener("DOMContentLoaded", init);