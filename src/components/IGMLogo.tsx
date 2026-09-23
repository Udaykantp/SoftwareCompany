import React from 'react';

interface IGMLogoProps {
  /**
   * 'badge': Just the dark rounded card with neon lime IGM + swoosh wave
   * 'full': Badge with 'MEDIA COMPANY' text lockup underneath
   * 'mark': Flat vector IGM mark without dark container
   * 'horizontal': Badge on left, 'Ingrade Media' or 'MEDIA COMPANY' on right
   */
  variant?: 'badge' | 'full' | 'mark' | 'horizontal';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  textColor?: 'dark' | 'light';
  glow?: boolean;
}

export const IGMLogo: React.FC<IGMLogoProps> = ({
  variant = 'badge',
  className = '',
  size = 'md',
  textColor = 'light',
  glow = true,
}) => {
  // Sizing map for the logo container
  const sizeClasses = {
    sm: variant === 'full' ? 'w-24' : 'w-16',
    md: variant === 'full' ? 'w-36' : 'w-24',
    lg: variant === 'full' ? 'w-48' : 'w-32',
    xl: variant === 'full' ? 'w-64' : 'w-44',
    custom: '',
  }[size];

  // Neon lime color matching reference: #c0ff00 / #b4ff00
  const limeColor = '#b8ff00';

  // SVG representation of the IGM badge
  const BadgeSVG = ({ showShadow = glow }: { showShadow?: boolean }) => (
    <svg
      viewBox="0 0 250 135"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto ${showShadow ? 'drop-shadow-[0_0_12px_rgba(184,255,0,0.35)]' : ''}`}
    >
      <defs>
        {/* Subtle dark gradient for the container */}
        <linearGradient id="igmBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#222222" />
          <stop offset="100%" stopColor="#151515" />
        </linearGradient>

        {/* Glow filter for neon elements */}
        <filter id="igmNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark Rounded Badge Background */}
      <rect
        x="2"
        y="2"
        width="246"
        height="131"
        rx="10"
        fill="url(#igmBadgeBg)"
        stroke="#2c2c2c"
        strokeWidth="1.5"
      />

      <g filter={showShadow ? 'url(#igmNeonGlow)' : undefined}>
        {/* ======================= LETTER 'I' ======================= */}
        {/* Solid vertical block */}
        <rect x="26" y="27" width="16" height="58" rx="1.5" fill={limeColor} />

        {/* ======================= LETTER 'G' ======================= */}
        {/* Outer shape with chamfered bottom-left corner and inner crossbar */}
        <path
          d="
            M 52 27
            H 122
            V 42
            H 68
            V 68
            L 78 77
            H 106
            V 56
            H 92
            V 46
            H 122
            V 85
            H 73
            L 52 64
            Z
          "
          fill={limeColor}
        />

        {/* ======================= LETTER 'M' ======================= */}
        {/* Geometric arch with chamfered top-right corner and 3 legs */}
        <path
          d="
            M 132 27
            H 203
            L 218 42
            V 85
            H 202
            V 44
            H 190
            V 85
            H 174
            V 44
            H 162
            V 85
            H 146
            V 44
            H 132
            Z
          "
          fill={limeColor}
        />

        {/* ================= DYNAMIC HORIZONTAL SWOOSH WAVE ================= */}
        {/* Fluid wave line under 'GM' tapering to the right */}
        <path
          d="
            M 85 97
            C 115 96, 155 94.5, 185 95
            C 210 95.5, 222 96, 224 96.5
            C 220 97.2, 195 98.2, 160 98.5
            C 125 98.8, 95 98.2, 85 97
            Z
          "
          fill={limeColor}
        />

        {/* Secondary subtle wave accent underneath */}
        <path
          d="
            M 125 102
            C 135 101.2, 148 101.5, 158 102.5
            C 152 103.5, 138 103.8, 125 102
            Z
          "
          fill={limeColor}
          opacity="0.9"
        />
      </g>
    </svg>
  );

  // Variant: Just the badge
  if (variant === 'badge') {
    return (
      <div className={`inline-block select-none ${sizeClasses} ${className}`}>
        <BadgeSVG />
      </div>
    );
  }

  // Variant: Full lockup with "MEDIA COMPANY" text underneath
  if (variant === 'full') {
    const textColorClass = textColor === 'light' ? 'text-white' : 'text-neutral-900';
    const subColorClass = textColor === 'light' ? 'text-neutral-300' : 'text-neutral-700';

    return (
      <div className={`inline-flex flex-col items-end select-none ${sizeClasses} ${className}`}>
        <div className="w-full">
          <BadgeSVG />
        </div>
        <div className="text-right mt-1 pr-1 leading-none font-sans">
          <div className={`text-[13px] sm:text-[15px] font-extrabold tracking-wider ${textColorClass}`}>
            MEDIA
          </div>
          <div className={`text-[10px] sm:text-[12px] font-medium tracking-[0.22em] ${subColorClass} -mt-0.5`}>
            COMPANY
          </div>
        </div>
      </div>
    );
  }

  // Variant: Horizontal lockup (Badge on left, company details on right)
  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        <div className="w-14 sm:w-16 shrink-0">
          <BadgeSVG />
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
            Ingrade Media
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-[#b8ff00] font-semibold">
            ingrade.io
          </span>
        </div>
      </div>
    );
  }

  // Variant: Flat vector mark only
  return (
    <div className={`inline-block select-none ${sizeClasses} ${className}`}>
      <svg
        viewBox="20 20 205 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <rect x="26" y="27" width="16" height="58" rx="1.5" fill={limeColor} />
        <path
          d="M 52 27 H 122 V 42 H 68 V 68 L 78 77 H 106 V 56 H 92 V 46 H 122 V 85 H 73 L 52 64 Z"
          fill={limeColor}
        />
        <path
          d="M 132 27 H 203 L 218 42 V 85 H 202 V 44 H 190 V 85 H 174 V 44 H 162 V 85 H 146 V 44 H 132 Z"
          fill={limeColor}
        />
        <path
          d="M 85 97 C 115 96, 155 94.5, 185 95 C 210 95.5, 222 96, 224 96.5 C 220 97.2, 195 98.2, 160 98.5 C 125 98.8, 95 98.2, 85 97 Z"
          fill={limeColor}
        />
      </svg>
    </div>
  );
};

/**
 * Draws the high-res IGM vector badge directly onto an HTML5 Canvas.
 * Used for exporting 16:9 visiting cards, marketing prints, and downloadable PNGs.
 */
export const drawIGMLogoCanvas = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { withText?: boolean; textPosition?: 'bottom' | 'right' } = {}
) => {
  ctx.save();
  ctx.translate(x, y);

  const scaleX = width / 250;
  const scaleY = height / 135;
  ctx.scale(scaleX, scaleY);

  // Background Badge
  const bgGrad = ctx.createLinearGradient(0, 0, 250, 135);
  bgGrad.addColorStop(0, '#222222');
  bgGrad.addColorStop(1, '#151515');
  ctx.fillStyle = bgGrad;
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(2, 2, 246, 131, 12);
  ctx.fill();
  ctx.stroke();

  // Neon Lime Color
  const lime = '#b8ff00';
  ctx.fillStyle = lime;
  ctx.shadowColor = 'rgba(184, 255, 0, 0.45)';
  ctx.shadowBlur = 8;

  // Letter 'I'
  ctx.beginPath();
  ctx.roundRect(26, 27, 16, 58, 1.5);
  ctx.fill();

  // Letter 'G'
  ctx.beginPath();
  ctx.moveTo(52, 27);
  ctx.lineTo(122, 27);
  ctx.lineTo(122, 42);
  ctx.lineTo(68, 42);
  ctx.lineTo(68, 68);
  ctx.lineTo(78, 77);
  ctx.lineTo(106, 77);
  ctx.lineTo(106, 56);
  ctx.lineTo(92, 56);
  ctx.lineTo(92, 46);
  ctx.lineTo(122, 46);
  ctx.lineTo(122, 85);
  ctx.lineTo(73, 85);
  ctx.lineTo(52, 64);
  ctx.closePath();
  ctx.fill();

  // Letter 'M'
  ctx.beginPath();
  ctx.moveTo(132, 27);
  ctx.lineTo(203, 27);
  ctx.lineTo(218, 42);
  ctx.lineTo(218, 85);
  ctx.lineTo(202, 85);
  ctx.lineTo(202, 44);
  ctx.lineTo(190, 44);
  ctx.lineTo(190, 85);
  ctx.lineTo(174, 85);
  ctx.lineTo(174, 44);
  ctx.lineTo(162, 44);
  ctx.lineTo(162, 85);
  ctx.lineTo(146, 85);
  ctx.lineTo(146, 44);
  ctx.lineTo(132, 44);
  ctx.closePath();
  ctx.fill();

  // Swoosh wave
  ctx.beginPath();
  ctx.moveTo(85, 97);
  ctx.bezierCurveTo(115, 96, 155, 94.5, 185, 95);
  ctx.bezierCurveTo(210, 95.5, 222, 96, 224, 96.5);
  ctx.bezierCurveTo(220, 97.2, 195, 98.2, 160, 98.5);
  ctx.bezierCurveTo(125, 98.8, 95, 98.2, 85, 97);
  ctx.closePath();
  ctx.fill();

  // Secondary wave
  ctx.beginPath();
  ctx.moveTo(125, 102);
  ctx.bezierCurveTo(135, 101.2, 148, 101.5, 158, 102.5);
  ctx.bezierCurveTo(152, 103.5, 138, 103.8, 125, 102);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // If text is requested
  if (options.withText && options.textPosition === 'bottom') {
    ctx.save();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('MEDIA', x + width - 2, y + height + 15);
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('COMPANY', x + width - 2, y + height + 28);
    ctx.restore();
  }
};

