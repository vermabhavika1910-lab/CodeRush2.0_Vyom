import React from 'react';

interface MaestroLogoProps extends React.SVGProps<SVGSVGElement> {
  height?: number | string;
}

export function MaestroLogo({ height = 40, ...props }: MaestroLogoProps) {
  // Center coordinates for the dots of the lowercase 'm'
  const dots = [
    // Left Stem
    { x: 4, y: 16 }, { x: 4, y: 22 }, { x: 4, y: 28 }, { x: 4, y: 34 }, { x: 4, y: 40 }, { x: 4, y: 46 }, { x: 4, y: 52 },
    { x: 10, y: 16 }, { x: 10, y: 22 }, { x: 10, y: 28 }, { x: 10, y: 34 }, { x: 10, y: 40 }, { x: 10, y: 46 }, { x: 10, y: 52 },
    
    // Left Arch Curve top
    { x: 16, y: 12 }, { x: 22, y: 12 },
    
    // Middle Stem
    { x: 28, y: 16 }, { x: 28, y: 22 }, { x: 28, y: 28 }, { x: 28, y: 34 }, { x: 28, y: 40 }, { x: 28, y: 46 }, { x: 28, y: 52 },
    { x: 34, y: 16 }, { x: 34, y: 22 }, { x: 34, y: 28 }, { x: 34, y: 34 }, { x: 34, y: 40 }, { x: 34, y: 46 }, { x: 34, y: 52 },
    
    // Right Arch Curve top
    { x: 40, y: 12 }, { x: 46, y: 12 },
    
    // Right Stem
    { x: 52, y: 16 }, { x: 52, y: 22 }, { x: 52, y: 28 }, { x: 52, y: 34 }, { x: 52, y: 40 }, { x: 52, y: 46 }, { x: 52, y: 52 },
    { x: 58, y: 16 }, { x: 58, y: 22 }, { x: 58, y: 28 }, { x: 58, y: 34 }, { x: 58, y: 40 }, { x: 58, y: 46 }, { x: 58, y: 52 },
  ];

  return (
    <svg
      viewBox="0 0 200 64"
      height={height}
      className="select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* 1. Lowcase Dot 'm' */}
      <g className="fill-current">
        {dots.map((d, idx) => (
          <circle key={idx} cx={d.x} cy={d.y} r="3.2" />
        ))}
      </g>

      {/* 2. Text AESTRO */}
      <text
        x="68"
        y="49"
        fontFamily="Outfit, Inter, var(--font-brand), sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="0.1em"
        fill="currentColor"
      >
        AESTRO
      </text>

      {/* 3. Halftone style Double Quotes */}
      <g fill="currentColor">
        {/* First Quote Character */}
        <path d="M152 23 C152 14.5 158.5 8 167 8 C175.5 8 181 14.5 181 23 C181 32 172.5 40 163.5 46 C162 47 160.5 45.5 161.5 44 C166 38.5 171.5 32.5 171.5 25 C171.5 24 171 23 170 23 C161.5 23 152 29.5 152 23 Z" opacity="0.95" />
        
        {/* Second Quote Character */}
        <path d="M172 23 C172 14.5 178.5 8 187 8 C195.5 8 201 14.5 201 23 C201 32 192.5 40 183.5 46 C182 47 180.5 45.5 181.5 44 C186 38.5 191.5 32.5 191.5 25 C191.5 24 191 23 190 23 C181.5 23 172 29.5 172 23 Z" opacity="0.95" />
      </g>
    </svg>
  );
}
