/**
 * Mini Google 1998! – AI Lab: Keyword Frequency vs. PageRank Algorithm
 * 
 * Vanilla JavaScript implementation demonstrating:
 * 1. Traditional keyword-frequency-based ranking (Old Way)
 * 2. Link-graph-based PageRank calculation via 100,000 Random Surfer moves (PageRank Way)
 */

// ==========================================
// 1. DATASET
// ==========================================
// Exact dummy dataset representing 6 pages with URLs, body text, and outgoing links
const dataset = [
  {
    id: 1,
    url: "pune-food-guide.com",
    text: "Where to eat in Pune - vada pav and biryani and pizza",
    linksTo: [2]
  },
  {
    id: 2,
    url: "best-pizza-pune.com",
    text: "Fresh wood-fired pizza made daily - try our cheese pizza",
    linksTo: [1, 3]
  },
  {
    id: 3,
    url: "college-canteen-blog.com",
    text: "Student reviews of canteen food and chai and Friday pizza",
    linksTo: [2, 4]
  },
  {
    id: 4,
    url: "pizza-recipes-home.com",
    text: "Make pizza at home - pizza dough and pizza sauce",
    linksTo: [2, 5]
  },
  {
    id: 5,
    url: "cheap-eats-pune.com",
    text: "Good food under 100 rupees - misal and dosa and pizza slices",
    linksTo: [2]
  },
  {
    id: 6,
    url: "pizza-pizza-pizza.com",
    text: "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza",
    linksTo: [1]
  }
];

// Precomputed PageRank storage
let pageRankScores = {};
let surferVisitCounts = {};
let currentQuery = "";

// ==========================================
// 2. PAGERANK ALGORITHM: RANDOM SURFER MODEL
// ==========================================
/**
 * Simulates the Random Surfer model across the directed graph.
 * 
 * Algorithm Steps:
 * 1. Build a directed graph from the `linksTo` information.
 * 2. Pick a random website as the surfer's starting location.
 * 3. Perform 100,000 steps.
 * 4. At each step:
 *    - With probability (1 - dampingFactor) [15%], or if the website has no outgoing links,
 *      teleport to any uniformly random website.
 *    - With probability dampingFactor [85%], pick an outgoing link at random and navigate to it.
 * 5. Track visits to each website.
 * 6. Calculate each page's PageRank percentage as (visits / totalMoves) * 100.
 * 
 * @param {Array} pages - Dataset of website objects
 * @param {number} totalMoves - Total surfer moves (default: 100,000)
 * @param {number} dampingFactor - Damping factor (default: 0.85)
 * @returns {Object} { pageRanks, visitCounts }
 */
function simulatePageRank(pages, totalMoves = 100000, dampingFactor = 0.85) {
  const pageIds = pages.map(p => p.id);
  
  // 1. Build directed graph lookup
  const graph = {};
  pages.forEach(p => {
    graph[p.id] = Array.isArray(p.linksTo) ? [...p.linksTo] : [];
  });

  // Track how many times each website is visited
  const visitCounts = {};
  pageIds.forEach(id => {
    visitCounts[id] = 0;
  });

  // 4. Start surfer at a randomly selected website
  let currentPageId = pageIds[Math.floor(Math.random() * pageIds.length)];

  // 3. Simulate 100,000 random surfer moves
  for (let step = 0; step < totalMoves; step++) {
    const outgoing = graph[currentPageId] || [];
    const randomVal = Math.random();

    // 6. Damping factor of 0.85: teleport with probability 0.15
    // 7. Handle pages with 0 outgoing links by teleporting to a random page
    if (randomVal >= dampingFactor || outgoing.length === 0) {
      currentPageId = pageIds[Math.floor(Math.random() * pageIds.length)];
    } else {
      // 5. Follow one of the outgoing links randomly
      const randomIndex = Math.floor(Math.random() * outgoing.length);
      currentPageId = outgoing[randomIndex];
    }

    // 8. Count visits
    visitCounts[currentPageId]++;
  }

  // 9. Calculate the PageRank percentage
  const pageRanks = {};
  pageIds.forEach(id => {
    pageRanks[id] = (visitCounts[id] / totalMoves) * 100;
  });

  return { pageRanks, visitCounts };
}

/**
 * Initializes or re-calculates the PageRank scores across all pages.
 */
function initPageRank() {
  console.time("PageRank Simulation (100,000 moves)");
  const result = simulatePageRank(dataset, 100000, 0.85);
  console.timeEnd("PageRank Simulation (100,000 moves)");

  pageRankScores = result.pageRanks;
  surferVisitCounts = result.visitCounts;

  console.log("=== PageRank Simulation Results (100,000 Moves, Damping = 0.85) ===");
  dataset.forEach(p => {
    console.log(
      `Page ${p.id} [${p.url}]: ${surferVisitCounts[p.id]} visits (${pageRankScores[p.id].toFixed(2)}%)`
    );
  });
}

// ==========================================
// 3. KEYWORD MATCHING & OCCURRENCE COUNTING
// ==========================================
/**
 * Safely escapes special regex characters.
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Escapes raw strings for safe HTML rendering to prevent XSS.
 */
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Counts how many times the searched keyword appears in the given text.
 * Case-insensitive, supports partial matches.
 * 
 * @param {string} text - The page body text
 * @param {string} query - The search keyword
 * @returns {number} Frequency count
 */
function countOccurrences(text, query) {
  if (!text || !query) return 0;
  const escaped = escapeRegex(query.trim());
  const regex = new RegExp(escaped, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Wraps every occurrence of the search keyword in `<mark class="highlight">`
 * preserving the original casing of the matched text.
 * 
 * @param {string} text - Text to highlight
 * @param {string} query - Keyword to highlight
 * @returns {string} HTML string with highlights
 */
function highlightKeywords(text, query) {
  if (!query || !query.trim()) {
    return escapeHtml(text);
  }
  const safeText = escapeHtml(text);
  const escaped = escapeRegex(query.trim());
  const regex = new RegExp(`(${escaped})`, "gi");
  return safeText.replace(regex, '<mark class="highlight">$1</mark>');
}

// ==========================================
// 4. RENDERING FUNCTIONS
// ==========================================
/**
 * Generates the HTML for an individual result card.
 * 
 * @param {Object} item - Website data object
 * @param {number} rank - 1-based rank number
 * @param {string} badgeType - 'old' or 'pagerank'
 * @param {string} badgeText - Badge label
 * @param {string} query - Active query for keyword highlighting
 * @returns {string} HTML string
 */
function createCardHTML(item, rank, badgeType, badgeText, query) {
  const badgeClass = badgeType === "old" ? "badge-frequency" : "badge-pagerank";
  const highlightedDescription = highlightKeywords(item.text, query);
  const safeUrl = escapeHtml(item.url);

  return `
    <article class="result-card">
      <div class="card-top-row">
        <a href="https://${safeUrl}" class="website-url" target="_blank" rel="noopener noreferrer" onclick="return false;">
          ${safeUrl}
        </a>
        <span class="rank-number">#${rank}</span>
      </div>
      <div class="card-badge-row">
        <span class="${badgeClass}">${escapeHtml(badgeText)}</span>
      </div>
      <p class="card-description">${highlightedDescription}</p>
    </article>
  `;
}

/**
 * Displays a friendly message or prompt inside a results container.
 * 
 * @param {HTMLElement} container - Results container element
 * @param {string} message - Message text
 * @param {string} type - 'prompt', 'empty', or 'no-results'
 */
function renderMessage(container, message, type = "prompt") {
  let icon = "🔍";
  let extraClass = "";

  if (type === "no-results") {
    icon = "⚠️";
    extraClass = "status-no-results";
  }

  container.innerHTML = `
    <div class="status-state">
      <span class="status-icon">${icon}</span>
      <p class="status-message ${extraClass}">${message}</p>
    </div>
  `;
}

// ==========================================
// 5. SEARCH & RANKING EXECUTION
// ==========================================
/**
 * Executes search across both columns:
 * - Left: Keyword frequency ranking (Old Way)
 * - Right: PageRank ranking (PageRank Way)
 * 
 * @param {string} query - Raw search query entered by the user
 */
function performSearch(query) {
  const cleanQuery = query.trim();
  currentQuery = cleanQuery;

  const leftResults = document.getElementById("leftResults");
  const rightResults = document.getElementById("rightResults");

  // If query is empty, show prompt in both columns
  if (!cleanQuery) {
    renderMessage(leftResults, "Please enter a search keyword or click a suggestion above.", "empty");
    renderMessage(rightResults, "Please enter a search keyword or click a suggestion above.", "empty");
    return;
  }

  // 1. Filter matching websites (case-insensitive partial match in text)
  // and compute frequency score
  const matchingPages = [];
  dataset.forEach(page => {
    const frequency = countOccurrences(page.text, cleanQuery);
    if (frequency > 0) {
      matchingPages.push({
        ...page,
        keywordScore: frequency,
        pageRankScore: pageRankScores[page.id] || 0
      });
    }
  });

  // If no matching results found
  if (matchingPages.length === 0) {
    const noResultsMsg = "No results found. Try another keyword!";
    renderMessage(leftResults, noResultsMsg, "no-results");
    renderMessage(rightResults, noResultsMsg, "no-results");
    return;
  }

  // ----------------------------------------------------
  // LEFT COLUMN: Sort by Keyword Frequency (Old Way)
  // ----------------------------------------------------
  const leftSorted = [...matchingPages].sort((a, b) => {
    // Highest keyword score first; tie-breaker: original ID
    return b.keywordScore - a.keywordScore || a.id - b.id;
  });

  leftResults.innerHTML = leftSorted
    .map((page, index) => {
      const rank = index + 1;
      const matchWord = page.keywordScore === 1 ? "match" : "matches";
      const badgeText = `Score: ${page.keywordScore} ${matchWord}`;
      return createCardHTML(page, rank, "old", badgeText, cleanQuery);
    })
    .join("");

  // ----------------------------------------------------
  // RIGHT COLUMN: Sort by PageRank Score (PageRank Way)
  // ----------------------------------------------------
  const rightSorted = [...matchingPages].sort((a, b) => {
    // Highest PageRank percentage first; tie-breaker: original ID
    return b.pageRankScore - a.pageRankScore || a.id - b.id;
  });

  rightResults.innerHTML = rightSorted
    .map((page, index) => {
      const rank = index + 1;
      const badgeText = `Score: ${page.pageRankScore.toFixed(2)}% PageRank`;
      return createCardHTML(page, rank, "pagerank", badgeText, cleanQuery);
    })
    .join("");
}

// ==========================================
// 6. EVENT LISTENERS & INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const leftResults = document.getElementById("leftResults");
  const rightResults = document.getElementById("rightResults");
  const recalculateBtn = document.getElementById("recalculateBtn");
  const suggestLinks = document.querySelectorAll(".suggest-link");

  // Step 1: Precompute PageRank using the 100,000 random surfer moves simulation
  initPageRank();

  // Step 2: Show initial prompt on page load
  const initialPrompt = "Enter a keyword above to compare keyword frequency vs. PageRank rankings.";
  renderMessage(leftResults, initialPrompt, "prompt");
  renderMessage(rightResults, initialPrompt, "prompt");

  // Step 3: Handle search form submission (Clicking 'Search' or Pressing Enter)
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    performSearch(searchInput.value);
  });

  // Step 4: Handle clicking suggested search links
  suggestLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const keyword = link.getAttribute("data-keyword");
      if (keyword) {
        searchInput.value = keyword;
        searchInput.focus();
        performSearch(keyword);
      }
    });
  });

  // Step 5: Handle re-running the 100,000 random surfer moves simulation
  if (recalculateBtn) {
    recalculateBtn.addEventListener("click", () => {
      const originalText = recalculateBtn.textContent;
      recalculateBtn.textContent = "Simulating...";
      recalculateBtn.disabled = true;

      setTimeout(() => {
        initPageRank();
        recalculateBtn.textContent = originalText;
        recalculateBtn.disabled = false;

        // If a query is currently active, re-render results with new percentages
        if (currentQuery) {
          performSearch(currentQuery);
        }
      }, 30);
    });
  }

  // Focus search input on initial load
  searchInput.focus();
});
