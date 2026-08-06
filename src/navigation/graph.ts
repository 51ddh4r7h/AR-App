import campusData from '../data/campus.json'
import { haversineDistance, type LatLng } from '../utils/geo'

export interface CampusNode extends LatLng {
  id: string
  name: string
  description: string
  openHours?: string
  highlights?: string[]
}

interface CampusEdge {
  from: string
  to: string
}

interface CampusDataShape {
  nodes: CampusNode[]
  edges: CampusEdge[]
}

export interface GraphEdge {
  to: string
  cost: number
}

export interface CampusGraph {
  nodes: Map<string, CampusNode>
  adjacency: Map<string, GraphEdge[]>
}

const typedCampusData: CampusDataShape = campusData

const addEdge = (
  adjacency: Map<string, GraphEdge[]>,
  from: string,
  to: string,
  cost: number,
): void => {
  const edges = adjacency.get(from) ?? []
  edges.push({ to, cost })
  adjacency.set(from, edges)
}

export const buildCampusGraph = (): CampusGraph => {
  const nodes = new Map<string, CampusNode>(
    typedCampusData.nodes.map((node) => [node.id, node]),
  )
  const adjacency = new Map<string, GraphEdge[]>()

  for (const edge of typedCampusData.edges) {
    const from = nodes.get(edge.from)
    const to = nodes.get(edge.to)
    if (!from || !to) {
      continue
    }
    const cost = haversineDistance(from, to)
    addEdge(adjacency, edge.from, edge.to, cost)
    addEdge(adjacency, edge.to, edge.from, cost)
  }

  return { nodes, adjacency }
}

export const getNearestNode = (
  graph: CampusGraph,
  position: LatLng,
): CampusNode | null => {
  let nearest: CampusNode | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const node of graph.nodes.values()) {
    const distance = haversineDistance(position, node)
    if (distance < bestDistance) {
      bestDistance = distance
      nearest = node
    }
  }
  return nearest
}

