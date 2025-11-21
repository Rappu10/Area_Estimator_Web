import React, { useCallback, useState } from 'react';
import FigureWorkspace from './components/FigureWorkspace';

let workspaceCounter = 0;
let closeSignalCounter = 0;

const createWorkspace = () => {
  workspaceCounter += 1;
  return { id: `workspace-${workspaceCounter}` };
};

const createCloseSignal = (id) => {
  closeSignalCounter += 1;
  return { id, token: closeSignalCounter };
};

export default function App() {
  const [workspaces, setWorkspaces] = useState(() => [createWorkspace()]);
  const [openCostWorkspaceId, setOpenCostWorkspaceId] = useState(null);
  const [closeCostSignal, setCloseCostSignal] = useState({ id: null, token: 0 });

  const handleAddWorkspace = () => {
    setWorkspaces((prev) => {
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, createWorkspace()];
    });
  };

  const handleRemoveWorkspace = (id) => {
    setWorkspaces((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((workspace) => workspace.id !== id);
    });
    setOpenCostWorkspaceId((prev) => (prev === id ? null : prev));
  };

  const handleCostDrawerStateChange = useCallback(
    (workspaceId, isOpen) => {
      if (!workspaceId) {
        return;
      }

      setOpenCostWorkspaceId((prev) => {
        if (isOpen) {
          if (prev && prev !== workspaceId) {
            setCloseCostSignal(createCloseSignal(prev));
          }
          return workspaceId;
        }
        if (prev === workspaceId) {
          return null;
        }
        return prev;
      });
    },
    [setCloseCostSignal]
  );

  const handleCloseCostDrawer = () => {
    if (!openCostWorkspaceId) {
      return;
    }
    setCloseCostSignal(createCloseSignal(openCostWorkspaceId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-emerald-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
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

        <div className="space-y-10">
          {workspaces.map((workspace, index) => (
            <FigureWorkspace
              key={workspace.id}
              id={workspace.id}
              index={index}
              canRemove={workspaces.length > 1}
              onRemove={() => handleRemoveWorkspace(workspace.id)}
              onCostDrawerStateChange={handleCostDrawerStateChange}
              externalCloseSignal={closeCostSignal}
            />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {openCostWorkspaceId && (
            <button
              type="button"
              onClick={handleCloseCostDrawer}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-transparent px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <span>Cerrar costos</span>
            </button>
          )}
          {workspaces.length < 4 && (
            <button
              type="button"
              onClick={handleAddWorkspace}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 hover:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              <span className="text-lg leading-none">+</span>
              <span>Agregar nueva figura</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
