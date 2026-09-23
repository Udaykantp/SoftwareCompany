import React, { useRef } from 'react';
import { STANDALONE_MARKER_PATT } from '../utils/arjsCodeTemplates';
import { sounds } from '../utils/audio';

interface MarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkerModal: React.FC<MarkerModalProps> = ({ isOpen, onClose }) => {
  const markerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  // Download high-res PNG of Hiro Marker
  const handleDownloadPNG = () => {
    sounds.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White padding
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 600);

    // Black outer border (AR.js Hiro specification)
    ctx.fillStyle = '#000000';
    ctx.fillRect(50, 50, 500, 500);

    // White inner box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(150, 150, 300, 300);

    // HIRO glyph pattern
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 80px -apple-system, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HIRO', 300, 300);

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillText('AR.js Standard Hiro Tracking Marker · Made for Ingrade Media (ingrade.io)', 300, 575);

    const link = document.createElement('a');
    link.download = 'marker.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Download marker.patt
  const handleDownloadPatt = () => {
    sounds.playClick();
    const blob = new Blob([STANDALONE_MARKER_PATT], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'marker.patt';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Trigger print dialog
  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-100">Ingrade Media AR Marker Kit</h2>
              <a
                href="https://ingrade.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 px-1.5 py-0.5 rounded transition-colors"
              >
                ingrade.io
              </a>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Point your camera at this marker to position Ingrade Media 3D products in real space.
            </p>
          </div>
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

        {/* Marker Display (Printable & Scan-ready) */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="p-4 bg-white rounded-xl shadow-inner border border-neutral-300">
            {/* Standard Hiro Marker Pattern Box */}
            <div className="w-56 h-56 bg-black p-8 flex items-center justify-center">
              <div className="w-full h-full bg-white flex flex-col items-center justify-center">
                <span className="text-black font-mono font-black text-3xl tracking-widest">HIRO</span>
                <span className="text-[10px] text-neutral-600 font-mono tracking-wider mt-1">PATTERN</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-3 text-center max-w-xs">
            Keep the thick black border fully visible to the camera for optimal tracking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-neutral-800">
          <button
            onClick={handleDownloadPNG}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>marker.png</span>
          </button>

          <button
            onClick={handleDownloadPatt}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>marker.patt</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
