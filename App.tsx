
import React, { useState, useEffect } from 'react';
import InputGroup from './components/InputGroup.tsx';
import ResultCard from './components/ResultCard.tsx';
import BeamDiagram from './components/BeamDiagram.tsx';
import Graph from './components/Graph.tsx';
import CalculationsAccordion from './components/CalculationsAccordion.tsx';

interface Point {
  x: number;
  y: number;
}

export interface Results {
  moment: number | null;
  shear: number | null;
  deflection: number | null;
  deflection_m: number | null; // Deflection in meters for calculation display
  momentData: Point[];
  shearData: Point[];
  deflectionData: Point[];
}

const App: React.FC = () => {
  const [load, setLoad] = useState<string>('10');
  const [length, setLength] = useState<string>('5');
  const [modulus, setModulus] = useState<string>('210');
  const [inertia, setInertia] = useState<string>('5000');
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string>('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [deflectionLimitType, setDeflectionLimitType] = useState<'L/200' | 'L/250' | 'none'>('L/200');
  const [deflectionCheck, setDeflectionCheck] = useState<{ status: 'pass' | 'fail' | 'none'; limit: number | null }>({ status: 'none', limit: null });
  const [yScaleFactor, setYScaleFactor] = useState<string>('0.5');


  useEffect(() => {
    const calculateResults = () => {
      const w = parseFloat(load);
      const L = parseFloat(length);
      const E_GPa = parseFloat(modulus);
      const I_cm4 = parseFloat(inertia);

      if (isNaN(w) || isNaN(L) || isNaN(E_GPa) || isNaN(I_cm4) || w < 0 || L <= 0 || E_GPa <= 0 || I_cm4 <= 0) {
        setError('Моля, въведете валидни положителни числа за всички полета.');
        setResults(null);
        return;
      }
      setError('');

      const E = E_GPa * 1e6; // GPa to kN/m^2
      const I = I_cm4 * 1e-8; // cm^4 to m^4

      const maxMoment = (w * L * L) / 8;
      const maxShear = (w * L) / 2;
      const maxDeflection_m = (5 * w * Math.pow(L, 4)) / (384 * E * I);

      // Deflection Check
      let allowableDeflection: number | null = null;
      let status: 'pass' | 'fail' | 'none' = 'none';

      if (deflectionLimitType === 'L/200') {
        allowableDeflection = L / 200;
      } else if (deflectionLimitType === 'L/250') {
        allowableDeflection = L / 250;
      }

      if (allowableDeflection !== null) {
        status = maxDeflection_m <= allowableDeflection ? 'pass' : 'fail';
      }
      
      setDeflectionCheck({ status, limit: allowableDeflection });

      const points = 101;
      const momentData: Point[] = [];
      const shearData: Point[] = [];
      const deflectionData: Point[] = [];

      for (let i = 0; i < points; i++) {
        const x = (L / (points - 1)) * i;
        const shear = w * (L / 2 - x);
        const moment = (w * x / 2) * (L - x);
        const deflection = ((w * x) / (24 * E * I)) * (Math.pow(L, 3) - 2 * L * Math.pow(x, 2) + Math.pow(x, 3));
        shearData.push({ x, y: shear });
        momentData.push({ x, y: moment });
        deflectionData.push({ x, y: deflection * 1000 });
      }

      setResults({
        moment: maxMoment,
        shear: maxShear,
        deflection: maxDeflection_m * 1000,
        deflection_m: maxDeflection_m,
        momentData,
        shearData,
        deflectionData
      });
    };

    calculateResults();
  }, [load, length, modulus, inertia, deflectionLimitType]);

  const handleCardClick = (title: string) => {
    setExpandedCard(prev => (prev === title ? null : title));
  };

  const getExpandedGraphProps = () => {
    if (!results || !expandedCard) return null;
    
    const commonProps = {
        onClick: () => handleCardClick(expandedCard) // Add onClick here to close
    };

    switch(expandedCard) {
      case 'Макс. огъващ момент':
        return { ...commonProps, title: 'Огъващ момент', data: results.momentData, unit: 'kNm', invert: true };
      case 'Макс. срязваща сила':
        return { ...commonProps, title: 'Срязваща сила', data: results.shearData, unit: 'kN', invert: false };
      case 'Макс. провисване':
        return { ...commonProps, title: 'Провисване', data: results.deflectionData, unit: 'mm', invert: true };
      default:
        return null;
    }
  };

  const expandedGraphProps = getExpandedGraphProps();
  const inputs = { load, length, modulus, inertia };
  const scale = parseFloat(yScaleFactor);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-10 space-y-8 transform transition-all duration-500 main-container">
        
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">Калкулатор за Проста Греда</h1>
          <p className="text-slate-400 mt-2">Равномерно разпределено натоварване</p>
        </header>

        <div className="beam-diagram">
          <BeamDiagram />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 input-grid">
          <InputGroup 
            label="Равномерно натоварване (w)" 
            value={load} 
            onChange={e => setLoad(e.target.value)} 
            unit="kN/m"
            showSlider={true}
            min="1"
            max="50"
            step="0.5"
           />
          <InputGroup 
            label="Дължина на гредата (L)" 
            value={length} 
            onChange={e => setLength(e.target.value)} 
            unit="m" 
            showSlider={true}
            min="1"
            max="20"
            step="0.1"
          />
          <InputGroup label="Модул на еластичност (E)" value={modulus} onChange={e => setModulus(e.target.value)} unit="GPa" />
          <InputGroup label="Инерционен момент (I)" value={inertia} onChange={e => setInertia(e.target.value)} unit="cm⁴" />
        </div>
        
        {error && <p className="text-center text-red-400 mt-4">{error}</p>}
        
        {results && !error && (
          <div className="border-t-2 border-slate-700 pt-8 space-y-8">
            <div>
              <div className="flex justify-center items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-center text-cyan-400">Резултати</h2>
                <button 
                    onClick={() => window.print()}
                    className="print-button-container flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-cyan-400 font-bold py-1 px-3 rounded-lg transition-colors duration-200 text-sm"
                    aria-label="Принтирай или запази като PDF"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zM6 4h8v3H6V4zm8 5H6v6h8V9z" clipRule="evenodd" />
                    </svg>
                    <span>Принтирай</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 results-grid">
                <ResultCard 
                  title="Макс. огъващ момент" 
                  value={results.moment} 
                  unit="kNm" 
                  onClick={() => handleCardClick('Макс. огъващ момент')}
                  isExpanded={expandedCard === 'Макс. огъващ момент'}
                />
                <ResultCard 
                  title="Макс. срязваща сила" 
                  value={results.shear} 
                  unit="kN"
                  onClick={() => handleCardClick('Макс. срязваща сила')}
                  isExpanded={expandedCard === 'Макс. срязваща сила'}
                />
                <ResultCard 
                  title="Макс. провисване" 
                  value={results.deflection} 
                  unit="mm" 
                  onClick={() => handleCardClick('Макс. провисване')}
                  isExpanded={expandedCard === 'Макс. провисване'}
                  validationStatus={deflectionCheck.status}
                  limitValue={deflectionCheck.limit}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg deflection-check-controls">
                <h3 className="text-lg font-semibold text-center mb-3 text-cyan-400">Проверка на провисване</h3>
                <div className="flex justify-center items-center space-x-4 sm:space-x-6 text-slate-300">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="deflectionLimit" value="L/200" checked={deflectionLimitType === 'L/200'} onChange={() => setDeflectionLimitType('L/200')} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-2" />
                        <span>L / 200</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="deflectionLimit" value="L/250" checked={deflectionLimitType === 'L/250'} onChange={() => setDeflectionLimitType('L/250')} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-2" />
                        <span>L / 250</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="deflectionLimit" value="none" checked={deflectionLimitType === 'none'} onChange={() => setDeflectionLimitType('none')} className="w-4 h-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-2" />
                        <span>Без проверка</span>
                    </label>
                </div>
            </div>

             <div className="mt-6 p-4 bg-slate-900/50 rounded-lg scale-controls">
                <h3 className="text-lg font-semibold text-center mb-3 text-cyan-400">Мащаб на графиките (Y-ос)</h3>
                <div className="flex justify-center items-center space-x-4">
                    <span className="text-sm text-slate-400">Ниска</span>
                    <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={yScaleFactor}
                        onChange={(e) => setYScaleFactor(e.target.value)}
                        className="w-full max-w-xs h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-sm text-slate-400">Висока</span>
                </div>
            </div>
            
            <CalculationsAccordion
                isOpen={isAccordionOpen}
                onToggle={() => setIsAccordionOpen(!isAccordionOpen)}
                inputs={inputs}
                results={results}
            />

            {expandedGraphProps ? (
              <div className="w-full max-w-2xl mx-auto graphs-grid">
                 <Graph {...expandedGraphProps} yScaleFactor={scale} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 graphs-grid">
                  <Graph title="Огъващ момент" data={results.momentData} unit="kNm" invert={true} onClick={() => handleCardClick('Макс. огъващ момент')} yScaleFactor={scale} />
                  <Graph title="Срязваща сила" data={results.shearData} unit="kN" onClick={() => handleCardClick('Макс. срязваща сила')} yScaleFactor={scale} />
                  <Graph title="Провисване" data={results.deflectionData} unit="mm" invert={true} onClick={() => handleCardClick('Макс. провисване')} yScaleFactor={scale} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
