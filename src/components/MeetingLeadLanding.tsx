import React, { useState } from 'react';
import { saveLead } from '../types/leads';
import { sounds } from '../utils/audio';
import { IGMLogo } from './IGMLogo';

interface MeetingLeadLandingProps {
  onClose?: () => void;
  onExploreDemo?: () => void;
}

export const MeetingLeadLanding: React.FC<MeetingLeadLandingProps> = ({
  onClose,
  onExploreDemo,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [savedLeadPhone, setSavedLeadPhone] = useState('');

  const founder = {
    name: 'Uday Kant',
    title: 'Founder & CEO',
    company: 'Ingrade Media',
    phone: '+91 62998 06186',
    rawPhone: '916299806186',
    email: 'udaykantp9199@gmail.com',
    website: 'https://ingrade.io',
    tagline: 'Next-Gen WebAR, 3D Interactive Media & Spatial Product Visualizers',
  };

  const handleDownloadVCard = () => {
    sounds.playClick();
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${founder.name}`,
      `ORG:${founder.company}`,
      `TITLE:${founder.title}`,
      `EMAIL;TYPE=WORK,INTERNET:${founder.email}`,
      `TEL;TYPE=CELL,VOICE:${founder.phone}`,
      `URL:${founder.website}`,
      `NOTE:Founder & CEO at Ingrade Media (ingrade.io). High-fidelity WebAR & 3D Spatial Products.`,
      'END:VCARD',
    ].join('\r\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Uday_Kant_Founder_Ingrade_Media.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    saveLead({
      name: formData.name.trim(),
      company: formData.company.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      notes: formData.notes.trim() || 'Met with Uday Kant (Founder, Ingrade Media)',
      source: 'guest_submission',
    });

    sounds.playMarkerLock();
    setSavedLeadPhone(formData.phone);
    setSubmitted(true);
  };

  const whatsAppUrl = `https://wa.me/${founder.rawPhone}?text=${encodeURIComponent(
    `Hi Uday! I scanned your Ingrade Media visiting card.\n\nMy Details:\n• Name: ${formData.name || 'Partner'}\n• Company: ${formData.company || 'N/A'}\n• Phone: ${formData.phone || 'N/A'}\n\nLooking forward to connecting regarding Ingrade Media WebAR & 3D!`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Glow & Close */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400"></div>

        {onClose && (
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Executive Header Card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-cyan-950/40 border border-cyan-500/30 shadow-xl overflow-hidden">
            {/* Background luxury shimmer */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

            {/* Official Company Logo Bar */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <IGMLogo variant="badge" className="w-14" glow={true} />
                <div>
                  <div className="text-xs font-bold text-white tracking-wide uppercase">Ingrade Media</div>
                  <div className="text-[10px] font-mono text-[#b8ff00]">ingrade.io</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                Verified Executive
              </span>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-cyan-300 font-extrabold text-xl font-display">
                    UK
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                      {founder.name}
                    </h2>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/40 text-[10px] font-bold text-amber-300 tracking-wider">
                      👑 FOUNDER
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 mt-0.5">
                    Founder & CEO · {founder.company}
                  </div>
                  <a
                    href={founder.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono text-cyan-300/90 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <span>ingrade.io</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 mt-4 leading-relaxed">
              {founder.tagline}
            </p>

            {/* Quick 1-Tap Founder Actions */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <button
                onClick={handleDownloadVCard}
                className="py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all flex flex-col items-center justify-center gap-1 text-center"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save Contact</span>
              </button>

              <a
                href={`https://wa.me/${founder.rawPhone}?text=Hi%20Uday,%20pleasure%20meeting%20you%20at%20our%20discussion!`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sounds.playClick()}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex flex-col items-center justify-center gap-1 text-center"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${founder.phone.replace(/\s+/g, '')}`}
                onClick={() => sounds.playClick()}
                className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-all flex flex-col items-center justify-center gap-1 text-center"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Direct Call</span>
              </a>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-4 mt-4 border-t border-neutral-800/80 font-mono">
              <span>📞 {founder.phone}</span>
              <span>✉️ {founder.email}</span>
            </div>
          </div>

          {/* Lead Exchange Form / Saved Confirmation */}
          {!submitted ? (
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                <h3 className="text-sm font-semibold text-white">
                  🤝 Exchange Your Details With Uday
                </h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Drop your contact below so Uday can save your details and follow up after the meeting.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      Your Name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      Phone / WhatsApp <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    Meeting Context / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discussing WebAR 3D catalog for our e-commerce brand"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 via-cyan-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Share My Contact With Uday</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 space-y-4 text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Details Saved Successfully!</h4>
                <p className="text-xs text-emerald-300/90 mt-1">
                  Your contact ({formData.name || savedLeadPhone}) has been captured for Uday Kant.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sounds.playClick()}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>Ping Uday on WhatsApp Now (+91 62998 06186)</span>
                </a>

                {onExploreDemo && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onExploreDemo();
                    }}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-colors"
                  >
                    View Ingrade 3D WebAR Interactive Demo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* About Ingrade Media */}
          <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">About Ingrade Media</span>
              <a
                href="https://ingrade.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 font-mono hover:underline"
              >
                https://ingrade.io
              </a>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Ingrade Media engineers high-performance browser-native WebAR experiences, 3D interactive product showcases, and exploded CAD engineering views for modern brands and manufacturers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
