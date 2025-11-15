
import React from 'react';

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
  showSlider?: boolean;
  min?: string;
  max?: string;
  step?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, unit, showSlider = false, min = "0", max = "100", step = "1" }) => {
  // Prevent component from crashing if value is invalid during user input
  const validValue = isNaN(parseFloat(value)) ? min : value;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <div className="flex items-center">
          <input
            type="number"
            value={value}
            onChange={onChange}
            min={min}
            step={step}
            placeholder="0.00"
            className="w-full bg-slate-700 border-2 border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
          <span className="absolute right-3 text-slate-400 pointer-events-none">{unit}</span>
        </div>
      </div>
      {showSlider && (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={validValue}
            onChange={onChange}
            className="w-full h-2 mt-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      )}
    </div>
  );
};

export default InputGroup;
