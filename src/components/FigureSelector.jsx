"use client";

import React, { useEffect, useMemo, useState } from 'react';

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

const FIGURE_EDGES = {
  rectangle: 4,
  triangle: 3,
  circle: 1,
  lShape: 6,
};

const getEdgeLabels = (figure, inputs = {}) => {
  const {
    width,
    height,
    base,
    radius,
    outerWidth,
    outerHeight,
    cutWidth,
    cutHeight,
  } = inputs;

  switch (figure) {
    case 'rectangle':
      return [
        { label: 'Lado superior', length: Number.isFinite(width) ? width : 0 },
        { label: 'Lado derecho', length: Number.isFinite(height) ? height : 0 },
        { label: 'Lado inferior', length: Number.isFinite(width) ? width : 0 },
        { label: 'Lado izquierdo', length: Number.isFinite(height) ? height : 0 },
      ];
    case 'triangle': {
      const safeBase = Number.isFinite(base) ? base : 0;
      return [
        { label: 'Base', length: safeBase },
        { label: 'Lado derecho', length: safeBase },
        { label: 'Lado izquierdo', length: safeBase },
      ];
    }
    case 'circle':
      return [
        {
          label: 'Perímetro completo',
          length: Number.isFinite(radius) ? 2 * Math.PI * radius : 0,
        },
      ];
    case 'lShape': {
      const safeOuterWidth = Number.isFinite(outerWidth) ? outerWidth : 0;
      const safeOuterHeight = Number.isFinite(outerHeight) ? outerHeight : 0;
      const safeCutWidth = Number.isFinite(cutWidth) ? cutWidth : 0;
      const safeCutHeight = Number.isFinite(cutHeight) ? cutHeight : 0;

      return [
        { label: 'Arista 1 (superior)', length: safeOuterWidth },
        {
          label: 'Arista 2 (vertical derecha)',
          length: Math.max(safeOuterHeight - safeCutHeight, 0),
        },
        { label: 'Arista 3 (horizontal interna)', length: safeCutWidth },
        { label: 'Arista 4 (vertical interna)', length: safeCutHeight },
        {
          label: 'Arista 5 (horizontal inferior)',
          length: Math.max(safeOuterWidth - safeCutWidth, 0),
        },
        { label: 'Arista 6 (vertical izquierda)', length: safeOuterHeight },
      ];
    }
    default:
      return [];
  }
};

export default function FigureSelector({ figure, setFigure, setData }) {
  const [inputs, setInputs] = useState({});
  const [borders, setBorders] = useState([]);

  useEffect(() => {
    setInputs({});
    setBorders([]);
  }, [figure]);

  useEffect(() => {
    const edgeCount = FIGURE_EDGES[figure] ?? 0;
    const edgeLabels = getEdgeLabels(figure, inputs);

    setBorders((previousBorders) => {
      if (edgeCount === 0) {
        return previousBorders.length > 0 ? [] : previousBorders;
      }

      const nextBorders = Array.from({ length: edgeCount }, (_, index) => {
        const existingBorder = previousBorders[index];
        const edgeInfo =
          edgeLabels[index] ?? {
            label: `Arista ${index + 1}`,
            length: 0,
          };
        const safeLength = Number.isFinite(edgeInfo.length) ? edgeInfo.length : 0;
        const defaultBorder = {
          id: `${figure}-edge-${index}`,
          edgeNumber: index + 1,
          type: 'orilla',
          width: 0,
          enabled: false,
        };

        if (
          existingBorder &&
          existingBorder.edgeLabel === edgeInfo.label &&
          existingBorder.length === safeLength
        ) {
          return existingBorder;
        }

        return {
          ...(existingBorder ?? defaultBorder),
          id: existingBorder?.id ?? `${figure}-edge-${index}`,
          edgeNumber: index + 1,
          edgeLabel: edgeInfo.label,
          length: safeLength,
          type: existingBorder?.type ?? 'orilla',
          width: Number.isFinite(existingBorder?.width) ? existingBorder.width : 0,
          enabled: existingBorder?.enabled ?? false,
        };
      });

      if (
        nextBorders.length === previousBorders.length &&
        nextBorders.every((border, index) => border === previousBorders[index])
      ) {
        return previousBorders;
      }

      return nextBorders;
    });
  }, [figure, inputs]);

  const combinedData = useMemo(
    () => ({
      ...inputs,
      borders,
    }),
    [inputs, borders]
  );

  useEffect(() => {
    setData(combinedData);
  }, [combinedData, setData]);

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
  };

  const handleBorderToggle = (id) => {
    setBorders((previousBorders) =>
      previousBorders.map((border) =>
        border.id === id ? { ...border, enabled: !border.enabled } : border
      )
    );
  };

  const handleBorderTypeChange = (id, nextType) => {
    setBorders((previousBorders) =>
      previousBorders.map((border) =>
        border.id === id ? { ...border, type: nextType } : border
      )
    );
  };

  const handleBorderWidthChange = (id, widthValue) => {
    const numericWidth = parseFloat(widthValue);
    setBorders((previousBorders) =>
      previousBorders.map((border) =>
        border.id === id
          ? {
              ...border,
              width: Number.isFinite(numericWidth) && numericWidth >= 0 ? numericWidth : 0,
            }
          : border
      )
    );
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
                value={inputs[name] ?? ''}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
              />
            </div>
          ))}
        </div>

        {borders.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/40 p-4">
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-300">
                Orillas ({borders.length} arista{borders.length !== 1 ? 's' : ''})
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Activa las aristas que requieren acabado y asigna su tipo y ancho.
              </p>
            </div>

            <div className="space-y-3">
              {borders.map((border) => (
                <div
                  key={border.id}
                  className={`rounded-lg border p-3 transition ${
                    border.enabled
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-gray-700 bg-gray-950/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={border.enabled}
                      onChange={() => handleBorderToggle(border.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-950 text-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                    />

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-300">{border.edgeLabel}</span>
                        <span className="text-xs text-gray-500">
                          {Number.isFinite(border.length) ? border.length.toFixed(2) : '0.00'} m
                        </span>
                      </div>

                      {border.enabled && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              Tipo de acabado
                            </label>
                            <select
                              value={border.type}
                              onChange={(event) => handleBorderTypeChange(border.id, event.target.value)}
                              className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                            >
                              <option value="zoclo">Zoclo</option>
                              <option value="faldon">Faldón</option>
                              <option value="orilla">Orilla</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                              Ancho del acabado (m)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={
                                Number.isFinite(border.width) && border.width !== null ? border.width : ''
                              }
                              onChange={(event) => handleBorderWidthChange(border.id, event.target.value)}
                              className="w-full rounded-lg border border-gray-800 bg-gray-950/80 px-3 py-2 text-sm text-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
