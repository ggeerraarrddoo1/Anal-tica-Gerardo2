
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ParameterSelector from './components/ParameterSelector';
import EvolutionChart from './components/EvolutionChart';
import DescriptionBox from './components/DescriptionBox';
import { BLOOD_TEST_DATA, GENERAL_REF_RANGES, PREDEFINED_DESCRIPTIONS } from './constants';
import { fetchParameterDescriptionFromAPI } from './services/geminiService';
import { BloodTestDataPoint } from './types';
import { parseDateValue, parseRefRangeString } from './utils/chartUtils';

interface ParameterStatus {
  isOutOfRange: boolean;
  trend: 'low' | 'high' | 'normal';
}

const App: React.FC = () => {
  const [availableParameters, setAvailableParameters] = useState<string[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [isDescriptionLoading, setIsDescriptionLoading] = useState<boolean>(false);
  const [descriptionCache, setDescriptionCache] = useState<Record<string, string>>({ ...PREDEFINED_DESCRIPTIONS });
  const [parameterFlags, setParameterFlags] = useState<Record<string, ParameterStatus>>({});

  useEffect(() => {
    const paramNames = Object.keys(BLOOD_TEST_DATA)
      .filter(param => BLOOD_TEST_DATA[param] && BLOOD_TEST_DATA[param].length > 0)
      .sort();
    setAvailableParameters(paramNames);

    const flags: Record<string, ParameterStatus> = {};
    paramNames.forEach(paramName => {
      const paramData = BLOOD_TEST_DATA[paramName];
      const sortedData = [...paramData].sort((a, b) => parseDateValue(b.date).getTime() - parseDateValue(a.date).getTime());
      
      if (sortedData.length > 0) {
        const latestDataPoint = sortedData[0];
        let isOutOfRange = false;
        let currentTrend: 'low' | 'high' | 'normal' = 'normal';

        if (latestDataPoint.refRange) {
          const refValues = parseRefRangeString(latestDataPoint.refRange);
          if (refValues.min !== null && latestDataPoint.value < refValues.min) {
            isOutOfRange = true;
            currentTrend = 'low';
          } else if (refValues.max !== null && latestDataPoint.value > refValues.max) {
            isOutOfRange = true;
            currentTrend = 'high';
          }
        }
        flags[paramName] = { isOutOfRange, trend: currentTrend };
      } else {
        flags[paramName] = { isOutOfRange: false, trend: 'normal' };
      }
    });
    setParameterFlags(flags);

    if (paramNames.length > 0 && selectedParameters.length === 0) {
      setSelectedParameters([paramNames[0]]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount as BLOOD_TEST_DATA is constant and we only want to init selectedParameters once.

  const fetchAndSetDescription = useCallback(async (paramName: string) => {
    if (descriptionCache[paramName]) {
      return;
    }
    try {
      const desc = await fetchParameterDescriptionFromAPI(paramName);
      setDescriptionCache(prevCache => ({ ...prevCache, [paramName]: desc }));
    } catch (error) {
      console.error("Failed to fetch description:", error);
      setDescriptionCache(prevCache => ({ ...prevCache, [paramName]: "Error al cargar la descripción." }));
    }
  }, [descriptionCache]);

  useEffect(() => {
    if (showDescription && selectedParameters.length > 0) {
      const missing = selectedParameters.filter(p => !descriptionCache[p]);
      if (missing.length > 0) {
        setIsDescriptionLoading(true);
        Promise.all(missing.map(p => fetchAndSetDescription(p))).finally(() => setIsDescriptionLoading(false));
      } else {
        setIsDescriptionLoading(false);
      }
    } else {
      setIsDescriptionLoading(false);
    }
  }, [selectedParameters, showDescription, fetchAndSetDescription, descriptionCache]);

  const handleParameterChange = (parameters: string[]) => {
    setSelectedParameters(parameters);
  };

  const handleToggleDescription = () => {
    setShowDescription(prev => !prev);
  };

  const currentParameterData: Record<string, BloodTestDataPoint[]> = useMemo(() => {
    const dataSets: Record<string, BloodTestDataPoint[]> = {};
    selectedParameters.forEach(param => {
      if (BLOOD_TEST_DATA[param]) {
        dataSets[param] = BLOOD_TEST_DATA[param];
      }
    });
    return dataSets;
  }, [selectedParameters]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Visor de Evolución Analítica
          </h1>
          <p className="mt-2 text-lg text-slate-300">Explora tus datos de análisis de sangre de forma interactiva.</p>
        </header>

        <div className="mb-8 p-6 bg-slate-700 rounded-lg shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
            <div className="flex-grow mb-4 sm:mb-0">
              <label htmlFor="parameterSelector" className="block text-sm font-medium text-indigo-300 mb-1">Seleccionar Parámetro:</label>
              {availableParameters.length > 0 && (
                <ParameterSelector
                  parameters={availableParameters}
                  selectedParameters={selectedParameters}
                  onChange={handleParameterChange}
                  parameterFlags={parameterFlags}
                />
              )}
            </div>
            <div className="flex items-center space-x-3 self-start sm:self-end pb-1">
              <input
                type="checkbox"
                id="descriptionToggle"
                checked={showDescription}
                onChange={handleToggleDescription}
                className="h-5 w-5 text-indigo-500 border-gray-400 rounded focus:ring-indigo-400 focus:ring-offset-slate-700 bg-slate-600"
                aria-checked={showDescription}
              />
              <label htmlFor="descriptionToggle" className="text-sm font-medium text-slate-200">Mostrar Descripción del Parámetro</label>
            </div>
          </div>
        </div>
        
        <div className="mb-8 bg-slate-700 p-4 sm:p-6 rounded-lg shadow-lg">
          {selectedParameters.length > 0 && Object.keys(currentParameterData).length > 0 ? (
            <EvolutionChart
              dataSets={currentParameterData}
              generalRefRanges={GENERAL_REF_RANGES}
            />
          ) : selectedParameters.length > 0 ? (
            <div id="noDataMessage" className="text-center text-slate-400 py-12">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-lg font-medium">No hay datos disponibles para los parámetros seleccionados o los datos son insuficientes.</p>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-lg font-medium">Por favor, selecciona uno o más parámetros para visualizar su evolución.</p>
            </div>
          )}
        </div>

        {showDescription && selectedParameters.length > 0 && (
          <div className="space-y-6">
            {selectedParameters.map(param => (
              <div key={param} className="bg-slate-700 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold text-indigo-300 mb-3">Descripción de {param}</h2>
                <DescriptionBox
                  description={descriptionCache[param] || ''}
                  isLoading={isDescriptionLoading && !descriptionCache[param]}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
