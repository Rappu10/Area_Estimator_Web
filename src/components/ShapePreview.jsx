import React, { useId, useMemo } from 'react';
import { calculateMetrics } from '../utils/figureMetrics';

const VIEWBOX = 240;

const clampPositive = (value, fallback = 1) =>
  Number.isFinite(value) && value > 0 ? value : fallback;

const getRectangleShape = (width = 1, height = 1) => {
  const safeWidth = clampPositive(width);
  const safeHeight = clampPositive(height);
  const scale = 180 / Math.max(safeWidth, safeHeight);
  const displayWidth = safeWidth * scale;
  const displayHeight = safeHeight * scale;
  const x = (VIEWBOX - displayWidth) / 2;
  const y = (VIEWBOX - displayHeight) / 2;

  return <rect x={x} y={y} width={displayWidth} height={displayHeight} rx="12" ry="12" />;
};

const getTriangleShape = (base = 1, height = 1) => {
  const safeBase = clampPositive(base);
  const safeHeight = clampPositive(height);
  const scale = 180 / Math.max(safeBase, safeHeight);
  const displayBase = safeBase * scale;
  const displayHeight = safeHeight * scale;

  const xOffset = (VIEWBOX - displayBase) / 2;
  const yOffset = (VIEWBOX + displayHeight) / 2;

  const points = [
    `${VIEWBOX / 2},${yOffset - displayHeight}`, // top
    `${xOffset},${yOffset}`, // bottom-left
    `${xOffset + displayBase},${yOffset}`, // bottom-right
  ].join(' ');

  return <polygon points={points} />;
};

const getCircleShape = (radius = 1) => {
  const safeRadius = clampPositive(radius);
  const scale = 90 / safeRadius;
  const displayRadius = safeRadius * scale;

  return <circle cx={VIEWBOX / 2} cy={VIEWBOX / 2} r={displayRadius} />;
};

const getLShapePath = (outerWidth, outerHeight, cutWidth, cutHeight) => {
  const safeOuterWidth = clampPositive(outerWidth);
  const safeOuterHeight = clampPositive(outerHeight);
  const safeCutWidth = clampPositive(cutWidth, Math.min(safeOuterWidth / 2, safeOuterWidth - 1));
  const safeCutHeight = clampPositive(cutHeight, Math.min(safeOuterHeight / 2, safeOuterHeight - 1));

  const scale = 180 / Math.max(safeOuterWidth, safeOuterHeight);
  const outerW = safeOuterWidth * scale;
  const outerH = safeOuterHeight * scale;
  const cutW = Math.min(safeCutWidth * scale, outerW - 20);
  const cutH = Math.min(safeCutHeight * scale, outerH - 20);

  const offsetX = (VIEWBOX - outerW) / 2;
  const offsetY = (VIEWBOX - outerH) / 2;

  const path = [
    `M ${offsetX} ${offsetY}`,
    `H ${offsetX + outerW}`,
    `V ${offsetY + outerH}`,
    `H ${offsetX + outerW - cutW}`,
    `V ${offsetY + outerH - cutH}`,
    `H ${offsetX}`,
    'Z',
  ].join(' ');

  return <path d={path} />;
};

function getShapeElement(figure, data) {
  switch (figure) {
    case 'rectangle':
      return getRectangleShape(data.width, data.height);
    case 'triangle':
      return getTriangleShape(data.base, data.height);
    case 'circle':
      return getCircleShape(data.radius);
    case 'lShape':
      return getLShapePath(data.outerWidth, data.outerHeight, data.cutWidth, data.cutHeight);
    default:
      return getRectangleShape();
  }
}

const figureDescriptions = {
  rectangle: 'Rectángulo',
  triangle: 'Triángulo isósceles',
  circle: 'Círculo',
  lShape: 'Figura en L',
};

const hasPositiveValue = (value) => Number.isFinite(value) && value > 0;

const formatMeasurementValue = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const decimals = value >= 100 ? 1 : 2;
  return Number.parseFloat(value.toFixed(decimals)).toString();
};

const addMeasurement = (collection, label, value, unit = 'm') => {
  if (!hasPositiveValue(value)) {
    return;
  }
  collection.push({ label, value, unit });
};

const getFigureMeasurements = (figure, data = {}) => {
  const measurements = [];

  switch (figure) {
    case 'rectangle':
      addMeasurement(measurements, 'Ancho', data.width);
      addMeasurement(measurements, 'Alto', data.height);
      break;
    case 'triangle':
      addMeasurement(measurements, 'Base', data.base);
      addMeasurement(measurements, 'Altura', data.height);
      break;
    case 'circle':
      addMeasurement(measurements, 'Radio', data.radius);
      if (hasPositiveValue(data.radius)) {
        addMeasurement(measurements, 'Diámetro', data.radius * 2);
      }
      break;
    case 'lShape':
      addMeasurement(measurements, 'Ancho exterior', data.outerWidth);
      addMeasurement(measurements, 'Alto exterior', data.outerHeight);
      addMeasurement(measurements, 'Ancho recorte', data.cutWidth);
      addMeasurement(measurements, 'Alto recorte', data.cutHeight);
      break;
    default:
      break;
  }

  return measurements;
};

const getScaleFactor = (figure, data = {}) => {
  switch (figure) {
    case 'rectangle': {
      const { width, height } = data;
      if (!hasPositiveValue(width) && !hasPositiveValue(height)) {
        return null;
      }
      const safeWidth = clampPositive(width);
      const safeHeight = clampPositive(height);
      return 180 / Math.max(safeWidth, safeHeight);
    }
    case 'triangle': {
      const { base, height } = data;
      if (!hasPositiveValue(base) && !hasPositiveValue(height)) {
        return null;
      }
      const safeBase = clampPositive(base);
      const safeHeight = clampPositive(height);
      return 180 / Math.max(safeBase, safeHeight);
    }
    case 'circle': {
      const { radius } = data;
      if (!hasPositiveValue(radius)) {
        return null;
      }
      const safeRadius = clampPositive(radius);
      return 90 / safeRadius;
    }
    case 'lShape': {
      const { outerWidth, outerHeight } = data;
      if (!hasPositiveValue(outerWidth) && !hasPositiveValue(outerHeight)) {
        return null;
      }
      const safeOuterWidth = clampPositive(outerWidth);
      const safeOuterHeight = clampPositive(outerHeight);
      return 180 / Math.max(safeOuterWidth, safeOuterHeight);
    }
    default:
      return null;
  }
};

const getPerimeterBreakdown = (figure, data = {}) => {
  const { perimeter } = calculateMetrics(figure, data);
  const safePerimeter = Number.isFinite(perimeter) ? perimeter : 0;

  if (safePerimeter <= 0) {
    return { perimeter: 0, details: [] };
  }

  const entries = [
    {
      key: 'walls',
      label: 'Paredes',
      dimensionLabel: 'Altura',
      dimensionValue: Number.isFinite(data.wallHeight) ? data.wallHeight : 0,
    },
    {
      key: 'baseboard',
      label: 'Zócalos',
      dimensionLabel: 'Altura',
      dimensionValue: Number.isFinite(data.baseboardHeight) ? data.baseboardHeight : 0,
    },
    {
      key: 'edges',
      label: 'Orillas',
      dimensionLabel: 'Ancho',
      dimensionValue: Number.isFinite(data.edgeWidth) ? data.edgeWidth : 0,
    },
  ];

  const details = entries
    .map((entry) => {
      const area = entry.dimensionValue * safePerimeter;
      return {
        ...entry,
        area,
      };
    })
    .filter((entry) => hasPositiveValue(entry.dimensionValue) && hasPositiveValue(entry.area));

  return { perimeter: safePerimeter, details };
};

export default function ShapePreview({ figure, data }) {
  const idBase = useId().replace(/:/g, '');
  const gradientId = `${idBase}-gradient`;
  const glowId = `${idBase}-glow`;

  const shapeElement = useMemo(() => getShapeElement(figure, data), [figure, data]);
  const label = figureDescriptions[figure] ?? 'Figura seleccionada';
  const measurements = useMemo(() => getFigureMeasurements(figure, data), [figure, data]);
  const scaleFactor = useMemo(() => getScaleFactor(figure, data), [figure, data]);
  const { perimeter: previewPerimeter, details: perimeterDetails } = useMemo(
    () => getPerimeterBreakdown(figure, data),
    [figure, data]
  );
  const hasMeasurements = measurements.length > 0;
  const hasPerimeterDetails = perimeterDetails.length > 0;

  return (
    <div className="rounded-2xl border border-emerald-500/10 bg-black/40 p-5 shadow-[0_20px_60px_rgba(16,185,129,0.15)] backdrop-blur-xl">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-emerald-300/80">
        <span>Vista previa</span>
        <span>{label}</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5">
        <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="h-56 w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(110,231,183,0.9)" />
              <stop offset="50%" stopColor="rgba(16,185,129,0.6)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.4)" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g fill={`url(#${gradientId})`} stroke="rgba(16,185,129,0.5)" strokeWidth="4" filter={`url(#${glowId})`}>
            {shapeElement}
          </g>
        </svg>
      </div>
      {hasMeasurements && (
        <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-500/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-200/90">
            Medidas ingresadas
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {measurements.map(({ label: measurementLabel, value, unit }) => (
              <div key={measurementLabel} className="flex items-baseline justify-between">
                <dt className="text-[11px] uppercase tracking-wide text-emerald-300/70">
                  {measurementLabel}
                </dt>
                <dd className="text-sm font-semibold text-emerald-200">
                  {formatMeasurementValue(value)}
                  <span className="ml-1 text-xs font-medium text-emerald-300/60">{unit}</span>
                </dd>
              </div>
            ))}
          </dl>
          {Number.isFinite(scaleFactor) && (
            <p className="mt-3 text-xs text-emerald-300/70">
              Escala aproximada: 1 m ~ {Number.parseFloat(scaleFactor.toFixed(2)).toString()} unidades visuales
            </p>
          )}
        </div>
      )}
      {hasPerimeterDetails && (
        <div className="mt-4 rounded-xl border border-sky-400/15 bg-sky-500/5 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-200/90">
              Paredes, zócalos y orillas
            </p>
            <p className="text-[11px] font-semibold text-sky-200/60">
              Longitud base: {formatMeasurementValue(previewPerimeter)} m
            </p>
          </div>
          <div className="mt-3 space-y-3">
            {perimeterDetails.map(
              ({ key, label: perimeterLabel, dimensionLabel, dimensionValue, area }) => (
                <div
                  key={key}
                  className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-3 text-sm text-sky-100/90"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{perimeterLabel}</span>
                    <span className="text-xs text-sky-200/70">
                      {dimensionLabel}:{' '}
                      <strong className="font-semibold text-sky-100">
                        {formatMeasurementValue(dimensionValue)} m
                      </strong>
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-3 text-xs text-sky-100/80">
                    <div>
                      <dt className="uppercase tracking-wide text-sky-200/50">Longitud</dt>
                      <dd className="mt-1 font-semibold text-sky-100">
                        {formatMeasurementValue(previewPerimeter)} m
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wide text-sky-200/50">Área estimada</dt>
                      <dd className="mt-1 font-semibold text-sky-100">
                        {formatMeasurementValue(area)} m²
                      </dd>
                    </div>
                  </dl>
                </div>
              )
            )}
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">
        Las proporciones se escalan para una visualización clara y no representan dimensiones reales.
      </p>
    </div>
  );
}
