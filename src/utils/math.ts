export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const lerp = (start: number, end: number, t: number): number =>
  start + (end - start) * t

export const normalizeAngle = (degrees: number): number => {
  const wrapped = ((degrees + 180) % 360 + 360) % 360
  return wrapped - 180
}

