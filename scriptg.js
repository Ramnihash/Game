


/* =====================================================
   LEVEL GAME SYSTEM (ONLY RUNS ON level.html)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const stars = document.querySelector(".stars");
  const enterBtn = document.getElementById("enterBtn");

  /* ================= GENERATE STARS ================= */
  if (stars) {
    for (let i = 0; i < 250; i++) {
      const s = document.createElement("div");

      const r = Math.random();
      if (r > 0.85) s.className = "star big";
      else if (r > 0.6) s.className = "star mid";
      else s.className = "star tiny";

      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";

      const duration = 60 + Math.random() * 120;
      s.style.animationDuration = duration + "s";

      stars.appendChild(s);
    }
  }

  if (enterBtn) {
    const enteringText = document.getElementById("enteringText");
    const fadeOverlay = document.getElementById("fadeOverlay");
    const startScreen = document.getElementById("startScreen");
    const space = document.getElementById("space");

    /* ================= ENTER BUTTON ================= */
    enterBtn.addEventListener("click", () => {

      enterBtn.disabled = true;

      /* STEP 1 — SPACE WARP BOOST */
      space.classList.add("warp");
      enteringText.classList.add("showText");
      startScreen.classList.add("entering");

      /* STEP 2 — FADE OUT */
      setTimeout(() => {
        fadeOverlay.classList.add("show");
      }, 1200);

      /* STEP 3 — NAVIGATE */
      setTimeout(() => {

        /* ALLOW PORTAL PAGE ACCESS */
        sessionStorage.setItem("realmEntry", "true");

        window.location.href = "portal.html";

      }, 2000);

    });
  }
});




const gridElement = document.getElementById("grid");

if (gridElement) {

  const levelData = {
    1: { name: "Awakening", moves: 10, rule: "Rule 1: Do not repeat a tile." },
    2: { name: "Memory Test", moves: 12, rule: "Rule 2: Avoid same row consecutively." },
    3: { name: "Linear Instability", moves: 14, rule: "Rule 3: Avoid same column consecutively." },
    4: { name: "Proximity Ban", moves: 15, rule: "Rule 4: Adjacent tiles forbidden." },
    5: { name: "Corner Collapse", moves: 16, rule: "Rule 5: Corner tiles forbidden." },
    6: { name: "Core Lock", moves: 17, rule: "Rule 6: Center tiles forbidden." },
    7: { name: "Quadrant Drift", moves: 18, rule: "Rule 7: Same quadrant twice forbidden." },
    8: { name: "Edge Instability", moves: 18, rule: "Rule 8: Edge tiles forbidden." },
    9: { name: "Even Row Ban", moves: 19, rule: "Rule 9: Even rows forbidden." },
    10: { name: "Even Column Ban", moves: 20, rule: "Rule 10: Even columns forbidden." },
    11: { name: "Diagonal Rift", moves: 20, rule: "Rule 11: Diagonal tiles forbidden." },
    12: { name: "Border Lock", moves: 22, rule: "Rule 12: Border tiles forbidden." },
    13: { name: "Pattern Shift", moves: 25, rule: "Rule 13: Alternate tile color required." }
  };

  let currentLevel = parseInt(localStorage.getItem("currentLevel")) || 1;
  const data = levelData[currentLevel];

  const levelInfo = document.getElementById("levelInfo");
  const movesLeftDisplay = document.getElementById("movesLeft");
  const feedback = document.getElementById("feedback");
  const overlay = document.getElementById("overlay");
  const resultTitle = document.getElementById("resultTitle");
  const ruleReveal = document.getElementById("ruleReveal");
  const buttonsDiv = document.getElementById("overlayButtons");
  const heartsContainer = document.getElementById("hearts");

  levelInfo.textContent = "Level " + currentLevel + " - " + data.name;

  let movesLeft = data.moves;
  movesLeftDisplay.textContent = "Moves: " + movesLeft;

  let lives = 5;
  updateHearts();

  const hintBtn = document.getElementById("hintBtn");
  const rulesOverlay = document.getElementById("rulesOverlay");
  const rulesList = document.getElementById("rulesList");
  const closeRulesBtn = document.getElementById("closeRulesBtn");

  if (hintBtn && rulesOverlay && rulesList && closeRulesBtn) {
    hintBtn.addEventListener("click", () => {
      // Clear previous list
      rulesList.innerHTML = "";

      // Populate list with rules from Level 1 up to currentLevel - 1
      let rulesFound = false;
      for (let i = 1; i < currentLevel; i++) {
        if (levelData[i]) {
          const li = document.createElement("li");
          li.textContent = levelData[i].rule;
          rulesList.appendChild(li);
          rulesFound = true;
        }
      }

      if (!rulesFound) {
        const li = document.createElement("li");
        li.textContent = "No previous anomalies recorded.";
        li.style.textAlign = "center";
        li.style.fontStyle = "italic";
        li.style.color = "#888";
        rulesList.appendChild(li);
      }

      // Show Overlay
      rulesOverlay.classList.remove("hidden");
    });

    closeRulesBtn.addEventListener("click", () => {
      rulesOverlay.classList.add("hidden");
    });

    // Optional: Close on outside click
    rulesOverlay.addEventListener("click", (e) => {
      if (e.target === rulesOverlay) {
        rulesOverlay.classList.add("hidden");
      }
    });
  }

  const GRID = 8;
  let clicked = [];
  let lastRow = null, lastCol = null, lastQuadrant = null, lastColor = null;

  for (let i = 0; i < 64; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.addEventListener("click", () => handleClick(tile, i));
    gridElement.appendChild(tile);
  }

  let isAnimating = false; // Prevent rapid clicking during animation

  function handleClick(tile, index) {
    if (isAnimating) return; // Block input during animation

    const row = Math.floor(index / GRID);
    const col = index % GRID;
    const quadrant = getQuadrant(row, col);
    const color = (row + col) % 2;

    let invalid = false;

    if (clicked.includes(index)) invalid = true;
    if (currentLevel >= 2 && row === lastRow) invalid = true;
    if (currentLevel >= 3 && col === lastCol) invalid = true;
    if (currentLevel >= 4 && isAdjacent(index)) invalid = true;
    if (currentLevel >= 5 && isCorner(row, col)) invalid = true;
    if (currentLevel >= 6 && isCenter(row, col)) invalid = true;
    if (currentLevel >= 7 && quadrant === lastQuadrant) invalid = true;
    if (currentLevel >= 8 && isEdge(row, col)) invalid = true;
    if (currentLevel >= 9 && row % 2 === 0) invalid = true;
    if (currentLevel >= 10 && col % 2 === 0) invalid = true;
    if (currentLevel >= 11 && row === col) invalid = true;
    if (currentLevel >= 12 && isBorder(row, col)) invalid = true;
    if (currentLevel >= 13 && lastColor !== null && color === lastColor) invalid = true;

    if (invalid) { wrongMove(); return; }

    tile.classList.add("valid");
    clicked.push(index);
    lastRow = row; lastCol = col; lastQuadrant = quadrant; lastColor = color;

    movesLeft--;
    movesLeftDisplay.textContent = "Moves: " + movesLeft;

    if (movesLeft === 0) win();
  }

  function wrongMove() {
    if (lives > 0) {
      lives--;
      updateHearts();

      // Animate the just-emptied heart (which is at index 'lives')
      const hearts = heartsContainer.children;
      if (hearts[lives]) {
        hearts[lives].classList.add("heart-shake");
      }

      if (lives === 0) {
        setTimeout(showLifeDown, 500);
      }
    } else {
      showLifeDown();
    }
    feedback.textContent = "Wrong Move Detected.";
  }


  function showLifeDown() {
    overlay.classList.remove("hidden");
    resultTitle.textContent = "Lives Down";
    ruleReveal.textContent = "The anomaly rejected your control.";
    buttonsDiv.innerHTML = "";
    createButton("Restart Level", () => location.reload());
    createButton("Levels", () => window.location.href = "portal.html");
  }

  function win() {
    overlay.classList.remove("hidden");

    const celebration = document.getElementById("celebrationText");
    celebration.textContent = "✨ REALITY STABILIZED ✨";

    resultTitle.textContent = "Level Complete";
    ruleReveal.textContent = data.rule;

    buttonsDiv.innerHTML = "";

    createButton("Continue", () => {
      unlockNextLevel();
      sessionStorage.setItem("realmEntry", "true");
      window.location.href = "portal.html";
    });
  }

  function createButton(text, action) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.onclick = action;
    buttonsDiv.appendChild(btn);
  }

  function updateHearts() {
    heartsContainer.innerHTML = "";
    const totalLives = 5;

    for (let i = 0; i < totalLives; i++) {
      // Create SVG Heart
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.classList.add("heart-icon");

      if (i < lives) {
        svg.classList.add("filled");
      } else {
        svg.classList.add("empty");
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z");

      svg.appendChild(path);
      heartsContainer.appendChild(svg);
    }
  }

  function getQuadrant(r, c) {
    if (r < 4 && c < 4) return 1;
    if (r < 4 && c >= 4) return 2;
    if (r >= 4 && c < 4) return 3;
    return 4;
  }

  function isAdjacent(index) {
    return clicked.some(i => {
      const r1 = Math.floor(i / GRID);
      const c1 = i % GRID;
      const r2 = Math.floor(index / GRID);
      const c2 = index % GRID;
      return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
    });
  }

  function isCorner(r, c) {
    return (r === 0 || r === 7) && (c === 0 || c === 7);
  }

  function isCenter(r, c) {
    return r >= 3 && r <= 4 && c >= 3 && c <= 4;
  }

  function isEdge(r, c) {
    return r === 0 || r === 7 || c === 0 || c === 7;
  }

  function isBorder(r, c) {
    return r === 0 || r === 7 || c === 0 || c === 7;
  }

}

function unlockNextLevel() {
  let current = parseInt(localStorage.getItem("currentLevel")) || 1;
  let maxUnlocked = parseInt(localStorage.getItem("maxUnlockedLevel")) || 1;

  // Only unlock the next level if we just beat the highest unlocked level
  if (current === maxUnlocked) {
    localStorage.setItem("maxUnlockedLevel", current + 1);
  }
}
