import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Colorway, ProductSpec, MarkerTrackingState } from '../types';
import { createProduct3D, ProductMeshGroup } from '../3d/productModels';
import { ARMarkerDetector } from '../utils/arMarkerDetector';
import { sounds } from '../utils/audio';

interface WebARCameraProps {
  product: ProductSpec;
  colorway: Colorway;
  onOpenMarkerModal: () => void;
  onCloseAR: () => void;
}

export const WebARCamera: React.FC<WebARCameraProps> = ({
  product,
  colorway,
  onOpenMarkerModal,
  onCloseAR,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const productGroupRef = useRef<ProductMeshGroup | null>(null);
  const detectorRef = useRef<ARMarkerDetector>(new ARMarkerDetector());
  const animFrameRef = useRef<number | null>(null);

  // Camera stream state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // AR Tracking state
  const [tracking, setTracking] = useState<MarkerTrackingState>({
    isSearching: true,
    isDetected: false,
    confidence: 0,
    markerType: 'Hiro',
    coordinates: null,
    distanceCm: 0,
    fps: 0,
  });

  // Simulated marker test overlay (for when users don't have a printout)
  const [useVirtualMarker, setUseVirtualMarker] = useState(false);
  const [virtualMarkerPos, setVirtualMarkerPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isDraggingMarker = useRef(false);

  // Model scale and rotation in AR
  const [scale, setScale] = useState(0.85);
  const [rotationY, setRotationY] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [flashActive, setFlashActive] = useState(false);

  // Start webcam feed
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.warn('Camera video play was deferred or interrupted:', playErr);
        });
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Webcam permission error:', err);
      const errMsg = err instanceof Error ? err.message : 'Camera access denied or unavailable.';
      setCameraError(errMsg);
      // Automatically enable virtual marker mode so user can still experience WebAR!
      setUseVirtualMarker(true);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Setup Three.js overlay scene
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // 3. Renderer with transparent background to overlay on top of video
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeCanvasRef.current = renderer.domElement;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting matching AR environment
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    const dirLight = new THREE.DirectionalLight(0xfff5ea, 3.0);
    dirLight.position.set(3, 5, 4);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-3, 2, -2);
    scene.add(ambientLight, dirLight, rimLight);

    // 5. 3D Product Mesh
    const pGroup = createProduct3D(product.id, colorway, 'shaded');
    pGroup.root.scale.set(scale, scale, scale);
    pGroup.root.position.set(0, 0, 0);
    productGroupRef.current = pGroup;
    scene.add(pGroup.root);

    // Resize listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Detection & Render Loop
    let lastTime = performance.now();
    let wasDetected = false;

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Detect marker from video stream or simulated marker
      if (videoRef.current || useVirtualMarker) {
        const { state, pose } = detectorRef.current.detect(
          videoRef.current as HTMLVideoElement,
          useVirtualMarker ? { x: virtualMarkerPos.x, y: virtualMarkerPos.y, active: true } : undefined
        );

        setTracking(state);

        if (state.isDetected && !wasDetected) {
          wasDetected = true;
          sounds.playMarkerLock();
        } else if (!state.isDetected && wasDetected) {
          wasDetected = false;
        }

        // Anchor 3D model to detected pose
        if (pose && productGroupRef.current) {
          const root = productGroupRef.current.root;
          root.visible = true;

          // Convert normalized coordinates to camera frustum world space
          const targetX = pose.x * 2.2;
          const targetY = pose.y * 1.8;

          // Smooth lerp
          root.position.x += (targetX - root.position.x) * 0.3;
          root.position.y += (targetY - root.position.y) * 0.3;
          root.position.z = -pose.distance * 1.8;

          if (autoRotate) {
            root.rotation.y += delta * 0.8;
          } else {
            root.rotation.y = rotationY;
          }
        } else if (productGroupRef.current) {
          // If marker not locked, show in center with subtle idle float
          const root = productGroupRef.current.root;
          root.visible = true;
          root.position.set(0, Math.sin(now * 0.002) * 0.08, -1.8);
          if (autoRotate) {
            root.rotation.y += delta * 0.6;
          }
        }
      }

      if (productGroupRef.current?.tick) {
        productGroupRef.current.tick(delta);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [product.id, colorway, useVirtualMarker]);

  // Update scale
  useEffect(() => {
    if (productGroupRef.current) {
      productGroupRef.current.root.scale.set(scale, scale, scale);
    }
  }, [scale]);

  // Snapshot Capture (Draws video + WebGL onto snapshot canvas)
  const takeSnapshot = () => {
    sounds.playShutter();
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 140);

    const video = videoRef.current;
    const glCanvas = threeCanvasRef.current;
    if (!glCanvas) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = glCanvas.width;
    outCanvas.height = glCanvas.height;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video background if available
    if (video && cameraActive) {
      ctx.drawImage(video, 0, 0, outCanvas.width, outCanvas.height);
    } else {
      // Draw gradient darkroom studio
      const grad = ctx.createLinearGradient(0, 0, 0, outCanvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    }

    // Overlay 3D WebGL render
    ctx.drawImage(glCanvas, 0, 0);

    // Ingrade Media watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`Ingrade Media (ingrade.io) · ${product.name}`, 32, outCanvas.height - 36);

    // Download snapshot image
    const link = document.createElement('a');
    link.download = `ingrade-ar-snapshot-${Date.now()}.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-black select-none">
      {/* Background Video Stream from Camera */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          cameraActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Fallback ambient backdrop when camera is loading or permission denied */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-6 text-center">
          <div className="max-w-md bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
            <h3 className="text-base font-semibold text-neutral-100 mb-2">WebAR Camera Feed</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              {cameraError ? (
                <>Camera unavailable ({cameraError}). Virtual AR Tabletop mode enabled below so you can test tracking immediately.</>
              ) : (
                'Requesting camera access to initialize AR.js marker tracking...'
              )}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={startCamera}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 rounded-lg transition-colors"
              >
                Retry Camera
              </button>
              <button
                onClick={() => setUseVirtualMarker(true)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white rounded-lg transition-colors"
              >
                Use Virtual AR Marker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Three.js 3D Product Canvas Overlay */}
      <div ref={canvasMountRef} className="absolute inset-0 pointer-events-none" />

      {/* Detected Marker Tracking Box Overlay */}
      {tracking.isDetected && tracking.coordinates && (
        <div
          className="absolute pointer-events-none border-2 border-emerald-400/80 rounded-sm shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all duration-75"
          style={{
            left: `${tracking.coordinates.x - tracking.coordinates.width / 2}px`,
            top: `${tracking.coordinates.y - tracking.coordinates.height / 2}px`,
            width: `${tracking.coordinates.width}px`,
            height: `${tracking.coordinates.height}px`,
          }}
        >
          <div className="absolute -top-6 left-0 bg-emerald-500/90 text-neutral-950 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <span>MARKER LOCKED</span>
            <span>·</span>
            <span>{tracking.distanceCm}cm</span>
          </div>
        </div>
      )}

      {/* Virtual Interactive Test Marker (Draggable) */}
      {useVirtualMarker && (
        <div
          className="absolute z-20 cursor-move"
          style={{
            left: `${virtualMarkerPos.x - 70}px`,
            top: `${virtualMarkerPos.y - 70}px`,
          }}
          onMouseDown={() => (isDraggingMarker.current = true)}
          onTouchStart={() => (isDraggingMarker.current = true)}
          onMouseMove={(e) => {
            if (isDraggingMarker.current) {
              setVirtualMarkerPos({ x: e.clientX, y: e.clientY });
            }
          }}
          onTouchMove={(e) => {
            if (isDraggingMarker.current && e.touches[0]) {
              setVirtualMarkerPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            }
          }}
          onMouseUp={() => (isDraggingMarker.current = false)}
          onTouchEnd={() => (isDraggingMarker.current = false)}
        >
          <div className="w-[140px] h-[140px] bg-black border-4 border-black p-3 flex flex-col items-center justify-center rounded-lg shadow-2xl relative">
            <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2 text-center">
              <span className="text-black font-mono font-black text-xl tracking-widest">HIRO</span>
              <span className="text-[9px] text-neutral-600 font-mono">AR.JS TEST MARKER</span>
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-neutral-900/90 text-cyan-300 text-[10px] px-2 py-0.5 rounded border border-cyan-500/30">
              Drag test marker
            </div>
          </div>
        </div>
      )}

      {/* Scanning Target Reticle (When searching) */}
      {!tracking.isDetected && !useVirtualMarker && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border border-dashed border-cyan-400/40 relative flex items-center justify-center text-center p-4">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
            <p className="text-xs text-white/80 drop-shadow-md">
              Align Hiro Marker in frame to anchor 3D product
            </p>
          </div>
        </div>
      )}

      {/* Snapshot Flash Layer */}
      {flashActive && <div className="absolute inset-0 bg-white z-50 transition-opacity duration-100" />}

      {/* Top HUD Controls */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-30">
        <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-xs">
          <span className="font-semibold text-white">Ingrade Media AR</span>
          <span className="text-neutral-600">·</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                tracking.isDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={`font-mono text-[11px] ${tracking.isDetected ? 'text-emerald-300' : 'text-amber-300'}`}>
              {tracking.isDetected ? 'Marker Locked [Hiro]' : 'Searching Marker'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMarkerModal}
            className="bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Show Marker
          </button>

          {cameraActive && (
            <button
              onClick={() => {
                setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
                sounds.playClick();
              }}
              className="bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              title="Switch Camera (Front/Back)"
            >
              Flip Cam
            </button>
          )}

          <button
            onClick={onCloseAR}
            className="bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Exit AR
          </button>
        </div>
      </header>

      {/* Bottom AR HUD Control Bar */}
      <footer className="absolute bottom-5 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto z-30">
        {/* Scale & Rotate Controls */}
        <div className="flex items-center gap-3 bg-neutral-950/80 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setScale((s) => Math.max(0.3, s - 0.15));
                sounds.playClick();
              }}
              className="w-7 h-7 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm font-bold"
            >
              -
            </button>
            <span className="font-mono text-cyan-400 text-xs px-1 w-10 text-center tabular-nums">
              {(scale / 0.85).toFixed(1)}x
            </span>
            <button
              onClick={() => {
                setScale((s) => Math.min(2.5, s + 0.15));
                sounds.playClick();
              }}
              className="w-7 h-7 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm font-bold"
            >
              +
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              sounds.playClick();
            }}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              autoRotate ? 'bg-cyan-500 text-neutral-950 font-semibold' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            Spin
          </button>
        </div>

        {/* Shutter Snapshot Button */}
        <button
          onClick={takeSnapshot}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
          </svg>
          <span>Take Snapshot</span>
        </button>

        {/* Virtual Marker Mode Toggle */}
        <button
          onClick={() => {
            setUseVirtualMarker(!useVirtualMarker);
            sounds.playClick();
          }}
          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors ${
            useVirtualMarker
              ? 'bg-neutral-900 border-cyan-500/50 text-cyan-300'
              : 'bg-neutral-950/80 border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          {useVirtualMarker ? 'Simulated Marker: Active' : 'Enable Simulated Marker'}
        </button>
      </footer>
    </div>
  );
};
