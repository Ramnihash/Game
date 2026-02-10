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
for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.dataset.row = row;
    tile.dataset.col = col;
    tile.addEventListener("click", () => {
      console.log(`Clicked tile: Row ${row}, Col ${col}`);
    });
    gridElement.appendChild(tile);
  }
}