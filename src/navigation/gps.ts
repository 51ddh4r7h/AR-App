import type { LatLng } from '../utils/geo'

export interface GpsReading extends LatLng {
  accuracy: number
  timestamp: number
}

type UpdateHandler = (reading: GpsReading) => void
type ErrorHandler = (error: GeolocationPositionError) => void

export class GpsService {
  private watchId: number | null = null

  constructor(
    private readonly onUpdate: UpdateHandler,
    private readonly onError: ErrorHandler,
  ) {}

  start(): void {
    if (!navigator.geolocation || this.watchId !== null) {
      return
    }
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.onUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      },
      (error) => this.onError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    )
  }

  stop(): void {
    if (this.watchId === null) {
      return
    }
    navigator.geolocation.clearWatch(this.watchId)
    this.watchId = null
  }
}

