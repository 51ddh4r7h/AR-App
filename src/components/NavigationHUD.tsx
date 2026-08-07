import { Badge } from '@/components/ui/badge'
import type { GpsReading } from '../navigation/gps'
import type { CampusNode } from '../navigation/graph'
import { Minimap } from './Minimap'
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
  nodes: CampusNode[]
  edges: Array<{ from: CampusNode; to: CampusNode }>
  userPosition: GpsReading | null
  routePath: CampusNode[] | null
  destination: CampusNode
  arrivalRadiusMeters: number
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
  nodes,
  edges,
  userPosition,
  routePath,
  destination,
  arrivalRadiusMeters,
}: NavigationHUDProps) {
  return (
    <>
      <header className="pointer-events-auto mx-3 mt-3 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white shadow-xl backdrop-blur-xl">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{destinationName}</h2>
          <p className="truncate text-xs text-sky-200">Next: {nextWaypointName}</p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {routeMode === 'graph' ? 'Path: graph' : 'Direct'}
        </Badge>
      </header>

      <div className="minimap-panel">
        <Minimap
          nodes={nodes}
          edges={edges}
          userPosition={userPosition}
          heading={heading}
          routePath={routePath}
          destination={destination}
          arrivalRadiusMeters={arrivalRadiusMeters}
          size={132}
          showLabels={false}
          ariaLabel={`Live map. ${distanceMeters.toFixed(0)} meters to ${destinationName}.`}
        />
      </div>

      <PrecisionCompass
        relativeBearing={relativeBearing}
        distanceMeters={distanceMeters}
        heading={heading}
        turnInstruction={turnInstruction}
        proximityLabel={proximityLabel}
      />

      <footer className="pointer-events-auto mx-3 mb-3 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-xs text-slate-300 shadow-xl backdrop-blur-xl">
        <span>Heading {Math.round(heading)}°</span>
        <span>GPS ±{Math.round(gpsAccuracy)}m</span>
        {weakGps ? <span className="text-amber-300">Weak GPS</span> : null}
      </footer>

      {routeMode === 'direct' ? (
        <div className="warning-banner">Graph path missing. Following direct bearing.</div>
      ) : null}
      {weakGps ? <div className="warning-banner">GPS signal weak. Route may drift.</div> : null}
    </>
  )
}
