import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three'
import { lerp } from '../utils/math'

interface ArrowVisual {
  group: Group
  targetX: number
  targetZ: number
  targetRotationY: number
  visible: boolean
}

const createArrowMesh = (): Group => {
  const group = new Group()
  const shaft = new Mesh(
    new CylinderGeometry(0.08, 0.08, 0.55, 16),
    new MeshStandardMaterial({ color: '#6ee7ff', emissive: '#1f7a8c', emissiveIntensity: 0.4 }),
  )
  shaft.position.y = 0.28
  group.add(shaft)

  const head = new Mesh(
    new ConeGeometry(0.18, 0.4, 20),
    new MeshStandardMaterial({ color: '#22d3ee', emissive: '#0e7490', emissiveIntensity: 0.5 }),
  )
  head.position.y = 0.75
  group.add(head)

  group.rotation.x = Math.PI / 18
  group.visible = false
  return group
}

export const createArrows = (count: number): ArrowVisual[] =>
  Array.from({ length: count }, () => ({
    group: createArrowMesh(),
    targetX: 0,
    targetZ: -2,
    targetRotationY: 0,
    visible: false,
  }))

export const updateArrowTargets = (
  arrows: ArrowVisual[],
  points: Array<{ x: number; z: number; rotationY: number }>,
): void => {
  arrows.forEach((arrow, index) => {
    const point = points[index]
    if (!point) {
      arrow.visible = false
      return
    }
    arrow.targetX = point.x
    arrow.targetZ = point.z
    arrow.targetRotationY = point.rotationY
    arrow.visible = true
  })
}

export const tickArrows = (arrows: ArrowVisual[]): void => {
  for (const arrow of arrows) {
    arrow.group.visible = arrow.visible
    if (!arrow.visible) {
      continue
    }
    arrow.group.position.x = lerp(arrow.group.position.x, arrow.targetX, 0.14)
    arrow.group.position.y = lerp(arrow.group.position.y, 0, 0.18)
    arrow.group.position.z = lerp(arrow.group.position.z, arrow.targetZ, 0.14)
    arrow.group.rotation.y = lerp(arrow.group.rotation.y, arrow.targetRotationY, 0.16)
  }
}

export type { ArrowVisual }

