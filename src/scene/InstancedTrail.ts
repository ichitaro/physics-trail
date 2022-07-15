import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Experience from '../utils/Experience'
import { Object3D } from 'three'

type Options = {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  numSteps?: number
}

type TrackableObject = {
  position: {
    x: number
    y: number
    z: number
  }
  quaternion: {
    x: number
    y: number
    z: number
    w: number
  }
}

export default class InstancedTrail extends THREE.Group {
  webgl = new Experience()
  geometry: THREE.BufferGeometry
  material: THREE.Material
  numSteps: number
  objects: TrackableObject[] = []
  instancedMesh: THREE.InstancedMesh | null = null
  dummy: Object3D = new THREE.Object3D()

  total: number = 0
  counter: number = 0

  constructor({ geometry, material, numSteps = 10 }: Options) {
    super()

    this.geometry = geometry
    this.material = material
    this.numSteps = numSteps
  }

  track(object: TrackableObject) {
    if (this.instancedMesh) return

    this.objects.push(object)
  }

  buildMesh() {
    const count = this.objects.length * this.numSteps
    const instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      count
    )
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    instancedMesh.count = 0
    instancedMesh.castShadow = true
    instancedMesh.receiveShadow = true

    this.instancedMesh = instancedMesh
    this.total = count
    this.counter = 0

    this.add(instancedMesh)

    this.webgl.events.physicsUpdated.off(this.step)
    this.webgl.events.physicsUpdated.on(this.step)
  }

  resetCounter() {
    if (!this.instancedMesh) return

    this.counter = 0
    this.instancedMesh.count = 0
  }

  step = () => {
    if (!this.instancedMesh) return

    const { objects, instancedMesh, counter, dummy } = this
    const numObjects = objects.length
    for (let i = 0; i < numObjects; i++) {
      const obj = objects[i]
      dummy.position.copy(obj.position as any)
      dummy.quaternion.copy(obj.quaternion as any)
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(counter + i, dummy.matrix)
    }

    this.counter = (counter + numObjects) % this.total
    instancedMesh.count = Math.min(instancedMesh.count + numObjects, this.total)
    instancedMesh.instanceMatrix.needsUpdate = true
  }
}
