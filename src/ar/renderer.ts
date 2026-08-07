import { Group, Mesh, MeshStandardMaterial, SphereGeometry, WebGLRenderer } from 'three'
import { clamp } from '../utils/math'
import { createARScene } from './scene'

export class ARRenderer {
  private readonly renderer: WebGLRenderer
  private readonly destinationMarker: Group
  private readonly guidanceRoot: Group
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

    this.guidanceRoot = new Group()
    this.guidanceRoot.position.set(0, -0.75, -0.8)
    this.sceneCtx.camera.add(this.guidanceRoot)

    this.destinationMarker = this.createDestinationMarker()
    this.guidanceRoot.add(this.destinationMarker)
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
    const forward = clamp(1.4, 3.2, 1.6 + destinationDistance * 0.02)
    this.destinationMarker.position.x = Math.sin(headingRadians) * forward
    this.destinationMarker.position.z = -Math.cos(headingRadians) * forward
    const scale = clamp(0.7, 1.7, 1.7 - destinationDistance / 90)
    this.destinationMarker.scale.setScalar(scale)
    this.destinationMarker.visible = true
  }

  clearNavigation(): void {
    this.destinationMarker.visible = false
  }

  dispose(): void {
    window.cancelAnimationFrame(this.animationFrameId)
    this.renderer.dispose()
  }
}
