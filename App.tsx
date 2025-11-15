


import React, { useState, useEffect, useRef } from 'react';
import InputGroup from './components/InputGroup.tsx';
import ResultCard from './components/ResultCard.tsx';
import BeamDiagram from './components/BeamDiagram.tsx';
import Graph from './components/Graph.tsx';
import CalculationsAccordion from './components/CalculationsAccordion.tsx';
import LoadManager from './components/LoadManager.tsx';
import FactorsManager from './components/FactorsManager.tsx';
import InputSummary from './components/InputSummary.tsx';
import type { Load, PointLoad, LoadCategory, Point, CombinationResult, EnvelopeResults, AllResults, AppInputs, IndividualLoadEffect } from './components/LoadManager.tsx';
import { defaultLoadFactors, defaultCombinationFactors, permanentCategories, variableCategories } from './components/LoadManager.tsx';


const App: React.FC = () => {
  // State for inputs
  const [uniformLoads, setUniformLoads] = useState<Load[]>([
      { id: `load-${Date.now()}`, category: 'SW', value: '1' },
      { id: `load-${Date.now()+1}`, category: 'LL', value: '5' }
  ]);
  const [pointLoads, setPointLoads] = useState<PointLoad[]>([
      { id: `load-${Date.now()+2}`, category: 'LL', value: '100', a: '3.00' }
  ]);
  const [length, setLength] = useState<string>('6');
  const [modulus, setModulus] = useState<string>('210');
  const [inertia, setInertia] = useState<string>('500');
  const [factors, setFactors] = useState<Record<LoadCategory, number>>(defaultLoadFactors);
  const [combinationFactors, setCombinationFactors] = useState<Record<LoadCategory, number>>(defaultCombinationFactors);

  // State for results and UI control
  const [allResults, setAllResults] = useState<AllResults | null>(null);
  const [error, setError] = useState<string>('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isFactorsAccordionOpen, setIsFactorsAccordionOpen] = useState(false);
  const [deflectionLimitType, setDeflectionLimitType] = useState<'L/200' | 'L/250' | 'none'>('L/200');
  const [deflectionCheck, setDeflectionCheck] = useState<{ status: 'pass' | 'fail' | 'none'; limit: number | null }>({ status: 'none', limit: null });
  const [yScaleFactor, setYScaleFactor] = useState<string>('0.5');
  
  // View mode state
  const [viewMode, setViewMode] = useState<'input' | 'results'>('input');
  const fileInputRef = useRef<HTMLInputElement>(null);


    const runCalculations = (): boolean => {
        try {
            const L = parseFloat(length);
            const E_GPa = parseFloat(modulus);
            const I_cm4 = parseFloat(inertia);

            const allInputs = { 'length': L, 'E': E_GPa, 'I': I_cm4 };
            for (const [key, v] of Object.entries(allInputs)) {
                if (isNaN(v) || v <= 0) {
                     setError('Моля, въведете валидни положителни числа за L, E, I.');
                     setAllResults(null);
                     return true; // Error occurred
                }
            }

            for (const pLoad of pointLoads) {
                const a = parseFloat(pLoad.a);
                if (isNaN(a) || a < 0 || a > L) {
                    setError(`Разстоянието "a" за точков товар трябва да бъде между 0 и ${L}.`);
                    setAllResults(null);
                    return true; // Error occurred
                }
            }
            setError('');

            const E = E_GPa * 1e6; // GPa to kN/m^2
            const I = I_cm4 * 1e-8; // cm^4 to m^4
            const points = 101;
            const x_coords = Array(points).fill(0).map((_, i) => (L / (points - 1)) * i);
            const zeros = Array(points).fill(0).map((_, i) => ({ x: x_coords[i], y: 0 }));

            const add = (arr1: Point[], arr2: Point[]) => arr1.map((p, i) => ({ x: p.x, y: p.y + arr2[i].y }));
            const scale = (arr: Point[], factor: number) => arr.map(p => ({ x: p.x, y: p.y * factor }));
            const getMaxAbs = (data: Point[]) => Math.max(...data.map(p => Math.abs(p.y)));

            type Effects = { momentData: Point[], shearData: Point[], deflectionData: Point[] };
            const effectsByCategory: Map<LoadCategory, Effects> = new Map();
            const activeCategories = new Set<LoadCategory>();
            const individualLoadEffects: IndividualLoadEffect[] = [];

            [...uniformLoads, ...pointLoads].forEach(load => {
                const val = parseFloat(load.value) || 0;
                if (val === 0) return;
                activeCategories.add(load.category);

                let m: Point[] = zeros.map(p => ({ ...p }));
                let s: Point[] = zeros.map(p => ({ ...p }));
                let d: Point[] = zeros.map(p => ({ ...p }));
                
                if ('a' in load) {
                    const P = val; const a = parseFloat(load.a); const b = L - a;
                    const RA = (P * b) / L; const RB = (P * a) / L;
                    for (let i = 0; i < points; i++) {
                        const x = x_coords[i];
                        if (x <= a) { s[i].y += RA; m[i].y += RA * x; d[i].y += ((P * b * x) / (6 * E * I * L)) * (L*L - b*b - x*x) * 1000; }
                        else { s[i].y -= RB; m[i].y += RA * a - RB * (x-a); d[i].y += ((P * a * (L-x)) / (6 * E * I * L)) * (2*L*x - x*x - a*a) * 1000; }
                    }
                     individualLoadEffects.push({
                        id: load.id, type: 'point', category: load.category, value: P, position: a,
                        maxMoment: { formula: 'P * a * b / L', substitution: `${P.toFixed(2)} * ${a.toFixed(2)} * ${b.toFixed(2)} / ${L.toFixed(2)}`, result: (P * a * b) / L },
                        maxShear: { formula: 'max(P*b/L, P*a/L)', substitution: `max(${(RA).toFixed(2)}, ${(RB).toFixed(2)})`, result: Math.max(RA, RB) },
                        maxDeflection: { formula: 'f(P, a, L, E, I)', substitution: `Изчислено числено`, result: getMaxAbs(d) },
                    });
                } else {
                    const w = val;
                    for (let i = 0; i < points; i++) {
                        const x = x_coords[i];
                        s[i].y += w * (L / 2 - x);
                        m[i].y += (w * x / 2) * (L - x);
                        d[i].y += ((w * x) / (24 * E * I)) * (L**3 - 2 * L * x**2 + x**3) * 1000;
                    }
                     individualLoadEffects.push({
                        id: load.id, type: 'uniform', category: load.category, value: w,
                        maxMoment: { formula: 'w * L² / 8', substitution: `${w.toFixed(2)} * ${L.toFixed(2)}² / 8`, result: (w * L**2) / 8 },
                        maxShear: { formula: 'w * L / 2', substitution: `${w.toFixed(2)} * ${L.toFixed(2)} / 2`, result: (w * L) / 2 },
                        maxDeflection: { formula: '5 * w * L⁴ / (384 * E * I)', substitution: `5 * ${w.toFixed(2)} * ${L.toFixed(2)}⁴ / (384 * ${E.toExponential(2)} * ${I.toExponential(2)})`, result: (5 * w * L**4) / (384 * E * I) * 1000 },
                    });
                }

                if (!effectsByCategory.has(load.category)) {
                    effectsByCategory.set(load.category, { momentData: zeros.map(p => ({ ...p })), shearData: zeros.map(p => ({ ...p })), deflectionData: zeros.map(p => ({ ...p })) });
                }
                const existing = effectsByCategory.get(load.category)!;
                existing.momentData = add(existing.momentData, m);
                existing.shearData = add(existing.shearData, s);
                existing.deflectionData = add(existing.deflectionData, d);
            });
            
            const activePermanentCats = permanentCategories.filter(c => activeCategories.has(c));
            const activeVariableCats = variableCategories.filter(c => activeCategories.has(c));
            const ulsCombinations: CombinationResult[] = [];
            const slsCombinations: CombinationResult[] = [];

            const baseUlsEffects = {
                momentData: activePermanentCats.reduce((acc, cat) => add(acc, scale(effectsByCategory.get(cat)!.momentData, factors[cat])), zeros.map(p => ({ ...p }))),
                shearData: activePermanentCats.reduce((acc, cat) => add(acc, scale(effectsByCategory.get(cat)!.shearData, factors[cat])), zeros.map(p => ({ ...p }))),
            };

            const generateCombinations = (list: LoadCategory[], calculateFn: (leading: LoadCategory | 'none') => void) => {
                if (list.length === 0 && activePermanentCats.length > 0) {
                     calculateFn('none');
                } else if (list.length > 0) {
                    list.forEach(leadingCat => calculateFn(leadingCat));
                } else if (list.length === 0 && activePermanentCats.length === 0) {
                     // No loads at all
                } else { // only permanent loads
                     calculateFn('none');
                }
            };

            generateCombinations(activeVariableCats, (leadingCat) => {
                let comboM = baseUlsEffects.momentData.map(p => ({...p}));
                let comboS = baseUlsEffects.shearData.map(p => ({...p}));
                let formulaParts = activePermanentCats.map(c => `${factors[c]}*${c}`);

                if (leadingCat !== 'none') {
                    comboM = add(comboM, scale(effectsByCategory.get(leadingCat)!.momentData, factors[leadingCat]));
                    comboS = add(comboS, scale(effectsByCategory.get(leadingCat)!.shearData, factors[leadingCat]));
                    formulaParts.push(`${factors[leadingCat]}*${leadingCat}`);

                    activeVariableCats.forEach(otherCat => {
                        if (otherCat === leadingCat) return;
                        const factor = factors[otherCat] * combinationFactors[otherCat];
                        comboM = add(comboM, scale(effectsByCategory.get(otherCat)!.momentData, factor));
                        comboS = add(comboS, scale(effectsByCategory.get(otherCat)!.shearData, factor));
                        formulaParts.push(`${factors[otherCat]}*${combinationFactors[otherCat]}*${otherCat}`);
                    });
                }
                
                ulsCombinations.push({
                    leadingVariableCategory: leadingCat,
                    description: `ULS: Водещ ${leadingCat !== 'none' ? leadingCat : 'само пост.'}`,
                    formula: formulaParts.join(' + '),
                    momentData: comboM, shearData: comboS, deflectionData: zeros.map(p => ({ ...p })),
                    maxMoment: getMaxAbs(comboM), maxShear: getMaxAbs(comboS), maxDeflection: 0,
                });
            });
            
            const baseSlsDeflection = activePermanentCats.reduce((acc, cat) => add(acc, effectsByCategory.get(cat)!.deflectionData), zeros.map(p => ({ ...p })));
            
            generateCombinations(activeVariableCats, (leadingCat) => {
                let comboD = baseSlsDeflection.map(p => ({...p}));
                const formulaParts: string[] = activePermanentCats.map(c => c);

                if(leadingCat !== 'none'){
                    comboD = add(comboD, effectsByCategory.get(leadingCat)!.deflectionData);
                    formulaParts.push(leadingCat);

                    activeVariableCats.forEach(otherCat => {
                        if (otherCat === leadingCat) return;
                        const factor = combinationFactors[otherCat];
                        comboD = add(comboD, scale(effectsByCategory.get(otherCat)!.deflectionData, factor));
                        formulaParts.push(`${factor}*${otherCat}`);
                    });
                }

                slsCombinations.push({
                    leadingVariableCategory: leadingCat,
                    description: `SLS: Водещ ${leadingCat !== 'none' ? leadingCat : 'само пост.'}`,
                    formula: formulaParts.join(' + '),
                    momentData: zeros.map(p => ({ ...p })), shearData: zeros.map(p => ({ ...p })), deflectionData: comboD,
                    maxMoment: 0, maxShear: 0, maxDeflection: getMaxAbs(comboD),
                });
            });

            if (ulsCombinations.length === 0 && slsCombinations.length === 0) {
                 setError("Моля, добавете поне едно натоварване.");
                 setAllResults(null);
                 return true;
            }

            const momentEnvelopeData = x_coords.map((x, i) => ({ x, y: ulsCombinations.reduce((max, c) => Math.abs(c.momentData[i].y) > Math.abs(max) ? c.momentData[i].y : max, 0) }));
            const shearEnvelopeData = x_coords.map((x, i) => ({ x, y: ulsCombinations.reduce((max, c) => Math.abs(c.shearData[i].y) > Math.abs(max) ? c.shearData[i].y : max, 0) }));
            const deflectionEnvelopeData = x_coords.map((x, i) => ({ x, y: slsCombinations.reduce((max, c) => Math.abs(c.deflectionData[i].y) > Math.abs(max) ? c.deflectionData[i].y : max, 0) }));

            const envelope: EnvelopeResults = {
                moment: 0, shear: 0, deflection: 0, deflection_m: 0,
                momentData: momentEnvelopeData, shearData: shearEnvelopeData, deflectionData: deflectionEnvelopeData,
                momentDescription: '', shearDescription: '', deflectionDescription: ''
            };

            if (ulsCombinations.length > 0) {
                const maxM_combo = ulsCombinations.reduce((a, b) => a.maxMoment > b.maxMoment ? a : b);
                const maxV_combo = ulsCombinations.reduce((a, b) => a.maxShear > b.maxShear ? a : b);
                envelope.moment = maxM_combo.maxMoment;
                envelope.shear = maxV_combo.maxShear;
                envelope.momentDescription = maxM_combo.description;
                envelope.shearDescription = maxV_combo.description;
            }

            if (slsCombinations.length > 0) {
                const maxD_combo = slsCombinations.reduce((a, b) => a.maxDeflection > b.maxDeflection ? a : b);
                envelope.deflection = maxD_combo.maxDeflection;
                envelope.deflection_m = maxD_combo.maxDeflection / 1000;
                envelope.deflectionDescription = maxD_combo.description;
            }
            
            setAllResults({ ulsCombinations, slsCombinations, envelope, individualLoadEffects });

            return false; // Success
        } catch (error: unknown) {
            console.error("Calculation Error:", error);
            if (error instanceof Error) {
                setError(`Възникна грешка: ${error.message}`);
            } else {
                setError("Възникна неочаквана грешка при изчислението. Моля, проверете входните данни.");
            }
            setAllResults(null);
            return true; // Error occurred
        }
    };
    
    // Effect to update deflection check when limit type or results change
    useEffect(() => {
        if (!allResults) return;
        const L = parseFloat(length);
        if (isNaN(L) || L <= 0) return;

        let allowableDeflection: number | null = null;
        let status: 'pass' | 'fail' | 'none' = 'none';

        if (deflectionLimitType === 'L/200') allowableDeflection = L / 200;
        else if (deflectionLimitType === 'L/250') allowableDeflection = L / 250;
        
        if (allowableDeflection !== null) {
            status = allResults.envelope.deflection_m <= allowableDeflection ? 'pass' : 'fail';
        }
        setDeflectionCheck({ status, limit: allowableDeflection });
    }, [deflectionLimitType, allResults, length]);


    const handleSolve = () => {
        const hasError = runCalculations();
        if (!hasError) {
            setIsAccordionOpen(false); // Ensure details are collapsed by default
            setViewMode('results');
        }
    };

    const handleEdit = () => {
        setViewMode('input');
        setExpandedCard(null); // Reset expanded card when going back
    };
  
    const handleCardClick = (title: string) => {
        setExpandedCard(prev => (prev === title ? null : title));
    };
  
    const getExpandedGraphProps = () => {
        if (!allResults || !expandedCard) return null;
        const { envelope } = allResults;
        const commonProps = { onClick: () => handleCardClick(expandedCard) };
        switch(expandedCard) {
            case 'Макс. огъващ момент': return { ...commonProps, title: 'Огъващ момент', data: envelope.momentData, unit: 'kNm', invert: true };
            case 'Макс. срязваща сила': return { ...commonProps, title: 'Срязваща сила', data: envelope.shearData, unit: 'kN', invert: false };
            case 'Макс. провисване': return { ...commonProps, title: 'Провисване', data: envelope.deflectionData, unit: 'mm', invert: true };
            default: return null;
        }
    };

    const handleSave = () => {
        const dataToSave = {
            uniformLoads,
            pointLoads,
            length,
            modulus,
            inertia,
            factors,
            combinationFactors,
        };
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beam-calculator-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleOpen = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                const data = JSON.parse(text);

                // Basic validation
                if (data.uniformLoads && data.pointLoads && data.length) {
                    setUniformLoads(data.uniformLoads);
                    setPointLoads(data.pointLoads);
                    setLength(data.length);
                    setModulus(data.modulus || '210');
                    setInertia(data.inertia || '500');
                    setFactors(data.factors || defaultLoadFactors);
                    setCombinationFactors(data.combinationFactors || defaultCombinationFactors);
                    setError('');
                } else {
                    throw new Error("Invalid or incomplete data in file.");
                }
            } catch (err) {
                console.error("Failed to load file:", err);
                setError(err instanceof Error ? `Грешка при зареждане на файл: ${err.message}` : "Невалиден файлов формат.");
            }
        };
        reader.onerror = () => {
             setError("Файлът не може да бъде прочетен.");
        };
        reader.readAsText(file);
        
        // Reset file input value to allow loading the same file again
        event.target.value = '';
    };

    const expandedGraphProps = getExpandedGraphProps();
    const inputs: AppInputs = { uniformLoads, pointLoads, length, modulus, inertia, factors, combinationFactors };
    const scale = parseFloat(yScaleFactor);
    const L_num = parseFloat(length);
    const safe_L = !isNaN(L_num) && L_num > 0 ? L_num : 6;

    const ActionButton = () => (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 z-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none">
            <div className="flex justify-center pointer-events-auto">
                 {viewMode === 'input' ? (
                     <button onClick={handleSolve} className="flex items-center gap-3 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 px-8 rounded-full shadow-lg shadow-cyan-500/30 transform hover:scale-105 transition-all duration-300">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                         <span>Реши</span>
                     </button>
                 ) : (
                     <button onClick={handleEdit} className="flex items-center gap-3 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                         <span>Редактирай данни</span>
                     </button>
                 )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-10 space-y-8 transform transition-all duration-500 main-container mb-24"> {/* Add margin bottom for button */}
                
                {viewMode === 'input' ? (
                    <>
                        <header className="text-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">Калкулатор за Проста Греда</h1>
                            <p className="text-slate-400 mt-2">Въведете параметри и товари</p>
                             <div className="flex justify-center gap-4 mt-4">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                                <button onClick={handleSave} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold py-1 px-3 rounded-lg transition-colors duration-200 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-3.5-3.5V6a1 1 0 012 0v6.5a1.5 1.5 0 103 0V6a1 1 0 012 0v6.5a3.5 3.5 0 01-3.5 3.5zM16.5 6a1 1 0 01-2 0V4.5a1.5 1.5 0 10-3 0V10a1 1 0 11-2 0V4.5A3.5 3.5 0 0113 1a3.5 3.5 0 013.5 3.5V6z" /></svg>
                                    Запази
                                </button>
                                <button onClick={handleOpen} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold py-1 px-3 rounded-lg transition-colors duration-200 text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                                    Отвори
                                </button>
                            </div>
                        </header>

                        <div className="beam-diagram">
                            <BeamDiagram 
                                uniformLoads={uniformLoads} 
                                pointLoads={pointLoads} 
                                length={safe_L} 
                                viewMode="input"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 input-grid">
                            <LoadManager type="uniform" loads={uniformLoads} setLoads={setUniformLoads} unit="kN/m" label="Равномерно разпределени товари" />
                            <LoadManager type="point" loads={pointLoads} setLoads={setPointLoads} unit="kN" label="Концентрирани товари" beamLength={safe_L} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 input-grid">
                            <InputGroup label="Дължина на гредата (L)" value={length} onChange={e => setLength(e.target.value)} unit="m" showSlider={true} min="1" max="20" step="0.1" />
                            <InputGroup label="Модул на еластичност (E)" value={modulus} onChange={e => setModulus(e.target.value)} unit="GPa" />
                            <InputGroup label="Инерционен момент (I)" value={inertia} onChange={e => setInertia(e.target.value)} unit="cm⁴" />
                        </div>
                        
                        <FactorsManager
                            isOpen={isFactorsAccordionOpen}
                            onToggle={() => setIsFactorsAccordionOpen(!isFactorsAccordionOpen)}
                            factors={factors}
                            setFactors={setFactors}
                            combinationFactors={combinationFactors}
                            setCombinationFactors={setCombinationFactors}
                        />

                        {error && <p className="text-center text-red-400 my-4">{error}</p>}
                    </>
                ) : (
                    allResults && !error && (
                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-center items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-semibold text-center text-cyan-400">Резултати (Обвивка)</h2>
                                    <button 
                                        onClick={() => window.print()}
                                        className="print-button-container flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                                        aria-label="Принтирай или запази като PDF"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zM6 4h8v3H6V4zm8 5H6v6h8V9z" clipRule="evenodd" /></svg>
                                        <span>Експорт / Принтирай</span>
                                    </button>
                                </div>
                                <div className="mb-6">
                                    <BeamDiagram 
                                        viewMode="results"
                                        results={allResults.envelope}
                                        length={safe_L}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 results-grid">
                                    <ResultCard title="Макс. огъващ момент" value={allResults.envelope.moment} unit="kNm" onClick={() => handleCardClick('Макс. огъващ момент')} isExpanded={expandedCard === 'Макс. огъващ момент'} combinationDescription={allResults.envelope.momentDescription} />
                                    <ResultCard title="Макс. срязваща сила" value={allResults.envelope.shear} unit="kN" onClick={() => handleCardClick('Макс. срязваща сила')} isExpanded={expandedCard === 'Макс. срязваща сила'} combinationDescription={allResults.envelope.shearDescription} />
                                    <ResultCard title="Макс. провисване" value={allResults.envelope.deflection} unit="mm" onClick={() => handleCardClick('Макс. провисване')} isExpanded={expandedCard === 'Макс. провисване'} validationStatus={deflectionCheck.status} limitValue={deflectionCheck.limit} combinationDescription={allResults.envelope.deflectionDescription} />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/50 rounded-lg deflection-check-controls">
                                <h3 className="text-lg font-semibold text-center mb-3 text-cyan-400">Проверка на провисване</h3>
                                <div className="flex justify-center items-center space-x-4 sm:space-x-6 text-slate-300">
                                    <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="deflectionLimit" value="L/200" checked={deflectionLimitType === 'L/200'} onChange={(e) => setDeflectionLimitType('L/200')} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-2" /><span>L / 200</span></label>
                                    <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="deflectionLimit" value="L/250" checked={deflectionLimitType === 'L/250'} onChange={(e) => setDeflectionLimitType('L/250')} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-2" /><span>L / 250</span></label>
                                    <label className="flex items-center space-x-2 cursor-pointer"><input type="radio" name="deflectionLimit" value="none" checked={deflectionLimitType === 'none'} onChange={(e) => setDeflectionLimitType('none')} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-2" /><span>Без проверка</span></label>
                                </div>
                            </div>
                            
                            <InputSummary inputs={inputs} />
                            
                            <div className="bg-slate-900/50 rounded-lg p-4 space-y-4">
                               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <h3 className="text-lg font-semibold text-center sm:text-left text-cyan-400">Графики на усилия и провисване</h3>
                                    <div className="flex items-center space-x-2 w-full sm:w-auto max-w-xs">
                                        <span className="text-sm text-slate-400">Мащаб Y</span>
                                        <input type="range" min="0.1" max="2" step="0.1" value={yScaleFactor} onChange={(e) => setYScaleFactor(e.target.value)} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                    </div>
                                </div>

                                {expandedGraphProps ? (
                                  <div className="w-full max-w-2xl mx-auto graphs-grid">
                                     <Graph {...expandedGraphProps} yScaleFactor={scale} />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 graphs-grid">
                                      <Graph title="Огъващ момент" data={allResults.envelope.momentData} unit="kNm" invert={true} onClick={() => handleCardClick('Макс. огъващ момент')} yScaleFactor={scale} />
                                      <Graph title="Срязваща сила" data={allResults.envelope.shearData} unit="kN" onClick={() => handleCardClick('Макс. срязваща сила')} yScaleFactor={scale} />
                                      <Graph title="Провисване" data={allResults.envelope.deflectionData} unit="mm" invert={true} onClick={() => handleCardClick('Макс. провисване')} yScaleFactor={scale} />
                                  </div>
                                )}
                            </div>
                            
                            <CalculationsAccordion isOpen={isAccordionOpen} onToggle={() => setIsAccordionOpen(!isAccordionOpen)} inputs={inputs} allResults={allResults} />

                        </div>
                    )
                )}
            </div>
            <ActionButton />
        </div>
    );
};

export default App;
