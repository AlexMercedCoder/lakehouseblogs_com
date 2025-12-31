/* =========================================================
   LakehouseBlogs.com — index.js
   Dynamically renders year sections and link cards from blogs.json
   Features: search, project filters, year toggles, scroll-spy, lazy reveal
   ========================================================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Roots & templates
  const yearsRoot = $("#yearsRoot");
  const yearNav = $("#yearNav");
  const searchInput = $("#search");
  const filtersBar = $("#filters");
  const cardTpl = $("#cardTemplate");
  const yearTpl = $("#yearTemplate");

  // App state
  const state = {
    blogs: [],
    grouped: new Map(), // year -> array of blogs
    activeProject: "all",
    query: ""
  };

  // Helpers
  const fmtDate = (iso) =>
    new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" })
      .format(new Date(iso));

  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Fetch + initialize
  async function init() {
    try {
      const res = await fetch("blogs.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load blogs.json: ${res.status}`);
      const data = await res.json();

      // Normalize, sort (newest first)
      state.blogs = (data.blogs || [])
        .map(b => ({
          ...b,
          date: b.date, // ISO string expected (YYYY-MM-DD)
          year: new Date(b.date).getFullYear(),
          project_slugs: Array.isArray(b.project_slugs) ? b.project_slugs : [],
          tags: Array.isArray(b.tags) ? b.tags : []
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      groupByYear();
      renderAll();
      bindUI();
      observeScrollSpy();
      observeReveals();
    } catch (err) {
      console.error(err);
      yearsRoot.innerHTML = `
        <div style="padding:1rem; border:1px solid #e5e7eb; border-radius:.5rem;">
          <strong>Could not load blog data.</strong>
          <div class="muted" style="margin-top:.25rem;">${String(err.message || err)}</div>
        </div>`;
    }
  }

  function groupByYear() {
    state.grouped.clear();
    for (const b of state.blogs) {
      if (!state.grouped.has(b.year)) state.grouped.set(b.year, []);
      state.grouped.get(b.year).push(b);
    }
    // Ensure per-year arrays are sorted by date desc
    for (const [year, arr] of state.grouped.entries()) {
      arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  function renderAll() {
    // Year nav (desc)
    const years = Array.from(state.grouped.keys()).sort((a, b) => b - a);
    yearNav.innerHTML = years
      .map(
        (y, i) =>
          `<a href="#${y}" class="${i === 0 ? "is-active" : ""}" data-year="${y}">${y}</a>`
      )
      .join("");

    // Year sections + cards
    yearsRoot.innerHTML = "";
    for (const year of years) {
      const section = yearTpl.content.firstElementChild.cloneNode(true);
      section.id = String(year);
      $(".year-title", section).textContent = String(year);

      const grid = $(".links-grid", section);
      const items = state.grouped.get(year) || [];

      for (const blog of items) {
        const card = buildCard(blog);
        grid.appendChild(card);
      }

      // Initial count
      updateYearCount(section);

      // Toggle button
      const toggleBtn = $(".toggle-year", section);
      toggleBtn.addEventListener("click", () => {
        const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
        toggleBtn.setAttribute("aria-expanded", String(!expanded));
        grid.style.display = expanded ? "none" : "";
      });

      yearsRoot.appendChild(section);
    }

    // Apply initial filter/search (no-op visual but sets attributes)
    applyFilters();
  }

  function buildCard(blog) {
    const card = cardTpl.content.firstElementChild.cloneNode(true);

    // meta
    const t = $("time", card);
    t.dateTime = blog.date;
    t.textContent = fmtDate(blog.date);

    $(".company", card).textContent = blog.company || "";

    // title
    const titleA = $(".title", card);
    titleA.href = blog.url;
    titleA.textContent = blog.title;

    // author
    const authorA = $(".author", card);
    authorA.href = blog.author_url || blog.url;
    authorA.textContent = blog.author || "Unknown";

    // badges
    const badgesWrap = $(".badges", card);
    badgesWrap.innerHTML = "";
    (blog.tags || []).forEach(tag => {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = tag;
      badgesWrap.appendChild(span);
    });

    // project filter slugs
    const projects = blog.project_slugs || [];
    card.dataset.project = projects.join(" ");

    // searchable blob (for fast contains checks)
    const searchable = [
      blog.title,
      blog.company,
      blog.author,
      (blog.tags || []).join(" "),
      projects.join(" "),
      blog.url
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    card.dataset.search = searchable;

    // reveal class already on template root: ensure present
    card.classList.add("reveal");

    return card;
  }

  // Filtering + Search
  function applyFilters() {
    const q = state.query.trim().toLowerCase();
    const active = state.activeProject;

    // For each card, determine visibility
    const sections = $$(".year-section", yearsRoot);
    for (const section of sections) {
      const cards = $$(".card", section);
      let visibleCount = 0;

      for (const card of cards) {
        const matchesProject =
          active === "all" || (card.dataset.project || "").split(/\s+/).includes(active);

        const matchesQuery = q === "" || (card.dataset.search || "").includes(q);

        const isVisible = matchesProject && matchesQuery;

        card.classList.toggle("hidden", !isVisible);
        if (isVisible) visibleCount++;
      }

      // Update per-year visible counts & optionally hide the whole year if 0
      updateYearCount(section, visibleCount);
      section.classList.toggle("hidden", visibleCount === 0);
    }
  }

  function updateYearCount(section, visibleOverride) {
    const countEl = $(".year-count", section);
    const total = $$(".card", section).length;
    const visible =
      typeof visibleOverride === "number"
        ? visibleOverride
        : $$(".card:not(.hidden)", section).length;

    countEl.textContent = `${visible}/${total} posts`;
  }

  // Scroll spy: highlight active year in nav
  function observeScrollSpy() {
    const navLinks = $$("a[data-year]", yearNav);
    const sections = $$(".year-section");

    if (!sections.length || !navLinks.length) return;

    const byId = new Map(navLinks.map(a => [a.getAttribute("href")?.slice(1), a]));

    const io = new IntersectionObserver(
      (entries) => {
        // Find the entry most in view and mark corresponding nav link active
        const view = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (view) {
          const year = view.target.id;
          navLinks.forEach(a => a.classList.toggle("is-active", a.dataset.year === year));
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach(sec => io.observe(sec));

    // Enhance click behavior (smooth scroll is in CSS; here we also close mobile keyboards)
    yearNav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      searchInput?.blur();
    });
  }

  // Reveal-on-scroll for cards
  function observeReveals() {
    const cards = $$(".card.reveal");
    if (!cards.length) return;

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    cards.forEach((c) => io.observe(c));
  }

  // UI bindings
  function bindUI() {
    // Search
    if (searchInput) {
      const onSearch = debounce((e) => {
        state.query = e.target.value || "";
        applyFilters();
      }, 150);
      searchInput.addEventListener("input", onSearch);
    }

    // Filters (chips)
    if (filtersBar) {
      filtersBar.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        // Update active chip
        $$(".chip", filtersBar).forEach(c => c.classList.remove("is-active"));
        chip.classList.add("is-active");

        // Update state
        state.activeProject = chip.dataset.project || "all";
        applyFilters();
      });
    }
  }

  // Kick off
  document.addEventListener("DOMContentLoaded", init);
})();
