"use client";

import React, { useState } from 'react';
import FigureSelector from './FigureSelector';
import ResultsPanel from './ResultsPanel';

export default function FigureWorkspace({
  id,
  index,
  canRemove,
  onRemove,
  onCostDrawerStateChange,
  externalCloseSignal,
}) {
  const [figure, setFigure] = useState('rectangle');
  const [data, setData] = useState({});
  const [customLabel, setCustomLabel] = useState('');

  return (
    <div className="relative px-4 pb-10 sm:px-6 lg:px-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-40 rounded-3xl bg-gradient-to-b from-emerald-500/20 via-transparent to-black/80 blur-3xl opacity-70"
      />

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.6em] text-emerald-300/80">
              Figura #{index + 1}
            </span>
            <h2 className="mt-2 text-2xl font-semibold text-white">Configuración de figura</h2>
          </div>
          <label className="flex min-w-[200px] flex-col text-sm text-gray-300">
            Nombre personalizado
            <input
              type="text"
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              placeholder="Ej: Barra"
              className="mt-1 w-full rounded-2xl border border-emerald-500/40 bg-transparent px-3 py-2 text-sm text-white placeholder:text-emerald-300 focus:border-emerald-300 focus:outline-none"
            />
          </label>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:bg-emerald-500/20 hover:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              aria-label={`Eliminar figura ${index + 1}`}
            >
              Eliminar figura
            </button>
          )}
        </div>

        <div className="grid gap-10 items-start lg:grid-cols-[minmax(0,360px)_minmax(0,2fr)]">
          <FigureSelector figure={figure} setFigure={setFigure} setData={setData} />
          <ResultsPanel
            figure={figure}
            data={data}
            instanceLabel={`Figura ${index + 1}`}
            customLabel={customLabel.trim()}
            workspaceId={id}
            onCostDrawerStateChange={onCostDrawerStateChange}
            externalCloseSignal={externalCloseSignal}
          />
        </div>
      </div>
    </div>
  );
}
