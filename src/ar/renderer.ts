import { Group, Mesh, MeshStandardMaterial, SphereGeometry, WebGLRenderer } from 'three'
import { clamp } from '../utils/math'
import { createArrows, tickArrows, updateArrowTargets, type ArrowVisual } from './arrows'
import { createARScene } from './scene'

export class ARRenderer {
  private readonly renderer: WebGLRenderer
  private readonly arrows: ArrowVisual[]
  private readonly destinationMarker: Group
  private readonly sceneCtx = createARScene()
  private animationFrameId = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.arrows = createArrows(3)
    this.arrows.forEach((arrow) => this.sceneCtx.scene.add(arrow.group))
    this.destinationMarker = this.createDestinationMarker()
    this.sceneCtx.scene.add(this.destinationMarker)
    this.destinationMarker.visible = false
    this.animate()
  }

  private createDestinationMarker(): Group {
    const marker = new Group()
    const beacon = new Mesh(
      new SphereGeometry(0.24, 20, 20),
      new MeshStandardMaterial({
        color: '#f472b6',
        emissive: '#be185d',
        emissiveIntensity: 0.6,
      }),
    )
    beacon.position.y = 1.1
    marker.add(beacon)
    return marker
  }

  private animate = (): void => {
    tickArrows(this.arrows)
    if (this.destinationMarker.visible) {
      this.destinationMarker.position.y = 0.95 + Math.sin(performance.now() * 0.003) * 0.12
      this.destinationMarker.rotation.y += 0.01
    }
    this.renderer.render(this.sceneCtx.scene, this.sceneCtx.camera)
    this.animationFrameId = window.requestAnimationFrame(this.animate)
  }

  onResize = (): void => {
    this.sceneCtx.camera.aspect = window.innerWidth / window.innerHeight
    this.sceneCtx.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  setNavigationDirection(
    relativeBearingDegrees: number,
    destinationDistance: number,
  ): void {
    const headingRadians = (relativeBearingDegrees * Math.PI) / 180
    const visibleArrows = Math.min(3, Math.max(1, Math.ceil(destinationDistance / 8)))
    const spacing = clamp(destinationDistance / (visibleArrows + 1), 2, 4)

    const points = Array.from({ length: visibleArrows }, (_, index) => {
      const distance = (index + 1) * spacing
      return {
        x: Math.sin(headingRadians) * distance,
        z: -Math.cos(headingRadians) * distance,
        rotationY: headingRadians,
      }
    })
    updateArrowTargets(this.arrows, points)

    const farthest = points[points.length - 1]
    if (farthest) {
      this.destinationMarker.visible = true
      this.destinationMarker.position.x = farthest.x + Math.sin(headingRadians) * 1.6
      this.destinationMarker.position.z = farthest.z - Math.cos(headingRadians) * 1.6
    }
  }

  clearNavigation(): void {
    updateArrowTargets(this.arrows, [])
    this.destinationMarker.visible = false
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId)
    this.renderer.dispose()
  }
}

