// Game Configuration
const GRID_SIZE = 8;
const MAX_LEVELS = 13;

// Game State
let currentState = {
  level: 1,
  movesLeft: 0,
  clickHistory: [], // Array of {row, col, time}
  cursedTile: null, // {row, col}
  gameActive: false,
  timer: null, // For time-based rules
  cursedInterval: null // For moving cursed tile
};

// Level Configuration (Rules & Constraints)
const LEVELS = [
  { id: 1, moves: 10, rule: "A tile cannot be clicked more than once", check: ['unique'] },
  { id: 2, moves: 10, rule: "Two consecutive tiles cannot be in the same row", check: ['unique', 'row'] },
  { id: 3, moves: 10, rule: "Two consecutive tiles cannot be in the same column", check: ['unique', 'row', 'col'] },
  { id: 4, moves: 12, rule: "Adjacent tiles (Manhattan distance < 2) are invalid", check: ['unique', 'row', 'col', 'adj'] },
  { id: 5, moves: 12, rule: "Clicking faster than 1s causes failure", check: ['unique', 'row', 'col', 'adj', 'speed'] },
  { id: 6, moves: 12, rule: "A tile clicked two moves ago cannot be clicked again", check: ['unique', 'row', 'col', 'adj', 'speed', 'history'] },
  { id: 7, moves: 14, rule: "Two consecutive tiles cannot be in the same quadrant", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad'] },
  { id: 8, moves: 14, rule: "One hidden cursed tile exists (clicking it fails)", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad', 'cursed'] },
  { id: 9, moves: 15, rule: "The cursed tile moves periodically", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad', 'cursed'] }, // Logic handled in update loop
  { id: 10, moves: 15, rule: "Clicking a tile too many times causes delay failure", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad', 'cursed', 'spam'] },
  { id: 11, moves: 15, rule: "Clicking a tile symmetric to the previous one causes failure", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad', 'cursed', 'spam', 'symmetry'] },
  { id: 12, moves: 20, rule: "Multiple constraints combined", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad', 'cursed', 'spam', 'symmetry'] },
  { id: 13, moves: 25, rule: "Surprise rule: No clicking on edges", check: ['unique', 'row', 'col', 'adj', 'speed', 'history', 'quad', 'cursed', 'spam', 'symmetry', 'edge'] },
];

// Elements
const gridElement = document.getElementById("grid");
const levelText = document.getElementById("levelText");
const clickCounterElement = document.getElementById("clickCounter"); // Now "Moves Left"
const feedbackElement = document.getElementById("feedback");
const enterBtn = document.getElementById("enterBtn");

// Initialization
function initGame() {
  if (enterBtn) {
    enterBtn.addEventListener("click", () => window.location.href = "tree.html");
    return; // Stop if on start screen
  }

  // Check if on Level Page
  if (!gridElement) {
    // Tree Page Logic
    const nodes = document.querySelectorAll(".node");
    nodes.forEach(node => {
      // Unlock logic would go here typically based on progress
      // For demo, assume currentLevel from localStorage unlocks up to that point
      const unlockedLevel = parseInt(localStorage.getItem("maxLevel")) || 1;
      const level = parseInt(node.dataset.level);

      if (level <= unlockedLevel) {
        node.classList.add("unlocked");
        node.classList.remove("locked");
        node.addEventListener("click", () => {
          localStorage.setItem("currentLevel", level);
          window.location.href = "level.html";
        });
      }
    });
    return;
  }

  // Level Page Logic
  startLevel(parseInt(localStorage.getItem("currentLevel")) || 1);
}

function startLevel(levelId) {
  const config = LEVELS.find(l => l.id === levelId);
  if (!config) return; // Error handling

  // Reset State
  currentState = {
    level: levelId,
    movesLeft: config.moves,
    clickHistory: [],
    cursedTile: null,
    gameActive: true
  };

  // UI Updates
  levelText.textContent = currentState.level;
  clickCounterElement.textContent = currentState.movesLeft;

  // Update "CLICKS" label to "MOVES" if possible, or just treat it as moves
  // Ideally we'd change the HTML label too, but let's assume the user knows
  const hudLabel = document.querySelector('.hud-item:nth-child(2) .hud-label');
  if (hudLabel) hudLabel.textContent = "MOVES LEFT";

  feedbackElement.textContent = config.rule.toUpperCase();
  feedbackElement.style.color = "#ffaa00";

  // Grid Generation
  createGrid();

  // Special Rules Init
  if (levelId >= 8) spawnCursedTile();
  if (levelId === 9) startCursedMovement();
}

function createGrid() {
  gridElement.innerHTML = "";
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = document.createElement("button");
      tile.classList.add("tile");
      tile.dataset.row = row;
      tile.dataset.col = col;
      tile.addEventListener("click", () => handleTileClick(row, col));
      gridElement.appendChild(tile);
    }
  }
}

function handleTileClick(row, col) {
  if (!currentState.gameActive) return;

  const now = Date.now();
  const move = { row, col, time: now };
  const currentLevelConfig = LEVELS.find(l => l.id === currentState.level);

  // 1. Validation
  const failureReason = validateMove(move, currentLevelConfig.check);

  if (failureReason) {
    failGame(failureReason);
    return;
  }

  // 2. Success Logic
  currentState.clickHistory.push(move);
  currentState.movesLeft--;
  clickCounterElement.textContent = currentState.movesLeft;

  // Visuals
  const tile = getTile(row, col);
  tile.classList.add("selected");
  // Optional: keep it selected or flash it? 
  // User req: "A tile cannot be clicked more than once" -> so keeping it selected effectively marks it

  // 3. Win Condition
  if (currentState.movesLeft === 0) {
    winLevel();
  }
}

// --- Rules & Validation ---

function validateMove(move, activeChecks) {
  const prev = currentState.clickHistory[currentState.clickHistory.length - 1];
  const history = currentState.clickHistory;

  // 1. Unique (Rule 1)
  if (activeChecks.includes('unique')) {
    if (history.some(m => m.row === move.row && m.col === move.col)) {
      return "TILE ALREADY CLICKED";
    }
  }

  if (!prev) return null; // First move always valid unless unique check failed (which is impossible for first move)

  // 2. Row (Rule 2)
  if (activeChecks.includes('row')) {
    if (move.row === prev.row) return "CANNOT USE SAME ROW";
  }

  // 3. Col (Rule 3)
  if (activeChecks.includes('col')) {
    if (move.col === prev.col) return "CANNOT USE SAME COLUMN";
  }

  // 4. Adjacent (Rule 4)
  if (activeChecks.includes('adj')) {
    const dist = Math.abs(move.row - prev.row) + Math.abs(move.col - prev.col);
    if (dist < 2) return "TOO CLOSE (ADJACENT)";
  }

  // 5. Speed (Rule 5)
  if (activeChecks.includes('speed')) {
    if (move.time - prev.time < 1000) return "TOO FAST (WAIT 1s)";
  }

  // 6. History (Rule 6) - 2 moves ago
  if (activeChecks.includes('history')) {
    const twoAgo = history[history.length - 2];
    if (twoAgo && twoAgo.row === move.row && twoAgo.col === move.col) {
      return "REPETITION DETECTED"; // Should be caught by unique, but if unique wasn't active...
    }
  }

  // 7. Quadrant (Rule 7)
  if (activeChecks.includes('quad')) {
    if (getQuadrant(move) === getQuadrant(prev)) return "SAME QUADRANT";
  }

  // 8. Cursed (Rule 8)
  if (activeChecks.includes('cursed')) {
    if (currentState.cursedTile && move.row === currentState.cursedTile.row && move.col === currentState.cursedTile.col) {
      return "CURSED TILE HIT";
    }
  }

  // 11. Symmetry (Rule 11)
  if (activeChecks.includes('symmetry')) {
    // Logic for symmetry around center (3.5, 3.5)
    // If prev was (0,0), symmetric is (7,7)
    const symRow = 7 - prev.row;
    const symCol = 7 - prev.col;
    if (move.row === symRow && move.col === symCol) return "SYMMETRY VIOLATION";
  }

  // 13. Edges (Rule 13)
  if (activeChecks.includes('edge')) {
    if (move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7) return "EDGE TILE FORBIDDEN";
  }

  return null;
}

// Helpers
function getQuadrant(move) {
  const r = move.row < 4 ? 0 : 1;
  const c = move.col < 4 ? 0 : 1;
  return r * 2 + c; // 0, 1, 2, 3
}

function getTile(row, col) {
  return document.querySelector(`.tile[data-row='${row}'][data-col='${col}']`);
}

// Cursed Logic
function spawnCursedTile() {
  let r, c;
  do {
    r = Math.floor(Math.random() * GRID_SIZE);
    c = Math.floor(Math.random() * GRID_SIZE);
  } while (false); // Simplification, ideally check against nothing? 
  // Ideally checks against history but at start history is empty

  currentState.cursedTile = { row: r, col: c };
  // Debug text? No, it's hidden.
}

function startCursedMovement() {
  if (currentState.cursedInterval) clearInterval(currentState.cursedInterval);
  currentState.cursedInterval = setInterval(() => {
    if (!currentState.gameActive) {
      clearInterval(currentState.cursedInterval);
      return;
    }
    spawnCursedTile();
  }, 3000); // Move every 3 seconds
}

// Outcomes
function failGame(reason) {
  currentState.gameActive = false;
  feedbackElement.textContent = `FAILURE: ${reason}`;
  feedbackElement.style.color = "red";
  gridElement.style.pointerEvents = "none";
  if (currentState.cursedInterval) clearInterval(currentState.cursedInterval);
}

function winLevel() {
  currentState.gameActive = false;
  feedbackElement.textContent = "LEVEL CLEARED. RETURNING...";
  feedbackElement.style.color = "#00ff00"; // Green

  // Unlock next level
  const unlocked = parseInt(localStorage.getItem("maxLevel")) || 1;
  if (currentState.level >= unlocked && currentState.level < MAX_LEVELS) {
    localStorage.setItem("maxLevel", currentState.level + 1);
  }

  if (currentState.cursedInterval) clearInterval(currentState.cursedInterval);

  setTimeout(() => {
    window.location.href = "tree.html";
  }, 2000);
}

// Start
initGame();
