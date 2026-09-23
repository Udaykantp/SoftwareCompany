import React, { useState } from 'react';
import { PRODUCTS, COLORWAYS } from './data/products';
import { ColorwayId, DisplayMode, LightingPreset, ProductId } from './types';
import { StudioScene } from './3d/StudioScene';
import { WebARCamera } from './components/WebARCamera';
import { ARSimulator } from './components/ARSimulator';
import { Header, ActiveTab } from './components/Header';
import { MarkerModal } from './components/MarkerModal';
import { ARCodeViewer } from './components/ARCodeViewer';
import { SpecsDrawer } from './components/SpecsDrawer';
import { DigitalVisitingCardModal } from './components/DigitalVisitingCardModal';
import { MeetingLeadLanding } from './components/MeetingLeadLanding';
import { sounds } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [selectedProductId, setSelectedProductId] = useState<ProductId>('watch');
  const [selectedColorwayId, setSelectedColorwayId] = useState<ColorwayId>('titanium');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('shaded');
  const [lighting, setLighting] = useState<LightingPreset>('studio');
  const [explodeProgress, setExplodeProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Modals & Panels
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardModalTab, setCardModalTab] = useState<'card' | 'leads' | 'scanner'>('card');
  const [isLeadLandingOpen, setIsLeadLandingOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('connect') === 'founder' || params.has('card');
    }
    return false;
  });
  const [isMuted, setIsMuted] = useState(false);

  const currentProduct = PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];
  const currentColorway = COLORWAYS.find((c) => c.id === selectedColorwayId) || COLORWAYS[0];

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Top Bar adhering to Section 2 Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMarkerModal={() => setIsMarkerModalOpen(true)}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        onOpenCardModal={(tab) => {
          setCardModalTab(tab || 'card');
          setIsCardModalOpen(true);
        }}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* VIEWPORT AREA */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'studio' && (
            <StudioScene
              product={currentProduct}
              colorway={currentColorway}
              displayMode={displayMode}
              lighting={lighting}
              explodeProgress={explodeProgress}
              autoRotate={autoRotate}
              onExplodeChange={setExplodeProgress}
              onPartSelect={() => setIsSpecsOpen(true)}
            />
          )}

          {activeTab === 'camera' && (
            <WebARCamera
              product={currentProduct}
              colorway={currentColorway}
              onOpenMarkerModal={() => setIsMarkerModalOpen(true)}
              onCloseAR={() => setActiveTab('studio')}
            />
          )}

          {activeTab === 'simulator' && (
            <ARSimulator
              product={currentProduct}
              colorway={currentColorway}
              onOpenMarkerModal={() => setIsMarkerModalOpen(true)}
              onLaunchLiveAR={() => setActiveTab('camera')}
            />
          )}
        </div>

        {/* BOTTOM STUDIO TOOLBAR (Visible in 3D Studio Mode) */}
        {activeTab === 'studio' && (
          <aside className="border-t border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0">
            {/* Product Switcher Segmented Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
              {PRODUCTS.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedProductId(prod.id);
                    setExplodeProgress(0);
                    sounds.playClick();
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    selectedProductId === prod.id
                      ? 'bg-neutral-800 text-cyan-300 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {prod.name.split(' ')[0]} {prod.name.split(' ')[1]}
                </button>
              ))}
            </div>

            {/* Material & Finish Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider hidden sm:inline">
                Finish:
              </span>
              <div className="flex items-center gap-1.5">
                {COLORWAYS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedColorwayId(c.id);
                      sounds.playClick();
                    }}
                    title={c.name}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      selectedColorwayId === c.id ? 'border-cyan-400 scale-110 shadow-sm' : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Display Modes (Shaded, Wireframe, X-Ray, Blueprint) */}
            <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
              {(['shaded', 'wireframe', 'xray', 'blueprint'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setDisplayMode(mode);
                    sounds.playClick();
                  }}
                  className={`capitalize px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    displayMode === mode ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Studio Lighting Presets */}
            <div className="hidden xl:flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
              <span className="text-[11px] text-neutral-500 px-2">Light:</span>
              {(['studio', 'cyber', 'daylight', 'monochrome'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLighting(l);
                    sounds.playClick();
                  }}
                  className={`capitalize px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    lighting === l ? 'bg-neutral-800 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Utility Toggles (Turntable & Sound) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCardModalTab('card');
                  setIsCardModalOpen(true);
                  sounds.playClick();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-cyan-800/50 hover:border-cyan-500/80 text-[11px] text-neutral-300 hover:text-white transition-all shadow-sm group"
                title="Open Ingrade Media Digital Visiting Card & Meeting QR"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform animate-pulse"></span>
                <span>Meeting Card: <strong className="font-semibold text-cyan-300">ingrade.io</strong></span>
              </button>

              <button
                onClick={() => {
                  setAutoRotate(!autoRotate);
                  sounds.playClick();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  autoRotate
                    ? 'bg-neutral-900 border-cyan-500/50 text-cyan-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title="Toggle Turntable Rotation"
              >
                Turntable: {autoRotate ? 'On' : 'Off'}
              </button>

              <button
                onClick={handleToggleMute}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* MODALS AND DRAWERS */}
      <DigitalVisitingCardModal
        isOpen={isCardModalOpen}
        defaultTab={cardModalTab}
        onClose={() => setIsCardModalOpen(false)}
        onOpenLeadLanding={() => setIsLeadLandingOpen(true)}
      />
      {isLeadLandingOpen && (
        <MeetingLeadLanding
          onClose={() => setIsLeadLandingOpen(false)}
          onExploreDemo={() => setIsLeadLandingOpen(false)}
        />
      )}
      <MarkerModal isOpen={isMarkerModalOpen} onClose={() => setIsMarkerModalOpen(false)} />
      <ARCodeViewer isOpen={isCodeViewerOpen} onClose={() => setIsCodeViewerOpen(false)} />
      <SpecsDrawer
        product={currentProduct}
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
        onSelectPart={(_partId) => {
          setExplodeProgress(0.8);
        }}
      />
    </div>
  );
}
