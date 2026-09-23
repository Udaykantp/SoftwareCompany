import React, { useState } from 'react';
import {
  STANDALONE_INDEX_HTML,
  STANDALONE_STYLE_CSS,
  STANDALONE_APP_JS,
  STANDALONE_MARKER_PATT,
  downloadARJsZip,
} from '../utils/arjsCodeTemplates';
import { sounds } from '../utils/audio';

interface ARCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

type FileKey = 'index.html' | 'style.css' | 'app.js' | 'marker.patt' | 'product.glb';

export const ARCodeViewer: React.FC<ARCodeViewerProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<FileKey>('index.html');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const getFileContent = (file: FileKey): string => {
    switch (file) {
      case 'index.html':
        return STANDALONE_INDEX_HTML;
      case 'style.css':
        return STANDALONE_STYLE_CSS;
      case 'app.js':
        return STANDALONE_APP_JS;
      case 'marker.patt':
        return STANDALONE_MARKER_PATT;
      case 'product.glb':
        return `// Binary glTF (GLB) 3D Model Asset
// Header: 0x46546C67 (glTF version 2.0)
// Mesh: 3D Product Geometry & PBR Materials
// Size: ~140 KB
// You can replace this with your CAD export or 3D model.`;
    }
  };

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(getFileContent(selectedFile));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = async () => {
    sounds.playClick();
    setIsDownloading(true);
    try {
      await downloadARJsZip();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[85vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-neutral-100 text-sm">Standalone AR.js Project Explorer</span>
            <span className="text-neutral-600">·</span>
            <a
              href="https://ingrade.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ingrade.io
            </a>
            <span className="text-neutral-600">·</span>
            <span className="font-mono text-xs text-neutral-400">arjs-product-demo/</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{isDownloading ? 'Generating ZIP...' : 'Export .ZIP Bundle'}</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Main Content: Sidebar Tree + Code Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* File Tree Sidebar */}
          <aside className="w-64 border-r border-neutral-800/80 bg-neutral-900/30 p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mb-2">Project Structure</div>
              <div className="space-y-1 font-mono text-xs">
                <div className="text-neutral-400 font-semibold px-2 py-1 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>arjs-product-demo/</span>
                </div>

                <div className="pl-4 space-y-1">
                  <button
                    onClick={() => {
                      setSelectedFile('index.html');
                      sounds.playClick();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition-colors ${
                      selectedFile === 'index.html' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <span className="text-orange-400">&lt;&gt;</span>
                    <span>index.html</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedFile('style.css');
                      sounds.playClick();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition-colors ${
                      selectedFile === 'style.css' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <span className="text-blue-400">#</span>
                    <span>style.css</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedFile('app.js');
                      sounds.playClick();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center gap-2 transition-colors ${
                      selectedFile === 'app.js' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <span className="text-yellow-400">JS</span>
                    <span>app.js</span>
                  </button>

                  <div className="text-neutral-500 px-2.5 py-1 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>assets/</span>
                  </div>

                  <div className="pl-4 space-y-1">
                    <button
                      onClick={() => {
                        setSelectedFile('product.glb');
                        sounds.playClick();
                      }}
                      className={`w-full text-left px-2.5 py-1 rounded flex items-center gap-2 transition-colors ${
                        selectedFile === 'product.glb' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="text-purple-400">3D</span>
                      <span>product.glb</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedFile('marker.patt');
                        sounds.playClick();
                      }}
                      className={`w-full text-left px-2.5 py-1 rounded flex items-center gap-2 transition-colors ${
                        selectedFile === 'marker.patt' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-neutral-400 hover:bg-neutral-800/60'
                      }`}
                    >
                      <span className="text-emerald-400">AR</span>
                      <span>marker.patt</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick deployment guide */}
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1.5">
              <div className="font-semibold text-neutral-200">How to Run Locally:</div>
              <p className="font-mono text-[10px] text-neutral-400 bg-neutral-950 p-1.5 rounded">
                npx serve arjs-product-demo
              </p>
              <p className="text-[10px] text-neutral-500">
                HTTPS required on mobile for camera permissions.
              </p>
            </div>
          </aside>

          {/* Code Viewer Panel */}
          <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
            {/* Top file tab bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/40 border-b border-neutral-800">
              <span className="font-mono text-xs text-neutral-300">{selectedFile}</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-xs transition-colors flex items-center gap-1.5"
              >
                <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code text content */}
            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-neutral-300 leading-relaxed selection:bg-cyan-500/30">
              <pre className="whitespace-pre-wrap">{getFileContent(selectedFile)}</pre>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
