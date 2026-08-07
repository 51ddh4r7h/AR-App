import { normalizeAngle } from '../utils/math'

type HeadingHandler = (heading: number) => void

const WINDOW_SIZE = 6

const toRad = (degrees: number): number => (degrees * Math.PI) / 180
const toDeg = (radians: number): number => (radians * 180) / Math.PI

interface OrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number
}

const tiltCompensatedHeading = (alpha: number, beta: number, gamma: number): number => {
  const a = toRad(alpha)
  const b = toRad(beta)
  const g = toRad(gamma)
  const cA = Math.cos(a)
  const sA = Math.sin(a)
  const sB = Math.sin(b)
  const cG = Math.cos(g)
  const sG = Math.sin(g)

  const rA = -cA * sG - sA * sB * cG
  const rB = -sA * sG + cA * sB * cG
  let heading = toDeg(Math.atan2(rA, rB))
  if (heading < 0) {
    heading += 360
  }
  return heading
}

const readHeading = (event: OrientationEvent): number | null => {
  if (typeof event.webkitCompassHeading === 'number') {
    return normalizeAngle(event.webkitCompassHeading)
  }
  if (
    typeof event.alpha !== 'number' ||
    typeof event.beta !== 'number' ||
    typeof event.gamma !== 'number'
  ) {
    return null
  }
  const isFlat = Math.abs(event.beta) < 30 && Math.abs(event.gamma) < 30
  const heading = isFlat
    ? 360 - event.alpha
    : tiltCompensatedHeading(event.alpha, event.beta, event.gamma)
  return normalizeAngle(heading)
}

export class HeadingService {
  private readings: number[] = []
  private listener: ((event: DeviceOrientationEvent) => void) | null = null
  private absoluteListener: ((event: DeviceOrientationEvent) => void) | null = null
  private hasAbsolute = false

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

  private publish(event: OrientationEvent): void {
    const heading = readHeading(event)
    if (heading === null) {
      return
    }
    this.onUpdate(this.pushReading(heading))
  }

  start(): void {
    if (this.listener || this.absoluteListener) {
      return
    }

    this.absoluteListener = (event: DeviceOrientationEvent) => {
      if (!event.absolute) {
        return
      }
      this.hasAbsolute = true
      this.publish(event as OrientationEvent)
    }

    this.listener = (event: DeviceOrientationEvent) => {
      const orientation = event as OrientationEvent
      if (this.hasAbsolute && typeof orientation.webkitCompassHeading !== 'number') {
        return
      }
      this.publish(orientation)
    }

    window.addEventListener('deviceorientationabsolute', this.absoluteListener, true)
    window.addEventListener('deviceorientation', this.listener, true)
  }

  stop(): void {
    if (this.listener) {
      window.removeEventListener('deviceorientation', this.listener, true)
    }
    if (this.absoluteListener) {
      window.removeEventListener('deviceorientationabsolute', this.absoluteListener, true)
    }
    this.listener = null
    this.absoluteListener = null
    this.hasAbsolute = false
    this.readings = []
  }
}
