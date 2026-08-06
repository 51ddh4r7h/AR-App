const EARTH_RADIUS_METERS = 6371000

const toRad = (degrees: number): number => (degrees * Math.PI) / 180
const toDeg = (radians: number): number => (radians * 180) / Math.PI

export interface LatLng {
  latitude: number
  longitude: number
}

export const haversineDistance = (from: LatLng, to: LatLng): number => {
  const dLat = toRad(to.latitude - from.latitude)
  const dLng = toRad(to.longitude - from.longitude)
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

export const bearingBetween = (from: LatLng, to: LatLng): number => {
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)
  const lngDelta = toRad(to.longitude - from.longitude)

  const y = Math.sin(lngDelta) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta)
  const bearing = toDeg(Math.atan2(y, x))
  return (bearing + 360) % 360
}

