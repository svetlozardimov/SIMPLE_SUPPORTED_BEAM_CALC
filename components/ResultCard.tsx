
import React from 'react';

interface ResultCardProps {
  title: string;
  value: number | null;
  unit: string;
  onClick: () => void;
  isExpanded: boolean;
  validationStatus?: 'pass' | 'fail' | 'none';
  limitValue?: number | null;
  combinationDescription?: string;
}

const PassIcon: React.FC = () => (
    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
);
const FailIcon: React.FC = () => (
    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
);

const ResultCard: React.FC<ResultCardProps> = ({ title, value, unit, onClick, isExpanded, validationStatus = 'none', limitValue = null, combinationDescription }) => {
  const formattedValue = value !== null ? value.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---';

  const baseClasses = 'relative bg-slate-700/50 rounded-lg p-3 text-center cursor-pointer transition-all duration-300 result-card flex flex-col justify-between';
  const hoverClasses = 'hover:scale-105 hover:bg-slate-700';
  
  const validationRingClasses = {
    'pass': 'ring-green-500/80',
    'fail': 'ring-red-500/80',
    'none': 'ring-transparent'
  };

  const expandedClasses = 'scale-105 ring-2 ring-cyan-400 bg-slate-700';
  const inactiveClasses = `${hoverClasses} ring-2 ${validationRingClasses[validationStatus]}`;

  return (
    <div 
      onClick={onClick}
      className={`${baseClasses} ${isExpanded ? expandedClasses : inactiveClasses}`}
    >
      <div>
        <h3 className="text-xs font-medium text-slate-400">{title}</h3>
        <div className="flex items-center justify-center gap-1 h-8 my-1">
            {validationStatus === 'pass' && <PassIcon />}
            {validationStatus === 'fail' && <FailIcon />}
            <p className="text-xl font-bold text-cyan-400">
              {formattedValue} <span className="text-base text-slate-300">{unit}</span>
            </p>
        </div>
         {limitValue !== null && validationStatus !== 'none' && (
            <p className={`text-xs ${validationStatus === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                Доп: {(limitValue * 1000).toFixed(2)} mm
            </p>
        )}
      </div>
       {combinationDescription && (
        <div className="mt-1 pt-1 border-t border-slate-600/50">
            <p className="text-xs text-slate-400">{combinationDescription}</p>
        </div>
       )}
    </div>
  );
};

export default ResultCard;
