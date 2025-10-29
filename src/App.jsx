import React, { useState } from 'react';
import FigureSelector from './components/FigureSelector';
import ResultsPanel from './components/ResultsPanel';

export default function App() {
  const [figure, setFigure] = useState('rectangle');
  const [data, setData] = useState({});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-emerald-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm uppercase tracking-widest text-emerald-300">
            Synapse Labs
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-white">
            PetroArte Area Estimator
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
            Calcula de forma profesional el área, perímetro y costo estimado de distintas figuras
            geométricas, incluyendo configuraciones avanzadas como la figura en L.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <FigureSelector figure={figure} setFigure={setFigure} setData={setData} />
          <ResultsPanel figure={figure} data={data} />
        </div>
      </div>
    </div>
  );
}
