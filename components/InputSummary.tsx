import React, { useState } from 'react';
import type { AppInputs } from './LoadManager';
import { loadCategories } from './LoadManager';

interface InputSummaryProps {
  inputs: AppInputs;
}

const InputSummary: React.FC<InputSummaryProps> = ({ inputs }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { length, modulus, inertia, uniformLoads, pointLoads } = inputs;

  return (
    <div className="bg-slate-900/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-lg text-cyan-400 hover:bg-slate-700/50 transition-colors duration-200"
        aria-expanded={isOpen}
        aria-controls="input-summary-details"
      >
        <span>Резюме на входните данни</span>
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
        id="input-summary-details"
        className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}
      >
        <div className="p-4 border-t border-slate-700 space-y-4">
          {/* Beam Parameters */}
          <div className="p-3 bg-slate-800 rounded-md">
            <h4 className="font-semibold text-cyan-400 mb-2">Параметри на гредата</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <p>Дължина (L): <span className="font-mono text-white">{length}</span> m</p>
                <p>Модул (E): <span className="font-mono text-white">{modulus}</span> GPa</p>
                <p>Ин. момент (I): <span className="font-mono text-white">{inertia}</span> cm⁴</p>
            </div>
          </div>

          {/* Loads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-800 rounded-md">
              <h4 className="font-semibold text-cyan-400 mb-2">Равномерни товари</h4>
              {uniformLoads.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {uniformLoads.map(load => (
                    <li key={load.id} className="font-mono text-slate-300">
                      {loadCategories[load.category]}: <span className="text-white">{load.value} kN/m</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">Няма.</p>}
            </div>
             <div className="p-3 bg-slate-800 rounded-md">
              <h4 className="font-semibold text-cyan-400 mb-2">Концентрирани товари</h4>
              {pointLoads.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {pointLoads.map(load => (
                    <li key={load.id} className="font-mono text-slate-300">
                      {loadCategories[load.category]}: <span className="text-white">{load.value} kN</span> @ <span className="text-white">{load.a} m</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-500">Няма.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputSummary;
