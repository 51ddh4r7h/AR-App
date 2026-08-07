import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import * as THREE from 'three'
import type { PerspectiveCamera } from 'three'
import type { CameraPipelineModule } from '../types/eighthwall'
import { bearingBetween, haversineDistance, type LatLng } from '../utils/geo'
import { normalizeAngle } from '../utils/math'

const ENGINE_URL = './external/xr/xr.js'
const REANCHOR_DISTANCE_METERS = 5
const CAMERA_MOVE_EPSILON = 1e-4
const BEACON_TOP = 2.5

export interface NavigationUpdate {
  destinationId: string
  userPosition: LatLng
  destination: LatLng
  heading: number
  relativeBearing: number
  distanceMeters: number
}

export interface EighthWallCallbacks {
  onReady?: () => void
  onError?: (message: string) => void
}

interface NavigationAnchor {
  userPosition: LatLng
  heading: number
}

interface NavigationState {
  camera: PerspectiveCamera | null
  marker: Group | null
  anchor: NavigationAnchor | null
  destinationId: string
  cameraMoved: boolean
  lastCameraPosition: Vector3 | null
  disposed: boolean
}

const loadEngine = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.XR8) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-eighthwall-engine]',
    )
    const script =
      existing ??
      document.createElement('script')
    if (!existing) {
      script.src = ENGINE_URL
      script.async = true
      script.crossOrigin = 'anonymous'
      script.dataset.eighthwallEngine = ''
      script.setAttribute('data-preload-chunks', 'slam')
      document.head.appendChild(script)
    }
    const onLoaded = (): void => {
      cleanup()
      resolve()
    }
    const onFailed = (): void => {
      cleanup()
      reject(new Error('8th Wall engine failed to load.'))
    }
    const cleanup = (): void => {
      window.removeEventListener('xrloaded', onLoaded)
      script.removeEventListener('error', onFailed)
    }
    window.addEventListener('xrloaded', onLoaded)
    script.addEventListener('error', onFailed)
  })

const createDestinationMarker = (): Group => {
  const marker = new Group()
  const pole = new Mesh(
    new CylinderGeometry(0.05, 0.09, 2.4, 10),
    new MeshBasicMaterial({ color: new Color('#f472b6') }),
  )
  pole.position.y = 1.2
  const beacon = new Mesh(
    new SphereGeometry(0.22, 20, 20),
    new MeshStandardMaterial({
      color: new Color('#f472b6'),
      emissive: new Color('#be185d'),
      emissiveIntensity: 0.85,
    }),
  )
  beacon.position.y = BEACON_TOP
  marker.add(pole, beacon)
  marker.visible = false
  return marker
}

export class EighthWallAR {
  private readonly state: NavigationState = {
    camera: null,
    marker: null,
    anchor: null,
    destinationId: '',
    cameraMoved: false,
    lastCameraPosition: null,
    disposed: false,
  }

  private animationFrameId = 0

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: EighthWallCallbacks = {},
  ) {}

  async start(): Promise<void> {
    try {
      await loadEngine()
      const XR8 = window.XR8
      if (!XR8) {
        throw new Error('8th Wall engine failed to load.')
      }
      if (!window.THREE) {
        window.THREE = THREE
      }
      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer.pipelineModule(),
        XR8.Threejs.pipelineModule(),
        XR8.XrController.pipelineModule(),
        this.createSceneModule(),
      ])
      XR8.run({ canvas: this.canvas, allowedDevices: XR8.XrConfig.device().ANY })
      this.callbacks.onReady?.()
    } catch (error) {
      this.callbacks.onError?.((error as Error).message)
    }
  }

  updateNavigation(update: NavigationUpdate): void {
    if (this.state.disposed) {
      return
    }
    if (!this.state.camera || !this.state.marker || !this.state.cameraMoved) {
      return
    }
    const destinationChanged = update.destinationId !== this.state.destinationId
    const movedFromAnchor = this.state.anchor
      ? haversineDistance(
          this.state.anchor.userPosition,
          update.userPosition,
        ) > REANCHOR_DISTANCE_METERS
      : true
    if (!this.state.anchor || destinationChanged || movedFromAnchor) {
      this.anchorAt(update)
    }
  }

  clear(): void {
    if (this.state.marker) {
      this.state.marker.visible = false
    }
    this.state.anchor = null
  }

  stop(): void {
    this.state.disposed = true
    window.cancelAnimationFrame(this.animationFrameId)
  }

  private anchorAt(update: NavigationUpdate): void {
    const { camera, marker } = this.state
    if (!camera || !marker) {
      return
    }
    this.state.destinationId = update.destinationId
    this.state.anchor = {
      userPosition: update.userPosition,
      heading: update.heading,
    }

    const bearing = bearingBetween(update.userPosition, update.destination)
    const delta = normalizeAngle(bearing - update.heading)
    const radians = (delta * Math.PI) / 180

    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const direction = forward
      .multiplyScalar(Math.cos(radians))
      .add(right.multiplyScalar(Math.sin(radians)))
    direction.y = 0
    direction.normalize()

    const distance = Math.max(1.5, update.distanceMeters)
    marker.position
      .copy(camera.position)
      .add(direction.multiplyScalar(distance))
    marker.position.y = 0
    marker.visible = true
  }

  private createSceneModule = (): CameraPipelineModule => {
    const state = this.state
    return {
      name: 'navigation-scene',

      onStart: () => {
        const XR8 = window.XR8
        if (!XR8) {
          return
        }
        const { scene, camera } = XR8.Threejs.xrScene()
        state.camera = camera
        state.lastCameraPosition = camera.position.clone()

        scene.add(new AmbientLight(new Color('#ffffff'), 1.1))
        const directional = new DirectionalLight(new Color('#d7f7ff'), 1.0)
        directional.position.set(2, 6, 4)
        scene.add(directional)

        state.marker = createDestinationMarker()
        scene.add(state.marker)

        camera.position.set(0, 1.6, 0)
        XR8.XrController.updateCameraProjectionMatrix({
          origin: camera.position,
          facing: camera.quaternion,
        })

        const poll = (): void => {
          if (state.disposed) {
            return
          }
          camera.updateMatrixWorld()
          if (
            state.lastCameraPosition &&
            camera.position.distanceTo(state.lastCameraPosition) >
              CAMERA_MOVE_EPSILON
          ) {
            state.cameraMoved = true
          }
          state.lastCameraPosition?.copy(camera.position)
          if (state.marker?.visible) {
            const beacon = state.marker.children[1] as Mesh
            beacon.position.y =
              BEACON_TOP + Math.sin(performance.now() * 0.003) * 0.12
          }
          this.animationFrameId = window.requestAnimationFrame(poll)
        }
        this.animationFrameId = window.requestAnimationFrame(poll)
      },
    }
  }
}
