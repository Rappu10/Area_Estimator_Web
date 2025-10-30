import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ShapePreview, {
  figureDescriptions,
  getFigureMeasurements,
  formatMeasurementValue as formatMeasurement,
} from './ShapePreview';
import { calculateMetrics } from '../utils/figureMetrics';

function PrintableReport({
  figureLabel,
  measurements,
  baseArea,
  unit,
  perimeter,
  floorAreaConverted,
  pricePerM2,
  wallSurface,
  wallCostPerM2,
  wallHeight,
  baseboardSurface,
  baseboardCostPerM2,
  baseboardHeight,
  edgeSurface,
  edgeCostPerM2,
  edgeWidth,
  floorCost,
  wallCost,
  baseboardCost,
  edgeCost,
  total,
  formatValue,
  formatMeasurement,
  reportTimestamp,
  lShapeError,
}) {
  const formatCurrency = (value) => {
    if (!Number.isFinite(value)) {
      return '$0.00';
    }
    return `$${formatValue(value)}`;
  };

  const relevantMeasurements = Array.isArray(measurements) ? measurements : [];

  const costRows = [
    {
      key: 'floor',
      label: 'Superficie principal',
      surfaceValue: floorAreaConverted,
      surfaceUnit: unit,
      unitCost: pricePerM2,
      subtotal: floorCost,
      metrics: [],
    },
    {
      key: 'walls',
      label: 'Paredes',
      surfaceValue: wallSurface,
      surfaceUnit: 'm²',
      unitCost: wallCostPerM2,
      subtotal: wallCost,
      metrics: [
        { label: 'Altura', value: wallHeight, unit: 'm' },
        { label: 'Perímetro', value: perimeter, unit: 'm' },
      ],
    },
    {
      key: 'baseboards',
      label: 'Zócalos',
      surfaceValue: baseboardSurface,
      surfaceUnit: 'm²',
      unitCost: baseboardCostPerM2,
      subtotal: baseboardCost,
      metrics: [
        { label: 'Altura', value: baseboardHeight, unit: 'm' },
        { label: 'Perímetro', value: perimeter, unit: 'm' },
      ],
    },
    {
      key: 'edges',
      label: 'Orillas',
      surfaceValue: edgeSurface,
      surfaceUnit: 'm²',
      unitCost: edgeCostPerM2,
      subtotal: edgeCost,
      metrics: [
        { label: 'Ancho', value: edgeWidth, unit: 'm' },
        { label: 'Perímetro', value: perimeter, unit: 'm' },
      ],
    },
  ].filter((row, index) => {
    if (index === 0) {
      // Mostrar siempre la superficie principal.
      return true;
    }
    const hasSurface = Number.isFinite(row.surfaceValue) && row.surfaceValue > 0;
    const hasCost = Number.isFinite(row.unitCost) && row.unitCost > 0;
    const hasSubtotal = Number.isFinite(row.subtotal) && row.subtotal > 0;
    return hasSurface || hasCost || hasSubtotal;
  });

  return (
    <div className="print-report print-only" role="document" aria-label="Reporte para impresión">
      <header className="print-report__header">
        <div>
          <h1 className="print-report__title">Reporte de estimación de área</h1>
          <p className="print-report__subtitle">Figura analizada: {figureLabel}</p>
        </div>
        <div className="print-report__timestamp">
          <p className="print-report__caption">Fecha de generación</p>
          <p>{reportTimestamp || 'Se completará al momento de imprimir'}</p>
        </div>
      </header>

      <section className="print-report__section">
        <h2 className="print-report__section-title">Resumen geométrico</h2>
        <div className="print-report__summary">
          <div className="print-report__highlight">
            <p className="print-report__caption">Área base (m²)</p>
            <p className="print-report__value">{formatValue(baseArea)} m²</p>
          </div>
          <div className="print-report__highlight">
            <p className="print-report__caption">Área convertida ({unit})</p>
            <p className="print-report__value">
              {formatValue(floorAreaConverted)} {unit}
            </p>
          </div>
          <div className="print-report__highlight">
            <p className="print-report__caption">Perímetro</p>
            <p className="print-report__value">{formatValue(perimeter)} m</p>
          </div>
        </div>

        {relevantMeasurements.length > 0 && (
          <div className="print-report__measurements">
            <h3 className="print-report__caption print-report__caption--uppercase">Dimensiones ingresadas</h3>
            <dl className="print-report__measurement-grid">
              {relevantMeasurements.map(({ label, value, unit: measurementUnit }) => (
                <div key={label} className="print-report__measurement">
                  <dt>{label}</dt>
                  <dd>
                    {formatMeasurement(value)}
                    <span className="print-report__measurement-unit">{measurementUnit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section className="print-report__section">
        <h2 className="print-report__section-title">Costos estimados</h2>
        <table className="print-report__table">
          <thead>
            <tr>
              <th scope="col">Concepto</th>
              <th scope="col">Superficie considerada</th>
              <th scope="col">Costo por m²</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {costRows.map(({ key, label, surfaceValue, surfaceUnit, unitCost, subtotal, metrics }) => {
              const hasSurface = Number.isFinite(surfaceValue) && surfaceValue > 0;
              const visibleMetrics = (metrics || []).filter(
                ({ value }) => Number.isFinite(value) && value > 0
              );

              return (
                <tr key={key}>
                  <td>
                    <span className="print-report__strong">{label}</span>
                    {visibleMetrics.length > 0 && (
                      <ul className="print-report__metrics">
                        {visibleMetrics.map(({ label: metricLabel, value, unit: metricUnit }) => (
                          <li key={metricLabel}>
                            {metricLabel}:{' '}
                            <span className="print-report__strong">
                              {formatValue(value)} {metricUnit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    {hasSurface ? (
                      <span className="print-report__strong">
                        {formatValue(surfaceValue)} {surfaceUnit}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{formatCurrency(unitCost)}</td>
                  <td>{formatCurrency(subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="print-report__total">
          <span>Total estimado</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
      </section>

      {lShapeError && (
        <section className="print-report__section">
          <h2 className="print-report__section-title">Notas</h2>
          <p className="print-report__note">{lShapeError}</p>
        </section>
      )}

      <p className="print-report__footnote">
        Este documento refleja los cálculos realizados con los datos proporcionados en la herramienta web. Se
        recomienda validar los resultados antes de tomar decisiones definitivas.
      </p>
    </div>
  );
}

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
  const [reportTimestamp, setReportTimestamp] = useState('');
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const manualCostDrawerRef = useRef(false);

  useEffect(() => {
    const { area: computedArea, perimeter: computedPerimeter, error } = calculateMetrics(figure, data);
    setArea(computedArea);
    setPerimeter(computedPerimeter);
    setLShapeError(error);
  }, [data, figure]);

  const measurements = useMemo(() => getFigureMeasurements(figure, data), [figure, data]);
  const figureLabel = useMemo(() => figureDescriptions[figure] ?? 'Figura seleccionada', [figure]);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    []
  );
  const updateReportTimestamp = useCallback(() => {
    setReportTimestamp(dateFormatter.format(new Date()));
  }, [dateFormatter]);

  const closeVisualPreview = useCallback(() => {
    setShowVisualPreview(false);
  }, []);

  const toggleVisualPreview = useCallback(() => {
    setShowVisualPreview((prev) => !prev);
  }, []);

  const handleToggleCostDrawer = useCallback(() => {
    setShowCostDrawer((prev) => {
      const next = !prev;
      manualCostDrawerRef.current = next;
      if (!next) {
        closeVisualPreview();
      }
      return next;
    });
  }, [closeVisualPreview]);

  const openCostDrawerForPrint = useCallback(() => {
    if (!showCostDrawer) {
      setShowCostDrawer(true);
    }
  }, [showCostDrawer]);

  const restoreCostDrawer = useCallback(() => {
    setShowCostDrawer(manualCostDrawerRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleBeforePrint = () => {
      updateReportTimestamp();
      closeVisualPreview();
      openCostDrawerForPrint();
    };

    const handleAfterPrint = () => {
      restoreCostDrawer();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [closeVisualPreview, openCostDrawerForPrint, restoreCostDrawer, updateReportTimestamp]);

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    updateReportTimestamp();
    closeVisualPreview();
    openCostDrawerForPrint();

    setTimeout(() => {
      window.print();
    }, 60);
  }, [closeVisualPreview, openCostDrawerForPrint, updateReportTimestamp]);

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
  const visualItems = [
    area > 0 && {
      key: 'floor',
      label: 'Superficie principal',
      areaValue: area,
      displayValue: `${formatValue(floorAreaConverted)} ${unit}`,
      color: 'linear-gradient(90deg, rgba(16,185,129,0.9), rgba(59,130,246,0.6))',
    },
    wallSurface > 0 && {
      key: 'walls',
      label: 'Paredes',
      areaValue: wallSurface,
      displayValue: `${formatValue(wallSurface)} m²`,
      color: 'linear-gradient(90deg, rgba(14,165,233,0.9), rgba(56,189,248,0.65))',
    },
    baseboardSurface > 0 && {
      key: 'baseboards',
      label: 'Zócalos',
      areaValue: baseboardSurface,
      displayValue: `${formatValue(baseboardSurface)} m²`,
      color: 'linear-gradient(90deg, rgba(249,115,22,0.9), rgba(253,186,116,0.8))',
    },
    edgeSurface > 0 && {
      key: 'edges',
      label: 'Orillas',
      areaValue: edgeSurface,
      displayValue: `${formatValue(edgeSurface)} m²`,
      color: 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(217,70,239,0.7))',
    },
  ].filter(Boolean);
  const maxVisualArea = visualItems.length > 0 ? Math.max(...visualItems.map(({ areaValue }) => areaValue)) : 0;

  return (
    <>
      <div className="print-area screen-only relative mt-6 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-[0_25px_80px_rgba(15,118,110,0.25)] backdrop-blur-xl">
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
                  onClick={handleToggleCostDrawer}
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
                    
                    {visualItems.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleVisualPreview}
                        aria-pressed={showVisualPreview}
                        className="print:hidden mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/15 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                      >
                        <span className="text-[11px]">Vista previa superficies</span>
                        <span
                          className={`text-base leading-none transition-transform ${
                            showVisualPreview ? 'rotate-45' : ''
                          }`}
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </button>
                    )}
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

          {showVisualPreview && visualItems.length > 0 && (
            <div className="print:hidden absolute bottom-6 right-6 z-40 w-[min(320px,calc(100vw-4rem))]">
              <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gray-950/95 px-5 pb-5 pt-4 shadow-[0_30px_90px_rgba(16,185,129,0.35)] backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-100">Vista previa de superficies</p>
                    <p className="mt-1 text-xs text-emerald-200/80">
                      Compara visualmente la participación relativa de cada elemento.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeVisualPreview}
                    className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100 transition hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    aria-label="Cerrar vista previa de superficies"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {visualItems.map(({ key, label, displayValue, areaValue, color }) => {
                    const percent = maxVisualArea > 0 ? Math.max((areaValue / maxVisualArea) * 100, 6) : 0;
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-emerald-100/90">
                          <span className="font-medium">{label}</span>
                          <span className="text-emerald-200/80">{displayValue}</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-emerald-500/10">
                          <div
                            className="h-full rounded-full shadow-[0_0_12px_rgba(16,185,129,0.45)] transition-all duration-500 ease-out"
                            style={{ width: `${percent}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <PrintableReport
        figureLabel={figureLabel}
        measurements={measurements}
        baseArea={area}
        unit={unit}
        perimeter={perimeter}
        floorAreaConverted={floorAreaConverted}
        pricePerM2={pricePerM2}
        wallSurface={wallSurface}
        wallCostPerM2={wallCostPerM2}
        wallHeight={wallHeight}
        baseboardSurface={baseboardSurface}
        baseboardCostPerM2={baseboardCostPerM2}
        baseboardHeight={baseboardHeight}
        edgeSurface={edgeSurface}
        edgeCostPerM2={edgeCostPerM2}
        edgeWidth={edgeWidth}
        floorCost={floorCost}
        wallCost={wallCost}
        baseboardCost={baseboardCost}
        edgeCost={edgeCost}
        total={total}
        formatValue={formatValue}
        formatMeasurement={formatMeasurement}
        reportTimestamp={reportTimestamp}
        lShapeError={lShapeError}
      />
    </>
  );
}
