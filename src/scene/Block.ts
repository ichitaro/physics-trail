import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Experience from '../utils/Experience'

export type Primitive = {
  geometry: THREE.BufferGeometry
  shape: CANNON.Shape
  height: number
}

type Options = {
  primitive: Primitive
  material: THREE.Material
  position?: THREE.Vector3
}

const zero = new THREE.Vector3()

export default class Block extends THREE.Mesh {
  webgl = new Experience()
  primitive: Primitive
  body: CANNON.Body

  constructor({ primitive, material, position = zero }: Options) {
    super(primitive.geometry, material)
    this.primitive = primitive
    this.visible = false
    this.castShadow = true

    const body = new CANNON.Body({ mass: 1 })
    body.addShape(primitive.shape)
    body.position.copy(position as any)
    this.body = body

    this.webgl.events.physicsUpdated.on(this.physicsUpdated)
  }

  physicsUpdated = () => {
    this.position.copy(this.body.position as any)
    this.quaternion.copy(this.body.quaternion as any)
  }

  setFocus() {
    this.visible = true
  }

  clearFocus() {
    this.visible = false
  }
}
