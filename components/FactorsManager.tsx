
import React from 'react';
import { LoadCategory, loadCategories, permanentCategories, variableCategories } from './LoadManager';

interface FactorsManagerProps {
    isOpen: boolean;
    onToggle: () => void;
    factors: Record<LoadCategory, number>;
    setFactors: (factors: Record<LoadCategory, number>) => void;
    combinationFactors: Record<LoadCategory, number>;
    setCombinationFactors: (factors: Record<LoadCategory, number>) => void;
}

const FactorInput: React.FC<{
    label: string,
    value: number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    symbol: string
}> = ({ label, value, onChange, symbol }) => (
    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none font-semibold">{symbol}</span>
            <input
                type="number"
                value={value}
                onChange={onChange}
                step="0.05"
                className="w-full bg-slate-700 border-2 border-slate-600 rounded-md py-2 pl-8 pr-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
        </div>
    </div>
);


const FactorsManager: React.FC<FactorsManagerProps> = ({ isOpen, onToggle, factors, setFactors, combinationFactors, setCombinationFactors }) => {

    const handleFactorChange = (category: LoadCategory, value: string, type: 'uls' | 'sls') => {
        const numericValue = parseFloat(value) || 0;
        if (type === 'uls') {
            setFactors({ ...factors, [category]: numericValue });
        } else {
            setCombinationFactors({ ...combinationFactors, [category]: numericValue });
        }
    };

    return (
        <div className="bg-slate-900/50 rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-cyan-400 hover:bg-slate-700/50 transition-colors duration-200"
                aria-expanded={isOpen}
                aria-controls="factors-details"
            >
                <span>Управление на коефициенти</span>
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
                id="factors-details"
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
            >
                <div className="p-4 border-t border-slate-700 space-y-6">
                    <div>
                        <h3 className="font-semibold text-cyan-300 mb-3">Коефициенти за сигурност (ULS) - γ</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {(Object.keys(loadCategories) as LoadCategory[]).map(cat => (
                                <FactorInput
                                    key={cat}
                                    label={loadCategories[cat]}
                                    value={factors[cat]}
                                    onChange={e => handleFactorChange(cat, e.target.value, 'uls')}
                                    symbol="γ"
                                />
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-cyan-300 mb-3">Комбинационни коефициенти (SLS) - ψ₀</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                             {variableCategories.map(cat => (
                                <FactorInput
                                    key={cat}
                                    label={loadCategories[cat]}
                                    value={combinationFactors[cat]}
                                    onChange={e => handleFactorChange(cat, e.target.value, 'sls')}
                                    symbol="ψ₀"
                                />
                            ))}
                        </div>
                         <p className="text-xs text-slate-500 mt-2">Коефициентите за постоянни товари (SW, DL) не са приложими.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FactorsManager;
