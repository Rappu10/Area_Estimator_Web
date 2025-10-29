import React, { useEffect, useState } from 'react';

const FIGURE_FIELDS = {
  rectangle: [
    { name: 'width', label: 'Ancho', unit: 'm' },
    { name: 'height', label: 'Alto', unit: 'm' },
  ],
  triangle: [
    { name: 'base', label: 'Base', unit: 'm' },
    { name: 'height', label: 'Altura', unit: 'm' },
  ],
  circle: [{ name: 'radius', label: 'Radio', unit: 'm' }],
  lShape: [
    { name: 'outerWidth', label: 'Ancho exterior', unit: 'm' },
    { name: 'outerHeight', label: 'Alto exterior', unit: 'm' },
    { name: 'cutWidth', label: 'Ancho del recorte', unit: 'm' },
    { name: 'cutHeight', label: 'Alto del recorte', unit: 'm' },
  ],
};

const FIGURE_OPTIONS = [
  { value: 'rectangle', label: 'Rectángulo' },
  { value: 'triangle', label: 'Triángulo' },
  { value: 'circle', label: 'Círculo' },
  { value: 'lShape', label: 'Figura en L' },
];

export default function FigureSelector({ figure, setFigure, setData }) {
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    setInputs({});
    setData({});
  }, [figure, setData]);

  const handleFigureChange = (event) => {
    setFigure(event.target.value);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const numericValue = parseFloat(value);
    const updatedInputs = {
      ...inputs,
      [name]: Number.isFinite(numericValue) ? numericValue : 0,
    };
    setInputs(updatedInputs);
    setData(updatedInputs);
  };

  const fields = FIGURE_FIELDS[figure] ?? [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-48 bg-gradient-to-b from-emerald-500/10 via-emerald-500/0 to-transparent" />

      <div className="relative">
        <h2 className="text-lg font-semibold text-white">Datos de la figura</h2>
        <p className="mt-1 text-sm text-gray-400">
          Selecciona la figura y captura las dimensiones requeridas para el cálculo.
        </p>

        <div className="mt-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Tipo de figura
          </label>
          <div className="relative">
            <select
              value={figure}
              onChange={handleFigureChange}
              className="w-full appearance-none rounded-xl border border-gray-800 bg-gray-950/80 px-4 py-3 text-sm font-medium text-gray-200 shadow-inner focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
            >
              {FIGURE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
              ▾
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {fields.map(({ name, label, unit }) => (
            <div key={name} className="rounded-xl border border-gray-800 bg-gray-950/40 px-4 py-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label} <span className="text-gray-600">({unit})</span>
              </label>
              <input
                type="number"
                step="any"
                name={name}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
          ))}
        </div>

        {figure === 'lShape' && (
          <p className="mt-4 text-xs text-emerald-300/90">
            Consejo: asegúrate de que el recorte sea menor que las dimensiones exteriores para
            mantener la forma en L.
          </p>
        )}
      </div>
    </div>
  );
}
