/**
 * GPU presentation of CPU-generated, cached phenotype tiles. This is deliberately
 * not described as GPU tissue synthesis: WebGL2 composites the image and samples
 * the focus kernel. The same image is presented by Canvas2D on unsupported devices.
 */
export interface Presenter {
  draw(source: HTMLCanvasElement, focus: number): void
  dispose(): void
}

export function createWebGLPresenter(canvas: HTMLCanvasElement): Presenter | null {
  let gl: WebGL2RenderingContext | null
  try {
    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
    })
  } catch {
    return null
  }
  if (!gl) return null
  const context = gl
  const vertex = context.createShader(context.VERTEX_SHADER)
  const fragment = context.createShader(context.FRAGMENT_SHADER)
  const program = context.createProgram()
  const buffer = context.createBuffer()
  const texture = context.createTexture()
  if (!vertex || !fragment || !program || !buffer || !texture) {
    context.deleteTexture(texture)
    context.deleteBuffer(buffer)
    context.deleteProgram(program)
    context.deleteShader(vertex)
    context.deleteShader(fragment)
    return null
  }

  const dispose = () => {
    context.deleteTexture(texture)
    context.deleteBuffer(buffer)
    context.deleteProgram(program)
    context.deleteShader(vertex)
    context.deleteShader(fragment)
  }
  context.shaderSource(
    vertex,
    `#version 300 es
    in vec2 position;
    out vec2 uv;
    void main() { uv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
  `,
  )
  context.shaderSource(
    fragment,
    `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform vec2 pixel;
    uniform float blur;
    in vec2 uv;
    out vec4 color;
    void main() {
      vec2 p = vec2(uv.x, 1.0 - uv.y);
      vec2 d = pixel * blur;
      vec3 c = texture(image, p).rgb * 0.25;
      c += (texture(image,p+vec2(d.x,0)).rgb + texture(image,p-vec2(d.x,0)).rgb + texture(image,p+vec2(0,d.y)).rgb + texture(image,p-vec2(0,d.y)).rgb) * 0.125;
      c += (texture(image,p+d).rgb + texture(image,p-d).rgb + texture(image,p+vec2(d.x,-d.y)).rgb + texture(image,p+vec2(-d.x,d.y)).rgb) * 0.0625;
      color = vec4(c, 1.0);
    }
  `,
  )
  context.compileShader(vertex)
  context.compileShader(fragment)
  context.attachShader(program, vertex)
  context.attachShader(program, fragment)
  context.linkProgram(program)
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    dispose()
    return null
  }
  context.useProgram(program)
  context.bindBuffer(context.ARRAY_BUFFER, buffer)
  context.bufferData(
    context.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    context.STATIC_DRAW,
  )
  const position = context.getAttribLocation(program, 'position')
  context.enableVertexAttribArray(position)
  context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0)
  context.bindTexture(context.TEXTURE_2D, texture)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE)
  const blur = context.getUniformLocation(program, 'blur')
  const pixel = context.getUniformLocation(program, 'pixel')
  return {
    draw(source, focus) {
      context.viewport(0, 0, canvas.width, canvas.height)
      context.useProgram(program)
      context.bindTexture(context.TEXTURE_2D, texture)
      context.texImage2D(
        context.TEXTURE_2D,
        0,
        context.RGBA,
        context.RGBA,
        context.UNSIGNED_BYTE,
        source,
      )
      context.uniform2f(pixel, 1 / source.width, 1 / source.height)
      context.uniform1f(blur, Math.abs(focus) * 5)
      context.drawArrays(context.TRIANGLES, 0, 6)
    },
    dispose,
  }
}

export function present2D(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  focus: number,
): boolean {
  const context = canvas.getContext('2d')
  if (!context) return false
  context.save()
  context.fillStyle = '#fffdf9'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.filter = `blur(${Math.abs(focus) * 2.5}px)`
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  context.restore()
  return true
}
