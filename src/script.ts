import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Experience, { isDebug } from './utils/Experience'
import assets from './utils/assets'
import { addLights } from './scene/lights'
import { addPlayground } from './scene/playground'
import { addEffects } from './scene/effects'
import { addStaticBodies } from './scene/staticBodies'

const webgl = new Experience({
  renderer: {
    canvas: document.querySelector('canvas.webgl') as HTMLCanvasElement,
    antialias: true,
  },
  orbitControls: true,
  stats: isDebug,
  gui: isDebug,
  postprocessing: true,
  cannon: {
    maxSubSteps: 3,
    world: (() => {
      const world = new CANNON.World()
      world.gravity.set(0, -1.5, 0)

      const defaultMaterial = new CANNON.Material('default')
      const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
          friction: 0.01,
          restitution: 0.99,
        }
      )
      world.defaultMaterial = defaultMaterial
      world.defaultContactMaterial = defaultContactMaterial

      return world
    })(),
  },
})

assets.loadQueued().then(() => {
  /**
   * Renderer
   */
  webgl.renderer.sortObjects = false
  webgl.renderer.physicallyCorrectLights = false
  webgl.renderer.toneMappingExposure = 1.3

  /**
   * Camera
   */
  webgl.camera.fov = 35
  webgl.camera.near = 1
  webgl.camera.far = 40
  webgl.camera.updateProjectionMatrix()
  webgl.camera.position.set(10.99, 5.45, 16.25).normalize().multiplyScalar(20)
  webgl.orbitControls!.target.y = 5

  /**
   * Objects
   */
  addStaticBodies()
  addPlayground()
  addLights()
  addEffects()

  /**
   * Toggle animation
   */
  window.addEventListener('keyup', (event) => {
    if (event.key === ' ') {
      webgl.isAnimationActive = !webgl.isAnimationActive
    }
  })

  /**
   * Start render loop
   */
  setTimeout(() => {
    webgl.start()
  }, 500)
})
