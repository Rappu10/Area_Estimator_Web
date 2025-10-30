import React, { useEffect, useMemo, useState } from 'react';
import { calculateMetrics } from '../utils/figureMetrics';

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

const INITIAL_MEASUREMENTS = {
  wallHeight: 2.7,
  baseboardHeight: 0.1,
  edgeWidth: 0.05,
};

export default function FigureSelector({ figure, setFigure, setData }) {
  const [inputs, setInputs] = useState({});
  const [measurements, setMeasurements] = useState(() => ({ ...INITIAL_MEASUREMENTS }));
  const [showMeasurements, setShowMeasurements] = useState(false);

  useEffect(() => {
    const defaults = { ...INITIAL_MEASUREMENTS };
    setInputs({});
    setMeasurements(defaults);
    setData(defaults);
    setShowMeasurements(false);
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
    setData({ ...measurements, ...updatedInputs });
  };

  const handleMeasurementChange = (event) => {
    const { name, value } = event.target;
    const numericValue = parseFloat(value);
    const safeValue = Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
    const updatedMeasurements = {
      ...measurements,
      [name]: safeValue,
    };
    setMeasurements(updatedMeasurements);
    setData({ ...updatedMeasurements, ...inputs });
  };

  const fields = FIGURE_FIELDS[figure] ?? [];
  const metrics = useMemo(
    () => calculateMetrics(figure, { ...inputs, ...measurements }),
    [figure, inputs, measurements]
  );
  const safePerimeter = Number.isFinite(metrics.perimeter) ? metrics.perimeter : 0;
  const wallHeightNumeric = Number.isFinite(measurements.wallHeight) ? measurements.wallHeight : 0;
  const baseboardHeightNumeric = Number.isFinite(measurements.baseboardHeight)
    ? measurements.baseboardHeight
    : 0;
  const edgeWidthNumeric = Number.isFinite(measurements.edgeWidth) ? measurements.edgeWidth : 0;
  const wallSurface = safePerimeter * wallHeightNumeric;
  const baseboardSurface = safePerimeter * baseboardHeightNumeric;
  const edgeSurface = safePerimeter * edgeWidthNumeric;
  const measurementPanelPosition = showMeasurements
    ? 'translate-y-0'
    : 'translate-y-[calc(100%-3.25rem)]';

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
                value={inputs[name] ?? ''}
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

        <div className="mt-8 relative min-h-[3.5rem] print:min-h-0">
          <div
            className={`absolute inset-x-0 bottom-0 z-20 transform-gpu transition-transform duration-500 ease-out ${measurementPanelPosition} print:static print:translate-y-0`}
          >
            <button
              type="button"
              aria-expanded={showMeasurements}
              onClick={() => setShowMeasurements((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 shadow-[0_12px_35px_rgba(16,185,129,0.18)] transition hover:bg-emerald-500/15 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 print:hidden"
            >
              <span>Mediciones de paredes, zócalos y orillas</span>
              <span className={`transition-transform ${showMeasurements ? 'rotate-180' : ''}`}>▴</span>
            </button>
            <div
              className={`print-card mt-3 max-h-[60vh] overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/60 shadow-inner transition-all duration-500 ease-out ${showMeasurements ? 'opacity-100' : 'pointer-events-none opacity-0'} print:opacity-100 print:pointer-events-auto`}
            >
              <div className="max-h-[60vh] overflow-y-auto px-5 pb-6 pt-5 print:max-h-none">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    Ajusta las alturas o anchos para estimar los acabados perimetrales usando el
                    perímetro calculado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowMeasurements(false)}
                    className="print:hidden inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    aria-label="Cerrar mediciones"
                  >
                    ▾
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4 print-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-200">Paredes</p>
                        <p className="text-xs text-gray-400">Superficie lineal de muro</p>
                      </div>
                      <label className="text-xs uppercase tracking-wide text-gray-400">
                        Altura (m)
                        <input
                          type="number"
                          min="0"
                          step="any"
                          name="wallHeight"
                          value={Number.isFinite(measurements.wallHeight) ? measurements.wallHeight : ''}
                          onChange={handleMeasurementChange}
                          className="print-input mt-1 w-24 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                        />
                      </label>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Longitud</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">
                          {safePerimeter.toFixed(2)}
                          <span className="ml-1 text-xs text-gray-500">m</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Área</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">
                          {Number.isFinite(wallSurface) ? wallSurface.toFixed(2) : '0.00'}
                          <span className="ml-1 text-xs text-gray-500">m²</span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4 print-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-200">Zócalos</p>
                        <p className="text-xs text-gray-400">Largo y superficie del rodapié</p>
                      </div>
                      <label className="text-xs uppercase tracking-wide text-gray-400">
                        Altura (m)
                        <input
                          type="number"
                          min="0"
                          step="any"
                          name="baseboardHeight"
                          value={
                            Number.isFinite(measurements.baseboardHeight)
                              ? measurements.baseboardHeight
                              : ''
                          }
                          onChange={handleMeasurementChange}
                          className="print-input mt-1 w-24 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                        />
                      </label>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Longitud</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">
                          {safePerimeter.toFixed(2)}
                          <span className="ml-1 text-xs text-gray-500">m</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Área</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">
                          {Number.isFinite(baseboardSurface) ? baseboardSurface.toFixed(2) : '0.00'}
                          <span className="ml-1 text-xs text-gray-500">m²</span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4 print-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-200">Orillas</p>
                        <p className="text-xs text-gray-400">Cinta o borde alrededor de la figura</p>
                      </div>
                      <label className="text-xs uppercase tracking-wide text-gray-400">
                        Ancho (m)
                        <input
                          type="number"
                          min="0"
                          step="any"
                          name="edgeWidth"
                          value={Number.isFinite(measurements.edgeWidth) ? measurements.edgeWidth : ''}
                          onChange={handleMeasurementChange}
                          className="print-input mt-1 w-24 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                        />
                      </label>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Longitud</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">
                          {safePerimeter.toFixed(2)}
                          <span className="ml-1 text-xs text-gray-500">m</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-gray-500">Área</dt>
                        <dd className="mt-1 font-semibold text-emerald-300">
                          {Number.isFinite(edgeSurface) ? edgeSurface.toFixed(2) : '0.00'}
                          <span className="ml-1 text-xs text-gray-500">m²</span>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
