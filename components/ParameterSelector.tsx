
import React from 'react';

interface ParameterFlag {
  isOutOfRange: boolean;
  trend: 'low' | 'high' | 'normal';
}

interface ParameterSelectorProps {
  parameters: string[];
  selectedParameter: string | null;
  onChange: (parameter: string) => void;
  parameterFlags: Record<string, ParameterFlag>;
}

const ParameterSelector: React.FC<ParameterSelectorProps> = ({ parameters, selectedParameter, onChange, parameterFlags }) => {
  return (
    <select
      id="parameterSelector"
      value={selectedParameter || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3 border border-slate-500 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-slate-600 text-slate-100 placeholder-slate-400"
      aria-label="Seleccionar parámetro de análisis"
    >
      {parameters.map((param) => {
        const flag = parameterFlags[param];
        let displaySuffix = '';
        if (flag && flag.isOutOfRange) {
          displaySuffix = flag.trend === 'low' ? ' ⬇️' : ' ⬆️';
        }
        return (
          <option key={param} value={param} className="bg-slate-600 text-slate-100">
            {param}{displaySuffix}
          </option>
        );
      })}
    </select>
  );
};

export default ParameterSelector;
