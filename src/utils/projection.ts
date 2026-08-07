import type { LatLng } from './geo'

const EARTH_RADIUS_METERS = 6371000
const toRad = (degrees: number): number => (degrees * Math.PI) / 180

export interface XY {
  x: number
  y: number
}

export interface CampusProjector {
  project: (point: LatLng) => XY
  metersPerPixel: number
}

const toLocalMeters = (origin: LatLng, point: LatLng): XY => {
  const dLat = point.latitude - origin.latitude
  const dLng = point.longitude - origin.longitude
  const y = toRad(dLat) * EARTH_RADIUS_METERS
  const x = toRad(dLng) * EARTH_RADIUS_METERS * Math.cos(toRad(point.latitude))
  return { x, y }
}

export const createCampusProjector = (
  points: LatLng[],
  viewSize: number,
  padding: number,
): CampusProjector => {
  const origin: LatLng = {
    latitude:
      points.reduce((sum, point) => sum + point.latitude, 0) / Math.max(1, points.length),
    longitude:
      points.reduce((sum, point) => sum + point.longitude, 0) / Math.max(1, points.length),
  }

  const meters = points.map((point) => toLocalMeters(origin, point))
  const minX = Math.min(...meters.map((point) => point.x))
  const maxX = Math.max(...meters.map((point) => point.x))
  const minY = Math.min(...meters.map((point) => point.y))
  const maxY = Math.max(...meters.map((point) => point.y))

  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const scale = (viewSize - padding * 2) / Math.max(width, height)

  return {
    metersPerPixel: 1 / scale,
    project: (point: LatLng): XY => {
      const local = toLocalMeters(origin, point)
      return {
        x: padding + (local.x - minX) * scale,
        y: padding + (maxY - local.y) * scale,
      }
    },
  }
}

export const expandBoundsToInclude = (
  points: LatLng[],
  extra: LatLng[],
): LatLng[] => {
  const result = [...points]
  const all = [...points, ...extra]
  const latitudes = all.map((point) => point.latitude)
  const longitudes = all.map((point) => point.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)

  for (const point of extra) {
    const inside =
      point.latitude >= minLat &&
      point.latitude <= maxLat &&
      point.longitude >= minLng &&
      point.longitude <= maxLng
    if (!inside) {
      result.push(point)
    }
  }
  return result
}
