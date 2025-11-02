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

  return (
    <section className="rounded-3xl border border-emerald-500/20 bg-black/30 p-6 shadow-[0_30px_90px_rgba(16,185,129,0.2)] backdrop-blur-md space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
            Figura #{index + 1}
          </span>
          <h2 className="mt-2 text-xl font-semibold text-white">Configuración de figura</h2>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            aria-label={`Eliminar figura ${index + 1}`}
          >
            Eliminar figura
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        <FigureSelector figure={figure} setFigure={setFigure} setData={setData} />
        <ResultsPanel
          figure={figure}
          data={data}
          instanceLabel={`Figura ${index + 1}`}
          workspaceId={id}
          onCostDrawerStateChange={onCostDrawerStateChange}
          externalCloseSignal={externalCloseSignal}
        />
      </div>
    </section>
  );
}
