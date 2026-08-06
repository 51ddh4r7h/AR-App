import { findShortestPath } from './astar'
import { getNearestNode, type CampusGraph, type CampusNode } from './graph'
import { bearingBetween, haversineDistance, type LatLng } from '../utils/geo'

export interface RouteResult {
  path: CampusNode[]
  currentNode: CampusNode
  nextNode: CampusNode | null
  destinationDistance: number
  nextBearing: number
}

export const buildRoute = (
  graph: CampusGraph,
  position: LatLng,
  destinationId: string,
): RouteResult | null => {
  const currentNode = getNearestNode(graph, position)
  const destination = graph.nodes.get(destinationId)

  if (!currentNode || !destination) {
    return null
  }

  const path = findShortestPath(graph, currentNode.id, destinationId)
  if (path.length === 0) {
    return null
  }

  const nextNode = path[1] ?? null
  const target = nextNode ?? destination
  const nextBearing = bearingBetween(position, target)
  const destinationDistance = haversineDistance(position, destination)

  return {
    path,
    currentNode,
    nextNode,
    destinationDistance,
    nextBearing,
  }
}

