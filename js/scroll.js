/**
 * Cinematic scroll layer.
 *
 * Lenis  -> buttery, inertial smooth scrolling (the "drifting through a museum" feel)
 * GSAP   -> eased typography reveals + the master scroll progress that drives the 3D world
 * ScrollTrigger -> ties scroll position to scene transitions
 *
 * Libraries load from CDN as ES modules so there's no build step.
 */
import Lenis from "https://esm.sh/lenis@1.1.13";
import gsap from "https://esm.sh/gsap@3.12.5";
import ScrollTrigger from "https://esm.sh/gsap@3.12.5/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initScroll(world) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------- Lenis */
  const lenis = new Lenis({
    lerp: prefersReduced ? 1 : 0.085,           // lower = silkier / more drift
    wheelMultiplier: 0.9,
    smoothWheel: !prefersReduced,
  });

  // Feed Lenis into GSAP's ticker so scroll + render share one clock.
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------------------------------------------------- master progress
     One ScrollTrigger spans the whole document and maps 0..1 onto the
     camera's journey down the gallery corridor. */
  ScrollTrigger.create({
    trigger: ".content",
    start: "top top",
    end: "bottom bottom",
    scrub: prefersReduced ? false : 1.0,        // 1s catch-up = cinematic, never twitchy
    onUpdate: (self) => world.setProgress(self.progress),
  });

  /* ---------------------------------------------------- per-panel reveals */
  const panels = gsap.utils.toArray(".panel");
  const indexEl = document.querySelector("[data-index]");

  panels.forEach((panel, i) => {
    const bits = panel.querySelectorAll(".kicker, .display, .headline, .lede, .body, .credits");

    gsap.set(bits, { yPercent: 18, opacity: 0 });

    ScrollTrigger.create({
      trigger: panel,
      start: "top 72%",
      end: "bottom 30%",
      onEnter: () => {
        gsap.to(bits, {
          yPercent: 0, opacity: 1,
          duration: 1.3, ease: "power3.out", stagger: 0.08, overwrite: "auto",
        });
        if (indexEl) indexEl.textContent = String(i + 1).padStart(2, "0");
      },
      onLeaveBack: () => {
        gsap.to(bits, { yPercent: 18, opacity: 0, duration: 0.6, ease: "power2.in", overwrite: "auto" });
        const prev = Math.max(1, i);
        if (indexEl) indexEl.textContent = String(prev).padStart(2, "0");
      },
    });
  });

  /* ---------------------------------------------------- gentle hero parallax
     The oversized title lines drift at slightly different rates as you scroll. */
  if (!prefersReduced) {
    gsap.to(".display .line", {
      yPercent: -10,
      ease: "none",
      scrollTrigger: { trigger: ".panel--hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".display .line--offset", {
      yPercent: -26,
      ease: "none",
      scrollTrigger: { trigger: ".panel--hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  ScrollTrigger.refresh();
  return lenis;
}
