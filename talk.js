async function loadTalks() {
  try {
    const response = await fetch("talks.json");
    const talks = await response.json();

    // Populate year filter options
    const years = [...new Set(talks.map(t => t.date.slice(0, 4)))].sort().reverse();
    const yearFilter = document.getElementById("yearFilter");
    years.forEach(y => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      yearFilter.appendChild(opt);
    });

    // Render talks
    function renderTalks(filterYear = "", searchTerm = "") {
      const container = document.getElementById("talks-container");
      container.innerHTML = "";

      const filtered = talks.filter(t => {
        const matchesYear = filterYear === "" || t.date.startsWith(filterYear);
        const term = searchTerm.toLowerCase();
        const text = (t.title + " " + t.speakers.join(" ") + " " + (t.tags || []).join(" ")).toLowerCase();
        return matchesYear && text.includes(term);
      });

      // Group by year
      const talksByYear = {};
      filtered.forEach(t => {
        const year = t.date.slice(0, 4);
        if (!talksByYear[year]) talksByYear[year] = [];
        talksByYear[year].push(t);
      });

      for (let year of Object.keys(talksByYear).sort().reverse()) {
        const section = document.createElement("section");
        section.className = "year-section";
        const heading = document.createElement("h2");
        heading.textContent = year;
        section.appendChild(heading);

        talksByYear[year].forEach(t => {
          const card = document.createElement("div");
          card.className = "talk-card";

          let titleHtml = t.title;
          if (t.url) {
            titleHtml = `<a href="${t.url}" target="_blank">${t.title}</a>`;
          }

          card.innerHTML = `
            <h3>${titleHtml}</h3>
            <p class="date">${t.date}</p>
            <p class="speakers">${t.speakers.join(", ")}</p>
          `;

          if (t.tags && t.tags.length) {
            const tagContainer = document.createElement("p");
            tagContainer.className = "tags";
            tagContainer.textContent = "Tags: " + t.tags.join(", ");
            card.appendChild(tagContainer);
          }

          section.appendChild(card);
        });

        container.appendChild(section);
      }
    }

    // Event listeners
    document.getElementById("yearFilter").addEventListener("change", () => {
      renderTalks(yearFilter.value, document.getElementById("search").value);
    });
    document.getElementById("search").addEventListener("input", () => {
      renderTalks(yearFilter.value, document.getElementById("search").value);
    });

    // Initial render
    renderTalks();

  } catch (error) {
    console.error("Error loading talks.json:", error);
    document.getElementById("talks-container").innerHTML = "<p>Failed to load talks.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadTalks);