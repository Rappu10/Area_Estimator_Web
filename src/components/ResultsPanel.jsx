"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ShapePreview, {
  figureDescriptions,
  getFigureMeasurements,
  formatMeasurementValue as formatMeasurement,
} from './ShapePreview';
import { calculateMetrics } from '../utils/figureMetrics';
import { DEFAULT_MATERIAL_ID, MATERIAL_CATALOG } from '../data/materialCatalog';
import { SURFACE_STYLES } from '../data/surfaceStyles';

const VIATIC_OPTIONS = [
  {
    group: 'Hacia Torreón',
    options: [
      { value: 'madero', label: 'Madero', amount: 2000 },
      { value: 'victoria', label: 'Victoria', amount: 2500 },
      { value: 'cuencame', label: 'Cuencamé', amount: 5000 },
      { value: 'torreon', label: 'Torreón', amount: 7500 },
    ],
  },
  {
    group: 'Hacia Mazatlán',
    options: [
      { value: 'otinapa', label: 'Otinapa', amount: 2000 },
      { value: 'el-salto', label: 'El Salto', amount: 3500 },
      { value: 'mazatlan', label: 'Mazatlán', amount: 9000 },
    ],
  },
  {
    group: 'Hacia México',
    options: [
      { value: 'nombre-de-dios', label: 'Nombre de Dios', amount: 2000 },
      { value: 'vicente-guerrero', label: 'Vicente Guerrero', amount: 3000 },
      { value: 'sombrerete', label: 'Sombrerete', amount: 4000 },
      { value: 'fresnillo', label: 'Fresnillo', amount: 6000 },
      { value: 'zacatecas', label: 'Zacatecas', amount: 9000 },
    ],
  },
  {
    group: 'Hacia Mezquital',
    options: [
      { value: 'praxedis', label: 'Práxedis', amount: 2000 },
      { value: 'pino-suarez', label: 'Pino Suárez', amount: 2500 },
      { value: 'mezquital', label: 'Mezquital', amount: 4000 },
    ],
  },
  {
    group: 'Hacia Tepehuanes',
    options: [{ value: 'canatlan', label: 'Canatlán', amount: 2000 }],
  },
];

const flattenMaterials = (catalog) =>
  catalog.flatMap(({ category, items }) =>
    items.map((item) => ({
      ...item,
      category,
    }))
  );

const hexToRgba = (hex, alpha = 1) => {
  if (typeof hex !== 'string') {
    return `rgba(255,255,255,${alpha})`;
  }
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  if (Number.isNaN(bigint)) {
    return `rgba(255,255,255,${alpha})`;
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const parseNonNegativeFloat = (value) => {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

function PrintableReport({
  figureLabel,
  measurements,
  baseArea,
  unit,
  perimeter,
  floorAreaConverted,
  materialUnitPrice,
  materialName,
  wallSurface,
  wallCostPerM2,
  wallHeight,
  baseboardSurface,
  baseboardCostPerM2,
  baseboardHeight,
  edgeSurface,
  edgeCostPerM2,
  edgeWidth,
  wallMetrics: wallMetricsOverride,
  baseboardMetrics: baseboardMetricsOverride,
  edgeMetrics: edgeMetricsOverride,
  floorCost,
  wallCost,
  baseboardCost,
  edgeCost,
  viaticCost,
  viaticLabel,
  specialCost,
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
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });
  };

  const relevantMeasurements = Array.isArray(measurements) ? measurements : [];

  const wallMetrics =
    Array.isArray(wallMetricsOverride) && wallMetricsOverride.length > 0
      ? wallMetricsOverride
      : [
          { label: 'Altura', value: wallHeight, unit: 'm' },
          { label: 'Perímetro', value: perimeter, unit: 'm' },
        ];
  const baseboardMetrics =
    Array.isArray(baseboardMetricsOverride) && baseboardMetricsOverride.length > 0
      ? baseboardMetricsOverride
      : [
          { label: 'Altura', value: baseboardHeight, unit: 'm' },
          { label: 'Perímetro', value: perimeter, unit: 'm' },
        ];
  const edgeMetrics =
    Array.isArray(edgeMetricsOverride) && edgeMetricsOverride.length > 0
      ? edgeMetricsOverride
      : [
          { label: 'Ancho', value: edgeWidth, unit: 'm' },
          { label: 'Perímetro', value: perimeter, unit: 'm' },
        ];

  const costRows = [
    {
      key: 'floor',
      label: materialName ? `Superficie principal · ${materialName}` : 'Superficie principal',
      surfaceValue: baseArea,
      surfaceUnit: 'm²',
      unitCost: materialUnitPrice,
      subtotal: floorCost,
      metrics: unit !== 'm2' ? [{ label: `Área (${unit})`, value: floorAreaConverted, unit }] : [],
    },
    {
      key: 'walls',
      label: 'Paredes',
      surfaceValue: wallSurface,
      surfaceUnit: 'm²',
      unitCost: wallCostPerM2,
      subtotal: wallCost,
      metrics: wallMetrics,
    },
    {
      key: 'baseboards',
      label: 'Faldones',
      surfaceValue: baseboardSurface,
      surfaceUnit: 'm²',
      unitCost: baseboardCostPerM2,
      subtotal: baseboardCost,
      metrics: baseboardMetrics,
    },
    {
      key: 'edges',
      label: 'Orillas',
      surfaceValue: edgeSurface,
      surfaceUnit: 'm²',
      unitCost: edgeCostPerM2,
      subtotal: edgeCost,
      metrics: edgeMetrics,
    },
    {
      key: 'special',
      label: 'Costos especiales',
      surfaceValue: null,
      surfaceUnit: '',
      unitCost: null,
      subtotal: specialCost,
      metrics: [],
      hideUnitCost: true,
    },
    {
      key: 'viatic',
      label: viaticCost > 0 ? `Viáticos · ${viaticLabel}` : 'Viáticos',
      surfaceValue: null,
      surfaceUnit: '',
      unitCost: null,
      subtotal: viaticCost,
      metrics: [],
      hideUnitCost: true,
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

        {materialName && (
          <p className="print-report__caption mt-4">
            Material seleccionado: <span className="print-report__strong">{materialName}</span>
          </p>
        )}

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
              <th scope="col">Costo de Material m²</th>
              <th scope="col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {costRows.map(({ key, label, surfaceValue, surfaceUnit, unitCost, subtotal, metrics, hideUnitCost }) => {
              const hasSurface = Number.isFinite(surfaceValue) && surfaceValue > 0;
              const visibleMetrics = (metrics || []).filter(
                ({ value }) => Number.isFinite(value) && value > 0
              );
              const unitCostContent = hideUnitCost ? '—' : formatCurrency(unitCost);

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
                  <td>{unitCostContent}</td>
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

export default function ResultsPanel({
  figure,
  data,
  instanceLabel,
  workspaceId,
  onCostDrawerStateChange,
  externalCloseSignal,
}) {
  const [area, setArea] = useState(0);
  const [perimeter, setPerimeter] = useState(0);
  const [unit, setUnit] = useState('m2');
  const [customPricePerM2, setCustomPricePerM2] = useState(100);
  const [wallCostPerM2, setWallCostPerM2] = useState(100);
  const [wallCostPerM2Touched, setWallCostPerM2Touched] = useState(false);
  const [baseboardCostPerM2, setBaseboardCostPerM2] = useState(100);
  const [baseboardCostPerM2Touched, setBaseboardCostPerM2Touched] = useState(false);
  const [edgeCostPerM2, setEdgeCostPerM2] = useState(100);
  const [edgeCostPerM2Touched, setEdgeCostPerM2Touched] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState(DEFAULT_MATERIAL_ID);
  const [specialCost, setSpecialCost] = useState(0);
  const [selectedViatic, setSelectedViatic] = useState('none');
  const [lShapeError, setLShapeError] = useState('');
  const [showCostDrawer, setShowCostDrawer] = useState(false);
  const [reportTimestamp, setReportTimestamp] = useState('');
  const [showVisualPreview, setShowVisualPreview] = useState(false);
  const manualCostDrawerRef = useRef(false);
  const modalScrollRef = useRef(null);
  const externalCloseSignalRef = useRef(externalCloseSignal?.token ?? 0);

  useEffect(() => {
    const { area: computedArea, perimeter: computedPerimeter, error } = calculateMetrics(figure, data);
    setArea(computedArea);
    setPerimeter(computedPerimeter);
    setLShapeError(error);
  }, [data, figure]);

  useEffect(() => {
    setWallCostPerM2Touched(false);
    setBaseboardCostPerM2Touched(false);
    setEdgeCostPerM2Touched(false);
  }, [figure, workspaceId]);

  const measurements = useMemo(() => getFigureMeasurements(figure, data), [figure, data]);
  const figureLabel = useMemo(() => {
    const baseLabel = figureDescriptions[figure] ?? 'Figura seleccionada';
    return instanceLabel ? `${baseLabel} · ${instanceLabel}` : baseLabel;
  }, [figure, instanceLabel]);
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

  const closeCostDrawer = useCallback(() => {
    manualCostDrawerRef.current = false;
    setShowCostDrawer(false);
    closeVisualPreview();
    if (workspaceId && typeof onCostDrawerStateChange === 'function') {
      onCostDrawerStateChange(workspaceId, false);
    }
  }, [closeVisualPreview, onCostDrawerStateChange, workspaceId]);

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
      manualCostDrawerRef.current = true;
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

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }

    if (!showCostDrawer) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCostDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCostDrawer, closeCostDrawer]);

  useEffect(() => {
    if (showCostDrawer) {
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (workspaceId && typeof onCostDrawerStateChange === 'function') {
      onCostDrawerStateChange(workspaceId, showCostDrawer);
    }
  }, [showCostDrawer, workspaceId, onCostDrawerStateChange]);

  useEffect(() => {
    const signalToken = externalCloseSignal?.token ?? 0;
    const signalId = externalCloseSignal?.id;

    if (!workspaceId) {
      externalCloseSignalRef.current = signalToken;
      return undefined;
    }

    if (signalToken === externalCloseSignalRef.current) {
      return undefined;
    }

    externalCloseSignalRef.current = signalToken;

    if (signalId === workspaceId && showCostDrawer) {
      closeCostDrawer();
    }
    return undefined;
  }, [externalCloseSignal, showCostDrawer, closeCostDrawer, workspaceId]);

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
  const formatCurrencyValue = (val) =>
    Number.isFinite(val)
      ? val.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
      : '$0.00';

  const wallHeightSetting = Number.isFinite(data?.wallHeight) ? data.wallHeight : 0;
  const baseboardHeightSetting = Number.isFinite(data?.baseboardHeight) ? data.baseboardHeight : 0;
  const edgeWidthSetting = Number.isFinite(data?.edgeWidth) ? data.edgeWidth : 0;

  const borderSummary = useMemo(() => {
    const allBorders = Array.isArray(data?.borders) ? data.borders : [];
    const areaByType = { zoclo: 0, faldon: 0, orilla: 0 };
    const lengthByType = { zoclo: 0, faldon: 0, orilla: 0 };
    const widthTotals = {
      zoclo: { total: 0, count: 0 },
      faldon: { total: 0, count: 0 },
      orilla: { total: 0, count: 0 },
    };

    allBorders.forEach((border) => {
      if (!border?.enabled) {
        return;
      }

      const normalizedType =
        border.type === 'zoclo' || border.type === 'faldon' ? border.type : 'orilla';
      const length = Number.isFinite(border?.length) ? border.length : 0;
      const width = Number.isFinite(border?.width) ? border.width : 0;

      lengthByType[normalizedType] += length;
      if (length > 0 && width > 0) {
        areaByType[normalizedType] += length * width;
      }
      if (width > 0) {
        widthTotals[normalizedType].total += width;
        widthTotals[normalizedType].count += 1;
      }
    });

    const averageWidthByType = {
      zoclo:
        widthTotals.zoclo.count > 0 ? widthTotals.zoclo.total / widthTotals.zoclo.count : 0,
      faldon:
        widthTotals.faldon.count > 0 ? widthTotals.faldon.total / widthTotals.faldon.count : 0,
      orilla:
        widthTotals.orilla.count > 0 ? widthTotals.orilla.total / widthTotals.orilla.count : 0,
    };

    return {
      areaByType,
      lengthByType,
      averageWidthByType,
    };
  }, [data?.borders]);

  const wallSurfaceFromBorders = borderSummary.areaByType.zoclo;
  const baseboardSurfaceFromBorders = borderSummary.areaByType.faldon;
  const edgeSurfaceFromBorders = borderSummary.areaByType.orilla;

  const wallLengthFromBorders = borderSummary.lengthByType.zoclo;
  const baseboardLengthFromBorders = borderSummary.lengthByType.faldon;
  const edgeLengthFromBorders = borderSummary.lengthByType.orilla;

  const wallHeight = wallSurfaceFromBorders > 0
    ? borderSummary.averageWidthByType.zoclo
    : wallHeightSetting;
  const baseboardHeight = baseboardSurfaceFromBorders > 0
    ? borderSummary.averageWidthByType.faldon
    : baseboardHeightSetting;
  const edgeWidth = edgeSurfaceFromBorders > 0
    ? borderSummary.averageWidthByType.orilla
    : edgeWidthSetting;

  const wallSurface =
    wallSurfaceFromBorders > 0 ? wallSurfaceFromBorders : perimeter * wallHeightSetting;
  const baseboardSurface =
    baseboardSurfaceFromBorders > 0
      ? baseboardSurfaceFromBorders
      : perimeter * baseboardHeightSetting;
  const edgeSurface =
    edgeSurfaceFromBorders > 0 ? edgeSurfaceFromBorders : perimeter * edgeWidthSetting;

  const wallMetrics = wallSurfaceFromBorders > 0
    ? [
        { label: 'Longitud activa', value: wallLengthFromBorders, unit: 'm' },
        { label: 'Altura promedio', value: wallHeight, unit: 'm' },
      ]
    : [
        { label: 'Altura', value: wallHeight, unit: 'm' },
        { label: 'Perímetro', value: perimeter, unit: 'm' },
      ];

  const baseboardMetrics = baseboardSurfaceFromBorders > 0
    ? [
        { label: 'Longitud activa', value: baseboardLengthFromBorders, unit: 'm' },
        { label: 'Altura promedio', value: baseboardHeight, unit: 'm' },
      ]
    : [
        { label: 'Altura', value: baseboardHeight, unit: 'm' },
        { label: 'Perímetro', value: perimeter, unit: 'm' },
      ];

  const edgeMetrics = edgeSurfaceFromBorders > 0
    ? [
        { label: 'Longitud activa', value: edgeLengthFromBorders, unit: 'm' },
        { label: 'Ancho promedio', value: edgeWidth, unit: 'm' },
      ]
    : [
        { label: 'Ancho', value: edgeWidth, unit: 'm' },
        { label: 'Perímetro', value: perimeter, unit: 'm' },
      ];

  const materialCatalog = useMemo(() => MATERIAL_CATALOG, []);
  const materialOptions = useMemo(() => flattenMaterials(materialCatalog), [materialCatalog]);

  const selectedMaterial = useMemo(() => {
    if (selectedMaterialId === DEFAULT_MATERIAL_ID) {
      return null;
    }
    return materialOptions.find((item) => item.id === selectedMaterialId) ?? null;
  }, [selectedMaterialId, materialOptions]);

  const materialUnitPrice = selectedMaterial ? selectedMaterial.price : customPricePerM2;
  const materialDisplayName = selectedMaterial ? selectedMaterial.name : 'Personalizado';
  const materialCategory = selectedMaterial?.category ?? null;
  const materialName = selectedMaterial
    ? `${selectedMaterial.name} (${selectedMaterial.category})`
    : 'Precio personalizado';

  useEffect(() => {
    const unitCost = Number.isFinite(materialUnitPrice) ? materialUnitPrice : 0;

    if (!wallCostPerM2Touched && wallCostPerM2 !== unitCost) {
      setWallCostPerM2(unitCost);
    }
    if (!baseboardCostPerM2Touched && baseboardCostPerM2 !== unitCost) {
      setBaseboardCostPerM2(unitCost);
    }
    if (!edgeCostPerM2Touched && edgeCostPerM2 !== unitCost) {
      setEdgeCostPerM2(unitCost);
    }
  }, [
    materialUnitPrice,
    wallCostPerM2Touched,
    baseboardCostPerM2Touched,
    edgeCostPerM2Touched,
    wallCostPerM2,
    baseboardCostPerM2,
    edgeCostPerM2,
  ]);

  const viaticSelection = useMemo(() => {
    if (!selectedViatic || selectedViatic === 'none') {
      return null;
    }
    for (const { group, options } of VIATIC_OPTIONS) {
      const match = options.find((option) => option.value === selectedViatic);
      if (match) {
        return { ...match, group };
      }
    }
    return null;
  }, [selectedViatic]);

  const floorAreaConverted = convertArea(area);
  const floorCost = area * materialUnitPrice;
  const wallCost = wallSurface * wallCostPerM2;
  const baseboardCost = baseboardSurface * baseboardCostPerM2;
  const edgeCost = edgeSurface * edgeCostPerM2;
  const viaticCost = viaticSelection?.amount ?? 0;
  const viaticLabel = viaticSelection ? `${viaticSelection.label} (${viaticSelection.group})` : 'Sin viáticos';
  const total = floorCost + wallCost + baseboardCost + edgeCost + specialCost + viaticCost;
  const visualItems = [
    area > 0 && {
      key: 'floor',
      label: 'Superficie principal',
      areaValue: area,
      displayValue: `${formatValue(floorAreaConverted)} ${unit}${
        selectedMaterial ? ` · ${materialDisplayName}` : ''
      }`,
      color: SURFACE_STYLES.floor.gradient,
    },
    wallSurface > 0 && {
      key: 'walls',
      label: 'Zoclos',
      areaValue: wallSurface,
      displayValue: `${formatValue(wallSurface)} m²`,
      color: SURFACE_STYLES.zoclo.gradient,
    },
    baseboardSurface > 0 && {
      key: 'baseboards',
      label: 'Faldones',
      areaValue: baseboardSurface,
      displayValue: `${formatValue(baseboardSurface)} m²`,
      color: SURFACE_STYLES.faldon.gradient,
    },
    edgeSurface > 0 && {
      key: 'edges',
      label: 'Orillas',
      areaValue: edgeSurface,
      displayValue: `${formatValue(edgeSurface)} m²`,
      color: SURFACE_STYLES.orilla.gradient,
    },
  ].filter(Boolean);
  const maxVisualArea = visualItems.length > 0 ? Math.max(...visualItems.map(({ areaValue }) => areaValue)) : 0;
  const perimeterCostConfigs = [
    {
      key: 'zoclo',
      label: 'Zoclos',
      surface: wallSurface,
      metrics: wallMetrics,
      unitCost: wallCostPerM2,
      subtotal: wallCost,
      style: SURFACE_STYLES.zoclo,
      onChange: (value) => {
        setWallCostPerM2Touched(true);
        setWallCostPerM2(value);
      },
    },
    {
      key: 'faldon',
      label: 'Faldones',
      surface: baseboardSurface,
      metrics: baseboardMetrics,
      unitCost: baseboardCostPerM2,
      subtotal: baseboardCost,
      style: SURFACE_STYLES.faldon,
      onChange: (value) => {
        setBaseboardCostPerM2Touched(true);
        setBaseboardCostPerM2(value);
      },
    },
    {
      key: 'orilla',
      label: 'Orillas',
      surface: edgeSurface,
      metrics: edgeMetrics,
      unitCost: edgeCostPerM2,
      subtotal: edgeCost,
      style: SURFACE_STYLES.orilla,
      onChange: (value) => {
        setEdgeCostPerM2Touched(true);
        setEdgeCostPerM2(value);
      },
    },
  ].filter(({ surface }) => Number.isFinite(surface) && surface > 0);
  const visualPreviewContent = (
    <>
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
    </>
  );

  return (
    <>
      <div className="print-area screen-only relative mt-6 w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-[0_25px_80px_rgba(15,118,110,0.25)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-16 -top-24 h-48 rounded-full bg-emerald-500/20 blur-3xl opacity-40" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">
              Resultados{instanceLabel ? ` · ${instanceLabel}` : ''}
            </h2>
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

              {visualItems.length > 0 && (
                <button
                  type="button"
                  onClick={toggleVisualPreview}
                  aria-pressed={showVisualPreview}
                  className="print:hidden inline-flex items-center gap-2 self-start rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:bg-emerald-500/15 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
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
                      Total {formatCurrencyValue(total)}
                    </span>
                  </div>
                  <span className={`ml-4 transition-transform ${showCostDrawer ? 'rotate-180' : ''}`}>▾</span>
                </button>
              </div>

              {showCostDrawer && (
                <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                  <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                    onClick={closeCostDrawer}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-gray-950/95 shadow-[0_35px_120px_rgba(16,185,129,0.35)] mx-auto">
                    <button
                      type="button"
                      onClick={closeCostDrawer}
                      className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-base font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                      aria-label="Cerrar costos"
                    >
                      ×
                    </button>
                    <div className="flex flex-col gap-3 border-b border-emerald-500/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Costos estimados</h3>
                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                          {instanceLabel ?? 'Figura actual'}
                        </p>
                      </div>
                      <div className="text-sm text-emerald-200/70">
                        Total actual{' '}
                        <span className="font-semibold text-emerald-300">
                          {formatCurrencyValue(total)}
                        </span>
                      </div>
                    </div>

                    <div
                      ref={modalScrollRef}
                      className="max-h-[75vh] overflow-y-auto px-5 py-5 space-y-5 sm:px-6"
                    >
                      {showCostDrawer && showVisualPreview && visualItems.length > 0 && (
                        <div className="rounded-xl border border-emerald-500/25 bg-gray-900/60 px-4 py-4">
                          {visualPreviewContent}
                        </div>
                      )}

                      <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-emerald-200">Superficie principal</p>
                            <p className="mt-1 text-xs text-gray-400">
                              Área: {formatValue(floorAreaConverted)} {unit}
                            </p>
                            <p className="mt-2 text-xs text-emerald-300/80">
                              Material: {materialDisplayName}
                              {materialCategory && (
                                <span className="block text-[11px] text-emerald-200/60">{materialCategory}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex w-full flex-col gap-3 text-xs uppercase tracking-wide text-gray-400 sm:max-w-sm">
                            <label className="flex flex-col text-left sm:text-right">
                              Material
                              <select
                                value={selectedMaterialId}
                                onChange={(e) => setSelectedMaterialId(e.target.value)}
                                className="print-select mt-1 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                              >
                                <option value={DEFAULT_MATERIAL_ID}>Personalizado</option>
                                {materialCatalog.map(({ category, items }) => (
                                  <optgroup key={category} label={category}>
                                    {items.map(({ id, name, price }) => {
                                      const formatted = price.toLocaleString('es-MX', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                                      return (
                                        <option key={id} value={id}>
                                          {`${name} — $${formatted}`}
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                ))}
                              </select>
                            </label>
                            {selectedMaterialId === DEFAULT_MATERIAL_ID ? (
                            <label className="flex flex-col text-left sm:text-right">
                              Precio por m²
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={customPricePerM2}
                                onChange={(e) => setCustomPricePerM2(parseNonNegativeFloat(e.target.value))}
                                className="print-input mt-1 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                              />
                            </label>
                            ) : (
                              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-right text-xs text-emerald-200/80">
                                Precio por m²
                                <p className="mt-1 text-sm font-semibold text-emerald-300">
                                  {formatCurrencyValue(materialUnitPrice)}
                                </p>
                              </div>
                            )}
                          </div>
                      </div>
                      <p className="mt-4 text-sm text-gray-300">
                        Subtotal:{' '}
                        <span className="font-semibold text-emerald-300">
                          {formatCurrencyValue(floorCost)}
                        </span>
                      </p>
                    </div>

                      {perimeterCostConfigs.map(
                        ({ key, label, surface, metrics, unitCost, subtotal, style, onChange }) => {
                          const metricItems = Array.isArray(metrics)
                            ? metrics.filter(
                                ({ value }) => Number.isFinite(value) && Math.abs(value) > 0
                              )
                            : [];
                          return (
                            <div
                              key={key}
                              className="rounded-xl border bg-gray-900/60 p-5 shadow-inner"
                              style={{
                                borderColor: hexToRgba(style.solid, 0.45),
                                boxShadow: `0 12px 35px ${hexToRgba(style.solid, 0.18)}`,
                              }}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p
                                    className="text-sm font-semibold"
                                    style={{ color: style.solid }}
                                  >
                                    {label}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Área activa: {formatValue(surface)} m²
                                  </p>
                                  {metricItems.length > 0 && (
                                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-300">
                                      {metricItems.map(({ label: metricLabel, value, unit: metricUnit }) => (
                                        <div key={metricLabel}>
                                          <dt className="text-[10px] uppercase tracking-wide text-gray-500">
                                            {metricLabel}
                                          </dt>
                                          <dd className="mt-1 font-semibold text-emerald-200">
                                            {formatValue(value)}
                                            {metricUnit ? (
                                              <span className="ml-1 text-[10px] text-gray-500">
                                                {metricUnit}
                                              </span>
                                            ) : null}
                                          </dd>
                                        </div>
                                      ))}
                                    </dl>
                                  )}
                                </div>
                                <label className="text-xs uppercase tracking-wide text-gray-400">
                                  Precio por m²
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={unitCost}
                                    onChange={(event) => onChange(parseNonNegativeFloat(event.target.value))}
                                    className="print-input mt-1 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition sm:w-32"
                                  />
                                </label>
                              </div>
                              <p className="mt-4 text-sm text-gray-300">
                                Subtotal:{' '}
                                <span className="font-semibold text-emerald-300">
                                  {formatCurrencyValue(subtotal)}
                                </span>
                              </p>
                            </div>
                          );
                        }
                      )}

                      <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-200">Costos especiales</p>
                            <p className="text-xs text-gray-400">
                              Importe adicional fijo para materiales o servicios extra.
                            </p>
                          </div>
                          <label className="text-xs uppercase tracking-wide text-gray-400">
                            Monto $
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={specialCost}
                              onChange={(e) => setSpecialCost(parseNonNegativeFloat(e.target.value))}
                              className="print-input mt-1 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-1.5 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition sm:w-32"
                            />
                          </label>
                        </div>
                        <p className="mt-4 text-sm text-gray-300">
                          Subtotal:{' '}
                          <span className="font-semibold text-emerald-300">
                            {formatCurrencyValue(specialCost)}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-800/70 bg-gray-900/60 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-200">Viáticos</p>
                            <p className="text-xs text-gray-400 max-w-xs">
                              Selecciona el destino del equipo de instalación para sumar los viáticos estimados.
                            </p>
                          </div>
                          <label className="text-xs uppercase tracking-wide text-gray-400">
                            Destino
                            <select
                              value={selectedViatic}
                              onChange={(e) => setSelectedViatic(e.target.value)}
                              className="print-select mt-1 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition sm:w-52"
                            >
                              <option value="none">Sin viáticos</option>
                              {VIATIC_OPTIONS.map(({ group, options }) => (
                                <optgroup key={group} label={group}>
                                  {options.map(({ value, label: optionLabel, amount }) => {
                                    const formattedAmount = amount.toLocaleString('es-MX', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    });
                                    return (
                                      <option key={value} value={value}>
                                        {`${optionLabel} — $${formattedAmount}`}
                                      </option>
                                    );
                                  })}
                                </optgroup>
                              ))}
                            </select>
                          </label>
                        </div>
                        <p className="mt-4 text-sm text-gray-300">
                          Subtotal:{' '}
                          <span className="font-semibold text-emerald-300">
                            {formatCurrencyValue(viaticCost)}
                          </span>
                        </p>
                        {viaticSelection && (
                          <p className="mt-2 text-xs text-emerald-200/70">
                            Seleccionado: {viaticSelection.label} · {viaticSelection.group}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-emerald-500/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Total estimado</span>
                        <span className="text-xl font-semibold text-emerald-400">
                          {formatCurrencyValue(total)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 sm:w-auto"
                      >
                        <span>Exportar PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {lShapeError && (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {lShapeError}
            </p>
          )}

          {showVisualPreview && visualItems.length > 0 && !showCostDrawer && (
            <div className="print:hidden fixed inset-x-4 bottom-6 z-[80] w-auto max-w-sm sm:inset-x-auto sm:right-6">
              <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gray-950/95 px-5 pb-5 pt-4 shadow-[0_30px_90px_rgba(16,185,129,0.35)] backdrop-blur-md">
                {visualPreviewContent}
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
        materialUnitPrice={materialUnitPrice}
        materialName={materialName}
        wallSurface={wallSurface}
        wallCostPerM2={wallCostPerM2}
        wallHeight={wallHeight}
        baseboardSurface={baseboardSurface}
        baseboardCostPerM2={baseboardCostPerM2}
        baseboardHeight={baseboardHeight}
        edgeSurface={edgeSurface}
        edgeCostPerM2={edgeCostPerM2}
        edgeWidth={edgeWidth}
        wallMetrics={wallMetrics}
        baseboardMetrics={baseboardMetrics}
        edgeMetrics={edgeMetrics}
        floorCost={floorCost}
        wallCost={wallCost}
        baseboardCost={baseboardCost}
        edgeCost={edgeCost}
        viaticCost={viaticCost}
        viaticLabel={viaticLabel}
        specialCost={specialCost}
        total={total}
        formatValue={formatValue}
        formatMeasurement={formatMeasurement}
        reportTimestamp={reportTimestamp}
        lShapeError={lShapeError}
      />
    </>
  );
}
