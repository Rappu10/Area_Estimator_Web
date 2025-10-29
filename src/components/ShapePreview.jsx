import React, { useId, useMemo } from 'react';

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

export default function ShapePreview({ figure, data }) {
  const idBase = useId().replace(/:/g, '');
  const gradientId = `${idBase}-gradient`;
  const glowId = `${idBase}-glow`;

  const shapeElement = useMemo(() => getShapeElement(figure, data), [figure, data]);
  const label = figureDescriptions[figure] ?? 'Figura seleccionada';

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
      <p className="mt-3 text-xs text-gray-400">
        Las proporciones se escalan para una visualización clara y no representan dimensiones reales.
      </p>
    </div>
  );
}
