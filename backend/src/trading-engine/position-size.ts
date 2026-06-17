interface PositionSizeParams {
  confidence: number;
  minPositionSize: number;
  maxPositionSize: number;
}

export function calculatePositionSize(params: PositionSizeParams): number {
  const { confidence, minPositionSize, maxPositionSize } = params;
  const clampedConfidence = Math.min(Math.max(confidence, 0), 1);

  return minPositionSize + (maxPositionSize - minPositionSize) * clampedConfidence;
}
