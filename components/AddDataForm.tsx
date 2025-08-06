import React, { useState } from 'react';

import { BloodTestDataPoint } from '../types';

interface AddDataFormProps {
  onAddData: (data: { parameter: string; newDataPoint: BloodTestDataPoint }) => void;
  parameters: string[];
}

const AddDataForm: React.FC<AddDataFormProps> = ({ onAddData, parameters }) => {
  const [parameter, setParameter] = useState('');
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [refRange, setRefRange] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parameter || !date || value === '') return;
    const newDataPoint = {
      date,
      value: parseFloat(value),
      unit,
      refRange: refRange || null,
      note: note || undefined,
    };
    onAddData({ parameter, newDataPoint });
    setParameter('');
    setDate('');
    setValue('');
    setUnit('');
    setRefRange('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-700 rounded-lg mt-6">
      <h3 className="text-lg font-semibold text-white mb-4">Añadir Nuevo Registro</h3>
      <div className="flex flex-col sm:flex-row sm:space-x-2 mb-2">
        <div className="flex-1">
          <input
            list="parameters"
            value={parameter}
            onChange={e => setParameter(e.target.value)}
            placeholder="Parámetro"
            className="w-full p-2 rounded mb-2 text-slate-900"
          />
          <datalist id="parameters">
            {parameters.map(p => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full sm:w-auto p-2 rounded mb-2 text-slate-900"
        />
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Valor"
          className="w-full sm:w-24 p-2 rounded mb-2 text-slate-900"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:space-x-2 mb-2">
        <input
          type="text"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="Unidad"
          className="w-full sm:w-32 p-2 rounded mb-2 text-slate-900"
        />
        <input
          type="text"
          value={refRange}
          onChange={e => setRefRange(e.target.value)}
          placeholder="Rango Ref."
          className="w-full sm:w-40 p-2 rounded mb-2 text-slate-900"
        />
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Nota"
          className="w-full sm:flex-1 p-2 rounded mb-2 text-slate-900"
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"
      >
        Añadir
      </button>
    </form>
  );
};

export default AddDataForm;
