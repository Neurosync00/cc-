# RINASCITA — A Renaissance / Streetwear Film

A cinematic, scroll-driven digital world where classical-painting light blends
with floating streetwear product. Drift through it like an interactive fashion
film inside a digital museum.

> *Where the sacred meets the sold out.*

## The stack

| Layer | Tech | Role |
|-------|------|------|
| 3D world | **Three.js + WebGL** | Floating sneakers, skateboards & shopping bags inside painterly environments |
| Post FX | UnrealBloom · FogExp2 · ACES tone mapping | Bloom glow, atmospheric fog, filmic color |
| Motion | **GSAP + ScrollTrigger** | Cinematic transitions; scroll progress morphs every scene |
| Scroll feel | **Lenis** | Buttery, inertial smooth scrolling — the "drifting" sensation |
| Models | **GLTF** (Blender / Spline export) | Optional realistic product upgrades (procedural fallback built in) |
| Type | Bodoni Moda · Cormorant Garamond | Oversized editorial serif, luxury-campaign aesthetic |

## Run it

No build step — it's ES modules + CDN. You just need any static server so the
browser can fetch the local modules (opening `index.html` via `file://` will
not work because of module CORS rules).

```bash
# pick one
python3 -m http.server 8080
npx serve .
```

Then open <http://localhost:8080>.

> The 3D libraries (Three.js, GSAP, Lenis) load from CDNs at runtime, so the
> first load needs network access.

## The film (scroll sections)

0. **Hero** — `RENAiSSANCE / STREEtWEAR`, a sneaker turning in golden dawn fog
1. **The Birth of Drip** — a shopping bag arrives in rose-marble light
2. **Skate the Sublime** — a single deck suspended in chiaroscuro
3. **Still Life, Still Hype** — a rotating still-life trio
4. **Fin.** — the gallery reloads

The camera dollies down a `-Z` corridor as you scroll; fog density and bloom
strength are interpolated between chapters, and mouse movement adds parallax.

## Swapping in real product models

Procedural meshes ship by default so the scene works with zero assets. To use
realistic Blender/Spline exports, drop `.glb` files into `models/` named after
the product key:

```
models/sneaker.glb
models/skateboard.glb
models/bag.glb
```

On load, `world.js` calls `loadGLTFProduct()` and, if the file is found, it is
auto-centered, scaled to fit, and replaces the procedural mesh. If a file is
missing or the network is unavailable, the procedural version stays — nothing
breaks.

## Tuning the cinematic feel

Most of the directing happens in two places:

- **`js/world.js` → `CHAPTERS` / `MOODS`** — per-scene mood palette, fog
  density, bloom strength, and which product floats there.
- **`js/scroll.js`** — `Lenis({ lerp })` controls scroll silkiness; the master
  `ScrollTrigger({ scrub })` controls how slowly the world catches up to the
  scroll (higher = more cinematic lag).

## Accessibility

Respects `prefers-reduced-motion`: Lenis smoothing and scrub are disabled, and
typography reveals snap instead of animating.

## Project layout

```
index.html        # structure + editorial copy + import map
css/style.css     # luxury editorial type & layout
js/main.js        # boot, render loop, loader, WebGL fallback
js/world.js       # Three.js scene, backdrops, particles, fog, bloom
js/products.js    # procedural streetwear + optional GLTF loader
js/scroll.js      # Lenis + GSAP ScrollTrigger orchestration
models/           # drop optional .glb product exports here
```
