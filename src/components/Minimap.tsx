import { useMemo } from 'react'
import type { CampusNode } from '../navigation/graph'
import { haversineDistance, type LatLng } from '../utils/geo'
import {
  createCampusProjector,
  expandBoundsToInclude,
  type CampusProjector,
} from '../utils/projection'

interface MinimapProps {
  nodes: CampusNode[]
  edges: Array<{ from: CampusNode; to: CampusNode }>
  userPosition: LatLng | null
  heading: number
  routePath: CampusNode[] | null
  destination: CampusNode | null
  arrivalRadiusMeters: number
  onSelect?: (nodeId: string) => void
  size?: number
  showLabels?: boolean
  ariaLabel?: string
}

const toPoints = (points: LatLng[], projector: CampusProjector): string =>
  points.map((point) => {
    const xy = projector.project(point)
    return `${xy.x.toFixed(1)},${xy.y.toFixed(1)}`
  }).join(' ')

const inArrivalZone = (
  userPosition: LatLng,
  destination: LatLng,
  arrivalRadiusMeters: number,
): boolean => haversineDistance(userPosition, destination) <= arrivalRadiusMeters

export function Minimap({
  nodes,
  edges,
  userPosition,
  heading,
  routePath,
  destination,
  arrivalRadiusMeters,
  onSelect,
  size = 320,
  showLabels = true,
  ariaLabel,
}: MinimapProps) {
  const padding = Math.max(14, size * 0.08)
  const fitPoints = useMemo(
    () => expandBoundsToInclude(nodes, userPosition ? [userPosition] : []),
    [nodes, userPosition],
  )
  const projector = useMemo(
    () => createCampusProjector(fitPoints, size, padding),
    [fitPoints, size, padding],
  )

  const user = userPosition ? projector.project(userPosition) : null
  const arrived = userPosition && destination ? inArrivalZone(userPosition, destination, arrivalRadiusMeters) : false

  const routePoints = routePath && routePath.length > 0
    ? toPoints(routePath, projector)
    : null

  const description =
    ariaLabel ??
    (destination
      ? `Campus map. ${userPosition ? 'Your position shown.' : ''} Destination ${destination.name}${userPosition ? ` at ${Math.round(
          Math.sqrt(
            ((userPosition.latitude - destination.latitude) * 111320) ** 2 +
              ((userPosition.longitude - destination.longitude) * 111320 * Math.cos((destination.latitude * Math.PI) / 180)) ** 2,
          ),
        )} meters` : ''}.`
      : 'Campus map.')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="minimap"
      width={size}
      height={size}
      role="img"
      aria-label={description}
      aria-hidden={onSelect ? 'false' : 'true'}
    >
      <rect x={0} y={0} width={size} height={size} rx={10} className="minimap-bg" />
      <text x={size - 12} y={16} textAnchor="end" className="minimap-north">
        N ↑
      </text>

      {edges.map((edge, index) => {
        const from = projector.project(edge.from)
        const to = projector.project(edge.to)
        return (
          <line
            key={`${edge.from.id}-${edge.to.id}-${index}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="minimap-edge"
          />
        )
      })}

      {routePoints ? (
        <polyline points={routePoints} className="minimap-route" fill="none" />
      ) : null}

      {nodes.map((node) => {
        const xy = projector.project(node)
        const isDestination = destination?.id === node.id
        return (
          <g
            key={node.id}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={onSelect ? `Select ${node.name}` : undefined}
            onClick={onSelect ? () => onSelect(node.id) : undefined}
            onKeyDown={
              onSelect
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(node.id)
                    }
                  }
                : undefined
            }
            className={onSelect ? 'minimap-node minimap-node--selectable' : 'minimap-node'}
          >
            <circle
              cx={xy.x}
              cy={xy.y}
              r={isDestination ? 7 : 4.5}
              className={isDestination ? 'minimap-node-dot minimap-node-dot--dest' : 'minimap-node-dot'}
            />
            {isDestination ? (
              <circle
                cx={xy.x}
                cy={xy.y}
                r={arrivalRadiusMeters / projector.metersPerPixel}
                className="minimap-arrival-ring"
                fill="none"
              />
            ) : null}
            {showLabels ? (
              <text
                x={xy.x + 9}
                y={xy.y + 3.5}
                className={isDestination ? 'minimap-label minimap-label--dest' : 'minimap-label'}
              >
                {node.name}
              </text>
            ) : null}
          </g>
        )
      })}

      {user ? (
        <g className="minimap-user" transform={`rotate(${heading} ${user.x} ${user.y})`}>
          <polygon
            points={`${user.x},${user.y - 13} ${user.x + 6},${user.y} ${user.x - 6},${user.y}`}
            className="minimap-user-cone"
          />
        </g>
      ) : null}
      {user ? <circle cx={user.x} cy={user.y} r={5} className="minimap-user-dot" /> : null}

      {arrived ? (
        <g className="minimap-arrived">
          <rect x={size / 2 - 52} y={10} width={104} height={24} rx={12} className="minimap-arrived-badge" />
          <text x={size / 2} y={26} textAnchor="middle" className="minimap-arrived-text">
            You are here
          </text>
        </g>
      ) : null}
    </svg>
  )
}
