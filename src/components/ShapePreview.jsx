"use client";

import React, { useEffect, useId, useMemo, useRef } from 'react';
import { calculateMetrics } from '../utils/figureMetrics';
import { BORDER_TYPE_STYLES } from '../data/surfaceStyles';

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

function getBorderElements(figure, data = {}) {
  const borders = Array.isArray(data.borders) ? data.borders : [];
  const enabledBorders = borders.filter(
    (border) => border?.enabled && Number.isFinite(border.width) && border.width > 0
  );

  if (enabledBorders.length === 0) {
    return null;
  }

  const elements = [];

  switch (figure) {
    case 'rectangle': {
      const width = clampPositive(data.width);
      const height = clampPositive(data.height);
      const scale = 180 / Math.max(width, height);
      const displayWidth = width * scale;
      const displayHeight = height * scale;
      const x = (VIEWBOX - displayWidth) / 2;
      const y = (VIEWBOX - displayHeight) / 2;

      enabledBorders.forEach((border) => {
        const edgeIndex = Number.isFinite(border?.edgeNumber) ? border.edgeNumber : 0;
        if (edgeIndex < 1 || edgeIndex > 4) {
          return;
        }

        const borderWidth = clampPositive(border.width, 0) * scale;
        if (borderWidth <= 0) {
          return;
        }

        const style = BORDER_TYPE_STYLES[border.type] ?? BORDER_TYPE_STYLES.orilla;
        const color = style?.solid ?? '#38bdf8';
        const baseRectProps = {
          key: border.id ?? `border-${edgeIndex}`,
          fill: color,
          fillOpacity: 0.45,
          stroke: color,
          strokeOpacity: 0.85,
          strokeWidth: 1.2,
        };

        switch (edgeIndex) {
          case 1:
            elements.push(
              <rect
                {...baseRectProps}
                x={x}
                y={Math.max(y - borderWidth, 0)}
                width={displayWidth}
                height={borderWidth}
              />
            );
            break;
          case 2:
            elements.push(
              <rect
                {...baseRectProps}
                x={x + displayWidth}
                y={y}
                width={borderWidth}
                height={displayHeight}
              />
            );
            break;
          case 3:
            elements.push(
              <rect
                {...baseRectProps}
                x={x}
                y={y + displayHeight}
                width={displayWidth}
                height={borderWidth}
              />
            );
            break;
          case 4:
            elements.push(
              <rect
                {...baseRectProps}
                x={Math.max(x - borderWidth, 0)}
                y={y}
                width={borderWidth}
                height={displayHeight}
              />
            );
            break;
          default:
            break;
        }
      });
      break;
    }
    case 'circle': {
      const radius = clampPositive(data.radius);
      const scale = 90 / radius;
      const displayRadius = radius * scale;
      const border = enabledBorders[0];

      if (border) {
        const borderWidth = clampPositive(border.width, 0) * scale;
        if (borderWidth > 0) {
          const style = BORDER_TYPE_STYLES[border.type] ?? BORDER_TYPE_STYLES.orilla;
          const color = style?.solid ?? '#38bdf8';
          elements.push(
            <circle
              key="border-circle"
              cx={VIEWBOX / 2}
              cy={VIEWBOX / 2}
              r={displayRadius + borderWidth / 2}
              fill="none"
              stroke={color}
              strokeOpacity={0.9}
              strokeWidth={borderWidth}
            />
          );
        }
      }
      break;
    }
    default:
      break;
  }

  return elements.length > 0 ? elements : null;
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
  const svgRef = useRef(null);

  const shapeElement = useMemo(() => getShapeElement(figure, data), [figure, data]);
  const borderElements = useMemo(() => getBorderElements(figure, data), [figure, data]);
  const label = figureDescriptions[figure] ?? 'Figura seleccionada';
  const measurements = useMemo(() => getFigureMeasurements(figure, data), [figure, data]);
  const scaleFactor = useMemo(() => getScaleFactor(figure, data), [figure, data]);
  const { perimeter: previewPerimeter, details: perimeterDetails } = useMemo(
    () => getPerimeterBreakdown(figure, data),
    [figure, data]
  );
  const hasMeasurements = measurements.length > 0;
  const hasPerimeterDetails = perimeterDetails.length > 0;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const svgElement = svgRef.current;

    if (!svgElement) {
      return undefined;
    }

    try {
      const serializer = new XMLSerializer();
      const svgMarkup = serializer.serializeToString(svgElement);
      const encoded = window.btoa(unescape(encodeURIComponent(svgMarkup)));

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        return undefined;
      }

      canvas.width = VIEWBOX * 2;
      canvas.height = VIEWBOX * 2;

      const image = new Image();
      image.onload = () => {
        context.fillStyle = '#f8fafc';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        svgElement.setAttribute('data-image', imageData);
      };
      image.src = `data:image/svg+xml;base64,${encoded}`;

      return () => {
        image.onload = null;
      };
    } catch (error) {
      if (svgElement) {
        svgElement.removeAttribute('data-image');
      }
      console.warn('No se pudo generar la imagen exportable de la vista previa.', error);
      return undefined;
    }
  }, [figure, data, shapeElement, borderElements]);

  return (
    <div className="rounded-2xl border border-emerald-500/10 bg-black/40 p-5 shadow-[0_20px_60px_rgba(16,185,129,0.15)] backdrop-blur-xl">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-emerald-300/80">
        <span>Vista previa</span>
        <span>{label}</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-inner print:bg-white">
        <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="h-56 w-full">
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
          <rect x="0" y="0" width={VIEWBOX} height={VIEWBOX} fill="#e5e7eb" />
          {borderElements}
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
        {borderElements && (
          <span className="ml-1 text-emerald-200/70">Las orillas se ilustran en blanco con borde oscuro.</span>
        )}
      </p>
    </div>
  );
}

export { figureDescriptions, getFigureMeasurements, formatMeasurementValue };
