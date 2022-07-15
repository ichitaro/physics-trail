import WebGLApp, { WebGLAppOptions } from './WebGLApp'

export type ExperienceOptions = WebGLAppOptions

export const isDebug = window.location.search.includes('debug')

let instance: Experience | null = null

/**
 * The singleton idea is based on https://github.com/brunosimon/threejs-template-complex
 * which facilitates type inference in VSCode even when TypeScript is not used.
 */
export default class Experience extends WebGLApp {
  constructor(options: ExperienceOptions = {}) {
    if (instance !== null) {
      return instance
    }

    super(options)

    instance = this

    if (isDebug) {
      // @ts-ignore
      window.webgl = this
    }
  }
}
