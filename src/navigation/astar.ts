import { haversineDistance } from '../utils/geo'
import type { CampusGraph, CampusNode } from './graph'

interface NodeCost {
  id: string
  fScore: number
}

const popLowest = (openSet: NodeCost[]): NodeCost | undefined => {
  if (openSet.length === 0) {
    return undefined
  }
  let bestIndex = 0
  for (let i = 1; i < openSet.length; i += 1) {
    if (openSet[i].fScore < openSet[bestIndex].fScore) {
      bestIndex = i
    }
  }
  return openSet.splice(bestIndex, 1)[0]
}

const reconstructPath = (
  cameFrom: Map<string, string>,
  current: string,
): string[] => {
  const path = [current]
  let cursor = current
  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor)!
    path.unshift(cursor)
  }
  return path
}

export const findShortestPath = (
  graph: CampusGraph,
  startId: string,
  goalId: string,
): CampusNode[] => {
  if (startId === goalId) {
    const sameNode = graph.nodes.get(startId)
    return sameNode ? [sameNode] : []
  }

  const start = graph.nodes.get(startId)
  const goal = graph.nodes.get(goalId)
  if (!start || !goal) {
    return []
  }

  const openSet: NodeCost[] = [{ id: startId, fScore: 0 }]
  const cameFrom = new Map<string, string>()
  const gScore = new Map<string, number>([[startId, 0]])
  const fScore = new Map<string, number>([
    [startId, haversineDistance(start, goal)],
  ])
  const openSetIds = new Set<string>([startId])

  while (openSet.length > 0) {
    const current = popLowest(openSet)
    if (!current) {
      break
    }
    openSetIds.delete(current.id)

    if (current.id === goalId) {
      return reconstructPath(cameFrom, current.id)
        .map((id) => graph.nodes.get(id))
        .filter((node): node is CampusNode => Boolean(node))
    }

    const neighbors = graph.adjacency.get(current.id) ?? []
    for (const neighbor of neighbors) {
      const currentG = gScore.get(current.id) ?? Number.POSITIVE_INFINITY
      const tentativeG = currentG + neighbor.cost
      if (tentativeG >= (gScore.get(neighbor.to) ?? Number.POSITIVE_INFINITY)) {
        continue
      }

      cameFrom.set(neighbor.to, current.id)
      gScore.set(neighbor.to, tentativeG)
      const neighborNode = graph.nodes.get(neighbor.to)
      if (!neighborNode) {
        continue
      }
      const score = tentativeG + haversineDistance(neighborNode, goal)
      fScore.set(neighbor.to, score)
      if (!openSetIds.has(neighbor.to)) {
        openSet.push({ id: neighbor.to, fScore: score })
        openSetIds.add(neighbor.to)
      } else {
        const existing = openSet.find((item) => item.id === neighbor.to)
        if (existing) {
          existing.fScore = score
        }
      }
    }
  }

  return []
}

