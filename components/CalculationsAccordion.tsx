
import React from 'react';
import type { Results } from '../App';

interface AccordionInputs {
  load: string;
  length: string;
  modulus: string;
  inertia: string;
}

interface CalculationsAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  inputs: AccordionInputs;
  results: Results | null;
}

const CalculationDetail: React.FC<{ title: string; formula: React.ReactNode; substitution: React.ReactNode; result: React.ReactNode }> = ({ title, formula, substitution, result }) => (
    <div className="p-3 bg-slate-800 rounded-md calculation-detail">
        <h4 className="font-semibold text-cyan-400">{title}</h4>
        <div className="mt-2 text-sm space-y-1 text-slate-300">
            <p><span className="font-medium text-slate-400">Формула:</span> {formula}</p>
            <p><span className="font-medium text-slate-400">Заместване:</span> {substitution}</p>
            <p><span className="font-medium text-slate-400">Резултат:</span> <span className="font-bold text-white">{result}</span></p>
        </div>
    </div>
);


const CalculationsAccordion: React.FC<CalculationsAccordionProps> = ({ isOpen, onToggle, inputs, results }) => {
    if (!results) return null;

    const { load, length, modulus, inertia } = inputs;
    const { moment, shear, deflection_m } = results;

    const w = parseFloat(load);
    const L = parseFloat(length);
    const E_GPa = parseFloat(modulus);
    const I_cm4 = parseFloat(inertia);
    const E_kNm2 = E_GPa * 1e6;
    const I_m4 = I_cm4 * 1e-8;

    return (
        <div className="bg-slate-900/50 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-cyan-400 hover:bg-slate-700/50 transition-colors duration-200 calculations-accordion-toggle"
                aria-expanded={isOpen}
                aria-controls="calculation-details"
            >
                <span>Детайлни изчисления</span>
                <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                id="calculation-details"
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
            >
                <div className="p-4 border-t border-slate-700 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-800 rounded-md">
                           <h3 className="font-semibold text-cyan-400 mb-2">Входни данни</h3>
                           <ul className="text-sm space-y-1 text-slate-300">
                                <li>Равномерно натоварване (w): <span className="font-mono text-white">{w}</span> kN/m</li>
                                <li>Дължина на гредата (L): <span className="font-mono text-white">{L}</span> m</li>
                                <li>Модул на еластичност (E): <span className="font-mono text-white">{E_GPa}</span> GPa</li>
                                <li>Инерционен момент (I): <span className="font-mono text-white">{I_cm4}</span> cm⁴</li>
                           </ul>
                        </div>
                        <div className="p-3 bg-slate-800 rounded-md">
                           <h3 className="font-semibold text-cyan-400 mb-2">Преобразувани единици</h3>
                           <ul className="text-sm space-y-1 text-slate-300">
                                <li>E = <span className="font-mono text-white">{E_GPa}</span> GPa = <span className="font-mono text-white">{E_kNm2.toLocaleString('bg-BG')}</span> kN/m²</li>
                                <li>I = <span className="font-mono text-white">{I_cm4}</span> cm⁴ = <span className="font-mono text-white">{I_m4.toExponential(2)}</span> m⁴</li>
                           </ul>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold text-center mb-4 text-cyan-400">Формули и резултати</h3>
                        <div className="space-y-4">
                            <CalculationDetail 
                                title="Макс. огъващ момент (Mₘₐₓ)"
                                formula={<>Mₘₐₓ = (w · L²) / 8</>}
                                substitution={<>Mₘₐₓ = ({w} · {L}²) / 8</>}
                                result={<>{moment?.toFixed(3)} kNm</>}
                            />
                            <CalculationDetail 
                                title="Макс. срязваща сила (Vₘₐₓ)"
                                formula={<>Vₘₐₓ = (w · L) / 2</>}
                                substitution={<>Vₘₐₓ = ({w} · {L}) / 2</>}
                                result={<>{shear?.toFixed(3)} kN</>}
                            />
                            <CalculationDetail 
                                title="Макс. провисване (δₘₐₓ)"
                                formula={<>δₘₐₓ = (5 · w · L⁴) / (384 · E · I)</>}
                                substitution={<>δₘₐₓ = (5 · {w} · {L}⁴) / (384 · {E_kNm2.toLocaleString('bg-BG')} · {I_m4.toExponential(2)})</>}
                                result={<>{(deflection_m ?? 0).toExponential(3)} m = {(results.deflection ?? 0).toFixed(3)} mm</>}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculationsAccordion;