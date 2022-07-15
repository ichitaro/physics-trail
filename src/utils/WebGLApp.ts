import * as THREE from 'three'
import type { World } from 'cannon-es'
import Stats from 'stats.js'
import { GUI } from 'lil-gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer, RenderPass } from 'postprocessing'
import { TypedEvent } from './TypedEvent'
import ResourceTracker from './ResourceTracker'

export type Size = {
  width: number
  height: number
  pixelRatio: number
}

export type Pointer = {
  x: number
  y: number
  isDragging: boolean
}

export type PointerInfo = Pointer & {
  event: PointerEvent
}

export type WebGLAppOptions = {
  clearColor?: THREE.ColorRepresentation
  clearAlpha?: number
  renderer?: THREE.WebGLRendererParameters
  gui?: boolean
  stats?: boolean
  orbitControls?: boolean
  postprocessing?:
    | boolean
    | {
        depthBuffer?: boolean
        stencilBuffer?: boolean
        alpha?: boolean
        multisampling?: number
        frameBufferType?: number
      }
  sizeProvider?: Size
  maxDeltaTime?: number
  cannon?: {
    world: World
    maxSubSteps?: number
  }
}

class DefaultSizeProvider {
  get width() {
    return window.innerWidth
  }

  get height() {
    return window.innerHeight
  }

  get pixelRatio() {
    return Math.min(window.devicePixelRatio, 2)
  }
}

/**
 * A simple Three.js application boilerplate
 * based on https://github.com/marcofugaro/threejs-modern-app.
 * Feel free to customize it for each project.
 */
export default class WebGLApp {
  canvas: HTMLCanvasElement
  sizeProvider: Size
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  world?: World
  protected _maxSubSteps?: number
  composer: EffectComposer | null = null
  stats: Stats | null = null
  gui: GUI | null = null
  orbitControls: OrbitControls | null = null
  isRunning: boolean = false
  pointer: Pointer = { x: 0, y: 0, isDragging: false }
  events = {
    tick: new TypedEvent<number>(),
    physicsUpdated: new TypedEvent<number>(),
    resize: new TypedEvent<Size>(),
    pointerdown: new TypedEvent<PointerInfo>(),
    pointermove: new TypedEvent<PointerInfo>(),
    pointerup: new TypedEvent<PointerInfo>(),
  }
  isAnimationActive: boolean = true
  maxDeltaTime: number
  elapsedTime: number = 0
  protected _lastTime: number = 0
  resourceTracker: ResourceTracker = new ResourceTracker()

  constructor(options: WebGLAppOptions = {}) {
    const sizeProvider = options.sizeProvider || new DefaultSizeProvider()
    this.sizeProvider = sizeProvider

    const { clearColor = 0x000000, clearAlpha = 1 } = options
    const enableAlpha = clearAlpha !== 1
    const renderer = new THREE.WebGLRenderer(
      options.postprocessing
        ? {
            alpha: enableAlpha,
            powerPreference: 'high-performance',
            antialias: false,
            stencil: false,
            depth: false,
            ...options.renderer,
          }
        : {
            alpha: enableAlpha,
            antialias: true,
            ...options.renderer,
          }
    )
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.physicallyCorrectLights = true
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.setSize(this.sizeProvider.width, this.sizeProvider.height)
    renderer.setPixelRatio(this.sizeProvider.pixelRatio)
    renderer.setClearColor(clearColor, clearAlpha)
    this.renderer = renderer

    const canvas = renderer.domElement
    this.canvas = canvas

    const camera = new THREE.PerspectiveCamera(45, this.aspect, 0.01, 100)
    camera.position.set(0, 0, 4)
    this.camera = camera

    const scene = new THREE.Scene()
    this.scene = scene

    this.maxDeltaTime = options.maxDeltaTime || 1 / 30

    if (options.cannon) {
      this.world = options.cannon.world
      this._maxSubSteps = options.cannon.maxSubSteps
    }

    if (options.postprocessing) {
      const composer = new EffectComposer(renderer, {
        multisampling: this.pixelRatio === 1 ? 8 : undefined,
        frameBufferType: THREE.HalfFloatType,
        ...(options.postprocessing === true ? {} : options.postprocessing),
      })
      composer.addPass(new RenderPass(scene, camera))
      this.composer = composer
    }

    if (options.stats) {
      const stats = new Stats()
      stats.showPanel(0)
      document.body.appendChild(stats.dom)
      this.stats = stats
    }

    if (options.gui) {
      this.gui = new GUI()
    }

    if (options.orbitControls) {
      const orbitControls = new OrbitControls(camera, canvas)
      orbitControls.enableDamping = true
      this.orbitControls = orbitControls
    }

    window.addEventListener('resize', this._onResize)
    canvas.addEventListener('pointerdown', this._onPointerDown)
    canvas.addEventListener('pointermove', this._onPointerMove)
    canvas.addEventListener('pointerup', this._onPointerUp)
  }

  get width() {
    return this.sizeProvider.width
  }

  get height() {
    return this.sizeProvider.height
  }

  get aspect() {
    return this.width / this.height
  }

  get pixelRatio() {
    return this.sizeProvider.pixelRatio
  }

  protected _onResize = () => {
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(this.pixelRatio)

    this.composer?.setSize(this.width, this.height)

    this._traverse('onResize', this)
    this.events.resize.emit(this)
  }

  protected _onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary) return

    this.pointer.isDragging = true
    this._updatePointerPosition(event)

    const arg = {
      ...this.pointer,
      event,
    }
    this._traverse('onPointerDown', arg)
    this.events.pointerdown.emit(arg)
  }

  protected _onPointerMove = (event: PointerEvent) => {
    if (!event.isPrimary) return

    this._updatePointerPosition(event)

    const arg = {
      ...this.pointer,
      event,
    }
    this._traverse('onPointerMove', arg)
    this.events.pointermove.emit(arg)
  }

  protected _onPointerUp = (event: PointerEvent) => {
    if (!event.isPrimary) return

    this.pointer.isDragging = false
    this._updatePointerPosition(event)

    const arg = {
      ...this.pointer,
      event,
    }
    this._traverse('onPointerUp', arg)
    this.events.pointerup.emit(arg)
  }

  protected _updatePointerPosition(event: PointerEvent) {
    this.pointer.x = (event.offsetX / this.width) * 2 - 1
    this.pointer.y = -(event.offsetY / this.height) * 2 + 1
  }

  protected _tick = (time: DOMHighResTimeStamp, frame: XRFrame) => {
    this.stats?.begin()

    const deltaTime = Math.min(
      this.maxDeltaTime,
      (time - this._lastTime) / 1000
    )
    this._lastTime = time

    this.orbitControls?.update()

    if (this.isAnimationActive) {
      this.elapsedTime += deltaTime

      this._traverse('onTick', deltaTime, this.elapsedTime, frame)
      this.events.tick.emit(deltaTime)

      if (this.world) {
        this.world.step(1 / 60, deltaTime, this._maxSubSteps)
        this.events.physicsUpdated.emit(deltaTime)
      }
    }

    if (this.composer) {
      this.composer.render(deltaTime)
    } else {
      this.renderer.render(this.scene, this.camera)
    }

    this.stats?.end()
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true
      this._lastTime = performance.now()
      this.renderer.setAnimationLoop(this._tick)
    }
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false
      this.renderer.setAnimationLoop(null)
    }
  }

  protected _traverse(fn: string, ...args: any[]) {
    this.scene.traverse((child: any) => {
      if (typeof child[fn] === 'function') {
        child[fn].apply(child, args)
      }
    })
  }

  dispose() {
    this.stop()

    window.removeEventListener('resize', this._onResize)
    this.canvas.removeEventListener('pointerdown', this._onPointerDown)
    this.canvas.removeEventListener('pointermove', this._onPointerMove)
    this.canvas.removeEventListener('pointerup', this._onPointerUp)

    this.events.tick.removeAllListeners()
    this.events.physicsUpdated.removeAllListeners()
    this.events.resize.removeAllListeners()
    this.events.pointerdown.removeAllListeners()
    this.events.pointermove.removeAllListeners()
    this.events.pointerup.removeAllListeners()

    this.resourceTracker.dispose()

    this.orbitControls?.dispose()
    this.composer?.dispose()
    this.renderer.dispose()

    this.gui?.destroy()
  }
}
