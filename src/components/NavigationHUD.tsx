import { PrecisionCompass } from './PrecisionCompass'

interface NavigationHUDProps {
  destinationName: string
  nextWaypointName: string
  distanceMeters: number
  heading: number
  gpsAccuracy: number
  weakGps: boolean
  routeMode: 'graph' | 'direct'
  relativeBearing: number
  turnInstruction: string
  proximityLabel: string
}

export function NavigationHUD({
  destinationName,
  nextWaypointName,
  distanceMeters,
  heading,
  gpsAccuracy,
  weakGps,
  routeMode,
  relativeBearing,
  turnInstruction,
  proximityLabel,
}: NavigationHUDProps) {
  return (
    <>
      <header className="top-hud">
        <h2>{destinationName}</h2>
        <p>Next: {nextWaypointName}</p>
      </header>

      <PrecisionCompass
        relativeBearing={relativeBearing}
        distanceMeters={distanceMeters}
        heading={heading}
        turnInstruction={turnInstruction}
        proximityLabel={proximityLabel}
      />

      <footer className="bottom-hud">
        <p>Heading: {Math.round(heading)}°</p>
        <p>GPS ±{Math.round(gpsAccuracy)}m</p>
        <p>{routeMode === 'graph' ? 'Path: graph' : 'Direct bearing'}</p>
      </footer>

      {routeMode === 'direct' ? (
        <div className="warning-banner">Graph path missing. Following direct bearing.</div>
      ) : null}
      {weakGps ? <div className="warning-banner">GPS signal weak. Route may drift.</div> : null}
    </>
  )
}
