const enterBtn = document.getElementById("enterBtn");

if (enterBtn) {
  enterBtn.addEventListener("click", () => {
    window.location.href = "tree.html";
  });
}
const nodes = document.querySelectorAll(".node");

nodes.forEach(node => {
  if (node.classList.contains("unlocked")) {
    node.addEventListener("click", () => {
      const level = node.dataset.level;
      localStorage.setItem("currentLevel", level);
      window.location.href = "level.html";
    });
  }
});

const gridElement = document.getElementById("grid");
const GRID_SIZE = 8;
const currentLevel = localStorage.getItem("currentLevel") || 1;
let clickCount = 0;

document.getElementById("levelText").textContent = currentLevel;
const clickCounterElement = document.getElementById("clickCounter");

// Create the grid
for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    const tile = document.createElement("button"); // Use button for better semantics
    tile.classList.add("tile");
    tile.dataset.row = row;
    tile.dataset.col = col;

    // Toggle selection on click
    tile.addEventListener("click", () => {
      clickCount++;
      if (clickCounterElement) clickCounterElement.textContent = clickCount;

      tile.classList.toggle("selected");
      console.log(`Clicked tile: Row ${row}, Col ${col}, Selected: ${tile.classList.contains("selected")}`);

      // Update feedback text based on action
      const feedback = document.getElementById("feedback");
      if (tile.classList.contains("selected")) {
        feedback.textContent = `SELECTED COORDINATE (${row}, ${col})`;
      } else {
        feedback.textContent = "OBSERVE THE REALM.";
      }
    });

    gridElement.appendChild(tile);
  }
}
