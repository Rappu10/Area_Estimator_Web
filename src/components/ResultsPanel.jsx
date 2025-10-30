import React, { useState, useEffect, useCallback } from 'react';
import ShapePreview from './ShapePreview';
import { calculateMetrics } from '../utils/figureMetrics';

export default function ResultsPanel({ figure, data }) {
  const [area, setArea] = useState(0);
  const [perimeter, setPerimeter] = useState(0);
  const [unit, setUnit] = useState('m2');
  const [pricePerM2, setPricePerM2] = useState(100);
  const [wallCostPerM2, setWallCostPerM2] = useState(0);
  const [baseboardCostPerM2, setBaseboardCostPerM2] = useState(0);
  const [edgeCostPerM2, setEdgeCostPerM2] = useState(0);
  const [lShapeError, setLShapeError] = useState('');
  const [showCostDrawer, setShowCostDrawer] = useState(false);
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

  const formatValue = (val, decimals = 2) => (Number.isFinite(val) ? val.toFixed(decimals) : '0.00');

  const wallHeight = Number.isFinite(data?.wallHeight) ? data.wallHeight : 0;
  const baseboardHeight = Number.isFinite(data?.baseboardHeight) ? data.baseboardHeight : 0;
  const edgeWidth = Number.isFinite(data?.edgeWidth) ? data.edgeWidth : 0;

  const wallSurface = perimeter * wallHeight;
  const baseboardSurface = perimeter * baseboardHeight;
  const edgeSurface = perimeter * edgeWidth;

  const floorAreaConverted = convertArea(area);
  const floorCost = floorAreaConverted * pricePerM2;
  const wallCost = wallSurface * wallCostPerM2;
  const baseboardCost = baseboardSurface * baseboardCostPerM2;
  const edgeCost = edgeSurface * edgeCostPerM2;
  const total = floorCost + wallCost + baseboardCost + edgeCost;

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
              <button
                type="button"
                aria-expanded={showCostDrawer}
                onClick={() => setShowCostDrawer((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.18)] transition hover:bg-emerald-500/15 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 print:hidden"
              >
                <div className="flex flex-col text-left">
                  <span>Costos estimados</span>
                  <span className="text-xs font-medium text-emerald-200/80 sm:text-[13px]">
                    Total ${formatValue(total)}
                  </span>
                </div>
                <span className={`ml-4 transition-transform ${showCostDrawer ? 'rotate-180' : ''}`}>▴</span>
              </button>
              <div
                className={`print:mt-4 print:max-h-none print:opacity-100 print:pointer-events-auto mt-0 overflow-hidden transition-[max-height] duration-500 ${
                  showCostDrawer ? 'mt-4 max-h-[60vh] pointer-events-auto' : 'max-h-0 pointer-events-none'
                }`}
              >
                <div
                  className={`print-card rounded-2xl border border-gray-800 bg-gray-950/60 px-5 pb-6 pt-5 shadow-inner transition-all duration-300 ${
                    showCostDrawer ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  } print:opacity-100 print:translate-y-0`}
                >
                  <p className="text-xs text-gray-400">
                    Valor por m² para sumar paredes, zócalos y orillas al costo total.
                  </p>
                  <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-200">Superficie principal</p>
                          <p className="text-xs text-gray-400">
                            Área: {formatValue(floorAreaConverted)} {unit}
                          </p>
                        </div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">
                          Costo m²
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={pricePerM2}
                            onChange={(e) => setPricePerM2(parseFloat(e.target.value) || 0)}
                            className="print-input mt-1 w-28 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-gray-300">
                        Subtotal:{' '}
                        <span className="font-semibold text-emerald-300">${formatValue(floorCost)}</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-200">Paredes</p>
                          <p className="text-xs text-gray-400">
                            Área: {formatValue(wallSurface)} m² · Altura {formatValue(wallHeight)} m
                          </p>
                        </div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">
                          Costo m²
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={wallCostPerM2}
                            onChange={(e) => setWallCostPerM2(parseFloat(e.target.value) || 0)}
                            className="print-input mt-1 w-28 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-gray-300">
                        Subtotal:{' '}
                        <span className="font-semibold text-emerald-300">${formatValue(wallCost)}</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-200">Zócalos</p>
                          <p className="text-xs text-gray-400">
                            Área: {formatValue(baseboardSurface)} m² · Longitud {formatValue(perimeter)} m
                          </p>
                        </div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">
                          Costo m²
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={baseboardCostPerM2}
                            onChange={(e) => setBaseboardCostPerM2(parseFloat(e.target.value) || 0)}
                            className="print-input mt-1 w-28 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-gray-300">
                        Subtotal:{' '}
                        <span className="font-semibold text-emerald-300">${formatValue(baseboardCost)}</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-emerald-200">Orillas</p>
                          <p className="text-xs text-gray-400">
                            Área: {formatValue(edgeSurface)} m² · Longitud {formatValue(perimeter)} m
                          </p>
                        </div>
                        <label className="text-xs uppercase tracking-wide text-gray-400">
                          Costo m²
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={edgeCostPerM2}
                            onChange={(e) => setEdgeCostPerM2(parseFloat(e.target.value) || 0)}
                            className="print-input mt-1 w-28 rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-gray-300">
                        Subtotal:{' '}
                        <span className="font-semibold text-emerald-300">${formatValue(edgeCost)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-4">
                    <span className="text-sm text-gray-400">Total estimado</span>
                    <p className="text-[22px] font-semibold text-emerald-400">
                      ${formatValue(total)}
                    </p>
                  </div>
                </div>
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
