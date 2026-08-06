import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene } from 'three'

export interface ARScene {
  scene: Scene
  camera: PerspectiveCamera
}

export const createARScene = (): ARScene => {
  const scene = new Scene()
  scene.background = null
  scene.fog = null
  scene.environment = null
  scene.overrideMaterial = null
  scene.add(new AmbientLight(new Color('#ffffff'), 1.2))

  const directional = new DirectionalLight(new Color('#d7f7ff'), 1.1)
  directional.position.set(0, 4, 3)
  scene.add(directional)

  const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 1.6, 0)
  return { scene, camera }
}

