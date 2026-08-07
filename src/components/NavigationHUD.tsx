interface NavigationHUDProps {
  destinationName: string
  nextWaypointName: string
  distanceMeters: number
  heading: number
  gpsAccuracy: number
  weakGps: boolean
  routeMode: 'graph' | 'direct'
}

export function NavigationHUD({
  destinationName,
  nextWaypointName,
  distanceMeters,
  heading,
  gpsAccuracy,
  weakGps,
  routeMode,
}: NavigationHUDProps) {
  return (
    <>
      <header className="top-hud">
        <h2>{destinationName}</h2>
        <p>Next: {nextWaypointName}</p>
      </header>

      <footer className="bottom-hud">
        <p>{Math.max(0, Math.round(distanceMeters))}m remaining</p>
        <p>Heading: {Math.round(heading)}°</p>
        <p>GPS ±{Math.round(gpsAccuracy)}m</p>
      </footer>

      {routeMode === 'direct' ? (
        <div className="warning-banner">Graph path missing. Following direct bearing.</div>
      ) : null}
      {weakGps ? <div className="warning-banner">GPS signal weak. Route may drift.</div> : null}
    </>
  )
}
