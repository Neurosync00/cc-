import { World } from "./world.js";
import { initScroll } from "./scroll.js";

const canvas = document.getElementById("scene");
const loader = document.getElementById("loader");
const bar = loader.querySelector(".loader__bar i");

function boot() {
  let world;
  try {
    world = new World(canvas);
  } catch (err) {
    console.error("WebGL failed to initialise:", err);
    showFallback();
    return;
  }

  // Smooth scroll + scroll-driven scene transitions
  try {
    initScroll(world);
  } catch (err) {
    console.warn("Scroll layer (GSAP/Lenis) unavailable — native scroll only.", err);
  }

  // Render loop
  const loop = () => {
    world.update();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Reveal the gallery
  revealLoader();
}

function revealLoader() {
  let p = 0;
  const tick = setInterval(() => {
    p = Math.min(100, p + 8 + Math.random() * 14);
    if (bar) bar.style.width = p + "%";
    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => loader.classList.add("is-done"), 300);
    }
  }, 90);
}

function showFallback() {
  loader.classList.add("is-done");
  document.body.style.background = "#0b0a08";
  const note = document.createElement("p");
  note.textContent = "This experience needs a WebGL-capable browser.";
  note.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;color:#c8a86a;font-family:serif;z-index:50;padding:2rem;text-align:center;";
  document.body.appendChild(note);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
