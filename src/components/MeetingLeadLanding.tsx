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
    website: '',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const founder = {
    name: 'Uday Kant',
    initials: 'UK',
    title: 'Founder & CEO',
    company: 'Ingrade Media',
    phone: '+91 62998 06186',
    rawPhone: '916299806186',
    email: 'udaykantp9199@gmail.com',
    website: 'https://ingrade.io',
    tagline: 'Next-Gen WebAR, 3D Interactive Media & Spatial Product Visualizers',
  };

  // User requirement: "es form ko submit kare ya cut kare ingrade.io website open ho jaye"
  const handleRedirectToWebsite = () => {
    sounds.playClick();
    if (onClose) onClose();
    window.open('https://ingrade.io', '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    handleRedirectToWebsite();
  };

  // RFC-Compliant vCard 3.0 Download
  const handleDownloadVCard = () => {
    sounds.playClick();
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Kant;Uday;;;',
      `FN:${founder.name}`,
      `ORG:${founder.company}`,
      `TITLE:${founder.title}`,
      `EMAIL;TYPE=INTERNET;TYPE=WORK;TYPE=PREF:${founder.email}`,
      `TEL;TYPE=CELL;TYPE=VOICE;TYPE=PREF:${founder.phone}`,
      `URL;TYPE=WORK:${founder.website}`,
      'ADR;TYPE=WORK:;;Global / Enterprise;;;;',
      `NOTE:Founder & CEO at Ingrade Media (ingrade.io). Next-Gen WebAR, 3D Interactive Media & Spatial Product Visualizers.`,
      `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${founder.rawPhone}`,
      `REV:${new Date().toISOString()}`,
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

    setIsSubmitting(true);
    sounds.playMarkerLock();

    // Store in CRM
    saveLead({
      name: formData.name.trim(),
      company: formData.company.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      notes: [
        formData.website ? `Website/LinkedIn: ${formData.website.trim()}` : null,
        formData.notes ? `Discussion: ${formData.notes.trim()}` : null,
        'Direct connection with Uday Kant (Founder, Ingrade Media)',
      ]
        .filter(Boolean)
        .join(' | '),
      source: 'guest_submission',
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);

      // Start countdown to open ingrade.io automatically
      setRedirectCountdown(3);
      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        setRedirectCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          window.open('https://ingrade.io', '_blank', 'noopener,noreferrer');
        }
      }, 1000);
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto"
      style={{
        backgroundColor: '#02070D',
        backgroundImage: `
          radial-gradient(circle at 18% 12%, rgba(0, 217, 255, 0.16) 0%, transparent 45%),
          radial-gradient(circle at 85% 25%, rgba(22, 135, 255, 0.18) 0%, transparent 42%),
          radial-gradient(circle at 50% 88%, rgba(0, 185, 104, 0.10) 0%, transparent 45%),
          linear-gradient(180deg, #02070D 0%, #06121C 50%, #071923 100%)
        `,
      }}
    >
      {/* Subtle abstract curved light streak effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden opacity-35"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-cyan-400/20 blur-sm" />
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full border border-blue-500/20 blur-md" />
        <div className="absolute -bottom-36 left-1/3 w-[32rem] h-[32rem] rounded-full border border-cyan-300/15 blur-sm" />
      </div>

      {/* Large Centered Glassmorphism Container */}
      <div className="relative w-[94%] max-w-[900px] my-auto rounded-[24px] sm:rounded-[30px] bg-[rgba(5,15,22,0.85)] backdrop-blur-2xl border border-[rgba(0,217,255,0.35)] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.95),0_0_50px_rgba(0,217,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.16)] overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Subtle top edge gradient streak */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent opacity-80 shrink-0" />

        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7 md:px-10 md:py-8 space-y-5 sm:space-y-6">

          {/* ================================================== */}
          {/* TOP BRAND SECTION                                  */}
          {/* ================================================== */}
          <header className="flex items-center justify-between gap-3">
            {/* LEFT: Ingrade Media Logo & Domain */}
            <div className="flex items-center gap-3">
              <a
                href="https://ingrade.io"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#040e18]/90 border border-[#00D9FF]/40 shadow-[0_0_15px_rgba(0,217,255,0.25)] flex items-center justify-center shrink-0 p-1.5 hover:border-[#00D9FF] transition-all group"
                title="Visit ingrade.io"
              >
                <IGMLogo variant="badge" className="w-full h-full" glow={true} />
              </a>

              <div className="flex flex-col">
                <span className="font-display font-extrabold text-white text-sm sm:text-base tracking-wider uppercase leading-tight">
                  INGRADE <span className="text-white/90">MEDIA</span>
                </span>
                <a
                  href="https://ingrade.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-bold text-[#00D9FF] hover:text-[#b8ff00] transition-colors tracking-tight flex items-center gap-1"
                >
                  <span>ingrade.io</span>
                </a>
              </div>
            </div>

            {/* RIGHT: Verified Executive Pill + Circular Close Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#031322]/80 border border-[#00D9FF]/45 text-[#00D9FF] text-[11px] sm:text-xs font-semibold tracking-wide backdrop-blur-md shadow-[0_0_12px_rgba(0,217,255,0.18)]">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00D9FF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="whitespace-nowrap">Verified Executive</span>
              </div>

              {/* Close Button: opens ingrade.io */}
              <button
                onClick={handleClose}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-[#00D9FF]/40 hover:border-[#00D9FF] text-neutral-300 hover:text-white flex items-center justify-center transition-all shadow-[0_0_10px_rgba(0,217,255,0.15)] active:scale-95 text-base sm:text-lg"
                title="Close and Open ingrade.io"
                aria-label="Close form and visit ingrade.io"
              >
                ✕
              </button>
            </div>
          </header>

          {/* ================================================== */}
          {/* PROFILE SECTION                                    */}
          {/* ================================================== */}
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 pt-1">
            {/* Avatar: UK */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#07192b] via-[#040e1a] to-[#02070d] border border-[#00D9FF]/60 shadow-[0_0_20px_rgba(0,217,255,0.28)] flex items-center justify-center shrink-0 p-[2px]">
              <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-[#030d18] flex items-center justify-center font-display font-extrabold text-white text-xl sm:text-2xl tracking-tight shadow-inner">
                {founder.initials}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display font-black text-white text-xl sm:text-2xl md:text-3xl tracking-tight">
                  {founder.name}
                </h1>
                
                {/* 👑 FOUNDER & CEO Gold Pill */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#181203]/90 border border-[#FFC400]/70 text-[#FFC400] text-[10px] sm:text-[11px] font-bold tracking-wider shadow-[0_0_12px_rgba(255,196,0,0.25)]">
                  <span>👑</span>
                  <span>FOUNDER &amp; CEO</span>
                </div>
              </div>

              {/* Title & Organization */}
              <div className="text-xs sm:text-sm font-semibold text-[#00D9FF] mt-0.5 tracking-wide">
                Founder &amp; CEO · Ingrade Media
              </div>

              {/* Ingrade Link */}
              <a
                href={founder.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-medium text-[#00D9FF]/90 hover:text-white transition-colors mt-0.5"
              >
                <span>ingrade.io</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          {/* ================================================== */}
          {/* DESCRIPTION                                        */}
          {/* ================================================== */}
          <p className="text-sm sm:text-[15px] md:text-base text-neutral-200/90 font-normal leading-snug sm:leading-relaxed max-w-2xl">
            {founder.tagline}
          </p>

          {/* ================================================== */}
          {/* ACTION BUTTONS (3 EQUAL-WIDTH BUTTONS)             */}
          {/* ================================================== */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-1">
            {/* BUTTON 1: Save Contact */}
            <button
              onClick={handleDownloadVCard}
              className="group py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#00D9FF] via-[#1687FF] to-[#00D9FF] hover:brightness-115 text-neutral-950 font-bold text-xs sm:text-sm tracking-tight flex flex-col items-center justify-center gap-1 shadow-[0_0_22px_rgba(0,217,255,0.4)] transition-all active:scale-95 cursor-pointer"
              title="Save Uday Kant (.vcf) directly to phone contacts"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-y-0.5 transition-transform"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="leading-tight text-center">Save Contact</span>
            </button>

            {/* BUTTON 2: WhatsApp */}
            <a
              href={`https://wa.me/${founder.rawPhone}?text=Hi%20Uday,%20pleasure%20meeting%20you!`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playClick()}
              className="group py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#00B968] to-[#059669] hover:brightness-110 text-white font-bold text-xs sm:text-sm tracking-tight flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(0,185,104,0.35)] transition-all active:scale-95 text-center cursor-pointer"
              title="Chat with Uday on WhatsApp"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="leading-tight">WhatsApp</span>
            </a>

            {/* BUTTON 3: Direct Call */}
            <a
              href={`tel:${founder.phone.replace(/\s+/g, '')}`}
              onClick={() => sounds.playClick()}
              className="group py-3 sm:py-3.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl bg-[#040e1b]/85 hover:bg-[#08182b] text-white font-bold text-xs sm:text-sm tracking-tight flex flex-col items-center justify-center gap-1 border border-[#00D9FF]/40 hover:border-[#00D9FF] shadow-[0_0_15px_rgba(0,217,255,0.14)] transition-all active:scale-95 text-center cursor-pointer"
              title="Call Uday Kant directly"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00D9FF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="leading-tight">Direct Call</span>
            </a>
          </div>

          {/* ================================================== */}
          {/* CONTACT INFORMATION BAR                            */}
          {/* ================================================== */}
          <div className="rounded-2xl bg-[#030d17]/80 backdrop-blur-xl border border-[rgba(0,217,255,0.25)] p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
            {/* Phone */}
            <a
              href={`tel:${founder.phone.replace(/\s+/g, '')}`}
              className="flex items-center gap-3 hover:text-white transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-[#051829] border border-[#00D9FF]/45 flex items-center justify-center text-[#00D9FF] shrink-0 shadow-[0_0_12px_rgba(0,217,255,0.2)] group-hover:border-[#00D9FF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Direct Phone</div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-white tracking-tight">
                  +91 62998 06186
                </div>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${founder.email}`}
              className="flex items-center gap-3 hover:text-white transition-colors group sm:border-l sm:border-white/10 sm:pl-4"
            >
              <div className="w-9 h-9 rounded-full bg-[#051829] border border-[#00D9FF]/45 flex items-center justify-center text-[#00D9FF] shrink-0 shadow-[0_0_12px_rgba(0,217,255,0.2)] group-hover:border-[#00D9FF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="min-w-0 truncate">
                <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">Founder Email</div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-white tracking-tight truncate">
                  udaykantp9199@gmail.com
                </div>
              </div>
            </a>
          </div>

          {/* ================================================== */}
          {/* CONTACT EXCHANGE FORM CARD                         */}
          {/* ================================================== */}
          <div className="rounded-2xl sm:rounded-[24px] bg-[#030d18]/85 backdrop-blur-2xl border border-[rgba(0,217,255,0.32)] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(0,217,255,0.12)] p-4 sm:p-6 md:p-7 space-y-4">
            
            {/* Header: 🤝 Exchange Your Details With Uday */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#051a2e] border border-[#00D9FF]/50 flex items-center justify-center text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.25)] shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="font-display font-bold text-white text-base sm:text-lg md:text-xl tracking-tight">
                  Exchange Your Details With <span className="text-[#00D9FF]">Uday</span>
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-neutral-300/80 leading-relaxed pl-0 sm:pl-13">
                Drop your contact below so Uday can save your details and follow up after the meeting.
              </p>
            </div>

            {/* FORM or SUCCESS STATE */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
                {/* Field 1: Your Name * */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2.4">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Your Name</span>
                    <span className="text-[#00D9FF]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#020912]/80 border border-[#00D9FF]/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 shadow-inner focus:outline-none focus:border-[#00D9FF] focus:shadow-[0_0_15px_rgba(0,217,255,0.25)] transition-all"
                  />
                </div>

                {/* Field 2: Company / Organization */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2.4">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 3v18" />
                      <path d="M15 3v18" />
                      <path d="M3 9h18" />
                      <path d="M3 15h18" />
                    </svg>
                    <span>Company / Organization</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#020912]/80 border border-[#00D9FF]/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 shadow-inner focus:outline-none focus:border-[#00D9FF] focus:shadow-[0_0_15px_rgba(0,217,255,0.25)] transition-all"
                  />
                </div>

                {/* Field 3: Phone / WhatsApp * */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2.4">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Phone / WhatsApp</span>
                    <span className="text-[#00D9FF]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#020912]/80 border border-[#00D9FF]/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 font-mono shadow-inner focus:outline-none focus:border-[#00D9FF] focus:shadow-[0_0_15px_rgba(0,217,255,0.25)] transition-all"
                  />
                </div>

                {/* Additional Optional Field: Email & Discussion Note (grid on desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>Email (Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. client@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#020912]/80 border border-[#00D9FF]/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 shadow-inner focus:outline-none focus:border-[#00D9FF] focus:shadow-[0_0_15px_rgba(0,217,255,0.25)] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>Discussion / Meeting Topic</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WebAR 3D catalog for our brand"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-[#020912]/80 border border-[#00D9FF]/30 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-neutral-500 shadow-inner focus:outline-none focus:border-[#00D9FF] focus:shadow-[0_0_15px_rgba(0,217,255,0.25)] transition-all"
                    />
                  </div>
                </div>

                {/* Large Full-Width Submit Button: ✈ Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#00D9FF] via-[#1687FF] to-[#2563EB] hover:brightness-110 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_28px_rgba(0,217,255,0.45)] transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Details...</span>
                      </span>
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <span>Submit &amp; Open ingrade.io</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-neutral-400 mt-2">
                    Submitting automatically connects you and opens{' '}
                    <span className="text-[#00D9FF] font-mono font-medium">ingrade.io</span>
                  </p>
                </div>
              </form>
            ) : (
              /* SUCCESS STATE */
              <div className="p-6 sm:p-8 rounded-2xl bg-[#041c14]/90 border border-[#00B968]/50 space-y-4 text-center animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-[#00B968]/20 border border-[#00B968]/50 flex items-center justify-center mx-auto text-[#00B968] shadow-[0_0_20px_rgba(0,185,104,0.3)]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                    ✓ Details Received
                  </h3>
                  <p className="text-sm text-neutral-300 mt-1">
                    Thanks for connecting with Uday.
                  </p>
                  <p className="text-xs text-[#00B968] font-medium mt-0.5">
                    Your details have been saved successfully.
                  </p>
                  {redirectCountdown !== null && (
                    <div className="mt-2 text-xs font-mono text-cyan-300">
                      Opening <strong className="text-white">ingrade.io</strong> in {redirectCountdown}s...
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="https://ingrade.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#1687FF] text-neutral-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Visit ingrade.io Now</span>
                    <span>↗</span>
                  </a>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white font-medium text-xs transition-colors border border-white/10"
                  >
                    Back to Profile
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* BOTTOM BRANDING: IDEAS → CODE → IMPACT             */}
          {/* ================================================== */}
          <footer className="pt-2 pb-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#00D9FF]/80 uppercase">
              <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-r from-transparent to-[#00D9FF]/40" />
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span>IDEAS</span>
                <span className="text-[#1687FF]">→</span>
                <span>CODE</span>
                <span className="text-[#1687FF]">→</span>
                <span>IMPACT</span>
              </span>
              <span className="w-6 sm:w-10 h-[1px] bg-gradient-to-l from-transparent to-[#00D9FF]/40" />
            </div>

            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <span>Ingrade Media WebAR Studio</span>
              <span>·</span>
              <a
                href="https://ingrade.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D9FF]/70 hover:text-white transition-colors"
              >
                ingrade.io
              </a>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
};
