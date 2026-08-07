import type { PerspectiveCamera, Quaternion, Scene, Vector3, WebGLRenderer } from 'three'

interface EighthWallXrScene {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
}

interface CameraPipelineModule {
  name: string
  onStart?: (options: { canvas: HTMLCanvasElement }) => void
  onUpdate?: (options: unknown) => void
}

interface EighthWallGlobal {
  addCameraPipelineModules(modules: CameraPipelineModule[]): void
  run(options: { canvas: HTMLCanvasElement; allowedDevices?: string }): void
  GlTextureRenderer: { pipelineModule(): CameraPipelineModule }
  Threejs: {
    pipelineModule(): CameraPipelineModule
    xrScene(): EighthWallXrScene
  }
  XrController: {
    pipelineModule(): CameraPipelineModule
    updateCameraProjectionMatrix(options: {
      origin: Vector3
      facing: Quaternion
    }): void
    recenter(): void
  }
  XrConfig: { device(): { ANY: string } }
}

declare global {
  interface Window {
    XR8?: EighthWallGlobal
    THREE?: typeof import('three')
  }
}

export type { CameraPipelineModule, EighthWallGlobal }
