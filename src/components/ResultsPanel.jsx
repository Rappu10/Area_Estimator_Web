import React, { useState, useEffect } from 'react';
import ShapePreview from './ShapePreview';

const L_SHAPE_ERROR =
  'Dimensiones inválidas: el recorte debe ser mayor que 0 y menor que las medidas exteriores.';

export default function ResultsPanel({ figure, data }) {
  const [area, setArea] = useState(0);
  const [perimeter, setPerimeter] = useState(0);
  const [unit, setUnit] = useState('m2');
  const [pricePerM2, setPricePerM2] = useState(100);
  const [lShapeError, setLShapeError] = useState('');

  useEffect(() => {
    let a = 0, p = 0;
    const { width, height, base, radius, outerWidth, outerHeight, cutWidth, cutHeight } = data;

    switch (figure) {
      case 'rectangle':
        a = (width || 0) * (height || 0);
        p = 2 * ((width || 0) + (height || 0));
        break;
      case 'triangle':
        a = ((base || 0) * (height || 0)) / 2;
        p = 3 * (base || 0); 
        break;
      case 'circle':
        a = Math.PI * Math.pow(radius || 0, 2);
        p = 2 * Math.PI * (radius || 0);
        break;
      case 'lShape': {
        const validOuter = (outerWidth || 0) > 0 && (outerHeight || 0) > 0;
        const validCut =
          (cutWidth || 0) >= 0 &&
          (cutHeight || 0) >= 0 &&
          (cutWidth || 0) < (outerWidth || 0) &&
          (cutHeight || 0) < (outerHeight || 0);

        if (validOuter && validCut) {
          const safeOuterWidth = outerWidth || 0;
          const safeOuterHeight = outerHeight || 0;
          const safeCutWidth = cutWidth || 0;
          const safeCutHeight = cutHeight || 0;

          a = safeOuterWidth * safeOuterHeight - safeCutWidth * safeCutHeight;

          const segments = [
            safeOuterWidth,
            Math.max(safeOuterHeight - safeCutHeight, 0),
            safeCutWidth,
            safeCutHeight,
            Math.max(safeOuterWidth - safeCutWidth, 0),
            safeOuterHeight,
          ];

          p = segments.reduce((total, segment) => total + segment, 0);
          setLShapeError('');
        } else {
          setLShapeError(
            (outerWidth || 0) === 0 && (outerHeight || 0) === 0 && (cutWidth || 0) === 0 && (cutHeight || 0) === 0
              ? ''
              : L_SHAPE_ERROR
          );
          a = 0;
          p = 0;
        }
        break;
      }
      default:
        break;
    }

    if (figure !== 'lShape') {
      setLShapeError('');
    }

    setArea(a);
    setPerimeter(p);
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
    <div className="relative mt-6 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-[0_25px_80px_rgba(15,118,110,0.25)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-16 -top-24 h-48 rounded-full bg-emerald-500/20 blur-3xl opacity-40" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Resultados</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Unidad</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs uppercase tracking-wide text-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
            >
              <option value="m2">m²</option>
              <option value="ha">ha</option>
              <option value="ft2">ft²</option>
            </select>
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
                className="mt-2 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
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
