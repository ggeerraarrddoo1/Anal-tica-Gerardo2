
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ParameterSelector from './components/ParameterSelector';
import EvolutionChart from './components/EvolutionChart';
import DescriptionBox from './components/DescriptionBox';
import { GENERAL_REF_RANGES, PREDEFINED_DESCRIPTIONS } from './constants';
import { fetchParameterDescriptionFromAPI } from './services/geminiService';
import { BloodTestData, BloodTestDataPoint } from './types';
import AddDataForm from './components/AddDataForm';
import { parseDateValue, parseRefRangeString } from './utils/chartUtils';

interface ParameterStatus {
  isOutOfRange: boolean;
  trend: 'low' | 'high' | 'normal';
}

const App: React.FC = () => {
  const [bloodTestData, setBloodTestData] = useState<BloodTestData>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [availableParameters, setAvailableParameters] = useState<string[]>([]);
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [parameterDescription, setParameterDescription] = useState<string>('');
  const [isDescriptionLoading, setIsDescriptionLoading] = useState<boolean>(false);
  const [descriptionCache, setDescriptionCache] = useState<Record<string, string>>({ ...PREDEFINED_DESCRIPTIONS });
  const [parameterFlags, setParameterFlags] = useState<Record<string, ParameterStatus>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/blood_data.json');
        const data: BloodTestData = await response.json();
        setBloodTestData(data);
      } catch (error) {
        console.error('Error al cargar los datos de análisis:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (Object.keys(bloodTestData).length === 0) return;
    const paramNames = Object.keys(bloodTestData)
      .filter(param => bloodTestData[param] && bloodTestData[param].length > 0)
      .sort();
    setAvailableParameters(paramNames);

    const flags: Record<string, ParameterStatus> = {};
    paramNames.forEach(paramName => {
      const paramData = bloodTestData[paramName];
      const latestDataPoint = paramData.reduce<BloodTestDataPoint | null>((latest, current) => {
        if (!latest) {
          return current;
        }

        const latestDate = parseDateValue(latest.date).getTime();
        const currentDate = parseDateValue(current.date).getTime();

        const latestDateIsNaN = Number.isNaN(latestDate);
        const currentDateIsNaN = Number.isNaN(currentDate);

        if (latestDateIsNaN && !currentDateIsNaN) {
          return current;
        }

        if (currentDateIsNaN) {
          return latest;
        }

        return currentDate >= latestDate ? current : latest;
      }, null);

      if (latestDataPoint) {
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
  }, [bloodTestData]);

  useEffect(() => {
    if (availableParameters.length > 0) {
      setSelectedParameter(prevSelected => prevSelected ?? availableParameters[0]);
    }
  }, [availableParameters]);

  const fetchAndSetDescription = useCallback(async (paramName: string) => {
    if (descriptionCache[paramName]) {
      setParameterDescription(descriptionCache[paramName]);
      return;
    }
    setIsDescriptionLoading(true);
    try {
      const desc = await fetchParameterDescriptionFromAPI(paramName);
      setDescriptionCache(prevCache => ({ ...prevCache, [paramName]: desc }));
      setParameterDescription(desc);
    } catch (error) {
      console.error("Failed to fetch description:", error);
      setParameterDescription("Error al cargar la descripción.");
    } finally {
      setIsDescriptionLoading(false);
    }
  }, [descriptionCache]);

  useEffect(() => {
    if (selectedParameter && showDescription) {
      fetchAndSetDescription(selectedParameter);
    } else if (!showDescription) {
        setParameterDescription(''); 
    }
  }, [selectedParameter, showDescription, fetchAndSetDescription]);

  const handleParameterChange = (parameter: string) => {
    setSelectedParameter(parameter);
  };

  const handleToggleDescription = () => {
    setShowDescription(prev => !prev);
  };

  const currentParameterData: BloodTestDataPoint[] = useMemo(() => {
    if (selectedParameter && bloodTestData[selectedParameter]) {
      return bloodTestData[selectedParameter];
    }
    return [];
  }, [selectedParameter, bloodTestData]);

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Cargando datos...
      </div>
    );
  }

  const handleAddData = ({ parameter, newDataPoint }: { parameter: string; newDataPoint: BloodTestDataPoint }) => {
    setBloodTestData(prevData => {
      const updated = { ...prevData };
      if (!updated[parameter]) {
        updated[parameter] = [];
      }
      updated[parameter].push(newDataPoint);
      return updated;
    });
  };

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
              {availableParameters.length > 0 && selectedParameter && (
                <ParameterSelector
                  parameters={availableParameters}
                  selectedParameter={selectedParameter}
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
          <AddDataForm onAddData={handleAddData} parameters={availableParameters} />
        </div>
        
        <div className="mb-8 bg-slate-700 p-4 sm:p-6 rounded-lg shadow-lg">
          {selectedParameter && currentParameterData.length > 0 ? (
            <EvolutionChart
              parameterName={selectedParameter}
              data={currentParameterData}
              generalRefRanges={GENERAL_REF_RANGES}
            />
          ) : selectedParameter && currentParameterData.length === 0 ? (
             <div id="noDataMessage" className="text-center text-slate-400 py-12">
                <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-lg font-medium">No hay datos disponibles para {selectedParameter} o los datos son insuficientes.</p>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">
              <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-lg font-medium">Por favor, selecciona un parámetro para visualizar su evolución.</p>
            </div>
          )}
        </div>

        {showDescription && selectedParameter && (
          <div className="bg-slate-700 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-indigo-300 mb-3">Descripción de {selectedParameter}</h2>
            <DescriptionBox
              description={parameterDescription}
              isLoading={isDescriptionLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
