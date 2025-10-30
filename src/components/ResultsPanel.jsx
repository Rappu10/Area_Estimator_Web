import React, { useState, useEffect, useCallback } from 'react';
import ShapePreview from './ShapePreview';
import { calculateMetrics } from '../utils/figureMetrics';

export default function ResultsPanel({ figure, data }) {
  const [area, setArea] = useState(0);
  const [perimeter, setPerimeter] = useState(0);
  const [unit, setUnit] = useState('m2');
  const [pricePerM2, setPricePerM2] = useState(100);
  const [lShapeError, setLShapeError] = useState('');
  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  useEffect(() => {
    const { area: computedArea, perimeter: computedPerimeter, error } = calculateMetrics(figure, data);
    setArea(computedArea);
    setPerimeter(computedPerimeter);
    setLShapeError(error);
  }, [data, figure]);

  const convertArea = (val) => {
    switch (unit) {
      case 'ha':
        return val / 10000;
      case 'ft2':
        return val * 10.7639;
      default:
        return val;
    }
  };

  const total = convertArea(area) * pricePerM2;
  return (
    <div className="print-area relative mt-6 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-[0_25px_80px_rgba(15,118,110,0.25)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-16 -top-24 h-48 rounded-full bg-emerald-500/20 blur-3xl opacity-40" />

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Resultados</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Unidad</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="print-select rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs uppercase tracking-wide text-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
              >
                <option value="m2">m²</option>
                <option value="ha">ha</option>
                <option value="ft2">ft²</option>
              </select>
            </div>
              <button
                type="button"
                onClick={handlePrint}
                className="print-hide rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
              Guardar en PDF
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <ShapePreview figure={figure} data={data} />

          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-1">
              <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-950/40 px-6 py-7 shadow-inner transition hover:border-emerald-400/40 hover:shadow-[0_18px_55px_rgba(16,185,129,0.28)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Área</p>
                <p className="mt-4 text-[28px] font-semibold text-emerald-400 leading-tight">
                  {convertArea(area).toFixed(2)}
                  <span className="ml-2 text-sm text-gray-500">{unit}</span>
                </p>
              </div>
              <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-950/40 px-6 py-7 shadow-inner transition hover:border-emerald-400/40 hover:shadow-[0_18px_55px_rgba(16,185,129,0.28)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Perímetro</p>
                <p className="mt-4 text-[28px] font-semibold text-emerald-300 leading-tight">
                  {perimeter.toFixed(2)}
                  <span className="ml-2 text-sm text-gray-500">m</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 shadow-inner transition hover:border-emerald-400/40 hover:shadow-[0_15px_45px_rgba(16,185,129,0.25)]">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Costo por m² (MXN)
              </label>
              <input
                type="number"
                value={pricePerM2}
                onChange={(e) => setPricePerM2(parseFloat(e.target.value) || 0)}
                className="print-input mt-2 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">Costo estimado</span>
                <p className="text-[22px] font-semibold text-emerald-400">
                  ${Number.isFinite(total) ? total.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {lShapeError && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {lShapeError}
          </p>
        )}
      </div>
    </div>
  );
}
