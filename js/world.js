import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { PRODUCT_BUILDERS, loadGLTFProduct } from "./products.js";

const STAGE_GAP = 24;       // distance between chapters along -Z
const CAM_DIST = 10;        // how far the camera floats in front of a stage

/**
 * Each chapter: a painterly backdrop (procedural canvas texture) + floating
 * streetwear product(s). Camera drifts down the -Z corridor as you scroll.
 */
const CHAPTERS = [
  { key: "hero",  product: "sneaker",    mood: "dawn",       fog: 0.018, bloom: 0.9 },
  { key: "birth", product: "bag",        mood: "rose",       fog: 0.020, bloom: 1.1 },
  { key: "skate", product: "skateboard", mood: "chiaroscuro",fog: 0.028, bloom: 1.35 },
  { key: "still", product: "trio",       mood: "amber",      fog: 0.016, bloom: 1.0 },
  { key: "outro", product: "sneaker",    mood: "void",       fog: 0.034, bloom: 1.5 },
];

const MOODS = {
  dawn:        { top: "#241b12", mid: "#6b4a2c", glow: "#e9c187", accent: "#c8a86a" },
  rose:        { top: "#2a1822", mid: "#7d4b58", glow: "#e7b8a6", accent: "#d9a679" },
  chiaroscuro: { top: "#0a0807", mid: "#241a10", glow: "#b9863f", accent: "#caa05a" },
  amber:       { top: "#1c150c", mid: "#5e4525", glow: "#e6c483", accent: "#c8a86a" },
  void:        { top: "#070605", mid: "#15110b", glow: "#8a6a37", accent: "#c8a86a" },
};

/* ---------------------------------------------------- painterly backdrop */
function makePaintingTexture(mood) {
  const c = MOODS[mood] || MOODS.dawn;
  const size = 1024;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");

  // base vertical gradient (sky-of-the-old-masters)
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, c.top);
  grad.addColorStop(0.55, c.mid);
  grad.addColorStop(1, c.top);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // sfumato glow blobs
  const blobs = 14;
  for (let i = 0; i < blobs; i++) {
    const x = Math.random() * size;
    const y = size * (0.25 + Math.random() * 0.6);
    const r = size * (0.12 + Math.random() * 0.3);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = i % 4 === 0 ? c.accent : c.glow;
    rg.addColorStop(0, hexA(col, 0.22));
    rg.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // single warm light source (chiaroscuro)
  const key = ctx.createRadialGradient(size * 0.62, size * 0.32, 0, size * 0.62, size * 0.32, size * 0.7);
  key.addColorStop(0, hexA(c.glow, 0.28));
  key.addColorStop(1, hexA(c.glow, 0));
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, size, size);

  // vignette
  const vig = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, size, size);

  // canvas grain / craquelure
  const grain = ctx.getImageData(0, 0, size, size);
  const d = grain.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------------------------------------------------- the World */
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerTarget = new THREE.Vector2(0, 0);
    this.progress = 0;
    this.activeChapter = 0;
    this.floaters = [];

    this._initRenderer();
    this._initScene();
    this._initLights();
    this._initParticles();
    this._initStages();
    this._initPost();
    this._bindEvents();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0a08);
    this.scene.fog = new THREE.FogExp2(0x0b0a08, CHAPTERS[0].fog);

    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(0, 0.6, CAM_DIST);

    // PBR environment for tasteful product reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0xffe9c7, 0.35));

    const key = new THREE.DirectionalLight(0xffd9a0, 2.4);
    key.position.set(6, 8, 6);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x9fb8c9, 1.1);
    rim.position.set(-7, 3, -4);
    this.scene.add(rim);

    // travelling warm point light that follows the camera like a gallery spot
    this.spot = new THREE.PointLight(0xffcf8a, 18, 40, 2.0);
    this.scene.add(this.spot);
  }

  _initParticles() {
    const count = 1200;
    const positions = new Float32Array(count * 3);
    const depth = STAGE_GAP * CHAPTERS.length;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = -Math.random() * depth - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const sprite = this._dustSprite();
    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: sprite,
      color: 0xe9c187,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _dustSprite() {
    const s = 64;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,240,210,1)");
    g.addColorStop(0.4, "rgba(255,220,160,0.6)");
    g.addColorStop(1, "rgba(255,220,160,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  _initStages() {
    this.stages = CHAPTERS.map((chapter, i) => {
      const group = new THREE.Group();
      group.position.z = -i * STAGE_GAP;
      this.scene.add(group);

      // backdrop painting plane
      const tex = makePaintingTexture(chapter.mood);
      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(48, 30),
        new THREE.MeshBasicMaterial({ map: tex, fog: true })
      );
      backdrop.position.z = -16;
      backdrop.position.y = 1;
      group.add(backdrop);

      // a couple of parallax mid-planes (framed light shafts)
      for (let p = 0; p < 2; p++) {
        const shaft = new THREE.Mesh(
          new THREE.PlaneGeometry(6, 26),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.18, fog: true, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        shaft.position.set((p === 0 ? -1 : 1) * 12, 1, -9 + p * 3);
        group.add(shaft);
      }

      this._populateProducts(group, chapter, i);
      return { group, chapter, backdrop };
    });
  }

  _populateProducts(group, chapter, index) {
    const make = (key) => {
      const mesh = PRODUCT_BUILDERS[key]();
      this._registerFloater(mesh, index);
      return mesh;
    };

    if (chapter.product === "trio") {
      const keys = ["sneaker", "bag", "skateboard"];
      keys.forEach((k, j) => {
        const m = make(k);
        const angle = (j / keys.length) * Math.PI * 2;
        m.position.set(Math.cos(angle) * 3.2, Math.sin(angle) * 1.4, -1 + Math.sin(angle) * 2);
        m.scale.multiplyScalar(0.8);
        group.add(m);
      });
    } else {
      const m = make(chapter.product);
      m.position.set(0, 0.2, 0);
      group.add(m);
    }

    // Attempt to upgrade to a real GLTF export if present (silent fallback).
    if (chapter.product !== "trio") {
      loadGLTFProduct(`./models/${chapter.product}.glb`).then((gltf) => {
        if (!gltf) return;
        const old = group.children.find((c) => c.userData.isProduct);
        if (old) group.remove(old);
        this._frameAndCenter(gltf, 3);
        gltf.position.set(0, 0.2, 0);
        this._registerFloater(gltf, index);
        group.add(gltf);
      });
    }
  }

  _frameAndCenter(obj, targetSize) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = targetSize / Math.max(size.x, size.y, size.z);
    obj.position.sub(center.multiplyScalar(scale));
    obj.scale.setScalar(scale);
  }

  _registerFloater(mesh, index) {
    mesh.userData.isProduct = true;
    this.floaters.push({
      mesh,
      chapter: index,
      phase: Math.random() * Math.PI * 2,
      spin: 0.1 + Math.random() * 0.18,
      amp: 0.25 + Math.random() * 0.25,
      tilt: (Math.random() - 0.5) * 0.4,
    });
  }

  _initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      CHAPTERS[0].bloom, // strength
      0.7,               // radius
      0.18               // threshold
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  _bindEvents() {
    window.addEventListener("resize", () => this._onResize());
    window.addEventListener("pointermove", (e) => {
      this.pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
  }

  /* Driven by the scroll layer (0..1 across the whole film). */
  setProgress(p) {
    this.progress = THREE.MathUtils.clamp(p, 0, 1);
  }

  /* Total scrollable depth so the scroll layer can map progress -> camera z. */
  get corridorDepth() {
    return STAGE_GAP * (CHAPTERS.length - 1);
  }

  update() {
    const t = this.clock.getElapsedTime();
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // camera drifts down the corridor with eased scroll + mouse parallax
    const targetZ = CAM_DIST - this.progress * this.corridorDepth;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;

    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.04;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.04;
    this.camera.position.x += (this.pointer.x * 2.4 - this.camera.position.x) * 0.05;
    this.camera.position.y += (0.6 - this.pointer.y * 1.6 - this.camera.position.y) * 0.05;
    this.camera.lookAt(0, 0.4, this.camera.position.z - CAM_DIST);

    // spotlight rides slightly ahead of the camera
    this.spot.position.set(this.camera.position.x + 2, this.camera.position.y + 3, this.camera.position.z - 2);

    // which chapter are we nearest? interpolate fog + bloom between neighbours
    const fp = this.progress * (CHAPTERS.length - 1);
    const i0 = Math.floor(fp);
    const i1 = Math.min(i0 + 1, CHAPTERS.length - 1);
    const f = fp - i0;
    this.activeChapter = Math.round(fp);
    this.scene.fog.density = THREE.MathUtils.lerp(CHAPTERS[i0].fog, CHAPTERS[i1].fog, f);
    this.bloom.strength = THREE.MathUtils.lerp(CHAPTERS[i0].bloom, CHAPTERS[i1].bloom, f);

    // float + rotate every product
    for (const fl of this.floaters) {
      fl.mesh.rotation.y += fl.spin * dt;
      fl.mesh.rotation.z = Math.sin(t * 0.6 + fl.phase) * fl.tilt;
      // bob gently around the product's authored resting height
      if (fl.baseY === undefined) fl.baseY = fl.mesh.position.y;
      fl.mesh.position.y = fl.baseY + Math.sin(t * 0.8 + fl.phase) * fl.amp;
    }

    // gold dust drifts upward + recycles
    const pos = this.particles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.4;
      if (y > 20) y = -20;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    this.particles.rotation.y = t * 0.01;

    this.composer.render();
  }

  get chapterCount() { return CHAPTERS.length; }
}
