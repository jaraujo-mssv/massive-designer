import { bayerThresholds } from '../bayer'
import { hexToRgb } from './color'
import { resolveFrame } from './frame'
import type { LivePreset, RenderState } from '../types'
import {
  BLIT_FRAGMENT_SHADER,
  COLOR_MODE,
  DITHER_FRAGMENT_SHADER,
  MAX_PALETTE,
  MAX_TRAIL,
  NOISE_TYPE,
  POINTER_MODE,
  SCROLL_MODE,
  VERTEX_SHADER,
} from './shader'

/** Anything WebGL can turn into a texture. */
export type DitherSource = TexImageSource & { width?: number; height?: number }

/**
 * Frame budget for the rAF loop. The treatment is a stepped, grainy pattern —
 * it reads identically at 30fps and costs half as much as display refresh on a
 * pane this size. Matches the cap the ink backend has always had
 * (`DitherVideoBackground`).
 */
const FRAME_MS = 1000 / 30

export interface RendererOptions {
  preset: LivePreset
  source?: DitherSource
  /**
   * Keeps the drawing buffer readable after the frame is submitted, so
   * `canvas.toDataURL()` returns pixels rather than a blank image. Costs a copy
   * per frame, so it stays off for the interactive preview and on only for the
   * one-shot bake in `render-static.ts`.
   */
  preserveDrawingBuffer?: boolean
  /** Called instead of throwing when the GPU path fails, so callers can fall back to the static image. */
  onError?: (error: Error) => void
  /**
   * Called after a frame has actually reached the canvas.
   *
   * This is the only honest signal that the GPU path works: creating a context
   * and compiling shaders both succeed on machines where drawing later fails,
   * and `render()` swallows those failures into `onError`. Callers that hide a
   * fallback image must wait for this rather than for `start()`, which merely
   * schedules a frame.
   */
  onPaint?: () => void
}

export interface DitherRenderer {
  readonly canvas: HTMLCanvasElement
  setPreset(preset: LivePreset): void
  setSource(source: DitherSource): void
  setPointer(x: number, y: number, active: boolean): void
  setScroll(progress: number): void
  /** Draws a single frame at an explicit time, in seconds. */
  render(time?: number): void
  /** Starts the rAF loop. Idempotent. */
  start(): void
  /** Pauses the rAF loop, keeping GPU resources alive. */
  stop(): void
  readonly running: boolean
  destroy(): void
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('ditherize: could not create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`ditherize: shader failed to compile — ${log}`)
  }
  return shader
}

function link(gl: WebGL2RenderingContext, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error('ditherize: could not create program')
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  // Shaders are reference-counted by the program; deleting lets the driver free them.
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`ditherize: program failed to link — ${log}`)
  }
  return program
}

function sourceDimensions(source: DitherSource): { width: number; height: number } {
  const candidate = source as unknown as {
    naturalWidth?: number
    naturalHeight?: number
    videoWidth?: number
    videoHeight?: number
    width?: number
    height?: number
  }
  const width = candidate.naturalWidth || candidate.videoWidth || candidate.width || 0
  const height = candidate.naturalHeight || candidate.videoHeight || candidate.height || 0
  if (!width || !height) throw new Error('ditherize: could not determine source dimensions')
  return { width, height }
}

/**
 * Creates a WebGL2 renderer for a preset.
 *
 * Two passes: the dither pass renders at the downsampled cell resolution into a
 * framebuffer, and a blit pass scales it to the canvas with NEAREST filtering.
 * Doing the work at cell resolution is what keeps the box filter affordable —
 * total texture reads equal the source's pixel count regardless of how much the
 * image is scaled up on screen.
 *
 * There is no aspect fitting here: the fullscreen triangle stretches the source
 * across the whole canvas. Callers that need `cover` behaviour pre-crop the
 * image into an offscreen canvas and pass that as the source.
 */
export function createRenderer(
  canvas: HTMLCanvasElement,
  options: RendererOptions,
): DitherRenderer {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
  })
  if (!context) throw new Error('ditherize: WebGL2 is not available')
  // Bound to a non-nullable name: narrowing does not reach the hoisted function
  // declarations below, and `gl!` on every line reads terribly.
  const gl: WebGL2RenderingContext = context

  // Bindings rather than constants: a context loss invalidates every object
  // made from this `gl` at once, and `createResources` below builds a fresh set
  // both at construction and after the driver hands the context back. The two
  // programs carry a definite-assignment assertion because that first build
  // happens a few lines down, out of reach of the flow analysis.
  let ditherProgram!: WebGLProgram
  let blitProgram!: WebGLProgram
  let sourceTexture: WebGLTexture | null = null
  let bayerTexture: WebGLTexture | null = null
  let cellTexture: WebGLTexture | null = null
  let framebuffer: WebGLFramebuffer | null = null
  const uniforms = new Map<string, WebGLUniformLocation | null>()

  const uniform = (program: WebGLProgram, name: string): WebGLUniformLocation | null => {
    const key = `${program === ditherProgram ? 'd' : 'b'}:${name}`
    if (!uniforms.has(key)) uniforms.set(key, gl.getUniformLocation(program, name))
    return uniforms.get(key) ?? null
  }

  let preset = options.preset
  let source: DitherSource | null = null
  let sourceSize = { width: 0, height: 0 }
  let pointer = { x: 0.5, y: 0.5, active: false }
  let scroll = 0
  let running = false
  let frameHandle = 0
  let startedAt = 0
  let destroyed = false
  /** True from `webglcontextlost` until a rebuild succeeds. Every GL call is off limits meanwhile. */
  let contextLost = false
  /** Whether the loop was running when the context went away, i.e. whether to resume it. */
  let resumeAfterRestore = false
  /** Drawing-buffer size at the moment of the loss; the buffer itself does not survive it. */
  let canvasSize = { width: 0, height: 0 }

  /** Recent pointer positions, newest first, with the time each was taken. */
  const trail: { x: number; y: number; time: number }[] = []
  let lastSampleAt = -Infinity
  // Packed once and refilled in place — this is uploaded every frame.
  const trailBuffer = new Float32Array(MAX_TRAIL * 3)

  let cellSize = { width: 0, height: 0 }
  let uploadedMatrix: number | null = null

  /**
   * Builds everything the GPU holds for this renderer: both programs, the three
   * textures and the framebuffer. Run once at construction and again on every
   * context restore, where the previous set has been invalidated wholesale by
   * the driver and nothing from it can be reused or even deleted meaningfully.
   */
  function createResources(): void {
    ditherProgram = link(gl, DITHER_FRAGMENT_SHADER)
    blitProgram = link(gl, BLIT_FRAGMENT_SHADER)
    sourceTexture = gl.createTexture()
    bayerTexture = gl.createTexture()
    cellTexture = gl.createTexture()
    framebuffer = gl.createFramebuffer()

    // A uniform location belongs to the program it was queried from, so every
    // cached one now addresses a program that no longer exists. The cache is
    // keyed by role ('d' or 'b') rather than by program identity, so nothing
    // about a rebuild invalidates it on its own: the stale locations would be
    // handed straight back and the whole frame would write into nowhere.
    uniforms.clear()

    // Both of these record uploads that lived on the old context. Clearing them
    // is what makes the next draw re-upload the Bayer matrix and re-allocate
    // the cell target instead of skipping the work as already done.
    uploadedMatrix = null
    cellSize = { width: 0, height: 0 }
  }

  createResources()

  function configureTexture(): void {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  function uploadSource(next: DitherSource): void {
    sourceSize = sourceDimensions(next)
    source = next
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, next)
    configureTexture()
  }

  function uploadBayer(): void {
    if (uploadedMatrix === preset.matrix) return
    const thresholds = bayerThresholds(preset.matrix)
    gl.bindTexture(gl.TEXTURE_2D, bayerTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R32F,
      preset.matrix,
      preset.matrix,
      0,
      gl.RED,
      gl.FLOAT,
      thresholds,
    )
    configureTexture()
    uploadedMatrix = preset.matrix
  }

  function resizeCellTarget(): void {
    const scale = Math.max(1, Math.min(8, Math.round(preset.scale)))
    const width = Math.max(1, Math.floor(sourceSize.width / scale))
    const height = Math.max(1, Math.floor(sourceSize.height / scale))
    if (width === cellSize.width && height === cellSize.height) return

    cellSize = { width, height }
    gl.bindTexture(gl.TEXTURE_2D, cellTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    configureTexture()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cellTexture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /**
   * Advances the trail one frame and returns how many samples are live.
   *
   * Sampling is paced at `duration / length`, so the two parameters compose:
   * the tail always spans `duration` seconds and `length` only decides how
   * finely it is drawn. Samples stop being taken when the pointer leaves, so
   * the tail ages out on its own rather than freezing on screen.
   */
  function advanceTrail(state: RenderState): number {
    const params = preset.live?.pointer?.trail
    if (!params || params.length < 1 || params.duration <= 0) {
      trail.length = 0
      return 0
    }

    const time = state.time ?? 0
    // The loop restarts its clock on every `start()`; without this the next
    // sample would wait for the old timeline to come round again.
    if (time < lastSampleAt) lastSampleAt = -Infinity

    const cap = Math.min(MAX_TRAIL, Math.round(params.length))
    const active = state.pointer ?? pointer
    if (active.active && time - lastSampleAt >= params.duration / cap) {
      trail.unshift({ x: active.x, y: active.y, time })
      lastSampleAt = time
    }

    while (trail.length && time - trail[trail.length - 1].time >= params.duration) trail.pop()
    if (trail.length > cap) trail.length = cap

    for (let i = 0; i < trail.length; i++) {
      const entry = trail[i]
      trailBuffer[i * 3] = entry.x
      trailBuffer[i * 3 + 1] = entry.y
      trailBuffer[i * 3 + 2] = 1 - (time - entry.time) / params.duration
    }
    return trail.length
  }

  function uploadUniforms(state: RenderState): void {
    const frame = resolveFrame(preset, state)

    gl.uniform2i(uniform(ditherProgram, 'uSourceSize'), sourceSize.width, sourceSize.height)
    gl.uniform2i(uniform(ditherProgram, 'uCellSize'), cellSize.width, cellSize.height)
    gl.uniform1i(uniform(ditherProgram, 'uMatrixSize'), preset.matrix)

    gl.uniform1f(uniform(ditherProgram, 'uSpread'), frame.spread)
    gl.uniform1f(uniform(ditherProgram, 'uBrightness'), frame.brightness)
    gl.uniform1f(uniform(ditherProgram, 'uContrast'), frame.contrast)
    gl.uniform1f(uniform(ditherProgram, 'uGamma'), frame.gamma)
    gl.uniform1f(uniform(ditherProgram, 'uSaturation'), frame.saturation)
    gl.uniform1i(uniform(ditherProgram, 'uInvert'), frame.invert ? 1 : 0)
    gl.uniform2i(uniform(ditherProgram, 'uDrift'), frame.driftX, frame.driftY)
    gl.uniform1f(uniform(ditherProgram, 'uNoiseAmount'), frame.noiseAmount)
    gl.uniform1f(uniform(ditherProgram, 'uNoiseScale'), frame.noiseScale)
    gl.uniform1i(uniform(ditherProgram, 'uNoiseZ'), frame.noiseZ)
    gl.uniform1i(
      uniform(ditherProgram, 'uNoiseType'),
      NOISE_TYPE[preset.live?.noise?.type ?? 'white'],
    )

    const color = preset.color
    gl.uniform1i(uniform(ditherProgram, 'uColorMode'), COLOR_MODE[color.mode])

    if (color.mode === 'duotone') {
      gl.uniform3fv(uniform(ditherProgram, 'uInk'), hexToRgb(color.ink))
      gl.uniform3fv(uniform(ditherProgram, 'uPaper'), hexToRgb(color.paper))
    }

    if (color.mode === 'palette') {
      const packed = new Float32Array(MAX_PALETTE * 3)
      color.colors.slice(0, MAX_PALETTE).forEach((entry, index) => {
        packed.set(hexToRgb(entry), index * 3)
      })
      gl.uniform3fv(uniform(ditherProgram, 'uPalette'), packed)
      gl.uniform1i(
        uniform(ditherProgram, 'uPaletteSize'),
        Math.min(color.colors.length, MAX_PALETTE),
      )
    }

    gl.uniform1i(
      uniform(ditherProgram, 'uRgbLevels'),
      color.mode === 'rgb' ? Math.max(2, Math.round(color.levels)) : 2,
    )

    const pointerParams = preset.live?.pointer
    gl.uniform1i(uniform(ditherProgram, 'uPointerMode'), POINTER_MODE[pointerParams?.mode ?? 'off'])
    gl.uniform1f(uniform(ditherProgram, 'uPointerRadius'), pointerParams?.radius ?? 0.25)
    gl.uniform1f(uniform(ditherProgram, 'uPointerStrength'), pointerParams?.strength ?? 0)
    const activePointer = state.pointer ?? pointer
    gl.uniform3f(
      uniform(ditherProgram, 'uPointer'),
      activePointer.x,
      activePointer.y,
      activePointer.active ? 1 : 0,
    )

    const trailCount = advanceTrail(state)
    gl.uniform1i(uniform(ditherProgram, 'uTrailCount'), trailCount)
    gl.uniform1f(uniform(ditherProgram, 'uTrailTaper'), pointerParams?.trail?.taper ?? 0)
    if (trailCount > 0) gl.uniform3fv(uniform(ditherProgram, 'uTrail'), trailBuffer)

    const scrollParams = preset.live?.scroll
    gl.uniform1i(uniform(ditherProgram, 'uScrollMode'), SCROLL_MODE[scrollParams?.mode ?? 'off'])
    gl.uniform1f(uniform(ditherProgram, 'uScrollStrength'), scrollParams?.strength ?? 0)
    gl.uniform1f(uniform(ditherProgram, 'uScroll'), state.scroll ?? scroll)
  }

  function draw(state: RenderState): void {
    if (destroyed || contextLost || !source) return
    resizeCellTarget()
    uploadBayer()

    // Pass 1 — dither at cell resolution into the framebuffer.
    gl.useProgram(ditherProgram)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.viewport(0, 0, cellSize.width, cellSize.height)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture)
    gl.uniform1i(uniform(ditherProgram, 'uSource'), 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, bayerTexture)
    gl.uniform1i(uniform(ditherProgram, 'uBayer'), 1)

    uploadUniforms(state)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Pass 2 — scale up to the canvas. NEAREST, always.
    gl.useProgram(blitProgram)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, cellTexture)
    gl.uniform1i(uniform(blitProgram, 'uTexture'), 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    // Pixels are on the canvas. Anything above this line can throw, which is
    // exactly why the signal lives here and not in `start()`.
    options.onPaint?.()
  }

  /**
   * Parks the renderer for the duration of a GPU reset — a driver hiccup, a
   * backgrounded tab under memory pressure, one live context too many.
   *
   * `preventDefault()` is not optional. The browser only schedules a
   * `webglcontextrestored` event for a loss the page has acknowledged, so
   * without it the context is gone for good and the canvas stays blank forever
   * — which here means an empty box, because `DitherImage` hides its fallback
   * photograph the moment `onPaint` first fires.
   *
   * Nothing GL-side is touched: the programs, textures, framebuffer and cached
   * uniform locations are all invalid already, and `contextLost` keeps `draw`
   * away from them until the rebuild lands.
   */
  function handleContextLost(event: Event): void {
    event.preventDefault()
    const wasRunning = running
    canvasSize = { width: canvas.width, height: canvas.height }
    renderer.stop()
    contextLost = true
    // Set after `stop()`, which clears it: an owner that stops a parked
    // renderer means it, and must not find the loop running again on restore.
    resumeAfterRestore = wasRunning
  }

  /**
   * Rebuilds the renderer once the driver hands a working context back.
   *
   * Failure routes through `onError` rather than throwing, exactly as a failed
   * draw does — a renderer that cannot come back has to degrade to the static
   * photograph underneath it, not take the page down with it. `contextLost`
   * stays true in that case, so every later call remains a no-op.
   */
  function handleContextRestored(): void {
    try {
      createResources()
      // `width`/`height` are DOM attributes and survive the loss, so this only
      // fills in a buffer that genuinely has no size. It must not overwrite a
      // live value: the owner's ResizeObserver keeps running while the context
      // is parked, so a pane resized mid-loss has already been re-cropped and
      // re-sized, and restoring the pre-loss numbers would leave the drawing
      // buffer describing a box that no longer exists.
      if (!canvas.width && canvasSize.width && canvasSize.height) {
        canvas.width = canvasSize.width
        canvas.height = canvasSize.height
      }
      uploadBayer()
      if (source) {
        uploadSource(source)
        resizeCellTarget()
      }
      contextLost = false
      if (resumeAfterRestore) {
        resumeAfterRestore = false
        renderer.start()
      } else {
        // A still preset has no loop to repaint it and nothing else will ask,
        // so the single frame it needs is drawn here.
        renderer.render(0)
      }
    } catch (error) {
      options.onError?.(error as Error)
    }
  }

  const renderer: DitherRenderer = {
    canvas,

    setPreset(next) {
      preset = next
      resizeCellTarget()
    },

    setSource(next) {
      uploadSource(next)
      resizeCellTarget()
    },

    setPointer(x, y, active) {
      pointer = { x, y, active }
    },

    setScroll(progress) {
      scroll = progress
    },

    render(time = 0) {
      try {
        draw({ time, pointer, scroll })
      } catch (error) {
        options.onError?.(error as Error)
      }
    },

    start() {
      if (running || destroyed) return
      // There is no loop to run without a context; remember the intent so the
      // restore handler picks it up instead of dropping the request.
      if (contextLost) {
        resumeAfterRestore = true
        return
      }
      running = true
      startedAt = performance.now()
      // Seeded so the first tick always draws rather than waiting out a budget.
      let lastFrame = -FRAME_MS
      const loop = (now: number) => {
        if (!running || destroyed) return
        frameHandle = requestAnimationFrame(loop)
        if (now - lastFrame < FRAME_MS) return
        lastFrame = now
        // Time still comes from the wall clock, not a frame count, so noise and
        // the pointer trail age at the same rate whatever the refresh rate.
        renderer.render((now - startedAt) / 1000)
      }
      frameHandle = requestAnimationFrame(loop)
    },

    stop() {
      running = false
      resumeAfterRestore = false
      if (frameHandle) cancelAnimationFrame(frameHandle)
      frameHandle = 0
    },

    get running() {
      return running
    },

    destroy() {
      renderer.stop()
      destroyed = true
      // Unhooked before the deliberate loss below, so the teardown does not
      // bounce back through the restore path and rebuild what it just freed.
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      gl.deleteTexture(sourceTexture)
      gl.deleteTexture(bayerTexture)
      gl.deleteTexture(cellTexture)
      gl.deleteFramebuffer(framebuffer)
      gl.deleteProgram(ditherProgram)
      gl.deleteProgram(blitProgram)
      // Deliberately NOT calling `WEBGL_lose_context.loseContext()` here. It is
      // tempting — browsers cap live contexts and blog navigation builds one
      // renderer per post — but a context lost that way stays lost until
      // `restoreContext()`, and `canvas.getContext('webgl2')` keeps handing back
      // that same dead object. So the canvas could never host a renderer again:
      // the next `createRenderer` would sail past the null check and die in
      // `link()`, which the caller catches once and never retries. React's
      // StrictMode runs setup/cleanup/setup on a single commit, so this would
      // fire on the very first mount in development. The deletes above already
      // return the GPU memory; the context goes with the canvas.
    },
  }

  canvas.addEventListener('webglcontextlost', handleContextLost)
  canvas.addEventListener('webglcontextrestored', handleContextRestored)

  if (options.source) renderer.setSource(options.source)

  return renderer
}
