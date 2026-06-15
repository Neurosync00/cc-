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

/* ----------------------------------------------------------- Car (BMW-style) */
// A premium grand-tourer silhouette. Generic — no trademarked badging — so it
// reads as a luxury sports sedan; swap in a real bmw.glb via the loader slot.
export function buildCar() {
  const g = new THREE.Group();

  const bodyMat = physicalMat(PALETTE.ink, { roughness: 0.28, metalness: 0.55, envMapIntensity: 1.4 });
  const trimMat = physicalMat(PALETTE.gold, { roughness: 0.25, metalness: 0.9, emissive: PALETTE.gold, emissiveIntensity: 0.12 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.08, metalness: 0.2, envMapIntensity: 2.0 });

  // Lower body — long, low slung
  const lower = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.62, 1.95), bodyMat);
  lower.position.y = 0.55;
  g.add(lower);

  // Hood + trunk taper (soften the box silhouette)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 1.85), bodyMat);
  hood.position.set(1.55, 0.86, 0);
  g.add(hood);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.85), bodyMat);
  trunk.position.set(-1.6, 0.86, 0);
  g.add(trunk);

  // Greenhouse / cabin — tapered toward the roof
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.62, 1.7), bodyMat);
  cabin.position.set(-0.05, 1.18, 0);
  cabin.scale.set(1, 1, 0.82);
  g.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.5), bodyMat);
  roof.position.set(-0.15, 1.5, 0);
  roof.scale.set(1, 1, 0.78);
  g.add(roof);

  // Glass: windshield, rear, sides
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), glassMat);
  windshield.position.set(1.05, 1.2, 0);
  windshield.rotation.y = Math.PI / 2;
  windshield.rotation.z = -0.5;
  g.add(windshield);
  const rearGlass = windshield.clone();
  rearGlass.position.set(-1.15, 1.2, 0);
  rearGlass.rotation.z = 0.6;
  g.add(rearGlass);
  [-1, 1].forEach((z) => {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), glassMat);
    side.position.set(-0.1, 1.2, z * 0.71);
    side.rotation.y = z > 0 ? 0 : Math.PI;
    g.add(side);
  });

  // Twin "kidney" grille (generic vertical intakes)
  [-0.22, 0.22].forEach((z) => {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.32), trimMat);
    grille.position.set(2.32, 0.66, z);
    g.add(grille);
  });
  // Front splitter
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 1.8), trimMat);
  splitter.position.set(2.3, 0.34, 0);
  g.add(splitter);

  // Headlights + taillights (emissive)
  const headMat = physicalMat(0xfff2d0, { emissive: 0xfff0c8, emissiveIntensity: 1.6, roughness: 0.2 });
  const tailMat = physicalMat(0x7a1414, { emissive: 0xff3b30, emissiveIntensity: 1.2, roughness: 0.3 });
  [-0.62, 0.62].forEach((z) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.5), headMat);
    hl.position.set(2.31, 0.72, z);
    g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.55), tailMat);
    tl.position.set(-2.31, 0.78, z);
    g.add(tl);
  });

  // Wheels with gold rims
  const tireMat = physicalMat(0x0c0c0c, { roughness: 0.85, metalness: 0.1 });
  const wheelY = 0.45, wheelX = 1.55, wheelZ = 1.0;
  [[wheelX, wheelZ], [wheelX, -wheelZ], [-wheelX, wheelZ], [-wheelX, -wheelZ]].forEach(([x, z]) => {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.34, 28), tireMat);
    tire.rotation.x = Math.PI / 2;
    tire.position.set(x, wheelY, z);
    g.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 16), trimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, wheelY, z);
    g.add(rim);
    // simple spokes
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), trimMat);
      spoke.position.set(x, wheelY, z);
      spoke.rotation.x = Math.PI / 2;
      spoke.rotation.z = (s / 5) * Math.PI;
      g.add(spoke);
    }
  });

  g.scale.setScalar(0.62);
  return g;
}

/* ----------------------------------------------------------- Registry */
export const PRODUCT_BUILDERS = {
  sneaker: buildSneaker,
  skateboard: buildSkateboard,
  bag: buildShoppingBag,
  bmw: buildCar,
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
