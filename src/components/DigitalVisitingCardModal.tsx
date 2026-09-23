import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { sounds } from '../utils/audio';
import { MeetingLead, getStoredLeads, saveLead, deleteLead } from '../types/leads';
import { IGMLogo, drawIGMLogoCanvas } from './IGMLogo';

interface DigitalVisitingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'card' | 'leads' | 'scanner';
  onOpenLeadLanding?: () => void;
}

interface UserProfile {
  name: string;
  title: string;
  company: string;
  website: string;
  email: string;
  phone: string;
  rawPhone: string;
  location: string;
  about: string;
}

const FOUNDER_PROFILE: UserProfile = {
  name: 'Uday Kant',
  title: 'Founder & CEO',
  company: 'Ingrade Media',
  website: 'https://ingrade.io',
  email: 'udaykantp9199@gmail.com',
  phone: '+91 62998 06186',
  rawPhone: '916299806186',
  location: 'Global / Enterprise',
  about: 'Founder & CEO at Ingrade Media. Building next-generation WebAR, 3D interactive spatial media & e-commerce CAD visualizers.',
};

export const DigitalVisitingCardModal: React.FC<DigitalVisitingCardModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'card',
  onOpenLeadLanding,
}) => {
  const [activeMode, setActiveMode] = useState<'card' | 'leads' | 'scanner'>(defaultTab);

  // Profile State (Persistent in localStorage, default to Founder Uday Kant)
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ingrade_card_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure founder phone and title are always present if default was older
        if (!parsed.phone || parsed.phone.includes('98765')) {
          parsed.phone = FOUNDER_PROFILE.phone;
          parsed.rawPhone = FOUNDER_PROFILE.rawPhone;
          parsed.title = FOUNDER_PROFILE.title;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return FOUNDER_PROFILE;
  });

  // Leads CRM State
  const [leads, setLeads] = useState<MeetingLead[]>([]);
  const [isAddingLeadManual, setIsAddingLeadManual] = useState(false);
  const [manualLeadForm, setManualLeadForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    notes: '',
  });

  // Card Controls
  const [qrTarget, setQrTarget] = useState<'connect_page' | 'website' | 'vcard' | 'whatsapp'>('connect_page');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Refresh leads from storage
  const refreshLeads = () => {
    setLeads(getStoredLeads());
  };

  useEffect(() => {
    refreshLeads();
    const handleUpdate = () => refreshLeads();
    window.addEventListener('ingrade_leads_updated', handleUpdate);
    return () => window.removeEventListener('ingrade_leads_updated', handleUpdate);
  }, []);

  // Sync mode with defaultTab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveMode(defaultTab);
      refreshLeads();
    }
  }, [isOpen, defaultTab]);

  // Generate RFC-compliant vCard 3.0 (.vcf)
  const getVCardString = () => {
    const nameParts = profile.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Uday';
    const lastName = nameParts.slice(1).join(' ') || 'Kant';

    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${profile.name}`,
      `ORG:${profile.company}`,
      `TITLE:${profile.title}`,
      `EMAIL;TYPE=INTERNET;TYPE=WORK;TYPE=PREF:${profile.email}`,
      `TEL;TYPE=CELL;TYPE=VOICE;TYPE=PREF:${profile.phone}`,
      `URL;TYPE=WORK:${profile.website}`,
      `ADR;TYPE=WORK:;;${profile.location || 'Global / Enterprise'};;;;`,
      `NOTE:${profile.about}`,
      `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${profile.rawPhone}`,
      `REV:${new Date().toISOString()}`,
      'END:VCARD',
    ].join('\r\n');
  };

  // Dynamic URL pointing to current app location with ?connect=founder
  const getFounderConnectUrl = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('connect', 'founder');
      return url.toString();
    }
    return 'https://ingrade.io?connect=founder';
  };

  const founderConnectUrl = getFounderConnectUrl();

  // Get QR URL/payload
  const getQrPayload = () => {
    if (qrTarget === 'connect_page') {
      // Dynamic QR code pointing to current app URL with ?connect=founder query parameter
      return getFounderConnectUrl();
    }
    if (qrTarget === 'website') {
      return profile.website;
    }
    if (qrTarget === 'whatsapp') {
      const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}?text=Hi%20Uday,%20pleasure%20meeting%20you%20at%20our%20discussion!`;
    }
    return getVCardString();
  };

  // Generate QR Code with high resolution
  useEffect(() => {
    const textToEncode = getQrPayload();

    QRCode.toDataURL(textToEncode, {
      width: 480,
      margin: 1.5,
      color: {
        dark: '#030712', // Obsidian dark
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [qrTarget, profile]);

  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    try {
      localStorage.setItem('ingrade_card_profile', JSON.stringify(editForm));
    } catch {
      // ignore
    }
    setIsEditing(false);
    showNotice('Founder card profile updated!');
    sounds.playClick();
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // 1-Tap Save to Phone Contacts (.vcf file download)
  const handleDownloadVCard = () => {
    sounds.playClick();
    const vcard = getVCardString();
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = profile.name.replace(/\s+/g, '_');
    link.setAttribute('download', `${sanitizedName}_Ingrade_Media.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice(`Contact card (${sanitizedName}.vcf) saved!`);
  };

  // 1-Tap Download Dynamic QR code image
  const handleDownloadOnlyQR = () => {
    if (!qrCodeDataUrl) return;
    sounds.playClick();
    const link = document.createElement('a');
    link.download = `Ingrade_Founder_Dynamic_QR_${profile.name.replace(/\s+/g, '_')}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    showNotice('Dynamic QR Code (.png) downloaded!');
  };

  // 1-Tap Native Share (WhatsApp, AirDrop, Messages)
  const handleShare = async () => {
    sounds.playClick();
    const shareUrl = founderConnectUrl;
    const shareData = {
      title: `${profile.name} · ${profile.title}, ${profile.company}`,
      text: `${profile.name} (${profile.title}) from Ingrade Media (ingrade.io) — Next-Gen WebAR & 3D Interactive Media. Connect here:`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showNotice('Founder card link shared!');
      } catch {
        copyToClipboard(shareUrl, 'Founder meeting link (?connect=founder) copied!');
      }
    } else {
      copyToClipboard(shareUrl, 'Founder meeting link (?connect=founder) copied!');
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    showNotice(message);
    sounds.playClick();
  };

  // Download High-Resolution 16:9 Holographic Card Image (PNG) Matching Reference Exactly
  const handleDownloadCardPNG = () => {
    sounds.playClick();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675; // Exact 16:9 ratio
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Deep Midnight Navy Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
    bgGrad.addColorStop(0, '#020817');
    bgGrad.addColorStop(0.5, '#061426');
    bgGrad.addColorStop(1, '#08111f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 675);

    // 2. Ambient Deep Blue Radial Glow behind QR (Right Side)
    const qrRadial = ctx.createRadialGradient(965, 280, 20, 965, 280, 320);
    qrRadial.addColorStop(0, 'rgba(22, 135, 255, 0.22)');
    qrRadial.addColorStop(0.6, 'rgba(22, 135, 255, 0.08)');
    qrRadial.addColorStop(1, 'rgba(2, 8, 23, 0)');
    ctx.fillStyle = qrRadial;
    ctx.beginPath();
    ctx.arc(965, 280, 320, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ambient Cyan Radial Glow (Bottom Left)
    const cyanRadial = ctx.createRadialGradient(180, 600, 10, 180, 600, 260);
    cyanRadial.addColorStop(0, 'rgba(0, 217, 255, 0.18)');
    cyanRadial.addColorStop(1, 'rgba(2, 8, 23, 0)');
    ctx.fillStyle = cyanRadial;
    ctx.beginPath();
    ctx.arc(180, 600, 260, 0, Math.PI * 2);
    ctx.fill();

    // 4. Abstract Sweeping Light Arcs
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-50, 660);
    ctx.bezierCurveTo(200, 620, 420, 360, 680, 160);
    ctx.bezierCurveTo(860, 20, 1060, -20, 1250, -40);
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.25)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-30, 700);
    ctx.bezierCurveTo(320, 660, 560, 420, 760, 200);
    ctx.bezierCurveTo(940, 20, 1140, 10, 1300, 30);
    ctx.strokeStyle = 'rgba(22, 135, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Electric Cyan light streak at bottom-left corner
    ctx.beginPath();
    ctx.moveTo(30, 610);
    ctx.bezierCurveTo(120, 560, 240, 480, 340, 420);
    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.restore();

    // 5. Thin Electric Cyan Border with Soft Outer Glow
    ctx.save();
    ctx.strokeStyle = '#00d9ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 217, 255, 0.45)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.roundRect(16, 16, 1168, 643, 30);
    ctx.stroke();
    ctx.restore();

    // 6. Top Left Branding: Official IGM Company Logo (Matching Reference)
    drawIGMLogoCanvas(ctx, 70, 48, 105, 58, { withText: false });

    // Company Name: "Ingrade Media"
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Ingrade Media', 190, 80);

    // Sub-domain: "ingrade.io"
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#b8ff00';
    ctx.fillText('ingrade.io', 192, 98);

    // 7. Top Right Micro-Tagline: "IDEAS  →  CODE  →  IMPACT"
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    const tagX = 1120;
    const tagY = 76;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('IDEAS', tagX - 160, tagY);
    ctx.fillStyle = '#00d9ff';
    ctx.fillText('→', tagX - 138, tagY);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('CODE', tagX - 82, tagY);
    ctx.fillStyle = '#00d9ff';
    ctx.fillText('→', tagX - 60, tagY);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('IMPACT', tagX, tagY);

    // 8. Founder Badge: "👑  FOUNDER & CEO"
    ctx.save();
    ctx.fillStyle = 'rgba(3, 19, 38, 0.75)';
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 217, 255, 0.2)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(70, 130, 205, 34, 17);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('👑', 84, 152);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('FOUNDER &', 108, 152);
    ctx.fillStyle = '#FFC400';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('CEO', 188, 152);

    // 9. Name: "Uday Kant" (White + Cyan Gradient)
    ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Uday ', 70, 215);

    const udayWidth = ctx.measureText('Uday ').width;
    const nameGrad = ctx.createLinearGradient(70 + udayWidth, 0, 70 + udayWidth + 140, 0);
    nameGrad.addColorStop(0, '#00d9ff');
    nameGrad.addColorStop(0.6, '#1687ff');
    nameGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = nameGrad;
    ctx.fillText('Kant', 70 + udayWidth, 215);

    // 10. Professional Tagline
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#9AAAC0';
    ctx.fillText('Next-Gen WebAR   •   3D Interactive Media   •   Spatial Product Showcase', 70, 248);

    // 11. Contact Details (3 Rows)
    const renderContactRow = (y: number, iconType: 'globe' | 'phone' | 'email', label: string, val: string) => {
      // Icon Circle
      ctx.save();
      ctx.fillStyle = '#07192f';
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(88, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw Icon Glyphs
      ctx.strokeStyle = '#00d9ff';
      ctx.fillStyle = '#00d9ff';
      ctx.lineWidth = 1.5;
      if (iconType === 'globe') {
        ctx.beginPath();
        ctx.arc(88, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(81, y);
        ctx.lineTo(95, y);
        ctx.stroke();
      } else if (iconType === 'phone') {
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📞', 88, y);
      } else {
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✉️', 88, y);
      }
      ctx.restore();

      // Label
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#9AAAC0';
      ctx.fillText(label, 116, y);

      // Value
      ctx.font = '600 13px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(val, 175, y);
    };

    renderContactRow(290, 'globe', 'Web', profile.website);
    renderContactRow(340, 'phone', 'Phone', profile.phone);
    renderContactRow(390, 'email', 'Email', profile.email);

    // 12. Bottom "WHAT WE DO" Services Panel
    ctx.save();
    ctx.fillStyle = 'rgba(4, 20, 38, 0.85)';
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(70, 495, 1060, 125, 20);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // "WHAT WE DO" Text + Underline
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('WHAT WE DO', 96, 545);

    ctx.fillStyle = '#00d9ff';
    ctx.shadowColor = '#00d9ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(96, 554, 32, 2.5);
    ctx.shadowBlur = 0;

    // Vertical Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(225, 515);
    ctx.lineTo(225, 600);
    ctx.stroke();

    // 5 Service Items
    const services = [
      { name1: 'Web', name2: 'Development', icon: '</>', x: 250 },
      { name1: 'Full-Stack', name2: 'Development', icon: '≡', x: 425 },
      { name1: 'Software', name2: 'Solutions', icon: '⚙', x: 600 },
      { name1: 'Business', name2: 'Websites', icon: '💻', x: 775 },
      { name1: 'Digital', name2: 'Products', icon: '🚀', x: 945 },
    ];

    services.forEach((s, idx) => {
      // Circular dark blue icon container
      ctx.save();
      ctx.fillStyle = '#07192f';
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x + 18, 558, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00d9ff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.icon, s.x + 18, 558);
      ctx.restore();

      // Text lines
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(s.name1, s.x + 44, 553);
      ctx.font = '400 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(s.name2, s.x + 44, 569);

      // Separator between services
      if (idx < services.length - 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(s.x + 155, 532);
        ctx.lineTo(s.x + 155, 584);
        ctx.stroke();
      }
    });

    // 13. Floating QR Glass Container on the Right
    const drawQRAndDownload = (imgElement?: HTMLImageElement) => {
      ctx.save();
      ctx.fillStyle = 'rgba(8, 24, 43, 0.88)';
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 217, 255, 0.35)';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.roundRect(790, 110, 335, 360, 28);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Inner Clean White Rounded QR Container
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(832, 130, 250, 230, 16);
      ctx.fill();

      // Draw QR Code
      if (imgElement) {
        ctx.drawImage(imgElement, 847, 140, 220, 210);
      }

      // Under QR: Scan to Connect with scan icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('⛶  Scan to Connect', 957, 400);

      // Subtitle: Save • Contact • Explore
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Save  •  Contact  •  Explore', 957, 424);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `IngradeMedia_Digital_Business_Card_${profile.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showNotice('High-res 16:9 Ingrade Media business card saved!');
    };

    if (qrCodeDataUrl) {
      const img = new Image();
      img.onload = () => drawQRAndDownload(img);
      img.src = qrCodeDataUrl;
    } else {
      drawQRAndDownload();
    }
  };

  // Manual Lead Submission
  const handleAddManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLeadForm.name.trim() || !manualLeadForm.phone.trim()) return;

    saveLead({
      name: manualLeadForm.name.trim(),
      company: manualLeadForm.company.trim(),
      phone: manualLeadForm.phone.trim(),
      email: manualLeadForm.email.trim(),
      notes: manualLeadForm.notes.trim() || 'Manual card entry from meeting',
      source: 'manual_card',
    });

    setManualLeadForm({ name: '', company: '', phone: '', email: '', notes: '' });
    setIsAddingLeadManual(false);
    showNotice('Lead saved to Meeting CRM!');
    sounds.playMarkerLock();
  };

  // Export Leads to CSV
  const handleExportCSV = () => {
    sounds.playClick();
    if (leads.length === 0) {
      showNotice('No leads to export yet!');
      return;
    }
    const headers = ['Name', 'Company', 'Phone', 'Email', 'Notes', 'Source', 'Date'];
    const rows = leads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${l.source}"`,
      `"${new Date(l.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ingrade_Meeting_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice(`Exported ${leads.length} leads to CSV!`);
  };

  // Camera Scanner Functions
  const startScanner = async () => {
    setScannerError(null);
    setScannedResult(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Scanner play deferred:', playErr);
        }
        setScannerActive(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable or permission denied.';
      setScannerError(msg);
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setScannerActive(false);
  };

  // Continuous QR Code scanning loop using jsQR
  useEffect(() => {
    if (!scannerActive || activeMode !== 'scanner') {
      stopScanner();
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let isScanning = true;
    let lastDetectedData = '';

    const scanFrame = () => {
      if (!isScanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          if (code.data !== lastDetectedData) {
            lastDetectedData = code.data;
            sounds.playMarkerLock();
            setScannedResult(code.data);
          }
          // Highlight code
          ctx.beginPath();
          ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
          ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
          ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
          ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
          ctx.closePath();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#10b981';
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scannerActive, activeMode]);

  // Save scanned result as a lead
  const handleSaveScannedLead = () => {
    if (!scannedResult) return;
    saveLead({
      name: 'Scanned Contact',
      phone: scannedResult.startsWith('tel:') ? scannedResult.replace('tel:', '') : '',
      email: scannedResult.startsWith('mailto:') ? scannedResult.replace('mailto:', '') : '',
      notes: scannedResult,
      source: 'scanned_qr',
    });
    showNotice('Saved scanned data to Meeting Leads!');
    sounds.playMarkerLock();
  };

  // Clean up scanner on close or tab switch
  useEffect(() => {
    if (isOpen && activeMode === 'scanner') {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-2xl overflow-y-auto">
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 text-neutral-950 font-bold text-xs px-5 py-2.5 rounded-full shadow-[0_10px_30px_rgba(6,182,212,0.4)] border border-white/40 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Glassmorphic Modal Frame */}
      <div className="relative w-full max-w-5xl bg-[#020712]/92 backdrop-blur-3xl border border-[#00d9ff]/30 rounded-[28px] sm:rounded-[32px] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.95),0_0_60px_rgba(0,217,255,0.18),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Ambient Glass Glow Orbs */}
        <div className="absolute -top-28 -left-28 w-80 h-80 rounded-full bg-[#00d9ff]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-28 w-80 h-80 rounded-full bg-[#1687ff]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 left-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Modal Top Glass Header */}
        <header className="relative flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/[0.08] bg-[#030d1d]/60 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3.5">
            <IGMLogo variant="badge" className="w-11 sm:w-12 shrink-0" glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-sm sm:text-base tracking-tight">
                  Founder Visiting Card & Meeting Hub
                </h3>
                <span aria-hidden="true" className="text-cyan-400/60 font-mono">·</span>
                <span className="text-xs font-mono font-bold text-[#b8ff00] tracking-wider">
                  ingrade.io
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Official Ingrade Media digital card · 1-tap vCard (.vcf) save & meeting lead capture
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-300 hover:text-white hover:border-[#00d9ff]/40 transition-all"
            aria-label="Close modal"
          >
            ✕
          </button>
        </header>

        {/* 3-Mode Glass Selector Tabs (Card vs Leads CRM vs Scanner) */}
        <div className="relative flex items-center border-b border-white/[0.08] bg-black/40 p-1.5 shrink-0 backdrop-blur-md">
          <button
            onClick={() => {
              setActiveMode('card');
              sounds.playClick();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'card'
                ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-neutral-950 shadow-[0_4px_15px_rgba(6,182,212,0.35)] font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="13" y2="12" />
              <line x1="7" y1="16" x2="11" y2="16" />
            </svg>
            <span>Founder Card</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('leads');
              refreshLeads();
              sounds.playClick();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'leads'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 shadow-[0_4px_15px_rgba(16,185,129,0.35)] font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Captured Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeMode === 'leads' ? 'bg-neutral-950 text-white' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveMode('scanner');
              sounds.playClick();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'scanner'
                ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-neutral-950 shadow-[0_4px_15px_rgba(6,182,212,0.35)] font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 8V4h4" />
              <path d="M20 8V4h-4" />
              <path d="M4 16v4h4" />
              <path d="M20 16v4h-4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Scan QR / Card</span>
          </button>
        </div>

        {/* Modal Body with Frosted Content Area */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: FOUNDER CARD */}
          {activeMode === 'card' && (
            <>
              {!isEditing ? (
                <>
                  {/* ========================================================================= */}
                  {/* 16:9 PREMIUM FUTURISTIC CORPORATE DIGITAL BUSINESS CARD (INGRADE MEDIA) */}
                  {/* ========================================================================= */}
                  <div
                    className="relative w-full rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 lg:p-10 transition-all duration-300 overflow-hidden border border-[#00d9ff]/70 shadow-[0_0_50px_rgba(0,217,255,0.25),0_30px_70px_rgba(0,0,0,0.9)] bg-gradient-to-br from-[#020817] via-[#051426] to-[#08111f]"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 82% 38%, rgba(22, 135, 255, 0.25) 0%, transparent 45%),
                        radial-gradient(circle at 12% 95%, rgba(0, 217, 255, 0.2) 0%, transparent 40%),
                        radial-gradient(circle at 45% 5%, rgba(0, 217, 255, 0.1) 0%, transparent 35%),
                        linear-gradient(135deg, #020817 0%, #051426 50%, #08111f 100%)
                      `,
                    }}
                  >
                    {/* Abstract Sweeping Light Arcs (SVG) */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 sm:opacity-55"
                      viewBox="0 0 1200 675"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M-80 670 C 220 630, 440 370, 680 170 C 870 10, 1080 -30, 1280 -40"
                        stroke="url(#cyanArcGrad)"
                        strokeWidth="2.5"
                        strokeDasharray="10 5"
                        opacity="0.65"
                      />
                      <path
                        d="M-40 710 C 330 670, 580 430, 770 210 C 950 20, 1160 10, 1340 30"
                        stroke="url(#blueArcGrad)"
                        strokeWidth="1.5"
                        opacity="0.5"
                      />
                      <path
                        d="M-50 560 C 130 520, 270 410, 420 320"
                        stroke="#00d9ff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        filter="drop-shadow(0 0 14px #00d9ff)"
                        opacity="0.8"
                      />
                      <defs>
                        <linearGradient id="cyanArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.85" />
                          <stop offset="50%" stopColor="#1687ff" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#2f6bff" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="blueArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.65" />
                          <stop offset="60%" stopColor="#1687ff" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#020817" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Luminous Rim & Corner Flare Accents */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-[#00d9ff]/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-8 w-64 h-[2.5px] bg-gradient-to-r from-transparent via-[#00d9ff] to-transparent shadow-[0_0_15px_#00d9ff]"></div>
                    <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#00d9ff]/12 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#1687ff]/18 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Quick Flip & Edit Controls on Card */}
                    <div className="absolute top-4 sm:top-6 right-4 sm:right-8 z-20 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsFlipped(!isFlipped);
                          sounds.playClick();
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold bg-[#031326]/80 hover:bg-[#082240] text-[#7dd3fc] hover:text-white rounded-lg border border-[#00d9ff]/35 backdrop-blur-md transition-all shadow-sm flex items-center gap-1"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="23 4 23 10 17 10" />
                          <polyline points="1 20 1 14 7 14" />
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        <span>{isFlipped ? 'Show 16:9 Card' : 'Services View'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditForm(profile);
                          setIsEditing(true);
                          sounds.playClick();
                        }}
                        className="p-1.5 bg-[#031326]/80 hover:bg-[#082240] text-slate-300 hover:text-white rounded-lg border border-[#00d9ff]/35 backdrop-blur-md transition-all shadow-sm"
                        title="Edit Card Details"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>

                    {!isFlipped ? (
                      /* ======================================================= */
                      /* CARD FRONT: EXACT 16:9 COMPOSITION MATCHING REFERENCE   */
                      /* ======================================================= */
                      <div className="relative z-10 flex flex-col justify-between space-y-6 sm:space-y-7">
                        
                        {/* 1. TOP ROW: BRANDING (LEFT) & MICRO-TAGLINE (RIGHT) */}
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:pr-32">
                          {/* Top-Left Branding: Official IGM Company Logo + Company Name */}
                          <div className="flex items-center gap-3.5 sm:gap-4">
                            {/* Official IGM Company Logo Badge */}
                            <IGMLogo variant="badge" className="w-16 sm:w-20 shrink-0" glow={true} />

                            {/* Ingrade Media & ingrade.io */}
                            <div>
                              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight leading-none">
                                {profile.company}
                              </h2>
                              <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm font-mono text-[#b8ff00] hover:underline tracking-widest block mt-1 font-semibold"
                              >
                                ingrade.io
                              </a>
                            </div>
                          </div>

                          {/* Top-Right Micro-Tagline: IDEAS  →  CODE  →  IMPACT */}
                          <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-[0.25em] text-slate-300 uppercase shrink-0 pt-2">
                            <span>IDEAS</span>
                            <span className="text-[#00d9ff] font-normal">→</span>
                            <span>CODE</span>
                            <span className="text-[#00d9ff] font-normal">→</span>
                            <span>IMPACT</span>
                          </div>
                        </div>

                        {/* 2. MIDDLE SECTION: FOUNDER PROFILE & FLOATING QR CONTAINER */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center pt-1">
                          
                          {/* LEFT COLUMN: FOUNDER BADGE, NAME, TAGLINE, CONTACT DETAILS */}
                          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
                            
                            {/* Founder Frosted Role Badge: 👑 FOUNDER & CEO */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#041428]/85 border border-[#00d9ff]/35 shadow-[0_0_15px_rgba(0,217,255,0.18)] backdrop-blur-md">
                              <span className="text-xs">👑</span>
                              <span className="text-[11px] font-bold text-white tracking-widest uppercase">FOUNDER &</span>
                              <span className="text-[11px] font-black text-[#FFC400] tracking-widest uppercase">CEO</span>
                            </div>

                            {/* Name: "Uday" in White, "Kant" in Bright Cyan/Blue Gradient */}
                            <div>
                              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black tracking-tight leading-none font-display">
                                <span className="text-white">Uday </span>
                                <span className="bg-gradient-to-r from-[#00d9ff] via-[#1687ff] to-[#38bdf8] bg-clip-text text-transparent">
                                  Kant
                                </span>
                              </h1>
                            </div>

                            {/* Professional Tagline */}
                            <div className="text-xs sm:text-[13px] text-[#9AAAC0] font-medium flex flex-wrap items-center gap-2">
                              <span>Next-Gen WebAR</span>
                              <span aria-hidden="true" className="text-[#00d9ff]/70">·</span>
                              <span>3D Interactive Media</span>
                              <span aria-hidden="true" className="text-[#00d9ff]/70">·</span>
                              <span>Spatial Product Showcase</span>
                            </div>

                            {/* Contact Details (3 Rows) */}
                            <div className="space-y-2.5 pt-1.5 font-mono">
                              {/* Row 1: Web */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)]">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-[#9AAAC0] w-12 font-sans">Web</span>
                                <a
                                  href="https://ingrade.io"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs sm:text-sm font-semibold text-white hover:text-[#00d9ff] transition-colors"
                                >
                                  https://ingrade.io
                                </a>
                              </div>

                              {/* Row 2: Phone */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)]">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-[#9AAAC0] w-12 font-sans">Phone</span>
                                <a
                                  href="tel:+916299806186"
                                  className="text-xs sm:text-sm font-semibold text-white hover:text-[#00d9ff] transition-colors"
                                >
                                  +91 62998 06186
                                </a>
                              </div>

                              {/* Row 3: Email */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)]">
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                  </svg>
                                </div>
                                <span className="text-xs font-medium text-[#9AAAC0] w-12 font-sans">Email</span>
                                <a
                                  href="mailto:udaykantp9199@gmail.com"
                                  className="text-xs sm:text-sm font-semibold text-white hover:text-[#00d9ff] transition-colors truncate"
                                >
                                  udaykantp9199@gmail.com
                                </a>
                              </div>
                            </div>

                            {/* Direct 'Save to Contacts' Button on Card */}
                            <div className="pt-2">
                              <button
                                onClick={handleDownloadVCard}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d9ff] via-[#1687ff] to-[#00d9ff] hover:brightness-110 text-neutral-950 font-bold text-xs tracking-wide shadow-[0_0_22px_rgba(0,217,255,0.45)] transition-all active:scale-95 group"
                                title="Download Uday Kant's contact card (.vcf) directly into your phone address book"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:scale-110 transition-transform">
                                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                  <polyline points="17 21 17 13 7 13 7 21" />
                                  <polyline points="7 3 7 8 15 8" />
                                </svg>
                                <span>Save to Contacts</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/25 font-mono font-bold">.VCF</span>
                              </button>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: FLOATING QR CODE GLASS CONTAINER */}
                          <div className="lg:col-span-5 flex justify-center lg:justify-end">
                            <div className="relative rounded-[26px] sm:rounded-[28px] bg-[#08182b]/85 backdrop-blur-xl border border-[#00d9ff]/70 p-4 sm:p-5 shadow-[0_0_35px_rgba(0,217,255,0.32),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col items-center max-w-[270px] sm:max-w-[300px] w-full">
                              
                              {/* Inner Clean White Rounded QR Container */}
                              <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-center">
                                {qrCodeDataUrl ? (
                                  <div className="relative">
                                    <img
                                      src={qrCodeDataUrl}
                                      alt="Scan for Ingrade Media Founder Profile"
                                      className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                                    />
                                    {qrTarget === 'connect_page' && (
                                      <div className="absolute top-1 right-1 bg-neutral-950/95 text-cyan-300 text-[8px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/40 shadow flex items-center gap-1 backdrop-blur-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span>founder</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-neutral-500 font-mono">
                                    Generating QR...
                                  </div>
                                )}
                              </div>

                              {/* Under QR: Viewfinder Scan Icon + Scan to Connect */}
                              <div className="flex items-center gap-2 mt-3 text-white font-bold text-xs sm:text-sm tracking-wide">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2.2">
                                  <path d="M4 8V4h4" />
                                  <path d="M20 8V4h-4" />
                                  <path d="M4 16v4h4" />
                                  <path d="M20 16v4h-4" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>Scan to Connect</span>
                              </div>

                              {/* Subtitle: Save · Contact · Explore */}
                              <div className="text-[11px] text-[#7dd3fc] font-medium tracking-wide mt-0.5">
                                Save · Contact · Explore
                              </div>

                              {/* Direct vCard download trigger under QR */}
                              <button
                                onClick={handleDownloadVCard}
                                className="mt-2 text-[11px] text-[#00d9ff] hover:text-white font-semibold flex items-center gap-1.5 transition-colors underline decoration-[#00d9ff]/50 hover:decoration-white active:scale-95"
                                title="Download vCard file"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Save Contact Card (.vcf)</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 3. BOTTOM SERVICES BAR: "WHAT WE DO" */}
                        <div className="rounded-2xl bg-[#041426]/90 backdrop-blur-xl border border-[#00d9ff]/40 p-4 sm:p-4.5 shadow-[0_0_20px_rgba(0,217,255,0.15)] flex flex-col md:flex-row items-center justify-between gap-4">
                          {/* Left side: WHAT WE DO heading + underline */}
                          <div className="shrink-0 flex md:flex-col items-center md:items-start gap-2 md:gap-0">
                            <span className="text-xs font-black tracking-[0.2em] text-white uppercase">
                              WHAT WE DO
                            </span>
                            <div className="w-8 h-[2.5px] bg-[#00d9ff] rounded-full mt-1.5 shadow-[0_0_8px_#00d9ff]"></div>
                          </div>

                          <div className="hidden md:block w-[1px] h-10 bg-white/10 shrink-0"></div>

                          {/* 5 Services Horizontally */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2 w-full flex-1">
                            
                            {/* Service 1: Web Development */}
                            <div className="flex items-center gap-2.5 group">
                              <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)] group-hover:border-[#00d9ff] transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <polyline points="16 18 22 12 16 6" />
                                  <polyline points="8 6 2 12 8 18" />
                                </svg>
                              </div>
                              <div className="text-[11px] leading-tight">
                                <div className="text-white font-semibold group-hover:text-[#00d9ff] transition-colors">Web</div>
                                <div className="text-slate-400">Development</div>
                              </div>
                            </div>

                            {/* Service 2: Full-Stack Development */}
                            <div className="flex items-center gap-2.5 group">
                              <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)] group-hover:border-[#00d9ff] transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                  <polyline points="2 17 12 22 22 17" />
                                  <polyline points="2 12 12 17 22 12" />
                                </svg>
                              </div>
                              <div className="text-[11px] leading-tight">
                                <div className="text-white font-semibold group-hover:text-[#00d9ff] transition-colors">Full-Stack</div>
                                <div className="text-slate-400">Development</div>
                              </div>
                            </div>

                            {/* Service 3: Software Solutions */}
                            <div className="flex items-center gap-2.5 group">
                              <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)] group-hover:border-[#00d9ff] transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <circle cx="12" cy="12" r="3" />
                                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                              </div>
                              <div className="text-[11px] leading-tight">
                                <div className="text-white font-semibold group-hover:text-[#00d9ff] transition-colors">Software</div>
                                <div className="text-slate-400">Solutions</div>
                              </div>
                            </div>

                            {/* Service 4: Business Websites */}
                            <div className="flex items-center gap-2.5 group">
                              <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)] group-hover:border-[#00d9ff] transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <rect x="2" y="3" width="20" height="14" rx="2" />
                                  <line x1="8" y1="21" x2="16" y2="21" />
                                  <line x1="12" y1="17" x2="12" y2="21" />
                                </svg>
                              </div>
                              <div className="text-[11px] leading-tight">
                                <div className="text-white font-semibold group-hover:text-[#00d9ff] transition-colors">Business</div>
                                <div className="text-slate-400">Websites</div>
                              </div>
                            </div>

                            {/* Service 5: Digital Products */}
                            <div className="flex items-center gap-2.5 group">
                              <div className="w-8 h-8 rounded-full bg-[#07192f] border border-[#00d9ff]/45 flex items-center justify-center text-[#00d9ff] shrink-0 shadow-[0_0_10px_rgba(0,217,255,0.2)] group-hover:border-[#00d9ff] transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                </svg>
                              </div>
                              <div className="text-[11px] leading-tight">
                                <div className="text-white font-semibold group-hover:text-[#00d9ff] transition-colors">Digital</div>
                                <div className="text-slate-400">Products</div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ======================================================= */
                      /* CARD BACK: COMPANY CAPABILITIES & ENTERPRISE OVERVIEW   */
                      /* ======================================================= */
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2.5">
                            <IGMLogo variant="badge" className="w-10 shrink-0" glow={true} />
                            <div>
                              <span className="text-sm font-bold text-white uppercase tracking-wider block leading-tight">
                                Ingrade Media Enterprise
                              </span>
                              <span className="text-[11px] font-mono text-[#b8ff00]">ingrade.io</span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">Architecture & Delivery</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 bg-[#041426]/80 backdrop-blur-md rounded-xl border border-[#00d9ff]/25">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>🌐</span>
                              <span>Browser WebAR Experiences</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              Zero app download required. Instant high-performance AR rendered straight inside standard mobile Safari and Chrome browsers.
                            </p>
                          </div>

                          <div className="p-3.5 bg-[#041426]/80 backdrop-blur-md rounded-xl border border-[#00d9ff]/25">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>⚙️</span>
                              <span>3D CAD & Spatial Product Visualizers</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              Exploded mechanical assemblies, photorealistic PBR material shaders, lighting rigs, and true physical millimeter scaling.
                            </p>
                          </div>

                          <div className="p-3.5 bg-[#041426]/80 backdrop-blur-md rounded-xl border border-[#00d9ff]/25">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>🎯</span>
                              <span>Marker & Surface Visual Grounding</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              Standard Hiro and custom branded geometric markers for corporate booth displays, product packaging, and exhibition stands.
                            </p>
                          </div>

                          <div className="p-3.5 bg-[#041426]/80 backdrop-blur-md rounded-xl border border-[#00d9ff]/25">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>🚀</span>
                              <span>Ultra-Fast 60FPS Three.js Engine</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              Lightweight client-side rendering pipeline optimized for instant load on mobile 4G/5G networks with low battery drain.
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-[#031326]/90 border border-[#00d9ff]/40 rounded-xl text-xs flex items-center justify-between backdrop-blur-md">
                          <div>
                            <span className="font-semibold text-white">Official Domain:</span>
                            <span className="text-[#00d9ff] ml-1.5 font-mono font-bold">https://ingrade.io</span>
                          </div>
                          <a
                            href="https://ingrade.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 bg-gradient-to-r from-[#00d9ff] to-[#1687ff] text-neutral-950 font-bold rounded-lg text-xs transition-all shadow-md hover:brightness-110"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Target Mode Selector */}
                  <div className="p-4 bg-[#030d1d]/80 backdrop-blur-xl rounded-2xl border border-[#00d9ff]/25 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00d9ff] shadow-[0_0_8px_#00d9ff]"></span>
                        What happens when client scans your QR:
                      </span>
                      {onOpenLeadLanding && (
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onOpenLeadLanding();
                          }}
                          className="text-[11px] font-semibold text-[#00d9ff] hover:text-white underline decoration-cyan-500/50 hover:decoration-white transition-colors"
                        >
                          👁️ Preview Guest Screen
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setQrTarget('connect_page');
                          sounds.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                          qrTarget === 'connect_page'
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-[#00d9ff] text-neutral-950 shadow-[0_0_15px_rgba(0,217,255,0.3)] font-bold'
                            : 'text-slate-300 hover:text-white bg-[#020a17]/70 border border-white/10 hover:border-[#00d9ff]/40'
                        }`}
                      >
                        ⚡ Founder Link (?connect=founder)
                      </button>

                      <button
                        onClick={() => {
                          setQrTarget('website');
                          sounds.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                          qrTarget === 'website'
                            ? 'bg-gradient-to-r from-[#00d9ff] to-[#1687ff] text-neutral-950 shadow-[0_0_15px_rgba(0,217,255,0.3)] font-bold'
                            : 'text-slate-300 hover:text-white bg-[#020a17]/70 border border-white/10 hover:border-[#00d9ff]/40'
                        }`}
                      >
                        🌐 ingrade.io
                      </button>

                      <button
                        onClick={() => {
                          setQrTarget('whatsapp');
                          sounds.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                          qrTarget === 'whatsapp'
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-bold'
                            : 'text-slate-300 hover:text-white bg-[#020a17]/70 border border-white/10 hover:border-[#00d9ff]/40'
                        }`}
                      >
                        💬 WhatsApp Chat
                      </button>

                      <button
                        onClick={() => {
                          setQrTarget('vcard');
                          sounds.playClick();
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center ${
                          qrTarget === 'vcard'
                            ? 'bg-gradient-to-r from-[#00d9ff] to-[#1687ff] text-neutral-950 shadow-[0_0_15px_rgba(0,217,255,0.3)] font-bold'
                            : 'text-slate-300 hover:text-white bg-[#020a17]/70 border border-white/10 hover:border-[#00d9ff]/40'
                        }`}
                      >
                        📇 Download .VCF
                      </button>
                    </div>
                  </div>

                  {/* Dynamic QR Live Generator Link Bar */}
                  <div className="p-3 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-semibold text-white">Dynamic Founder QR Link</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                          ?connect=founder
                        </span>
                      </div>
                      <button
                        onClick={handleDownloadOnlyQR}
                        className="text-[11px] font-medium text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Download QR PNG</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10 font-mono text-[11px] text-neutral-300">
                      <span className="truncate flex-1 select-all text-cyan-300">
                        {founderConnectUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(founderConnectUrl, 'Founder URL (?connect=founder) copied!')}
                        className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-white rounded-lg text-[10px] font-sans font-medium transition-colors shrink-0 flex items-center gap-1"
                        title="Copy Founder Connect Link"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy</span>
                      </button>
                      <a
                        href={founderConnectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-[10px] font-sans font-medium transition-colors shrink-0 flex items-center gap-1"
                        title="Open Founder Connect Page in new tab"
                      >
                        <span>Open</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Primary Action Buttons for Meeting & Contacting */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5">
                    {/* FEATURED: Save to Contacts vCard Button */}
                    <button
                      onClick={handleDownloadVCard}
                      className="px-3.5 py-3 bg-gradient-to-r from-[#00d9ff] via-[#1687ff] to-[#00d9ff] hover:brightness-110 text-neutral-950 font-bold text-xs rounded-xl shadow-[0_0_25px_rgba(0,217,255,0.4)] border border-white/30 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group"
                      title="Save Uday Kant directly to Contacts as a vCard file (.vcf)"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:scale-110 transition-transform">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      <span className="flex items-center gap-1 font-extrabold tracking-tight">
                        <span>Save to Contacts</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/25 font-mono">.VCF</span>
                      </span>
                    </button>

                    <a
                      href={`https://wa.me/${profile.rawPhone}?text=Hi%20Uday,%20pleasure%20meeting%20you!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-3 bg-[#06241c]/80 hover:bg-[#0a382c] text-emerald-300 text-xs font-bold rounded-xl transition-all border border-emerald-500/40 backdrop-blur-xl flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-95 group"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="group-hover:scale-110 transition-transform">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>WhatsApp Founder</span>
                    </a>

                    <button
                      onClick={handleDownloadCardPNG}
                      className="px-3.5 py-3 bg-[#041428]/85 hover:bg-[#072040] text-white text-xs font-semibold rounded-xl transition-all border border-[#00d9ff]/35 hover:border-[#00d9ff]/70 backdrop-blur-xl flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(0,217,255,0.12)] active:scale-95 group"
                      title="Save 16:9 card image to your phone gallery for offline meetings"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Save as PNG</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="px-3.5 py-3 bg-[#041428]/85 hover:bg-[#072040] text-white font-semibold text-xs rounded-xl transition-all border border-[#00d9ff]/35 hover:border-[#00d9ff]/70 backdrop-blur-xl flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(0,217,255,0.12)] active:scale-95 group"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2.2" className="group-hover:scale-110 transition-transform">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span>Share Card Link</span>
                    </button>
                  </div>
                </>
              ) : (
                /* EDIT PROFILE FORM */
                <form onSubmit={handleSaveProfile} className="space-y-3.5 p-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">Customize Founder Card</h4>
                      <p className="text-[11px] text-neutral-400">Updates sync instantly to your digital card & dynamic QR</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-white/[0.05] rounded-xl border border-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-neutral-300 block mb-1 font-medium">Your Full Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1 font-medium">Designation / Role</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1 font-medium">Company</label>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1 font-medium">Website URL</label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1 font-medium">Phone Number (WhatsApp)</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditForm({
                            ...editForm,
                            phone: val,
                            rawPhone: val.replace(/[^0-9]/g, ''),
                          });
                        }}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white font-mono outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1 font-medium">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-neutral-300 block mb-1 font-medium">Founder Bio / Intro</label>
                      <textarea
                        value={editForm.about}
                        onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white resize-none outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-xs font-medium rounded-xl border border-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                    >
                      Save Glass Card
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: LEADS CRM (CAPTURED CONTACTS) */}
          {activeMode === 'leads' && (
            <div className="space-y-4">
              {/* Leads Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white font-display">Meeting Leads CRM</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                      {leads.length} contacts
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Contacts captured when clients scanned your QR code or exchanged details.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingLeadManual(!isAddingLeadManual)}
                    className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-medium rounded-xl border border-white/10 flex items-center gap-1 transition-colors"
                  >
                    <span>{isAddingLeadManual ? 'Cancel' : '➕ Add Card'}</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Add Manual Lead Form */}
              {isAddingLeadManual && (
                <form
                  onSubmit={handleAddManualLead}
                  className="p-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl space-y-3 animate-in fade-in"
                >
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>📇</span>
                    <span>Add Paper Card or Contact from Meeting</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Contact Name *"
                      value={manualLeadForm.name}
                      onChange={(e) => setManualLeadForm({ ...manualLeadForm, name: e.target.value })}
                      className="bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={manualLeadForm.company}
                      onChange={(e) => setManualLeadForm({ ...manualLeadForm, company: e.target.value })}
                      className="bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone / WhatsApp *"
                      value={manualLeadForm.phone}
                      onChange={(e) => setManualLeadForm({ ...manualLeadForm, phone: e.target.value })}
                      className="bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none font-mono"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={manualLeadForm.email}
                      onChange={(e) => setManualLeadForm({ ...manualLeadForm, email: e.target.value })}
                      className="bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Meeting notes or requirement"
                      value={manualLeadForm.notes}
                      onChange={(e) => setManualLeadForm({ ...manualLeadForm, notes: e.target.value })}
                      className="sm:col-span-2 bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingLeadManual(false)}
                      className="px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-xs rounded-xl border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 font-bold text-xs rounded-xl shadow-md active:scale-95"
                    >
                      Save Contact
                    </button>
                  </div>
                </form>
              )}

              {/* Leads List with Frosted Glass Panels */}
              {leads.length > 0 ? (
                <div className="space-y-2.5">
                  {leads.map((lead) => {
                    const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                    return (
                      <div
                        key={lead.id}
                        className="p-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 rounded-2xl space-y-2.5 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{lead.name}</h5>
                              {lead.company && (
                                <span className="text-xs text-cyan-300 font-medium">· {lead.company}</span>
                              )}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/10">
                                {lead.source === 'guest_submission'
                                  ? '📱 QR Scan'
                                  : lead.source === 'manual_card'
                                  ? '📇 Paper Card'
                                  : '🔍 Camera'}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              Captured {new Date(lead.createdAt).toLocaleDateString()} at{' '}
                              {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              deleteLead(lead.id);
                              sounds.playClick();
                            }}
                            className="text-neutral-500 hover:text-red-400 p-1.5 text-xs transition-colors rounded-lg hover:bg-white/[0.05]"
                            title="Delete Lead"
                          >
                            ✕
                          </button>
                        </div>

                        {lead.notes && (
                          <p className="text-xs text-neutral-300 bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
                            {lead.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <div className="flex items-center gap-3 font-mono text-neutral-300">
                            {lead.phone && <span>📞 {lead.phone}</span>}
                            {lead.email && <span className="hidden sm:inline">✉️ {lead.email}</span>}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {cleanPhone && (
                              <>
                                <a
                                  href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                                    lead.name
                                  )},%20it%20was%20great%20connecting%20at%20our%20meeting!`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all"
                                >
                                  <span>WhatsApp</span>
                                </a>
                                <a
                                  href={`tel:${cleanPhone}`}
                                  className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 border border-white/10 rounded-xl text-[11px] font-medium transition-colors"
                                >
                                  Call
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-xl text-neutral-300">
                    📇
                  </div>
                  <h5 className="text-sm font-bold text-white">No Leads Captured Yet</h5>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Show your Founder QR code during meetings. When someone scans it, their contact details will appear right here!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAMERA SCANNER */}
          {activeMode === 'scanner' && (
            <div className="space-y-4">
              <div className="relative w-full aspect-[4/3] bg-black/60 rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center backdrop-blur-xl">
                {/* Background Video Stream */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className={`w-full h-full object-cover ${scannerActive ? 'opacity-100' : 'opacity-0'}`}
                />
                {/* Offscreen Canvas for Frame Extraction */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle / Viewfinder Frame */}
                {scannerActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <div className="relative w-56 h-56 border-2 border-dashed border-cyan-400/70 rounded-2xl flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br"></div>

                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

                      <span className="absolute -bottom-8 text-[11px] text-white/90 bg-neutral-950/80 px-2.5 py-0.5 rounded-full font-mono backdrop-blur-md border border-white/10">
                        Point at Client QR or Card
                      </span>
                    </div>
                  </div>
                )}

                {/* State when camera is inactive or error */}
                {!scannerActive && (
                  <div className="p-6 text-center max-w-sm">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-3 text-cyan-300">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">Camera Scanner</h4>
                    <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                      {scannerError || 'Start camera to scan partner QR codes or business cards.'}
                    </p>
                    <button
                      onClick={startScanner}
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Scanned Result Card */}
              {scannedResult && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-2 animate-in fade-in backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      QR Code Detected!
                    </span>
                    <button
                      onClick={() => setScannedResult(null)}
                      className="text-[11px] text-neutral-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="p-2.5 bg-black/50 rounded-xl border border-white/10 font-mono text-xs text-neutral-200 break-all select-all">
                    {scannedResult}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveScannedLead}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <span>💾 Save to Meeting Leads</span>
                    </button>

                    {scannedResult.startsWith('http') && (
                      <a
                        href={scannedResult}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-medium rounded-xl border border-white/10 transition-colors flex items-center gap-1"
                      >
                        <span>Open URL</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}

                    <button
                      onClick={() => copyToClipboard(scannedResult, 'Scanned content copied!')}
                      className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-medium rounded-xl border border-white/10 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Simulation Quick Test */}
              <div className="p-3 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-neutral-200">Test Ingrade Media Scan Target:</span>
                  <p className="text-[11px] text-neutral-400">Preview what clients see when scanning your QR code.</p>
                </div>
                <button
                  onClick={() => {
                    setScannedResult('https://ingrade.io');
                    sounds.playMarkerLock();
                  }}
                  className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-xl text-xs font-medium transition-colors"
                >
                  Simulate ingrade.io Scan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
