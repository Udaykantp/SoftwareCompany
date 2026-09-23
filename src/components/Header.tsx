import React from 'react';
import { sounds } from '../utils/audio';
import { IGMLogo } from './IGMLogo';

export type ActiveTab = 'studio' | 'camera' | 'simulator';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenMarkerModal: () => void;
  onOpenCodeViewer: () => void;
  onOpenSpecs: () => void;
  onOpenCardModal: (tab?: 'card' | 'leads' | 'scanner') => void;
  onOpenContactForm?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenMarkerModal,
  onOpenCodeViewer,
  onOpenSpecs,
  onOpenCardModal,
  onOpenContactForm,
}) => {
  return (
    <header className="h-16 px-6 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
      {/* Zone 1: Brand mark */}
      <div className="flex items-center gap-3">
        <a
          href="https://ingrade.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group"
          title="Ingrade Media — ingrade.io"
        >
          <IGMLogo variant="badge" className="w-12 sm:w-14" glow={true} />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white font-display group-hover:text-[#b8ff00] transition-colors whitespace-nowrap leading-tight">
              Ingrade Media
            </span>
            <span className="text-[10px] font-mono text-[#b8ff00] group-hover:underline transition-colors">
              ingrade.io
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: 4 clean navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          onClick={() => {
            onTabChange('studio');
            sounds.playClick();
          }}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
            activeTab === 'studio' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400' : ''
          }`}
        >
          3D Studio
        </button>

        <button
          onClick={() => {
            onTabChange('camera');
            sounds.playClick();
          }}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
            activeTab === 'camera' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400' : ''
          }`}
        >
          WebAR Camera
        </button>

        <button
          onClick={() => {
            onTabChange('simulator');
            sounds.playClick();
          }}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 ${
            activeTab === 'simulator' ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400' : ''
          }`}
        >
          AR Simulator
        </button>

        <button
          onClick={() => {
            onOpenCodeViewer();
            sounds.playClick();
          }}
          className="hover:text-white transition-colors whitespace-nowrap py-1 flex items-center gap-1.5"
        >
          <span>AR.js Code</span>
        </button>

        <button
          onClick={() => {
            onOpenSpecs();
            sounds.playClick();
          }}
          className="hover:text-white transition-colors whitespace-nowrap py-1"
        >
          Specifications
        </button>

        <button
          onClick={() => {
            onOpenCardModal('leads');
            sounds.playClick();
          }}
          className="hover:text-white text-emerald-400 font-medium transition-colors whitespace-nowrap py-1 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Meeting Leads</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (onOpenContactForm) {
              onOpenContactForm();
            } else {
              onOpenCardModal('card');
            }
            sounds.playClick();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-gradient-to-r from-[#00D9FF] via-[#1687FF] to-[#00D9FF] hover:brightness-110 active:scale-95 rounded-lg transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap cursor-pointer"
          title="Exchange Details & Executive Visiting Card for ingrade.io"
        >
          <span className="text-xs">🤝</span>
          <span>Contact Uday</span>
        </button>

        <button
          onClick={() => {
            onOpenCardModal('card');
            sounds.playClick();
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-[#00d9ff]/35 hover:border-[#00d9ff] active:scale-95 rounded-lg transition-all shadow-sm whitespace-nowrap"
          title="Meeting Founder Card & Lead Capture QR for ingrade.io"
        >
          <span className="text-xs">👑</span>
          <span>Founder Card</span>
        </button>

        <button
          onClick={() => {
            onOpenCardModal('scanner');
            sounds.playClick();
          }}
          className="p-1.5 text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          title="Open Camera QR / Card Scanner"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 8V4h4" />
            <path d="M20 8V4h-4" />
            <path d="M4 16v4h4" />
            <path d="M20 16v4h-4" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <button
          onClick={() => {
            onOpenMarkerModal();
            sounds.playClick();
          }}
          className="hidden sm:block px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
        >
          Marker Kit
        </button>

        <button
          onClick={() => {
            if (activeTab === 'camera') {
              onTabChange('studio');
            } else {
              onTabChange('camera');
            }
            sounds.playClick();
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded-lg transition-all whitespace-nowrap shadow-sm"
        >
          {activeTab === 'camera' ? 'Studio' : 'Launch AR'}
        </button>
      </div>
    </header>
  );
};
