import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 uResolution;
uniform float uTime;

float caustic(vec2 uv, float time) {
  vec2 p = mod(uv * 6.28318530718, 6.28318530718) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float intensity = 0.005;
  for (int n = 0; n < 5; n++) {
    float t = time * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + t) / intensity), p.y / (cos(i.y + t) / intensity)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 st = uv;
  st.x *= uResolution.x / uResolution.y;
  float t = uTime * 0.5;
  vec2 drift = vec2(t * 0.028, t * -0.019);
  float slow = caustic(st * 1.1 + drift, t);
  float fast = caustic(st * 2.35 - drift * 1.7, t * 0.78);
  float light = slow * 0.72 + fast * 0.33;

  vec3 deep = vec3(0.039, 0.071, 0.086);
  vec3 teal = vec3(0.29, 0.46, 0.47);
  vec3 warm = vec3(0.83, 0.72, 0.42);
  vec3 color = deep + teal * light * 0.52 + warm * pow(light, 2.4) * 0.4;

  vec2 centered = uv - 0.5;
  float vignette = smoothstep(0.9, 0.2, length(centered * vec2(1.2, 1.0)));
  color *= mix(0.68, 1.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;

type RefractionFieldProps = {
  className?: string;
};

export default function RefractionField({ className }: RefractionFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const markFallback = () => {
      canvas.dataset.seaFallback = "true";
    };

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });

    if (!gl) {
      markFallback();
      return;
    }

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

    const vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      markFallback();
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      markFallback();
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      markFallback();
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform2f(uResolution, width, height);
        return true;
      }
      return false;
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    let inView = true;
    let drawing = false;

    const draw = (now: number) => {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      draw(now);
      if (drawing) {
        frame = requestAnimationFrame(loop);
      }
    };

    const updateRunning = () => {
      const shouldDraw = inView && !document.hidden;
      if (shouldDraw && !drawing) {
        drawing = true;
        frame = requestAnimationFrame(loop);
      } else if (!shouldDraw && drawing) {
        drawing = false;
        cancelAnimationFrame(frame);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        updateRunning();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const handleVisibility = () => updateRunning();
    document.addEventListener("visibilitychange", handleVisibility);

    const resizeObserver = new ResizeObserver(() => {
      if (resize()) {
        draw(performance.now());
      }
    });
    resizeObserver.observe(canvas);

    resize();
    if (reducedMotion) {
      draw(performance.now());
    } else {
      drawing = true;
      frame = requestAnimationFrame(loop);
    }

    return () => {
      drawing = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      const loseContext = gl.getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
