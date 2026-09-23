/**
 * Three.js 3D Procedural Product Models
 * Supports PBR materials, dynamic exploded views, wireframe/x-ray modes, and rotation.
 */

import * as THREE from 'three';
import { Colorway, DisplayMode, ProductId } from '../types';

export interface ProductMeshGroup {
  root: THREE.Group;
  parts: Map<string, { mesh: THREE.Object3D; basePos: THREE.Vector3; explodeDir: THREE.Vector3 }>;
  updateExplode: (progress: number) => void;
  updateMaterial: (colorway: Colorway, mode: DisplayMode) => void;
  tick?: (delta: number) => void;
}

export function createProduct3D(
  productId: ProductId,
  colorway: Colorway,
  mode: DisplayMode
): ProductMeshGroup {
  const root = new THREE.Group();
  const parts = new Map<string, { mesh: THREE.Object3D; basePos: THREE.Vector3; explodeDir: THREE.Vector3 }>();
  let tickFn: ((delta: number) => void) | undefined;

  const getPrimaryMaterial = () => {
    if (mode === 'wireframe') {
      return new THREE.MeshBasicMaterial({ color: colorway.accentHex, wireframe: true });
    }
    if (mode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color: colorway.hex,
        transmission: 0.85,
        opacity: 0.45,
        transparent: true,
        roughness: 0.1,
        metalness: 0.1,
        wireframe: false,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: colorway.hex,
      roughness: colorway.roughness,
      metalness: colorway.metalness,
    });
  };

  const getAccentMaterial = (metal = 0.9, rough = 0.2) => {
    if (mode === 'wireframe') {
      return new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true });
    }
    return new THREE.MeshStandardMaterial({
      color: colorway.accentHex,
      metalness: metal,
      roughness: rough,
    });
  };

  const getGlassMaterial = () => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.35,
      transparent: true,
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.52,
    });
  };

  // BUILD PRODUCTS
  if (productId === 'watch') {
    // 1. Titanium Case
    const caseGeo = new THREE.CylinderGeometry(1.6, 1.5, 0.4, 48);
    const caseMesh = new THREE.Mesh(caseGeo, getPrimaryMaterial());
    caseMesh.castShadow = true;
    caseMesh.receiveShadow = true;
    root.add(caseMesh);
    parts.set('case', { mesh: caseMesh, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0, 0, 0) });

    // 2. Sapphire Glass
    const glassGeo = new THREE.CylinderGeometry(1.48, 1.48, 0.08, 48);
    const glassMesh = new THREE.Mesh(glassGeo, getGlassMaterial());
    glassMesh.position.y = 0.25;
    root.add(glassMesh);
    parts.set('glass', { mesh: glassMesh, basePos: new THREE.Vector3(0, 0.25, 0), explodeDir: new THREE.Vector3(0, 1.4, 0) });

    // 3. Ceramic Bezel
    const bezelGeo = new THREE.TorusGeometry(1.52, 0.12, 16, 48);
    bezelGeo.rotateX(Math.PI / 2);
    const bezelMesh = new THREE.Mesh(bezelGeo, getAccentMaterial(0.3, 0.1));
    bezelMesh.position.y = 0.2;
    root.add(bezelMesh);
    parts.set('bezel', { mesh: bezelMesh, basePos: new THREE.Vector3(0, 0.2, 0), explodeDir: new THREE.Vector3(0, 0.9, 0) });

    // 4. Dial Face
    const dialGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.04, 48);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8, metalness: 0.1 });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.y = 0.12;
    root.add(dialMesh);
    parts.set('dial', { mesh: dialMesh, basePos: new THREE.Vector3(0, 0.12, 0), explodeDir: new THREE.Vector3(0, 0.4, 0) });

    // 5. Watch Hands (Hour, Minute, Seconds sweep)
    const handsGroup = new THREE.Group();
    const hrGeo = new THREE.BoxGeometry(0.08, 0.02, 0.7);
    hrGeo.translate(0, 0, -0.35);
    const minGeo = new THREE.BoxGeometry(0.06, 0.02, 1.1);
    minGeo.translate(0, 0, -0.55);
    const secGeo = new THREE.BoxGeometry(0.02, 0.02, 1.3);
    secGeo.translate(0, 0, -0.5);

    const hrHand = new THREE.Mesh(hrGeo, getAccentMaterial());
    const minHand = new THREE.Mesh(minGeo, getAccentMaterial());
    const secHand = new THREE.Mesh(secGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));

    hrHand.position.y = 0.16;
    minHand.position.y = 0.18;
    secHand.position.y = 0.2;
    handsGroup.add(hrHand, minHand, secHand);
    root.add(handsGroup);
    parts.set('hands', { mesh: handsGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0, 0.6, 0) });

    // Sweep seconds tick
    tickFn = (_delta: number) => {
      secHand.rotation.y -= 0.02;
      minHand.rotation.y -= 0.001;
    };

    // 6. Crown
    const crownGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.35, 24);
    crownGeo.rotateZ(Math.PI / 2);
    const crownMesh = new THREE.Mesh(crownGeo, getAccentMaterial());
    crownMesh.position.set(1.7, 0, 0);
    root.add(crownMesh);
    parts.set('crown', { mesh: crownMesh, basePos: new THREE.Vector3(1.7, 0, 0), explodeDir: new THREE.Vector3(1.2, 0, 0) });

    // 7. Caseback Sensor
    const backGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.15, 32);
    const backMesh = new THREE.Mesh(backGeo, new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.2, metalness: 0.8 }));
    backMesh.position.y = -0.22;
    root.add(backMesh);
    parts.set('back', { mesh: backMesh, basePos: new THREE.Vector3(0, -0.22, 0), explodeDir: new THREE.Vector3(0, -1.2, 0) });

  } else if (productId === 'drone') {
    // 1. Central Canopy Fuselage
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.5, 2.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, getPrimaryMaterial());
    bodyMesh.castShadow = true;
    root.add(bodyMesh);
    parts.set('canopy', { mesh: bodyMesh, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0, 1.2, 0) });

    // 2. 4 Carbon Fiber Arms
    const armsGroup = new THREE.Group();
    const armPositions = [
      { x: 1.6, z: 1.6, rot: Math.PI / 4 },
      { x: -1.6, z: 1.6, rot: -Math.PI / 4 },
      { x: 1.6, z: -1.6, rot: -Math.PI / 4 },
      { x: -1.6, z: -1.6, rot: Math.PI / 4 },
    ];
    armPositions.forEach((pos) => {
      const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 16);
      armGeo.rotateZ(Math.PI / 2);
      armGeo.rotateY(pos.rot);
      const armMesh = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.9 }));
      armsGroup.add(armMesh);
    });
    root.add(armsGroup);
    parts.set('arms', { mesh: armsGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(1.2, 0, 0) });

    // 3. Rotors and Motors
    const rotorsGroup = new THREE.Group();
    const blades: THREE.Mesh[] = [];
    armPositions.forEach((pos) => {
      const motorGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16);
      const motorMesh = new THREE.Mesh(motorGeo, getAccentMaterial());
      motorMesh.position.set(pos.x, 0.15, pos.z);

      const bladeGeo = new THREE.BoxGeometry(1.8, 0.03, 0.18);
      const bladeMesh = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.7 }));
      bladeMesh.position.set(pos.x, 0.35, pos.z);

      rotorsGroup.add(motorMesh, bladeMesh);
      blades.push(bladeMesh);
    });
    root.add(rotorsGroup);
    parts.set('rotors', { mesh: rotorsGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0, 0.8, 0) });

    // Animated spinning propellers
    tickFn = () => {
      blades.forEach((b, i) => {
        b.rotation.y += i % 2 === 0 ? 0.35 : -0.35;
      });
    };

    // 4. Gimbal 4K Camera
    const gimbalGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.35, 24, 24);
    const cameraSphere = new THREE.Mesh(sphereGeo, getAccentMaterial(0.8, 0.2));
    const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 24);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 }));
    lensMesh.position.z = 0.3;
    gimbalGroup.add(cameraSphere, lensMesh);
    gimbalGroup.position.set(0, -0.4, 1.0);
    root.add(gimbalGroup);
    parts.set('gimbal', { mesh: gimbalGroup, basePos: new THREE.Vector3(0, -0.4, 1.0), explodeDir: new THREE.Vector3(0, -0.8, 1.0) });

    // 5. Landing Skids
    const skidGroup = new THREE.Group();
    [-0.9, 0.9].forEach((x) => {
      const skidGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12);
      skidGeo.rotateX(Math.PI / 2);
      const skidMesh = new THREE.Mesh(skidGeo, getPrimaryMaterial());
      skidMesh.position.set(x, -0.7, 0);

      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12);
      const leg1 = new THREE.Mesh(legGeo, getPrimaryMaterial());
      leg1.position.set(x, -0.4, 0.8);
      const leg2 = new THREE.Mesh(legGeo, getPrimaryMaterial());
      leg2.position.set(x, -0.4, -0.8);
      skidGroup.add(skidMesh, leg1, leg2);
    });
    root.add(skidGroup);
    parts.set('landing', { mesh: skidGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0, -1.3, 0) });

  } else if (productId === 'headset') {
    // Spatial Studio H1 Headset
    // 1. Headband
    const bandCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.8, 0, 0),
      new THREE.Vector3(0, 2.6, 0),
      new THREE.Vector3(1.8, 0, 0)
    );
    const bandGeo = new THREE.TubeGeometry(bandCurve, 32, 0.12, 16, false);
    const bandMesh = new THREE.Mesh(bandGeo, getPrimaryMaterial());
    root.add(bandMesh);
    parts.set('headband', { mesh: bandMesh, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0, 1.4, 0) });

    // 2. Earcups Left & Right
    const earcupGroup = new THREE.Group();
    [-1.8, 1.8].forEach((x) => {
      const cupGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.45, 32);
      cupGeo.rotateZ(Math.PI / 2);
      const cupMesh = new THREE.Mesh(cupGeo, getPrimaryMaterial());
      cupMesh.position.set(x, -0.3, 0);

      // Acoustic Grille Mesh
      const meshGeo = new THREE.CircleGeometry(0.85, 32);
      meshGeo.rotateY(x > 0 ? Math.PI / 2 : -Math.PI / 2);
      const grilleMesh = new THREE.Mesh(meshGeo, getAccentMaterial(0.7, 0.2));
      grilleMesh.position.set(x + (x > 0 ? 0.23 : -0.23), -0.3, 0);

      earcupGroup.add(cupMesh, grilleMesh);
    });
    root.add(earcupGroup);
    parts.set('mesh', { mesh: earcupGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(1.3, 0, 0) });

    // 3. Planar Drivers
    const driverGroup = new THREE.Group();
    [-1.8, 1.8].forEach((x) => {
      const dGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24);
      dGeo.rotateZ(Math.PI / 2);
      const dMesh = new THREE.Mesh(dGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 }));
      dMesh.position.set(x, -0.3, 0);
      driverGroup.add(dMesh);
    });
    root.add(driverGroup);
    parts.set('driver', { mesh: driverGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(0.8, 0, 0) });

    // 4. Memory Foam Cushions
    const cushionGroup = new THREE.Group();
    [-1.8, 1.8].forEach((x) => {
      const cGeo = new THREE.TorusGeometry(0.8, 0.22, 16, 32);
      cGeo.rotateY(Math.PI / 2);
      const cMesh = new THREE.Mesh(cGeo, new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.1 }));
      cMesh.position.set(x + (x > 0 ? -0.25 : 0.25), -0.3, 0);
      cushionGroup.add(cMesh);
    });
    root.add(cushionGroup);
    parts.set('cushion', { mesh: cushionGroup, basePos: new THREE.Vector3(0, 0, 0), explodeDir: new THREE.Vector3(-0.6, 0, 0) });

  } else {
    // Optik Cine Prime 50mm Lens
    // 1. Front Element
    const frontGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.2, 36);
    frontGeo.rotateX(Math.PI / 2);
    const frontMesh = new THREE.Mesh(frontGeo, getGlassMaterial());
    frontMesh.position.z = 1.3;
    root.add(frontMesh);
    parts.set('front_element', { mesh: frontMesh, basePos: new THREE.Vector3(0, 0, 1.3), explodeDir: new THREE.Vector3(0, 0, 1.4) });

    // 2. Focus Ring
    const focusGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.9, 36);
    focusGeo.rotateX(Math.PI / 2);
    const focusMesh = new THREE.Mesh(focusGeo, getPrimaryMaterial());
    focusMesh.position.z = 0.6;
    root.add(focusMesh);
    parts.set('focus_ring', { mesh: focusMesh, basePos: new THREE.Vector3(0, 0, 0.6), explodeDir: new THREE.Vector3(0, 0, 0.7) });

    // 3. Aperture Ring
    const irisGeo = new THREE.CylinderGeometry(1.38, 1.38, 0.6, 36);
    irisGeo.rotateX(Math.PI / 2);
    const irisMesh = new THREE.Mesh(irisGeo, getAccentMaterial(0.8, 0.3));
    irisMesh.position.z = -0.1;
    root.add(irisMesh);
    parts.set('aperture_ring', { mesh: irisMesh, basePos: new THREE.Vector3(0, 0, -0.1), explodeDir: new THREE.Vector3(0, 0, 0) });

    // 4. Lens Mount
    const mountGeo = new THREE.CylinderGeometry(1.1, 1.25, 0.45, 36);
    mountGeo.rotateX(Math.PI / 2);
    const mountMesh = new THREE.Mesh(mountGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 }));
    mountMesh.position.z = -0.8;
    root.add(mountMesh);
    parts.set('mount', { mesh: mountMesh, basePos: new THREE.Vector3(0, 0, -0.8), explodeDir: new THREE.Vector3(0, 0, -1.3) });
  }

  // Explode view update function
  const updateExplode = (progress: number) => {
    parts.forEach(({ mesh, basePos, explodeDir }) => {
      mesh.position.set(
        basePos.x + explodeDir.x * progress * 1.5,
        basePos.y + explodeDir.y * progress * 1.5,
        basePos.z + explodeDir.z * progress * 1.5
      );
    });
  };

  // Material update function
  const updateMaterial = (newColorway: Colorway, newMode: DisplayMode) => {
    root.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (newMode === 'wireframe') {
          child.material = new THREE.MeshBasicMaterial({ color: newColorway.accentHex, wireframe: true });
        } else if (newMode === 'xray') {
          child.material = new THREE.MeshPhysicalMaterial({
            color: newColorway.hex,
            transmission: 0.85,
            opacity: 0.4,
            transparent: true,
            roughness: 0.1,
            metalness: 0.2,
          });
        }
      }
    });
  };

  return {
    root,
    parts,
    updateExplode,
    updateMaterial,
    tick: tickFn,
  };
}
