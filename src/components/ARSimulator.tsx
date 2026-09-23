import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Colorway, ProductSpec } from '../types';
import { createProduct3D, ProductMeshGroup } from '../3d/productModels';
import { sounds } from '../utils/audio';

interface ARSimulatorProps {
  product: ProductSpec;
  colorway: Colorway;
  onOpenMarkerModal: () => void;
  onLaunchLiveAR: () => void;
}

export const ARSimulator: React.FC<ARSimulatorProps> = ({
  product,
  colorway,
  onOpenMarkerModal,
  onLaunchLiveAR,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const productGroupRef = useRef<ProductMeshGroup | null>(null);
  const markerMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Simulation controls
  const [markerElevation, setMarkerElevation] = useState(0);
  const [markerTrackingActive, setMarkerTrackingActive] = useState(true);
  const [cameraWobble, setCameraWobble] = useState(true);
  const [simulatedEnvironment, setSimulatedEnvironment] = useState<'wood' | 'studio' | 'marble'>('wood');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 5.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Room Tabletop
    const tableGeo = new THREE.BoxGeometry(10, 0.4, 8);
    const tableMat = new THREE.MeshStandardMaterial({
      color: simulatedEnvironment === 'wood' ? 0x78350f : simulatedEnvironment === 'marble' ? 0xe2e8f0 : 0x18181b,
      roughness: 0.4,
      metalness: 0.1,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.2;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // 5. Procedural Hiro AR Marker Texture on Table
    const markerCanvas = document.createElement('canvas');
    markerCanvas.width = 256;
    markerCanvas.height = 256;
    const mCtx = markerCanvas.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = '#000000';
      mCtx.fillRect(0, 0, 256, 256);
      mCtx.fillStyle = '#ffffff';
      mCtx.fillRect(40, 40, 176, 176);
      mCtx.fillStyle = '#000000';
      mCtx.font = 'bold 36px monospace';
      mCtx.textAlign = 'center';
      mCtx.textBaseline = 'middle';
      mCtx.fillText('HIRO', 128, 128);
    }
    const markerTex = new THREE.CanvasTexture(markerCanvas);

    const markerGeo = new THREE.PlaneGeometry(2.4, 2.4);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshStandardMaterial({ map: markerTex, roughness: 0.6 });
    const markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.position.set(0, 0.01, 0);
    markerMeshRef.current = markerMesh;
    scene.add(markerMesh);

    // 6. Lighting
    const amb = new THREE.AmbientLight(0xffffff, 1.8);
    const key = new THREE.DirectionalLight(0xfff7ed, 3.2);
    key.position.set(3, 7, 4);
    key.castShadow = true;
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rim.position.set(-4, 3, -3);
    scene.add(amb, key, rim);

    // 7. 3D Product anchored to marker
    const pGroup = createProduct3D(product.id, colorway, 'shaded');
    pGroup.root.position.set(0, 0.8, 0);
    pGroup.root.scale.set(0.85, 0.85, 0.85);
    productGroupRef.current = pGroup;
    scene.add(pGroup.root);

    // Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Realistic handheld camera wobble simulation
      if (cameraWobble && cameraRef.current) {
        cameraRef.current.position.x = Math.sin(now * 0.001) * 0.25;
        cameraRef.current.position.y = 3.8 + Math.cos(now * 0.0015) * 0.15;
        cameraRef.current.lookAt(0, 0.4, 0);
      }

      if (productGroupRef.current?.tick) {
        productGroupRef.current.tick(delta);
      }

      if (productGroupRef.current && markerTrackingActive) {
        productGroupRef.current.root.rotation.y += delta * 0.5;
        productGroupRef.current.root.visible = true;
      } else if (productGroupRef.current) {
        productGroupRef.current.root.visible = false;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [product.id, colorway, simulatedEnvironment, cameraWobble, markerTrackingActive]);

  // Adjust elevation
  useEffect(() => {
    if (productGroupRef.current) {
      productGroupRef.current.root.position.y = 0.8 + markerElevation;
    }
  }, [markerElevation]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-neutral-950 select-none">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Bar Info */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-20">
        <div className="flex items-center gap-2 bg-neutral-900/85 backdrop-blur-md border border-neutral-800 px-3.5 py-1.5 rounded-xl text-xs">
          <span className="font-semibold text-neutral-200">AR Tabletop Simulator</span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono text-cyan-400">Marker Anchored</span>
          <span className="text-neutral-600">·</span>
          <a
            href="https://ingrade.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-300 transition-colors"
          >
            ingrade.io
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMarkerModal}
            className="bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Print Marker Sheet
          </button>
          <button
            onClick={onLaunchLiveAR}
            className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            Launch Camera AR
          </button>
        </div>
      </header>

      {/* Bottom Floating Simulator Controls */}
      <footer className="absolute bottom-5 left-4 right-4 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-auto z-20">
        {/* Surface Material Presets */}
        <div className="flex items-center gap-2 bg-neutral-900/85 backdrop-blur-md border border-neutral-800 px-3 py-2 rounded-xl text-xs">
          <span className="text-neutral-400">Surface:</span>
          {(['wood', 'marble', 'studio'] as const).map((env) => (
            <button
              key={env}
              onClick={() => {
                setSimulatedEnvironment(env);
                sounds.playClick();
              }}
              className={`capitalize px-2.5 py-1 rounded transition-colors ${
                simulatedEnvironment === env ? 'bg-cyan-500 text-neutral-950 font-semibold' : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              {env}
            </button>
          ))}
        </div>

        {/* Wobble & Tracking Toggles */}
        <div className="flex items-center gap-3 bg-neutral-900/85 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
            <input
              type="checkbox"
              checked={cameraWobble}
              onChange={(e) => setCameraWobble(e.target.checked)}
              className="rounded bg-neutral-800 border-neutral-700"
            />
            <span>Handheld Wobble</span>
          </label>

          <div className="h-4 w-px bg-neutral-800" />

          <button
            onClick={() => {
              setMarkerTrackingActive(!markerTrackingActive);
              sounds.playClick();
            }}
            className={`px-2.5 py-1 rounded transition-colors ${
              markerTrackingActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}
          >
            {markerTrackingActive ? 'Tracking: Locked' : 'Tracking: Lost'}
          </button>
        </div>
      </footer>
    </div>
  );
};
