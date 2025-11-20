import { calculateMetrics } from '../src/utils/figureMetrics.js';

const scenarios = [
  {
    label: 'Configuración mínima (dato del usuario)',
    input: {
      figure: 'lShape',
      data: {
        outerWidth: 2,
        outerHeight: 0.63,
        cutWidth: 0.6,
        cutHeight: 0.5,
      },
    },
    expected: {
      area: 0.96,
      perimeter: 2 * (2 + 0.63),
    },
  },
  {
    label: 'Ejemplo estándar',
    input: {
      figure: 'lShape',
      data: {
        outerWidth: 12,
        outerHeight: 15,
        cutWidth: 4,
        cutHeight: 5,
      },
    },
    expected: {
      area: 160,
      perimeter: 2 * (12 + 15),
    },
  },
];

const EPSILON = 1e-6;
let failed = false;

for (const scenario of scenarios) {
  const { area, perimeter, error } = calculateMetrics(
    scenario.input.figure,
    scenario.input.data
  );

  const areaMatches = Math.abs(area - scenario.expected.area) < EPSILON;
  const perimeterMatches = Math.abs(perimeter - scenario.expected.perimeter) < EPSILON;

  if (!areaMatches || !perimeterMatches || error) {
    failed = true;
    console.error(
      `[FALLA] ${scenario.label}:`,
      'area',
      area,
      'perimeter',
      perimeter,
      'error',
      error
    );
  } else {
    console.log(`[OK] ${scenario.label}:`, 'area', area, 'perimeter', perimeter);
  }
}

if (failed) {
  console.error('Al menos una validación falló.');
  process.exitCode = 1;
}
