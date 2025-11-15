
import React from 'react';
import type { AllResults, AppInputs } from './LoadManager';
import { loadCategories } from './LoadManager';

interface CalculationsAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  inputs: AppInputs;
  allResults: AllResults | null;
}

const CalculationDetail: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`p-2 bg-slate-800 rounded-md calculation-detail ${className}`}>
        <h4 className="font-semibold text-cyan-400 text-sm">{title}</h4>
        <div className="mt-2 text-sm space-y-2 text-slate-300">
            {children}
        </div>
    </div>
);

const Formula: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <code className={`block text-xs bg-slate-900 p-2 rounded my-1 whitespace-pre-wrap break-all font-mono text-cyan-200 ${className}`}>
        {children}
    </code>
);

const EffectDetail: React.FC<{ title: string, formula: string, substitution: string, result: number, unit: string }> = ({title, formula, substitution, result, unit}) => (
    <div className='p-2 bg-slate-900/70 rounded'>
        <h5 className='font-semibold text-cyan-300 text-xs'>{title}</h5>
        <p className="text-xs">Формула: <Formula>{formula}</Formula></p>
        <p className="text-xs">Заместване: <Formula>{substitution}</Formula></p>
        <p className="text-xs">Резултат: <span className="font-mono font-bold text-white">{result.toFixed(2)} {unit}</span></p>
    </div>
);


const CalculationsAccordion: React.FC<CalculationsAccordionProps> = ({ isOpen, onToggle, inputs, allResults }) => {
    if (!allResults) return null;

    const { length, modulus, inertia } = inputs;
    const { ulsCombinations, slsCombinations, envelope, individualLoadEffects } = allResults;

    const L = parseFloat(length);
    const E_GPa = parseFloat(modulus);
    const I_cm4 = parseFloat(inertia);
    const E_kNm2 = E_GPa * 1e6;
    const I_m4 = I_cm4 * 1e-8;

    return (
        <div className="bg-slate-900/50 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-3 text-left font-semibold text-base text-cyan-400 hover:bg-slate-700/50 transition-colors duration-200 calculations-accordion-toggle"
                aria-expanded={isOpen}
                aria-controls="calculation-details"
            >
                <span>Детайлни изчисления</span>
                <svg className={`w-5 h-5 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div id="calculation-details" className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[20000px]' : 'max-h-0'}`}>
                <div className="p-3 border-t border-slate-700 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-center mb-3 text-cyan-400">1. Ефекти от единични товари</h3>
                        <div className="space-y-3">
                            {individualLoadEffects.map((effect, index) => (
                                <CalculationDetail key={effect.id} title={`Товар ${index + 1}: ${loadCategories[effect.category]}`}>
                                    <p className="text-xs">Стойност: <span className='font-mono text-white'>{effect.value} {effect.type === 'uniform' ? 'kN/m' : `kN @ ${effect.position} m`}</span></p>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mt-2">
                                        <EffectDetail title="Огъващ момент (M)" {...effect.maxMoment} unit="kNm" />
                                        <EffectDetail title="Срязваща сила (V)" {...effect.maxShear} unit="kN" />
                                        <EffectDetail title="Провисване (δ)" {...effect.maxDeflection} unit="mm" />
                                    </div>
                                </CalculationDetail>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-center mb-3 text-cyan-400">2. Комбинации за носеща способност (ULS)</h3>
                        {ulsCombinations.map((combo, index) => (
                           <CalculationDetail key={index} title={`Комбинация ULS-${index + 1}`}>
                               <p className="text-xs">Водещ променлив товар: <span className="font-bold text-white">{combo.leadingVariableCategory !== 'none' ? loadCategories[combo.leadingVariableCategory] : 'Няма'}</span></p>
                               <p className="text-xs">Формула:</p>
                               <Formula>{combo.formula}</Formula>
                               <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/50 text-xs">
                                   <p>M_max = <span className="font-mono text-white">{combo.maxMoment.toFixed(2)} kNm</span></p>
                                   <p>V_max = <span className="font-mono text-white">{combo.maxShear.toFixed(2)} kN</span></p>
                               </div>
                           </CalculationDetail>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-center my-3 text-cyan-400">3. Комбинации за експлоатационна годност (SLS)</h3>
                        {slsCombinations.map((combo, index) => (
                            <CalculationDetail key={index} title={`Комбинация SLS-${index + 1}`}>
                               <p className="text-xs">Водещ променлив товар: <span className="font-bold text-white">{combo.leadingVariableCategory !== 'none' ? loadCategories[combo.leadingVariableCategory] : 'Няма'}</span></p>
                               <p className="text-xs">Формула:</p>
                               <Formula>{combo.formula}</Formula>
                               <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs">
                                   <p>δ_max = <span className="font-mono text-white font-bold">{combo.maxDeflection.toFixed(2)} mm</span></p>
                               </div>
                            </CalculationDetail>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold text-center my-3 text-cyan-400">Крайни резултати (Обвивка)</h3>
                    <div className="p-2 bg-slate-800/50 rounded-md text-xs text-slate-300 text-center">
                       Показаните по-долу стойности са абсолютните максимуми (обвивка) от всички изчислени по-горе комбинации.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <CalculationDetail title="M_Ed,max">
                            <p className="font-bold text-white text-base">{envelope.moment.toFixed(2)} kNm</p>
                            <p className="text-xs text-slate-400 mt-1">От: {envelope.momentDescription}</p>
                        </CalculationDetail>
                         <CalculationDetail title="V_Ed,max">
                            <p className="font-bold text-white text-base">{envelope.shear.toFixed(2)} kN</p>
                            <p className="text-xs text-slate-400 mt-1">От: {envelope.shearDescription}</p>
                        </CalculationDetail>
                         <CalculationDetail title="δ_max">
                            <p className="font-bold text-white text-base">{envelope.deflection.toFixed(2)} mm</p>
                            <p className="text-xs text-slate-400 mt-1">От: {envelope.deflectionDescription}</p>
                        </CalculationDetail>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculationsAccordion;
