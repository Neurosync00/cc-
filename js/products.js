import * as THREE from "three";

/**
 * Procedural streetwear products.
 *
 * These are built in code so the experience runs with zero external assets.
 * To swap in realistic Blender/Spline exports, see loadGLTFProduct() below and
 * the notes in README.md — drop a .glb into /models and the world will prefer it.
 */

const PALETTE = {
  cream: 0xf3ece0,
  bone: 0xe7dcc6,
  gold: 0xc8a86a,
  ink: 0x14110c,
  oxblood: 0x5e2b2b,
  sky: 0x9fb8c9,
};

function physicalMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.08,
    envMapIntensity: opts.envMapIntensity ?? 1.0,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

/* ----------------------------------------------------------- Sneaker */
export function buildSneaker() {
  const g = new THREE.Group();

  // Sole — a soft capsule-ish slab with a midsole stripe
  const soleShape = new THREE.Shape();
  soleShape.absellipse(0, 0, 1.5, 0.6, 0, Math.PI * 2);
  const sole = new THREE.Mesh(
    new THREE.ExtrudeGeometry(soleShape, { depth: 0.42, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 4, steps: 1 }),
    physicalMat(PALETTE.cream, { roughness: 0.7 })
  );
  sole.rotation.x = -Math.PI / 2;
  sole.position.y = -0.35;
  sole.scale.set(1, 1, 0.42);
  g.add(sole);

  // Midsole accent (gold) — the "air" line
  const midsole = new THREE.Mesh(
    new THREE.TorusGeometry(1.45, 0.07, 12, 48),
    physicalMat(PALETTE.gold, { metalness: 0.6, roughness: 0.3, emissive: PALETTE.gold, emissiveIntensity: 0.18 })
  );
  midsole.rotation.x = Math.PI / 2;
  midsole.position.y = -0.18;
  midsole.scale.set(1, 0.42, 1);
  g.add(midsole);

  // Upper — rounded body
  const upper = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.62, 1.5, 8, 20),
    physicalMat(PALETTE.bone, { roughness: 0.5 })
  );
  upper.rotation.z = Math.PI / 2;
  upper.position.set(-0.1, 0.28, 0);
  upper.scale.set(1, 1, 0.78);
  g.add(upper);

  // Toe cap
  const toe = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 24, 18, 0, Math.PI * 2, 0, Math.PI / 1.7),
    physicalMat(PALETTE.cream, { roughness: 0.45 })
  );
  toe.rotation.x = Math.PI / 2;
  toe.position.set(1.0, 0.18, 0);
  toe.scale.set(1, 0.78, 0.92);
  g.add(toe);

  // Heel collar (oxblood)
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.16, 12, 28),
    physicalMat(PALETTE.oxblood, { roughness: 0.4 })
  );
  collar.position.set(-0.95, 0.62, 0);
  collar.rotation.y = Math.PI / 2;
  collar.scale.set(1, 1, 0.7);
  g.add(collar);

  // Swoosh-ish gold blade
  const blade = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.06, 8, 24, Math.PI * 0.8),
    physicalMat(PALETTE.gold, { metalness: 0.7, roughness: 0.25, emissive: PALETTE.gold, emissiveIntensity: 0.25 })
  );
  blade.position.set(0.1, 0.3, 0.4);
  blade.rotation.set(Math.PI / 2, 0, -0.4);
  blade.scale.set(1, 0.5, 1);
  g.add(blade);
  const blade2 = blade.clone();
  blade2.position.z = -0.4;
  g.add(blade2);

  g.scale.setScalar(0.9);
  return g;
}

/* ----------------------------------------------------------- Skateboard */
export function buildSkateboard() {
  const g = new THREE.Group();

  // Deck — extruded rounded rectangle with concave-ish tilt
  const w = 0.95, l = 4.2, r = 0.45;
  const shape = new THREE.Shape();
  shape.moveTo(-l / 2 + r, -w / 2);
  shape.lineTo(l / 2 - r, -w / 2);
  shape.absarc(l / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-l / 2 + r, w / 2);
  shape.absarc(-l / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);

  const deck = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.03, bevelSegments: 3, steps: 1 }),
    physicalMat(PALETTE.oxblood, { roughness: 0.6 })
  );
  deck.rotation.x = Math.PI / 2;
  // raise kicktails
  deck.geometry.computeBoundingBox();
  const pos = deck.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const t = Math.max(0, Math.abs(x) - (l / 2 - 0.7)) / 0.7;
    pos.setZ(i, pos.getZ(i) + t * t * 0.35);
  }
  pos.needsUpdate = true;
  deck.geometry.computeVertexNormals();
  g.add(deck);

  // Grip tape top (ink)
  const grip = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }),
    physicalMat(PALETTE.ink, { roughness: 0.95 })
  );
  grip.rotation.x = Math.PI / 2;
  grip.position.y = 0.13;
  g.add(grip);

  // Trucks + wheels
  const truckMat = physicalMat(PALETTE.gold, { metalness: 0.85, roughness: 0.25 });
  const wheelMat = physicalMat(PALETTE.cream, { roughness: 0.4 });
  [-1.4, 1.4].forEach((x) => {
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 12), truckMat);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(x, -0.18, 0);
    g.add(axle);
    [-0.5, 0.5].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 20), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, -0.18, z);
      g.add(wheel);
    });
  });

  g.scale.setScalar(0.8);
  return g;
}

/* ----------------------------------------------------------- Shopping bag */
export function buildShoppingBag() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.9, 0.8),
    physicalMat(PALETTE.cream, { roughness: 0.75 })
  );
  // soften with slight bevel via scale of a wireframe? keep box, add rolled top
  g.add(body);

  // Gold rim at the opening
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(1.56, 0.16, 0.86),
    physicalMat(PALETTE.gold, { metalness: 0.7, roughness: 0.3, emissive: PALETTE.gold, emissiveIntensity: 0.15 })
  );
  rim.position.y = 0.95;
  g.add(rim);

  // Handles
  const handleMat = physicalMat(PALETTE.ink, { roughness: 0.6 });
  [-0.4, 0.4].forEach((x) => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 28, Math.PI), handleMat);
    handle.position.set(x, 1.0, 0);
    handle.rotation.set(0, 0, 0);
    g.add(handle);
  });

  // Front panel emblem (oxblood square)
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.55),
    physicalMat(PALETTE.oxblood, { roughness: 0.5 })
  );
  emblem.position.set(0, 0, 0.41);
  g.add(emblem);
  const emblemBar = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.06),
    physicalMat(PALETTE.gold, { metalness: 0.6, roughness: 0.3 })
  );
  emblemBar.position.set(0, 0, 0.412);
  g.add(emblemBar);

  g.scale.setScalar(0.95);
  return g;
}

/* ----------------------------------------------------------- Registry */
export const PRODUCT_BUILDERS = {
  sneaker: buildSneaker,
  skateboard: buildSkateboard,
  bag: buildShoppingBag,
};

/**
 * Optional: load a real GLTF export. Resolves to null (so callers fall back to
 * procedural geometry) if the file is missing or the network is unavailable.
 */
export async function loadGLTFProduct(url) {
  try {
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    return gltf.scene;
  } catch (err) {
    console.info(`[products] GLTF "${url}" unavailable, using procedural mesh.`, err?.message || err);
    return null;
  }
}
