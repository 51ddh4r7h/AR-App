import type { CSSProperties } from 'react'

interface PrecisionCompassProps {
  relativeBearing: number
  distanceMeters: number
  heading: number
  turnInstruction: string
  proximityLabel: string
}

const TICK_DEGREES = Array.from({ length: 24 }, (_, index) => index * 15)

const getStateColor = (distanceMeters: number, proximityLabel: string): string => {
  if (proximityLabel === 'Moving away') {
    return '#f87171'
  }
  if (distanceMeters <= 14) {
    return '#4ade80'
  }
  if (distanceMeters <= 50) {
    return '#22d3ee'
  }
  return '#7dd3fc'
}

const getPulseSeconds = (distanceMeters: number): number => {
  if (distanceMeters <= 14) {
    return 0.7
  }
  if (distanceMeters <= 50) {
    return 1.4
  }
  if (distanceMeters <= 150) {
    return 2.1
  }
  return 2.8
}

export function PrecisionCompass({
  relativeBearing,
  distanceMeters,
  heading,
  turnInstruction,
  proximityLabel,
}: PrecisionCompassProps) {
  const color = getStateColor(distanceMeters, proximityLabel)
  const pulseSeconds = getPulseSeconds(distanceMeters)

  return (
    <div className="pf">
      <div
        className="pf-dial"
        style={
          {
            '--pf-color': color,
            '--pf-pulse': `${pulseSeconds}s`,
          } as CSSProperties
        }
      >
        <div className="pf-ring" style={{ transform: `rotate(${-heading}deg)` }}>
          {TICK_DEGREES.map((deg) => (
            <span
              key={deg}
              className={deg % 90 === 0 ? 'pf-tick pf-tick--major' : 'pf-tick'}
              style={{ transform: `rotate(${deg}deg) translateY(calc(-1 * var(--pf-r)))` }}
            />
          ))}
          {(['N', 'E', 'S', 'W'] as const).map((label, index) => {
            const deg = index * 90
            return (
              <span
                key={label}
                className="pf-cardinal"
                style={{
                  transform: `rotate(${deg}deg) translateY(calc(-1 * var(--pf-size) * 0.36))`,
                }}
              >
                <span style={{ transform: `translate(-50%, -50%) rotate(${-deg}deg)` }}>
                  {label}
                </span>
              </span>
            )
          })}
        </div>
        <div className="pf-forward" />
        <div className="pf-pulses">
          <span className="pf-pulse" />
          <span className="pf-pulse" />
          <span className="pf-pulse" />
        </div>
        <svg
          viewBox="0 0 120 160"
          className="pf-needle"
          style={{ transform: `translate(-50%, -50%) rotate(${relativeBearing}deg)` }}
        >
          <polygon points="60,8 79,72 66,72 66,152 54,152 54,72 41,72" fill={color} />
        </svg>
        <div className="pf-hub">
          <span className="pf-distance">{Math.max(0, Math.round(distanceMeters))}</span>
          <span className="pf-unit">m</span>
        </div>
      </div>
      <div className="pf-caption">
        <span className="pf-turn">{turnInstruction}</span>
        <span className="pf-prox" style={{ color }}>
          {proximityLabel}
        </span>
        <span className="pf-hint">Rotate until the arrow points straight ahead</span>
      </div>
    </div>
  )
}
