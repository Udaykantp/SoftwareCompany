import React from 'react';
import { ProductSpec } from '../types';
import { sounds } from '../utils/audio';

interface SpecsDrawerProps {
  product: ProductSpec;
  isOpen: boolean;
  onClose: () => void;
  onSelectPart: (partId: string) => void;
}

export const SpecsDrawer: React.FC<SpecsDrawerProps> = ({
  product,
  isOpen,
  onClose,
  onSelectPart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div>
          <h3 className="font-display font-semibold text-neutral-100 text-sm">{product.name}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{product.category}</p>
        </div>
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
        >
          ✕
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Unboxed Metadata Overview */}
        <div className="space-y-2">
          <div className="text-xl font-bold font-display text-white">{product.price}</div>
          <p className="text-xs text-neutral-300 leading-relaxed">{product.tagline}</p>

          <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
            <span>{product.material}</span>
            <span aria-hidden="true">·</span>
            <span>{product.ipRating}</span>
          </div>
        </div>

        {/* Physical Dimensions & Mass (Tabular figures) */}
        <div className="border-t border-neutral-800/80 pt-4">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">Dimensions & Weight</h4>
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <div className="text-neutral-500 text-[10px]">Length × Width</div>
              <div className="text-neutral-200 mt-0.5 tabular-nums">
                {product.dimensionsMm.length} × {product.dimensionsMm.width} mm
              </div>
            </div>
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <div className="text-neutral-500 text-[10px]">Height (Depth)</div>
              <div className="text-neutral-200 mt-0.5 tabular-nums">{product.dimensionsMm.height} mm</div>
            </div>
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 col-span-2 flex items-center justify-between">
              <span className="text-neutral-500 text-[10px]">Net Mass</span>
              <span className="text-cyan-400 font-semibold tabular-nums">{product.weightGrams} grams</span>
            </div>
          </div>
        </div>

        {/* Mechanical Parts Breakdown */}
        <div className="border-t border-neutral-800/80 pt-4">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">
            Exploded Sub-Assemblies ({product.parts.length})
          </h4>
          <div className="space-y-2">
            {product.parts.map((part) => (
              <div
                key={part.id}
                onClick={() => {
                  onSelectPart(part.id);
                  sounds.playClick();
                }}
                className="p-3 bg-neutral-900/40 hover:bg-neutral-850 hover:border-cyan-500/30 border border-neutral-800/70 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-200 group-hover:text-cyan-300 transition-colors">
                    {part.name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">Inspect →</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{part.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Engineering Specifications */}
        <div className="border-t border-neutral-800/80 pt-4 pb-2">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">Technical Specifications</h4>
          <div className="divide-y divide-neutral-800 text-xs">
            {product.specs.map((spec, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <span className="text-neutral-400">{spec.label}</span>
                <span className="font-mono text-neutral-200 font-medium text-right tabular-nums">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ingrade Media Brand Attribution */}
        <div className="border-t border-neutral-800/80 pt-4 pb-4">
          <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-900 to-cyan-950/40 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Made for Ingrade Media</span>
              <a
                href="https://ingrade.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>ingrade.io</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Interactive 3D product visualization, exploded CAD sub-assemblies, and browser-native WebAR powered by AR.js.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
