import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Colorway, DisplayMode, LightingPreset, ProductSpec } from '../types';
import { createProduct3D, ProductMeshGroup } from './productModels';
import { sounds } from '../utils/audio';

interface StudioSceneProps {
  product: ProductSpec;
  colorway: Colorway;
  displayMode: DisplayMode;
  lighting: LightingPreset;
  explodeProgress: number;
  autoRotate: boolean;
  onExplodeChange: (val: number) => void;
  onPartSelect?: (partId: string) => void;
}

export const StudioScene: React.FC<StudioSceneProps> = ({
  product,
  colorway,
  displayMode,
  lighting,
  explodeProgress,
  autoRotate,
  onExplodeChange,
  onPartSelect,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const productGroupRef = useRef<ProductMeshGroup | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Interaction states for orbit controls
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: 0.6, phi: 1.1, radius: 6.8 });

  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [isPlayingExplode, setIsPlayingExplode] = useState(false);

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Ground Shadow & Circular Grid
    const groundGroup = new THREE.Group();
    const shadowGeo = new THREE.CircleGeometry(3.6, 64);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -1.8;
    groundGroup.add(shadowMesh);

    // Subtle technical grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -1.81;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    groundGroup.add(gridHelper);
    scene.add(groundGroup);

    // 5. Lighting Setup
    const lightsGroup = new THREE.Group();
    lightsGroupRef.current = lightsGroup;
    scene.add(lightsGroup);
    setupLights(lighting, lightsGroup);

    // 6. Load Product
    const pGroup = createProduct3D(product.id, colorway, displayMode);
    productGroupRef.current = pGroup;
    scene.add(pGroup.root);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (autoRotate && !isDraggingRef.current) {
        cameraRotationRef.current.theta += delta * 0.4;
        updateCameraPosition();
      }

      if (productGroupRef.current?.tick) {
        productGroupRef.current.tick(delta);
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
  }, [product.id]);

  // Update Lights when lighting preset changes
  useEffect(() => {
    if (lightsGroupRef.current) {
      setupLights(lighting, lightsGroupRef.current);
    }
  }, [lighting]);

  // Update Material & Display Mode
  useEffect(() => {
    if (sceneRef.current && productGroupRef.current) {
      sceneRef.current.remove(productGroupRef.current.root);
      const newPGroup = createProduct3D(product.id, colorway, displayMode);
      productGroupRef.current = newPGroup;
      sceneRef.current.add(newPGroup.root);
      newPGroup.updateExplode(explodeProgress);
    }
  }, [colorway, displayMode, product.id]);

  // Update Exploded View
  useEffect(() => {
    if (productGroupRef.current) {
      productGroupRef.current.updateExplode(explodeProgress);
    }
  }, [explodeProgress]);

  // Explode Animation player toggle
  useEffect(() => {
    if (!isPlayingExplode) return;
    let progress = explodeProgress;
    let forward = true;
    sounds.playExplode();

    const interval = setInterval(() => {
      if (forward) {
        progress += 0.035;
        if (progress >= 1.0) {
          progress = 1.0;
          forward = false;
        }
      } else {
        progress -= 0.035;
        if (progress <= 0) {
          progress = 0;
          setIsPlayingExplode(false);
          clearInterval(interval);
        }
      }
      onExplodeChange(progress);
    }, 24);

    return () => clearInterval(interval);
  }, [isPlayingExplode]);

  const setupLights = (preset: LightingPreset, group: THREE.Group) => {
    group.clear();

    if (preset === 'cyber') {
      const amb = new THREE.AmbientLight(0x0f172a, 1.8);
      const key = new THREE.DirectionalLight(0x06b6d4, 3.2); // Electric Cyan
      key.position.set(4, 5, 3);
      const rim = new THREE.DirectionalLight(0xd946ef, 3.8); // Magenta Rim
      rim.position.set(-4, 3, -4);
      group.add(amb, key, rim);
    } else if (preset === 'daylight') {
      const amb = new THREE.AmbientLight(0xf8fafc, 2.2);
      const sun = new THREE.DirectionalLight(0xffedd5, 3.5);
      sun.position.set(6, 8, 4);
      const fill = new THREE.DirectionalLight(0x93c5fd, 1.2);
      fill.position.set(-4, 2, -3);
      group.add(amb, sun, fill);
    } else if (preset === 'monochrome') {
      const amb = new THREE.AmbientLight(0xffffff, 1.2);
      const key = new THREE.DirectionalLight(0xffffff, 4.0);
      key.position.set(3, 6, 4);
      const rim = new THREE.DirectionalLight(0xffffff, 2.0);
      rim.position.set(-4, -1, -3);
      group.add(amb, key, rim);
    } else {
      // Studio Softbox (Default)
      const amb = new THREE.AmbientLight(0xffffff, 1.8);
      const key = new THREE.DirectionalLight(0xfff7ed, 3.4);
      key.position.set(3.5, 6, 4.5);
      const fill = new THREE.DirectionalLight(0xe0f2fe, 1.8);
      fill.position.set(-4, 3, -2);
      const rim = new THREE.DirectionalLight(0x38bdf8, 1.5);
      rim.position.set(0, 4, -5);
      group.add(amb, key, fill, rim);
    }
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraRotationRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Mouse / Touch Handlers for Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };

    cameraRotationRef.current.theta += deltaX * 0.008;
    cameraRotationRef.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, cameraRotationRef.current.phi - deltaY * 0.008));
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraRotationRef.current.radius = Math.max(3.2, Math.min(12, cameraRotationRef.current.radius + e.deltaY * 0.006));
    updateCameraPosition();
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - prevMouseRef.current.x;
      const deltaY = e.touches[0].clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      cameraRotationRef.current.theta += deltaX * 0.008;
      cameraRotationRef.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, cameraRotationRef.current.phi - deltaY * 0.008));
      updateCameraPosition();
    }
  };

  const handleResetCamera = useCallback(() => {
    cameraRotationRef.current = { theta: 0.6, phi: 1.1, radius: 6.8 };
    updateCameraPosition();
    sounds.playClick();
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-[500px] select-none cursor-grab active:cursor-grabbing overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Blueprint Caliper Dimensions Overlay */}
      {displayMode === 'blueprint' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-[340px] h-[340px] border border-cyan-500/40 rounded-sm">
            {/* Top dimension */}
            <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[11px] font-mono text-cyan-400">
              <span className="h-2 w-px bg-cyan-400"></span>
              <span className="bg-neutral-950/80 px-2 py-0.5 border border-cyan-500/20">{product.dimensionsMm.width} mm (W)</span>
              <span className="h-2 w-px bg-cyan-400"></span>
            </div>
            {/* Right dimension */}
            <div className="absolute -right-8 top-0 bottom-0 flex flex-col items-center justify-between text-[11px] font-mono text-cyan-400">
              <span className="w-2 h-px bg-cyan-400"></span>
              <span className="bg-neutral-950/80 px-2 py-0.5 border border-cyan-500/20 rotate-90">{product.dimensionsMm.height} mm (H)</span>
              <span className="w-2 h-px bg-cyan-400"></span>
            </div>
            {/* Technical grid corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>
          </div>
        </div>
      )}

      {/* Exploded Parts Annotation Tag */}
      {hoveredPart && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-neutral-900/90 backdrop-blur-md border border-cyan-500/40 text-neutral-100 text-xs px-3 py-1.5 rounded shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-semibold text-cyan-300">{hoveredPart}</span>
          </div>
        </div>
      )}

      {/* Top Studio Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-2.5 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="font-display font-medium text-neutral-200">{product.name}</span>
          <span className="text-neutral-600">·</span>
          <span className="font-mono text-cyan-400">{product.category}</span>
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

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleResetCamera}
            className="bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            title="Reset 3D Camera"
          >
            Reset View
          </button>
        </div>
      </div>

      {/* Bottom Floating Inspection Controls */}
      <div className="absolute bottom-5 left-4 right-4 pointer-events-none z-10 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Exploded View Slider */}
        <div className="pointer-events-auto w-full md:w-auto flex items-center gap-3 bg-neutral-900/85 backdrop-blur-md border border-neutral-800/80 px-4 py-2.5 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
            <span>Exploded View</span>
            <span className="font-mono text-cyan-400 text-[11px] tabular-nums">
              {Math.round(explodeProgress * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explodeProgress}
            onChange={(e) => {
              onExplodeChange(parseFloat(e.target.value));
              sounds.playClick();
            }}
            className="w-32 md:w-44 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <button
            onClick={() => {
              setIsPlayingExplode(!isPlayingExplode);
              sounds.playClick();
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              isPlayingExplode ? 'bg-cyan-500 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {isPlayingExplode ? 'Pause' : 'Animate'}
          </button>
        </div>

        {/* Exploded Parts Tags Pills List */}
        {explodeProgress > 0.15 && (
          <div className="pointer-events-auto hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-xl py-1">
            {product.parts.slice(0, 5).map((part) => (
              <button
                key={part.id}
                onMouseEnter={() => setHoveredPart(part.name)}
                onMouseLeave={() => setHoveredPart(null)}
                onClick={() => {
                  onPartSelect?.(part.id);
                  sounds.playClick();
                }}
                className="whitespace-nowrap px-2.5 py-1 bg-neutral-900/70 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 text-[11px] text-neutral-400 hover:text-cyan-300 rounded transition-colors"
              >
                {part.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
