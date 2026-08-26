import { useEffect, useRef } from "react";

const VERT = `#version 300 es
void main() {
  vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_energy;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rot * p * 2.03;
    amplitude *= 0.55;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 aspect = vec2(u_res.x / u_res.y, 1.0);
  vec2 p = uv * aspect;
  float t = u_time * 0.05;

  vec2 anchor = u_pointer * aspect;
  vec2 rel = p - anchor;
  float d = length(rel);
  float swirlAngle = 0.85 * u_energy * exp(-d * d * 3.2);
  float cs = cos(swirlAngle);
  float sn = sin(swirlAngle);
  vec2 swirled = anchor + vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs);

  vec2 q = vec2(fbm(swirled * 1.35 + t * 0.6), fbm(swirled * 1.35 - vec2(0.23, 0.41) * t));
  vec2 r = vec2(fbm(swirled * 1.7 + q * 1.15 + vec2(1.7, 9.2)),
                fbm(swirled * 1.7 + q * 1.15 + vec2(8.3, 2.8)));
  float f = fbm(swirled * 1.5 + r);

  float band = smoothstep(0.36, 0.86, f);
  float vein = pow(clamp(1.0 - abs(f - 0.52) * 3.4, 0.0, 1.0), 2.2);
  float halo = exp(-d * d * 5.5) * u_energy;

  vec3 teal = vec3(110.0, 180.0, 190.0) / 255.0;
  vec3 amber = vec3(211.0, 155.0, 97.0) / 255.0;
  vec3 bright = vec3(232.0, 181.0, 124.0) / 255.0;

  vec3 col = mix(teal, amber, clamp(vein * 1.25, 0.0, 1.0));
  col = mix(col, bright, clamp(halo * 0.8, 0.0, 1.0));

  float edgeFade = smoothstep(0.0, 0.16, uv.y) * smoothstep(1.0, 0.84, uv.y)
                 * smoothstep(0.0, 0.09, uv.x) * smoothstep(1.0, 0.91, uv.x);
  float intensity = band * 0.30 + vein * 0.34 + halo * 0.30;
  float alpha = clamp(intensity, 0.0, 1.0) * edgeFade * 0.82;

  fragColor = vec4(col, alpha);
}`;

type Gl = WebGL2RenderingContext;

type FieldHandles = {
  gl: Gl;
  program: WebGLProgram;
  uniforms: Record<"u_res" | "u_time" | "u_pointer" | "u_energy", WebGLUniformLocation | null>;
};

const DPR_CAP = 1.75;
const RENDER_SCALE = 0.72;

function buildProgram(gl: Gl): FieldHandles | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const vertex = compile(gl.VERTEX_SHADER, VERT);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vertex || !fragment) {
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return {
    gl,
    program,
    uniforms: {
      u_res: gl.getUniformLocation(program, "u_res"),
      u_time: gl.getUniformLocation(program, "u_time"),
      u_pointer: gl.getUniformLocation(program, "u_pointer"),
      u_energy: gl.getUniformLocation(program, "u_energy"),
    },
  };
}

export default function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) {
      return;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    }) as Gl | null;
    if (!gl) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const vao = gl.createVertexArray();
    let handles: FieldHandles | null = null;
    let raf = 0;
    let running = false;
    let inView = true;
    let startTime = performance.now() + Math.random() * 40000;
    const pointer = { x: 0.68, y: 0.58, tx: 0.68, ty: 0.58 };
    const energy = { value: 0.25, target: 0.25 };
    let lastMoveAt = 0;
    let lastFrameAt = 0;

    const draw = (timeSeconds: number) => {
      if (!handles) {
        return;
      }
      const { gl: ctx, program, uniforms } = handles;
      ctx.useProgram(program);
      ctx.uniform2f(uniforms.u_res, canvas.width, canvas.height);
      ctx.uniform1f(uniforms.u_time, timeSeconds);
      ctx.uniform2f(uniforms.u_pointer, pointer.x, pointer.y);
      ctx.uniform1f(uniforms.u_energy, energy.value);
      ctx.clearColor(0, 0, 0, 0);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP) * RENDER_SCALE;
      const width = Math.max(2, Math.round(rect.width * dpr));
      const height = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      if (handles) {
        handles.gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - lastFrameAt) / 1000 || 0.016);
      lastFrameAt = now;
      if (now - lastMoveAt > 1400) {
        energy.target = 0.25;
      }
      const ease = 1 - Math.exp(-dt * 3.4);
      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      energy.value += (energy.target - energy.value) * ease;
      draw((now - startTime) / 1000);
      if (running) {
        raf = requestAnimationFrame(tick);
      }
    };

    const sync = () => {
      const shouldRun = !motionQuery.matches && inView && !document.hidden && !!handles;
      if (running !== shouldRun) {
        running = shouldRun;
        if (running) {
          lastFrameAt = performance.now();
          raf = requestAnimationFrame(tick);
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }
      if (handles && !running && motionQuery.matches) {
        draw(31.7);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / (rect.width || 1);
      pointer.ty = 1 - (event.clientY - rect.top) / (rect.height || 1);
      energy.target = 1;
      lastMoveAt = performance.now();
    };

    const onVisibilityChange = () => sync();
    const onContextLost = (event: Event) => {
      event.preventDefault();
      handles = null;
      sync();
    };
    const onContextRestored = () => {
      handles = buildProgram(gl);
      if (handles && vao) {
        gl.bindVertexArray(vao);
      }
      resize();
      sync();
      if (!motionQuery.matches) {
        draw((performance.now() - startTime) / 1000);
      }
    };

    handles = buildProgram(gl);
    if (!handles || !vao) {
      return;
    }
    gl.bindVertexArray(vao);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const observer = new ResizeObserver(() => {
      resize();
      if (!running) {
        draw((performance.now() - startTime) / 1000);
      }
    });
    const intersection = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      sync();
    });

    observer.observe(host);
    intersection.observe(canvas);
    host.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", onVisibilityChange);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    motionQuery.addEventListener("change", sync);

    resize();
    sync();

    return () => {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      motionQuery.removeEventListener("change", sync);
      if (handles) {
        gl.deleteProgram(handles.program);
        handles = null;
      }
      gl.deleteVertexArray(vao);
    };
  }, []);

  return <canvas ref={canvasRef} className="signal-index-hero-field" aria-hidden="true" />;
}
