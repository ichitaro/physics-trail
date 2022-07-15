import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import assets from '../utils/assets'
import Experience from '../utils/Experience'
import Block from './Block'
import InstancedTrail from './InstancedTrail'
import ObjectPicker from './ObjectPicker'
import Magnet from './Magnet'

const keyColor = '#B5AC01'

export function addPlayground() {
  const webgl = new Experience()
  const { scene } = webgl
  const world = webgl.world!

  const blockSize = new THREE.Vector3(1, 15, 3).multiplyScalar(0.07)
  const blockGeometry = new THREE.BoxGeometry(
    blockSize.x,
    blockSize.y,
    blockSize.z
  )
  const blockMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(keyColor).convertSRGBToLinear(),
    transparent: true,
    opacity: 0.7,
    depthTest: false,
  })
  const trail = new InstancedTrail({
    geometry: blockGeometry,
    material: new THREE.MeshStandardMaterial({
      roughness: 0.1,
      metalness: 0,
      flatShading: true,
    }),
    numSteps: 240,
  })
  scene.add(trail)
  const blocks = Array.from({ length: 12 }).map(() => {
    const block = new Block({
      shape: new CANNON.Box(
        new CANNON.Vec3(0.5 * blockSize.x, 0.5 * blockSize.y, 0.5 * blockSize.z)
      ),
      geometry: blockGeometry,
      material: blockMaterial,
    })
    scene.add(block)
    world.addBody(block.body)
    trail.track(block.body)
    return block
  })
  resetBlocks()
  trail.buildMesh()

  const picker = new ObjectPicker({
    objects: blocks,
    markerColor: keyColor,
  })

  const magnet = new Magnet({ radius: 2 })
  webgl.events.tick.on(() => {
    if (webgl.pointer.isDragging && !picker.isDragging) {
      magnet.applyForce(trail.bodies)
    }
  })

  function resetBlocks() {
    const gap = -0.31
    const spread = 1
    const dummy = new THREE.Object3D()

    for (const block of blocks) {
      const body = block.body
      resetBody(body)
      // body.sleep()

      dummy.position.set(
        (Math.random() - 0.5) * spread,
        gap + 0.5 * blockSize.y,
        (Math.random() - 0.5) * spread
      )
      dummy.rotation.set(0, Math.PI * Math.random(), 0)
      body.position.copy(dummy.position as any)
      body.quaternion.copy(dummy.quaternion as any)
    }

    trail.resetCounter()
  }
}

function resetBody(body: CANNON.Body) {
  // Position
  body.position.setZero()
  body.previousPosition.setZero()
  body.interpolatedPosition.setZero()
  body.initPosition.setZero()

  // orientation
  body.quaternion.set(0, 0, 0, 1)
  body.initQuaternion.set(0, 0, 0, 1)
  body.previousQuaternion.set(0, 0, 0, 1)
  body.interpolatedQuaternion.set(0, 0, 0, 1)

  // Velocity
  body.velocity.setZero()
  body.initVelocity.setZero()
  body.angularVelocity.setZero()
  body.initAngularVelocity.setZero()

  // Force
  body.force.setZero()
  body.torque.setZero()

  // Sleep state reset
  body.sleepState = 0
  body.timeLastSleepy = 0
  //@ts-ignore
  body._wakeUpAfterNarrowphase = false
}
