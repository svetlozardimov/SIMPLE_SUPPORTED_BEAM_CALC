import React from 'react';
import InputGroup from './InputGroup';

export type LoadCategory = 'SW' | 'DL' | 'LL' | 'SNOW' | 'WIND';

export interface Load {
  id: string;
  category: LoadCategory;
  value: string;
}

export interface PointLoad extends Load {
  a: string;
}

// Fix: Add shared types here to break circular dependency
export interface Point {
  x: number;
  y: number;
}

export interface CombinationResult {
    leadingVariableCategory: LoadCategory | 'none';
    description: string;
    formula: string;
    momentData: Point[];
    shearData: Point[];
    deflectionData: Point[];
    maxMoment: number;
    maxShear: number;
    maxDeflection: number;
}

export interface EnvelopeResults {
    moment: number;
    shear: number;
    deflection: number;
    deflection_m: number;
    momentData: Point[];
    shearData: Point[];
    deflectionData: Point[];
    momentDescription: string;
    shearDescription: string;
    deflectionDescription: string;
}

export interface FormulaSet {
    formula: string;
    substitution: string;
    result: number;
}

export interface IndividualLoadEffect {
    id: string;
    type: 'uniform' | 'point';
    category: LoadCategory;
    value: number;
    position?: number;
    maxMoment: FormulaSet;
    maxShear: FormulaSet;
    maxDeflection: FormulaSet;
}


export interface AllResults {
    ulsCombinations: CombinationResult[];
    slsCombinations: CombinationResult[];
    envelope: EnvelopeResults;
    individualLoadEffects: IndividualLoadEffect[];
}

export interface AppInputs {
  uniformLoads: Load[];
  pointLoads: PointLoad[];
  length: string;
  modulus: string;
  inertia: string;
  factors: Record<LoadCategory, number>;
  combinationFactors: Record<LoadCategory, number>;
}


export const loadCategories: Record<LoadCategory, string> = {
    SW: 'Собствено тегло (SW)',
    DL: 'Постоянен товар (DL)',
    LL: 'Подвижен товар (LL)',
    SNOW: 'Сняг (SNOW)',
    WIND: 'Вятър (WIND)',
};

export const defaultLoadFactors: Record<LoadCategory, number> = {
    SW: 1.35,
    DL: 1.35,
    LL: 1.5,
    SNOW: 1.5,
    WIND: 1.5,
};

// Eurocode combination factors (psi_0) for buildings
export const defaultCombinationFactors: Record<LoadCategory, number> = {
    SW: 0, // Not applicable
    DL: 0, // Not applicable
    LL: 0.7, // Category A, B, C
    SNOW: 0.6, 
    WIND: 0.5, 
};

export const permanentCategories: LoadCategory[] = ['SW', 'DL'];
export const variableCategories: LoadCategory[] = ['LL', 'SNOW', 'WIND'];


interface LoadManagerProps {
    type: 'uniform' | 'point';
    loads: (Load | PointLoad)[];
    setLoads: React.Dispatch<React.SetStateAction<any[]>>;
    unit: string;
    label: string;
    beamLength?: number;
}

const LoadManager: React.FC<LoadManagerProps> = ({ type, loads, setLoads, unit, label, beamLength = 1 }) => {

    const handleAddLoad = () => {
        const newLoad: Load | PointLoad = 
            type === 'point' 
            ? { id: `load-${Date.now()}`, category: 'LL', value: '0', a: (beamLength / 2).toFixed(2) }
            : { id: `load-${Date.now()}`, category: 'LL', value: '0' };
        setLoads(prev => [...prev, newLoad]);
    };

    const handleRemoveLoad = (id: string) => {
        setLoads(prev => prev.filter(load => load.id !== id));
    };

    const handleUpdateLoad = (id: string, field: 'category' | 'value' | 'a', newValue: string) => {
        setLoads(prev => prev.map(load => 
            load.id === id 
                ? { ...load, [field]: newValue } 
                : load
        ));
    };

    return (
        <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg h-full flex flex-col">
            <label className="block text-lg font-semibold text-cyan-400">{label}</label>
            <div className='space-y-3 flex-grow'>
                {loads.map((load) => (
                    <div key={load.id} className="space-y-2">
                        <div className="grid grid-cols-[1fr,auto] gap-2 items-center">
                            <select
                                value={load.category}
                                onChange={(e) => handleUpdateLoad(load.id, 'category', e.target.value)}
                                className="w-full bg-slate-700 border-2 border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm"
                            >
                                {Object.entries(loadCategories).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => handleRemoveLoad(load.id)}
                                className="p-2 bg-slate-700 hover:bg-red-500/80 rounded-md text-slate-400 hover:text-white transition-colors duration-200"
                                aria-label="Премахни натоварване"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className={`grid ${type === 'point' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={load.value}
                                    onChange={(e) => handleUpdateLoad(load.id, 'value', e.target.value)}
                                    min="0"
                                    step="0.1"
                                    placeholder="0.00"
                                    className="w-full bg-slate-700 border-2 border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{unit}</span>
                            </div>
                            {type === 'point' && (
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(load as PointLoad).a}
                                        onChange={(e) => handleUpdateLoad(load.id, 'a', e.target.value)}
                                        min="0"
                                        max={beamLength}
                                        step="0.1"
                                        placeholder="a"
                                        className="w-full bg-slate-700 border-2 border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">m</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 {loads.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">Няма добавени товари.</div>
                )}
            </div>
            <div className="mt-4 border-t border-slate-700 pt-4">
                 <button
                    onClick={handleAddLoad}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Добави натоварване
                </button>
            </div>
        </div>
    );
};

export default LoadManager;