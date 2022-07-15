import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

export type PickableObject = THREE.Object3D & {
  body: CANNON.Body
  setFocus?: () => void
  clearFocus?: () => void
}

type Options = {
  objects?: PickableObject[]
  markerColor?: THREE.ColorRepresentation
}

/**
 * @see {@link https://github.com/pmndrs/cannon-es/blob/master/examples/threejs_mousepick.html}
 */
export default class ObjectPicker {
  webgl = new Experience()
  pointer = this.webgl.pointer
  camera = this.webgl.camera
  scene = this.webgl.scene
  world = this.webgl.world!
  orbitControls = this.webgl.orbitControls

  objects: PickableObject[]
  focusTarget: PickableObject | null = null
  movementPlane: THREE.Object3D
  jointBody: CANNON.Body
  constraint: CANNON.Constraint | null = null
  isDragging = false
  raycaster = new THREE.Raycaster()

  constructor({ objects = [], markerColor = 0xff0000 }: Options) {
    this.objects = objects
    this.movementPlane = (() => {
      // Movement plane when dragging
      const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(100, 100),
        new THREE.MeshBasicMaterial({ color: 'red', wireframe: true })
      )
      plane.visible = false // Hide it..
      return plane
    })()
    this.jointBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Sphere(0.1),
      collisionFilterGroup: 0,
      collisionFilterMask: 0,
    }) // Joint body, to later constraint the block

    this.scene.add(this.movementPlane)
    this.world.addBody(this.jointBody)

    this.webgl.events.pointerdown.on(this.onPointerDown)
    this.webgl.events.pointermove.on(this.onPointerMove)
    this.webgl.events.pointerup.on(this.onPointerUp)
  }

  onPointerDown = () => {
    const intersection = this.getIntersection(
      this.pointer,
      this.objects,
      this.camera
    )

    if (!intersection) {
      return
    }

    const { point, object } = intersection

    if (this.orbitControls) {
      this.orbitControls.enabled = false
    }

    // Move marker mesh on contact point
    this.setFocus(object)
    this.webgl.canvas.style.cursor = 'grabbing'

    // Move the movement plane on the z-plane of the hit
    this.moveMovementPlane(point)

    // Create the constraint between the block body and the joint body
    this.addJointConstraint(point, object.body)

    this.isDragging = true
  }

  onPointerMove = () => {
    if (this.isDragging) {
      // Project the mouse onto the movement plane
      const intersection = this.getIntersection(
        this.pointer,
        [this.movementPlane],
        this.camera
      )

      if (intersection) {
        const { point } = intersection

        // Move the cannon constraint on the contact point
        this.moveJoint(point)
      }
    } else {
      const intersection = this.getIntersection(
        this.pointer,
        this.objects,
        this.camera
      )
      if (intersection) {
        this.setFocus(intersection.object)
      } else {
        this.clearFocus()
      }
    }
  }

  onPointerUp = () => {
    if (this.orbitControls) {
      this.orbitControls.enabled = true
    }

    this.isDragging = false

    this.clearFocus()

    // Remove the mouse constraint from the world
    this.removeJointConstraint()
  }

  setFocus(object: PickableObject) {
    if (this.focusTarget !== object) {
      this.clearFocus()
      this.focusTarget = object
      object.setFocus?.()
      this.webgl.canvas.style.cursor = 'grab'
    }
  }

  clearFocus() {
    if (this.focusTarget) {
      this.focusTarget.clearFocus?.()
      this.focusTarget = null
      this.webgl.canvas.style.cursor = ''
    }
  }

  moveMovementPlane(point: THREE.Vector3) {
    // Center at mouse position
    this.movementPlane.position.copy(point)

    // Make it face toward the camera
    this.movementPlane.quaternion.copy(this.camera.quaternion)
  }

  // Add a constraint between the block and the jointBody
  // in the initeraction position
  addJointConstraint(position: THREE.Vector3, constrainedBody: CANNON.Body) {
    // Vector that goes from the body to the clicked point
    const vector = new CANNON.Vec3()
      .copy(position as any)
      .vsub(constrainedBody.position)

    // Apply anti-quaternion to vector to tranform it into the local body coordinate system
    const antiRotation = constrainedBody.quaternion.inverse()
    const pivot = antiRotation.vmult(vector) // pivot is not in local body coordinates

    // Move the cannon click marker body to the click position
    this.jointBody.position.copy(position as any)

    // Create a new constraint
    // The pivot for the jointBody is zero
    this.constraint = new CANNON.PointToPointConstraint(
      constrainedBody,
      pivot,
      this.jointBody,
      new CANNON.Vec3(0, 0, 0)
    )

    // Add the constraint to world
    this.world.addConstraint(this.constraint)
  }

  // This functions moves the joint body to a new postion in space
  // and updates the constraint
  moveJoint(position: THREE.Vector3) {
    this.jointBody.position.copy(position as any)
    this.constraint?.update()
  }

  // Remove constraint from world
  removeJointConstraint() {
    if (this.constraint) {
      this.world.removeConstraint(this.constraint)
      this.constraint = null
    }
  }

  getIntersection<T extends THREE.Object3D>(
    coords: { x: number; y: number },
    objects: T[],
    camera: THREE.Camera
  ) {
    this.raycaster.setFromCamera(coords, camera)

    const hits = this.raycaster.intersectObjects<T>(objects)

    return hits.length > 0 ? hits[0] : null
  }
}
