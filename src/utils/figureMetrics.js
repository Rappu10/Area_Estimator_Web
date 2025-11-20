const L_SHAPE_ERROR =
  'Dimensiones inválidas: el recorte debe ser mayor que 0 y menor que las medidas exteriores.';

const toFinite = (value) => (Number.isFinite(value) ? value : 0);

export function calculateMetrics(figure, data = {}) {
  let area = 0;
  let perimeter = 0;
  let error = '';

  const {
    width,
    height,
    base,
    radius,
    outerWidth,
    outerHeight,
    cutWidth,
    cutHeight,
  } = data;

  switch (figure) {
    case 'rectangle': {
      const safeWidth = toFinite(width);
      const safeHeight = toFinite(height);
      area = safeWidth * safeHeight;
      perimeter = 2 * (safeWidth + safeHeight);
      break;
    }
    case 'triangle': {
      const safeBase = toFinite(base);
      const safeHeight = toFinite(height);
      area = (safeBase * safeHeight) / 2;
      perimeter = safeBase * 3;
      break;
    }
    case 'circle': {
      const safeRadius = toFinite(radius);
      area = Math.PI * Math.pow(safeRadius, 2);
      perimeter = 2 * Math.PI * safeRadius;
      break;
    }
    case 'lShape': {
      const safeOuterWidth = toFinite(outerWidth);
      const safeOuterHeight = toFinite(outerHeight);
      const safeCutWidth = toFinite(cutWidth);
      const safeCutHeight = toFinite(cutHeight);

      const validOuter = safeOuterWidth > 0 && safeOuterHeight > 0;
      const validCut =
        safeCutWidth > 0 &&
        safeCutHeight > 0 &&
        safeCutWidth < safeOuterWidth &&
        safeCutHeight < safeOuterHeight;
      const hasNoInput =
        safeOuterWidth === 0 &&
        safeOuterHeight === 0 &&
        safeCutWidth === 0 &&
        safeCutHeight === 0;

      if (validOuter && validCut) {
        const outerArea = safeOuterWidth * safeOuterHeight;
        const cutArea = safeCutWidth * safeCutHeight;
        area = outerArea - cutArea;
        perimeter = 2 * (safeOuterWidth + safeOuterHeight);
      } else if (hasNoInput) {
        error = '';
        area = 0;
        perimeter = 0;
      } else {
        error = L_SHAPE_ERROR;
        area = 0;
        perimeter = 0;
      }
      break;
    }
    default:
      area = 0;
      perimeter = 0;
      break;
  }

  return { area, perimeter, error };
}

export { L_SHAPE_ERROR };
