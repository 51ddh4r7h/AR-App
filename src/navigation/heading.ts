import { normalizeAngle } from '../utils/math'

type HeadingHandler = (heading: number) => void

const WINDOW_SIZE = 6

export class HeadingService {
  private readings: number[] = []
  private listener: ((event: DeviceOrientationEvent) => void) | null = null

  constructor(private readonly onUpdate: HeadingHandler) {}

  private pushReading(next: number): number {
    this.readings.push(next)
    if (this.readings.length > WINDOW_SIZE) {
      this.readings.shift()
    }
    const sin = this.readings.reduce(
      (sum, value) => sum + Math.sin((value * Math.PI) / 180),
      0,
    )
    const cos = this.readings.reduce(
      (sum, value) => sum + Math.cos((value * Math.PI) / 180),
      0,
    )
    const avg = (Math.atan2(sin, cos) * 180) / Math.PI
    return (avg + 360) % 360
  }

  start(): void {
    if (this.listener) {
      return
    }
    this.listener = (event: DeviceOrientationEvent) => {
      const headingEvent = event as DeviceOrientationEvent & {
        webkitCompassHeading?: number
      }
      const alpha = headingEvent.webkitCompassHeading ?? event.alpha
      if (typeof alpha !== 'number') {
        return
      }
      const heading = normalizeAngle(360 - alpha)
      const normalized = (heading + 360) % 360
      this.onUpdate(this.pushReading(normalized))
    }
    window.addEventListener('deviceorientation', this.listener, true)
  }

  stop(): void {
    if (!this.listener) {
      return
    }
    window.removeEventListener('deviceorientation', this.listener, true)
    this.listener = null
    this.readings = []
  }
}
