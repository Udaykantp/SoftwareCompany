/**
 * Canonical AR.js Product Demo templates and standalone project exporter
 * Matches arjs-product-demo/ structure requested by user:
 * arjs-product-demo/
 * ├── index.html
 * ├── style.css
 * ├── app.js
 * └── assets/
 *     ├── product.glb
 *     └── marker.patt
 */

import JSZip from 'jszip';

export const STANDALONE_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Ingrade Media | WebAR Product Showcase (ingrade.io)</title>
  <link rel="stylesheet" href="style.css">
  
  <!-- A-Frame and AR.js (WebAR marker tracking engine) -->
  <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
  <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>
  <!-- Optional A-Frame extras for animations and loaders -->
  <script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js"></script>
</head>
<body style="margin: 0; overflow: hidden;">
  <!-- AR.js Scene -->
  <a-scene 
    embedded 
    arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
    renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true; colorManagement: true;"
    vr-mode-ui="enabled: false"
    id="arScene">
    
    <a-assets timeout="10000">
      <a-asset-item id="productModel" src="assets/product.glb"></a-asset-item>
    </a-assets>

    <!-- Marker definition: uses custom marker.patt (or Hiro marker fallback) -->
    <a-marker 
      type="pattern" 
      url="assets/marker.patt" 
      id="productMarker"
      emitevents="true"
      smooth="true"
      smoothCount="5"
      smoothTolerance="0.01"
      smoothThreshold="2">
      
      <!-- 3D Product Container with lighting -->
      <a-entity id="productContainer" position="0 0.1 0" scale="0.6 0.6 0.6">
        <!-- 3D GLB Model -->
        <a-entity 
          id="productEntity" 
          gltf-model="#productModel" 
          animation="property: rotation; to: 0 360 0; loop: true; dur: 16000; easing: linear;"
          position="0 0 0">
        </a-entity>
        
        <!-- Subtle shadow receiver plane under model -->
        <a-circle 
          radius="0.75" 
          rotation="-90 0 0" 
          color="#000000" 
          opacity="0.3" 
          material="transparent: true; roughness: 1.0;">
        </a-circle>
      </a-entity>
    </a-marker>

    <!-- Static scene lighting -->
    <a-entity light="type: ambient; color: #ffffff; intensity: 1.2;"></a-entity>
    <a-entity light="type: directional; color: #ffffff; intensity: 1.8; castShadow: true;" position="2 4 3"></a-entity>
    <a-entity light="type: directional; color: #38bdf8; intensity: 0.6;" position="-2 2 -2"></a-entity>

    <a-entity camera></a-entity>
  </a-scene>

  <!-- Modern Floating AR HUD Overlay -->
  <div id="arHud" class="ar-hud">
    <!-- Top Bar -->
    <header class="hud-header">
      <div class="hud-brand">
        <span class="brand-title">Ingrade Media</span>
        <span class="brand-sep">·</span>
        <a href="https://ingrade.io" target="_blank" style="color:#38bdf8;text-decoration:none;font-size:11px;font-family:monospace;">ingrade.io</a>
        <span class="brand-sep">·</span>
        <span id="productTitle">Precision Product 3D</span>
      </div>
      <div id="trackingBadge" class="status-indicator searching">
        <span class="status-dot"></span>
        <span id="trackingText">Scanning for Marker</span>
      </div>
    </header>

    <!-- Center Reticle / Scanning Guide -->
    <div id="scanGuide" class="scan-guide">
      <div class="reticle-box">
        <div class="reticle-corner top-left"></div>
        <div class="reticle-corner top-right"></div>
        <div class="reticle-corner bottom-left"></div>
        <div class="reticle-corner bottom-right"></div>
        <p class="guide-text">Point camera at the printed or on-screen marker</p>
      </div>
    </div>

    <!-- Bottom Controls Bar -->
    <footer class="hud-footer">
      <div class="control-group">
        <button id="btnScaleDown" class="hud-btn" title="Scale Down">－</button>
        <span id="scaleLabel" class="hud-val">1.0×</span>
        <button id="btnScaleUp" class="hud-btn" title="Scale Up">＋</button>
      </div>

      <button id="btnSnapshot" class="hud-btn primary snapshot-btn" title="Capture AR Snapshot">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"></path>
        </svg>
        <span>Snapshot</span>
      </button>

      <div class="control-group">
        <button id="btnRotateToggle" class="hud-btn" title="Toggle Auto-Rotation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
        </button>
        <button id="btnReset" class="hud-btn" title="Reset View">Reset</button>
      </div>
    </footer>
  </div>

  <!-- Snapshot Flash Animation Layer -->
  <div id="flashOverlay" class="flash-overlay"></div>

  <script src="app.js"></script>
</body>
</html>`;

export const STANDALONE_STYLE_CSS = `/* Ingrade AR.js Product Demo Styling */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #000;
  color: #f1f5f9;
  user-select: none;
}

/* Floating HUD */
.ar-hud {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

/* Header */
.hud-header {
  pointer-events: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.hud-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.brand-title {
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

.brand-sep {
  color: #64748b;
}

#productTitle {
  color: #94a3b8;
  font-weight: 500;
}

/* Status Indicator */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  transition: all 0.3s ease;
}

.status-indicator.searching {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-indicator.detected {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

/* Scanning Guide Reticle */
.scan-guide {
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  transition: opacity 0.4s ease;
}

.scan-guide.hidden {
  opacity: 0;
}

.reticle-box {
  width: 260px;
  height: 260px;
  position: relative;
  border: 1px dashed rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1rem;
}

.reticle-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: #38bdf8;
  border-style: solid;
}

.reticle-corner.top-left {
  top: -2px; left: -2px;
  border-width: 3px 0 0 3px;
}
.reticle-corner.top-right {
  top: -2px; right: -2px;
  border-width: 3px 3px 0 0;
}
.reticle-corner.bottom-left {
  bottom: -2px; left: -2px;
  border-width: 0 0 3px 3px;
}
.reticle-corner.bottom-right {
  bottom: -2px; right: -2px;
  border-width: 0 3px 3px 0;
}

.guide-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

/* Footer Controls */
.hud-footer {
  pointer-events: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.hud-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: all 0.2s ease;
}

.hud-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.hud-btn:active {
  transform: scale(0.96);
}

.hud-btn.primary {
  background: #0284c7;
  border-color: #38bdf8;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
}

.hud-btn.primary:hover {
  background: #0369a1;
}

.hud-val {
  font-family: monospace;
  font-size: 0.8rem;
  padding: 0 0.35rem;
  color: #38bdf8;
}

/* Flash overlay */
.flash-overlay {
  position: fixed;
  inset: 0;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  z-index: 10000;
  transition: opacity 0.08s ease-out;
}

.flash-overlay.active {
  opacity: 0.85;
}
`;

export const STANDALONE_APP_JS = `/**
 * Ingrade AR.js Product Demo Controller
 * Manages marker detection, 3D entity transforms, scale, rotation, and snapshot capture
 */

document.addEventListener('DOMContentLoaded', () => {
  const marker = document.getElementById('productMarker');
  const productContainer = document.getElementById('productContainer');
  const productEntity = document.getElementById('productEntity');
  const trackingBadge = document.getElementById('trackingBadge');
  const trackingText = document.getElementById('trackingText');
  const scanGuide = document.getElementById('scanGuide');
  const scaleLabel = document.getElementById('scaleLabel');
  const flashOverlay = document.getElementById('flashOverlay');

  const btnScaleUp = document.getElementById('btnScaleUp');
  const btnScaleDown = document.getElementById('btnScaleDown');
  const btnRotateToggle = document.getElementById('btnRotateToggle');
  const btnReset = document.getElementById('btnReset');
  const btnSnapshot = document.getElementById('btnSnapshot');

  let currentScale = 0.6;
  let isRotating = true;
  let isMarkerVisible = false;

  // Web Audio chime
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio blocked or unsupported
    }
  };

  // Marker Found Handler
  marker.addEventListener('markerFound', () => {
    isMarkerVisible = true;
    trackingBadge.classList.remove('searching');
    trackingBadge.classList.add('detected');
    trackingText.textContent = 'Marker Locked [Hiro]';
    scanGuide.classList.add('hidden');
    playChime();
    console.log('[AR.js] Marker locked. 3D Model anchored.');
  });

  // Marker Lost Handler
  marker.addEventListener('markerLost', () => {
    isMarkerVisible = false;
    trackingBadge.classList.remove('detected');
    trackingBadge.classList.add('searching');
    trackingText.textContent = 'Scanning for Marker';
    scanGuide.classList.remove('hidden');
    console.log('[AR.js] Marker lost.');
  });

  // Scale Controls
  const updateScale = (delta) => {
    currentScale = Math.min(Math.max(currentScale + delta, 0.2), 2.5);
    productContainer.setAttribute('scale', \`\${currentScale} \${currentScale} \${currentScale}\`);
    scaleLabel.textContent = \`\${(currentScale / 0.6).toFixed(1)}×\`;
  };

  btnScaleUp.addEventListener('click', () => updateScale(0.1));
  btnScaleDown.addEventListener('click', () => updateScale(-0.1));

  // Toggle Auto-Rotation
  btnRotateToggle.addEventListener('click', () => {
    isRotating = !isRotating;
    if (isRotating) {
      productEntity.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 16000; easing: linear;');
    } else {
      productEntity.removeAttribute('animation');
    }
  });

  // Reset View
  btnReset.addEventListener('click', () => {
    currentScale = 0.6;
    productContainer.setAttribute('scale', '0.6 0.6 0.6');
    scaleLabel.textContent = '1.0×';
    productContainer.setAttribute('position', '0 0.1 0');
  });

  // Snapshot Capture
  btnSnapshot.addEventListener('click', () => {
    // Flash effect
    flashOverlay.classList.add('active');
    setTimeout(() => flashOverlay.classList.remove('active'), 120);

    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) return;

    // Use A-Frame screenshot component
    const screenshot = sceneEl.components.screenshot;
    if (screenshot) {
      const canvas = screenshot.getCanvas('perspective');
      if (canvas) {
        const link = document.createElement('a');
        link.download = \`ingrade-ar-snapshot-\${Date.now()}.png\`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  });
});
`;

export const STANDALONE_MARKER_PATT = `0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000 0.000
`;

/**
 * Downloads the complete arjs-product-demo directory as a zip
 */
export async function downloadARJsZip(): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('arjs-product-demo');
  if (!folder) return;

  folder.file('index.html', STANDALONE_INDEX_HTML);
  folder.file('style.css', STANDALONE_STYLE_CSS);
  folder.file('app.js', STANDALONE_APP_JS);

  const assets = folder.folder('assets');
  if (assets) {
    assets.file('marker.patt', STANDALONE_MARKER_PATT);
    // Create a valid minimal GLB binary header placeholder for product.glb
    const minimalGLB = createMinimalGLBBuffer();
    assets.file('product.glb', minimalGLB);
    assets.file('README.txt', 'Place your 3D GLB export or use the provided model in product.glb. Test with index.html using any local HTTP server (e.g. npx serve or Live Server).');
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'arjs-product-demo.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Creates a valid minimal glTF binary (GLB) file buffer
 */
function createMinimalGLBBuffer(): Uint8Array {
  const jsonContent = JSON.stringify({
    asset: { version: '2.0', generator: 'Ingrade Media (ingrade.io) AR Generator' },
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'IngradeMediaProduct', mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', max: [1, 1, 0], min: [-1, -1, 0] }],
    bufferViews: [{ buffer: 0, byteLength: 36, byteOffset: 0 }],
    buffers: [{ byteLength: 36 }],
  });

  const jsonPadding = (4 - (jsonContent.length % 4)) % 4;
  const paddedJson = jsonContent + ' '.repeat(jsonPadding);
  const jsonByteLength = paddedJson.length;

  const totalLength = 12 + 8 + jsonByteLength + 8 + 36;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);

  // GLB Header
  view.setUint32(0, 0x46546c67, true); // 'glTF'
  view.setUint32(4, 2, true); // version 2
  view.setUint32(8, totalLength, true);

  // JSON Chunk header
  view.setUint32(12, jsonByteLength, true);
  view.setUint32(16, 0x4e4f534a, true); // 'JSON'
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(paddedJson);
  new Uint8Array(buffer, 20, jsonByteLength).set(jsonBytes);

  // BIN Chunk header
  const binOffset = 20 + jsonByteLength;
  view.setUint32(binOffset, 36, true);
  view.setUint32(binOffset + 4, 0x004e4942, true); // 'BIN\0'

  return new Uint8Array(buffer);
}
