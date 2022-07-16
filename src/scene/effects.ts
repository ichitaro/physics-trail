import * as THREE from 'three'
import {
  EffectPass,
  NormalPass,
  SSAOEffect,
  DepthDownsamplingPass,
  BloomEffect,
  BlendFunction,
} from 'postprocessing'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

/**
 * @see {@link https://github.com/pmndrs/postprocessing/blob/main/demo/src/demos/SSAODemo.js}
 */
export function addEffects() {
  const webgl = new Experience()
  const { scene, camera, renderer } = webgl
  const composer = webgl.composer!

  const normalPass = new NormalPass(scene, camera)

  const depthDownsamplingPass = new DepthDownsamplingPass({
    normalBuffer: normalPass.texture,
    resolutionScale: 0.5,
  })

  const normalDepthBuffer = renderer.capabilities.isWebGL2
    ? depthDownsamplingPass.texture
    : undefined

  const ssaoEffect = new SSAOEffect(camera, normalPass.texture, {
    // blendFunction: BlendFunction.NORMAL,
    distanceScaling: true,
    depthAwareUpsampling: true,
    normalDepthBuffer,
    samples: 9,
    rings: 4,
    distanceThreshold: 0.9,
    rangeThreshold: 0.6,
    rangeFalloff: 0.02,
    luminanceInfluence: 0.8,
    minRadiusScale: 0.3,
    radius: 0.2,
    intensity: 10,
    fade: 0.2,
    color: null,
    // resolutionScale: 0.5,
  } as any)

  const bloomEffect = new BloomEffect({
    intensity: 0.35,
    luminanceThreshold: 0.5,
  })

  const effectPass = new EffectPass(camera, ssaoEffect, bloomEffect)

  composer.addPass(normalPass)
  if (renderer.capabilities.isWebGL2) {
    composer.addPass(depthDownsamplingPass)
  } else {
    console.log(
      'WebGL 2 not supported, falling back to naive depth downsampling'
    )
  }

  composer.addPass(effectPass)
}
