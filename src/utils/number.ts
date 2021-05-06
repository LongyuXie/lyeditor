export function lowerBound(n: number, limit: number) {
  return (n < limit) ? limit : n;
}

export function upperBound(n: number, limit: number) {
  return (n > limit) ? limit : n;
}

export function normalize(n: number, low: number, upper: number): number {
  if (n < low) return low;
  if (n > upper) return upper;
  return n;
}
