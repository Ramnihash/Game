/* ================= PAGE ACCESS GUARD ================= */

if (!sessionStorage.getItem("realmEntry")) {
  window.location.href = "index.html";
} else {
  sessionStorage.removeItem("realmEntry"); // prevents refresh staying here
}

document.addEventListener("DOMContentLoaded", () => {

  const stars = document.querySelector(".stars");
  const container = document.getElementById("portalContainer");
  const page = document.getElementById("treePage");

  /* ================= STARS ================= */
  for (let i = 0; i < 250; i++) {
    const s = document.createElement("div");

    const r = Math.random();
    if (r > 0.85) s.className = "star big";
    else if (r > 0.6) s.className = "star mid";
    else s.className = "star tiny";

    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDuration = (30 + Math.random() * 40) + "s";

    stars.appendChild(s);
  }

  /* ================= PORTALS & LINE ================= */
  const PORTAL_COUNT = 13;
  const SIZE = 70;
  const HALF_SIZE = SIZE / 2;

  const portals = [];
  // Separate paths for active vs locked
  const pathActive = document.getElementById("path-active");
  const pathLocked = document.getElementById("path-locked");
  const maxUnlocked = parseInt(localStorage.getItem("maxUnlockedLevel")) || 1;

  function createPortals() {
    // Clear existing (if any, though here it's run once)
    // But we need to calculate positions based on screen size
    // For simplicity, we'll calculate initial positions in a function we can call on resize?
    // Actually, "re-calculating" anchors on resize is better.

    for (let i = 1; i <= PORTAL_COUNT; i++) {
      const el = document.createElement("button");
      el.className = "portal";
      el.textContent = "L" + i;

      // Locked Logic
      if (i > maxUnlocked) {
        el.classList.add("locked");
      } else {
        el.addEventListener("click", () => {
          openLevel(i);
        });
      }

      container.appendChild(el);

      // Random float properties
      const floatSpeed = 0.5 + Math.random() * 1.5;
      const floatOffset = Math.random() * Math.PI * 2;
      const floatRange = 10 + Math.random() * 10; // How far it floats

      portals.push({
        el,
        level: i,
        anchorX: 0,
        anchorY: 0,
        x: 0,
        y: 0,
        floatSpeed,
        floatOffset,
        floatRange
      });
    }



    // Reset Progress Logic
    const resetBtn = document.getElementById("resetBtn");
    const confirmOverlay = document.getElementById("confirmOverlay");
    const confirmResetBtn = document.getElementById("confirmResetBtn");
    const cancelResetBtn = document.getElementById("cancelResetBtn");

    if (resetBtn && confirmOverlay) {
      resetBtn.addEventListener("click", () => {
        confirmOverlay.classList.remove("hidden");
      });

      cancelResetBtn.addEventListener("click", () => {
        confirmOverlay.classList.add("hidden");
      });

      confirmResetBtn.addEventListener("click", () => {
        // Wipe Data
        localStorage.removeItem("maxUnlockedLevel");
        localStorage.removeItem("currentLevel");

        // Reset to Level 1
        localStorage.setItem("maxUnlockedLevel", "1");

        // Reload Page
        window.location.reload();
      });

      // Close on outside click
      confirmOverlay.addEventListener("click", (e) => {
        if (e.target === confirmOverlay) {
          confirmOverlay.classList.add("hidden");
        }
      });
    }

    // Initial layout
    layoutPortals();
  }

  function layoutPortals() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Margin on sides
    const marginX = 100;
    const availableWidth = w - (marginX * 2);
    const stepX = availableWidth / (PORTAL_COUNT - 1);

    // Sine wave parameters
    const centerY = h / 2;
    const amplitude = h / 3.5; // Height of the wave
    const frequency = 2; // How many waves? 2 full cycles maybe?

    portals.forEach((p, index) => {
      // Linear X
      const tx = marginX + (stepX * index);

      // Sine Y
      // normalize x to 0..1 for sine calc or just use index
      const normalized = index / (PORTAL_COUNT - 1); // 0 to 1
      const angle = normalized * Math.PI * 2 * frequency; // 2 full waves
      const ty = centerY + Math.sin(angle) * amplitude;

      p.anchorX = tx - HALF_SIZE; // Centered
      p.anchorY = ty - HALF_SIZE;
    });
  }

  function openLevel(level) {
    localStorage.setItem("currentLevel", level);
    window.location.href = "level.html";
  }

  createPortals();

  function animate() {
    const time = Date.now() * 0.001;

    // 1. Update Portal Positions
    portals.forEach(p => {
      // Floating motion
      const dx = Math.sin(time * p.floatSpeed + p.floatOffset) * p.floatRange;
      const dy = Math.cos(time * p.floatSpeed + p.floatOffset) * p.floatRange;

      p.x = p.anchorX + dx;
      p.y = p.anchorY + dy;

      p.el.style.left = p.x + "px";
      p.el.style.top = p.y + "px";
    });

    // 2. Update Connection Lines
    if (portals.length > 0) {
      const allPoints = portals.map(p => ({ x: p.x + HALF_SIZE, y: p.y + HALF_SIZE }));

      const activeIndex = Math.min(maxUnlocked, PORTAL_COUNT) - 1;

      // Full Locked Path (Background)
      pathLocked.setAttribute("d", getSplinePath(allPoints));

      // Active Path (Foreground)
      const activePoints = allPoints.slice(0, activeIndex + 1);

      if (activePoints.length > 1) {
        pathActive.setAttribute("d", getSplinePath(activePoints, true));
      } else {
        pathActive.setAttribute("d", "");
      }
    }

    requestAnimationFrame(animate);
  }

  // Smooth Curve Function (Catmull-Rom spline to SVG path)
  function getSplinePath(points) {
    if (points.length === 0) return "";
    if (points.length === 1) return "";

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  animate();

  /* SAFE RESIZE HANDLING */
  window.addEventListener("resize", () => {
    layoutPortals();
  });


  /* ================= SMOOTH ENTRY ================= */
  requestAnimationFrame(() => {
    page.classList.add("show");
  });

});
