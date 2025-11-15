
import React, { useState } from 'react';
import type { Load, PointLoad, LoadCategory, EnvelopeResults } from './LoadManager';
import { loadNomenclature } from './LoadManager';

interface BeamDiagramProps {
  uniformLoads?: Load[];
  pointLoads?: PointLoad[];
  length?: number;
  results?: EnvelopeResults | null;
  viewMode: 'input' | 'results';
}

const loadColors: Record<LoadCategory, string> = { SW: '#a16207', DL: '#64748b', LL: '#ef4444', SNOW: '#38bdf8', WIND: '#2dd4bf' };

const BeamDiagram: React.FC<BeamDiagramProps> = ({ uniformLoads = [], pointLoads = [], length = 6, results = null, viewMode }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: { label: string; value: string; unit: string }[] } | null>(null);

  const beamStartX = 30;
  const beamEndX = 470;
  const beamWidth = beamEndX - beamStartX;
  const beamY = 100;
  const svgViewBox = "0 0 500 180";

  const scaleX = (x: number) => beamStartX + (beamWidth * (x / length));

  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (!results) return;
    const svg = event.currentTarget.ownerSVGElement;
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const { x: svgX } = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const beamX = ((svgX - beamStartX) / beamWidth) * length;
      if (beamX < 0 || beamX > length) {
        setTooltip(null);
        return;
      }

      const { momentData, shearData, deflectionData } = results;
      const index = Math.min(momentData.length - 1, Math.max(0, Math.round((beamX / length) * (momentData.length - 1))));
      
      const content = [
        { label: 'x', value: momentData[index].x.toFixed(2), unit: 'm' },
        { label: 'M', value: momentData[index].y.toFixed(2), unit: 'kNm' },
        { label: 'V', value: shearData[index].y.toFixed(2), unit: 'kN' },
        { label: 'δ', value: deflectionData[index].y.toFixed(2), unit: 'mm' },
      ];

      setTooltip({ x: svgX, y: beamY - 40, content });
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  const renderInputMode = () => {
    const activeUniforms = uniformLoads.filter(l => parseFloat(l.value) > 0);
    const activePoints = pointLoads.filter(l => {
        const val = parseFloat(l.value); const a = parseFloat(l.a);
        return val > 0 && !isNaN(a) && a >= 0 && a <= length;
    });

    const maxUniformVal = Math.max(1, ...activeUniforms.map(l => parseFloat(l.value)));
    const maxPointVal = Math.max(1, ...activePoints.map(l => parseFloat(l.value)));

    // --- Smart Label Placement for Point Loads ---
    const pointLabelPositions: { x: number, y: number, text: string, color: string }[] = [];
    const sortedPoints = [...activePoints].sort((a,b) => parseFloat(a.a) - parseFloat(b.a));
    const labelLevels: { endX: number }[] = [ {endX: -1}, {endX: -1} ]; // two levels for labels

    sortedPoints.forEach(load => {
        const val = parseFloat(load.value);
        const a = parseFloat(load.a);
        const aPos = scaleX(a);
        const text = `${loadNomenclature[load.category]} = ${val} kN`;
        
        let levelIndex = 0; // default to top level
        if(aPos < labelLevels[0].endX + 5) { // check for collision on level 0
            levelIndex = 1; // move to level 1
        }
        
        const labelY = 20 + levelIndex * 20;
        pointLabelPositions.push({ x: aPos, y: labelY, text, color: loadColors[load.category] });
        
        // This is a rough estimation of label width, good enough for this purpose
        const labelWidth = text.length * 5.5; 
        labelLevels[levelIndex].endX = aPos + labelWidth / 2;
    });

    return (
      <>
        {/* Uniform Loads */}
        {activeUniforms.map((load, index) => {
            const val = parseFloat(load.value);
            const height = 15 + 15 * (val / maxUniformVal);
            const color = loadColors[load.category];
            return (
                <g key={load.id}>
                    {Array.from({ length: 15 }).map((_, i) => (
                        <line key={i} x1={beamStartX + 20 + i * ((beamWidth - 40)/14)} y1={beamY - height} x2={beamStartX + 20 + i * ((beamWidth - 40)/14)} y2={beamY - 5} stroke={color} strokeWidth="1" markerEnd={`url(#arrow-uniform-${load.category})`} />
                    ))}
                    <text x={beamStartX + 10} y={15 + index * 12} fontFamily="sans-serif" fontSize="10" fill={color} textAnchor="start">
                        {`${loadNomenclature[load.category]} = ${load.value} kN/m`}
                    </text>
                </g>
            )
        })}
        
        {/* Point Loads */}
        {activePoints.map(load => {
            const val = parseFloat(load.value);
            const a = parseFloat(load.a);
            const aPos = scaleX(a);
            const height = 30 + 30 * (val / maxPointVal);
            const color = loadColors[load.category];
            return (
                <g key={load.id}>
                    <line x1={aPos} y1={beamY - height} x2={aPos} y2={beamY - 5} stroke={color} strokeWidth="3" markerEnd={`url(#arrow-point-${load.category})`} />
                </g>
            )
        })}
        {/* Point Load Labels */}
        {pointLabelPositions.map(({x, y, text, color}, index) => (
             <text key={index} x={x} y={y} fontFamily="sans-serif" fontSize="10" fill={color} textAnchor="middle">{text}</text>
        ))}
      </>
    );
  };
  
  const renderResultsMode = () => {
    if (!results) return null;
    const maxDeflection = Math.max(...results.deflectionData.map(p => Math.abs(p.y)));
    const deflectionScale = maxDeflection > 0 ? 30 / maxDeflection : 0; // scale to max 30px deflection

    const deflectionPath = results.deflectionData.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${beamY + p.y * deflectionScale}`
    ).join(' ');

    return (
        <>
            <path d={deflectionPath} fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinecap="round"/>
            <rect x={beamStartX} y={0} width={beamWidth} height={180} fill="transparent" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} />
            {tooltip && (
                <g transform={`translate(${tooltip.x}, ${tooltip.y})`} className="pointer-events-none">
                    <rect x="-60" y="-55" width="120" height="70" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" opacity="0.9" />
                    {tooltip.content.map((line, i) => (
                         <text key={i} x="0" y={-40 + i * 15} fontFamily="sans-serif" fontSize="11" textAnchor="middle">
                            <tspan fill="#64748b" fontWeight="bold">{line.label}: </tspan>
                            <tspan fill="#e2e8f0">{line.value} </tspan>
                            <tspan fill="#94a3b8" fontSize="10">{line.unit}</tspan>
                        </text>
                    ))}
                </g>
            )}
        </>
    );
  };

  return (
    <div className="flex justify-center items-center p-2 bg-slate-900/50 rounded-lg">
      <svg width="100%" viewBox={svgViewBox} className="max-w-xl">
        <defs>
          {Object.entries(loadColors).map(([cat, color]) => (
            <React.Fragment key={cat}>
              <marker id={`arrow-uniform-${cat}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>
              <marker id={`arrow-point-${cat}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={color} /></marker>
            </React.Fragment>
          ))}
          <marker id="arrow-dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" /></marker>
        </defs>

        {viewMode === 'input' ? renderInputMode() : renderResultsMode()}

        {/* Beam and Supports (common for both modes) */}
        <line x1={beamStartX} y1={beamY} x2={beamEndX} y2={beamY} stroke="#94a3b8" strokeWidth={viewMode === 'results' ? '1.5' : '4'} strokeDasharray={viewMode === 'results' ? '3 3' : 'none'} opacity={viewMode === 'results' ? 0.7 : 1} />
        <path d={`M ${beamStartX} ${beamY} L ${beamStartX - 10} ${beamY + 15} L ${beamStartX + 10} ${beamY + 15} Z`} fill="none" stroke="#94a3b8" strokeWidth="2" />
        <line x1={beamStartX - 15} y1={beamY + 20} x2={beamStartX + 15} y2={beamY + 20} stroke="#94a3b8" strokeWidth="2" />
        <path d={`M ${beamEndX} ${beamY} L ${beamEndX - 10} ${beamY + 15} L ${beamEndX + 10} ${beamY + 15} Z`} fill="none" stroke="#94a3b8" strokeWidth="2" />
        <circle cx={beamEndX - 5} cy={beamY + 20} r="3" fill="#94a3b8" /><circle cx={beamEndX + 5} cy={beamY + 20} r="3" fill="#94a3b8" />
        <line x1={beamEndX - 15} y1={beamY + 28} x2={beamEndX + 15} y2={beamY + 28} stroke="#94a3b8" strokeWidth="2" />

        {/* Length Dimension */}
        <line x1={beamStartX} y1={beamY + 50} x2={beamEndX} y2={beamY + 50} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
        <text x={(beamStartX + beamEndX) / 2} y={beamY + 45} fontFamily="sans-serif" fontSize="12" fill="#e2e8f0" textAnchor="middle">L = {length.toLocaleString('bg-BG')} m</text>
      </svg>
    </div>
  );
};

export default BeamDiagram;
