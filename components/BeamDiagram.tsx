
import React from 'react';

const BeamDiagram: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4 bg-slate-900/50 rounded-lg">
      <svg width="100%" viewBox="0 0 400 100" className="max-w-md">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
          </marker>
        </defs>

        {/* Distributed Load Arrows */}
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={i} x1={40 + i * 22} y1="15" x2={40 + i * 22} y2="45" stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#arrow)" />
        ))}

        {/* Load Label */}
        <text x="200" y="10" fontFamily="sans-serif" fontSize="12" fill="#e2e8f0" textAnchor="middle">w (kN/m)</text>
        
        {/* Beam */}
        <line x1="20" y1="50" x2="380" y2="50" stroke="#94a3b8" strokeWidth="4" />

        {/* Supports */}
        {/* Pin Support */}
        <path d="M 20 50 L 10 65 L 30 65 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <line x1="5" y1="70" x2="35" y2="70" stroke="#94a3b8" strokeWidth="2" />

        {/* Roller Support */}
        <path d="M 380 50 L 370 65 L 390 65 Z" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="375" cy="70" r="3" fill="#94a3b8" />
        <circle cx="385" cy="70" r="3" fill="#94a3b8" />
        <line x1="365" y1="78" x2="395" y2="78" stroke="#94a3b8" strokeWidth="2" />

        {/* Length Dimension */}
        <line x1="20" y1="90" x2="380" y2="90" stroke="#64748b" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
        <text x="200" y="85" fontFamily="sans-serif" fontSize="12" fill="#e2e8f0" textAnchor="middle">L (m)</text>
      </svg>
    </div>
  );
};

export default BeamDiagram;
