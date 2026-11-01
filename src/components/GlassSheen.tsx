import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  sway: number;
  phase: number;
  alpha: number;
};

const DROP_COUNT = 32;

function makeDrops(): Drop[] {
  return Array.from({ length: DROP_COUNT }, () => ({
    x: 0.22 + Math.random() * 0.78,
    y: Math.random(),
    radius: 2.4 + Math.random() * 6.5,
    speed: 0.018 + Math.random() * 0.028,
    sway: 6 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.16 + Math.random() * 0.28,
  }));
}

export default function GlassSheen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent || reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drops = makeDrops();
    let width = 0;
    let height = 0;
    let running = false;
    let frame = 0;
    let last = 0;
    let pointer = 0.62;
    let sheen = 0.62;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      if (!running) return;
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 0.016);
      last = time;
      sheen += (pointer - sheen) * 0.06;
      const drift = 0.5 + Math.sin(time * 0.00035) * 0.12;
      const band = width * (drift * 0.45 + sheen * 0.55);

      ctx.clearRect(0, 0, width, height);

      const light = ctx.createLinearGradient(band - width * 0.22, 0, band + width * 0.18, height);
      light.addColorStop(0, "rgba(255,255,255,0)");
      light.addColorStop(0.42, "rgba(255,248,236,0.05)");
      light.addColorStop(0.52, "rgba(255,255,255,0.14)");
      light.addColorStop(0.62, "rgba(220,236,255,0.06)");
      light.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, width, height);

      for (const drop of drops) {
        drop.y += drop.speed * dt;
        if (drop.y > 1.08) drop.y = -0.08;
        const x = drop.x * width + Math.sin(time * 0.0008 + drop.phase) * drop.sway;
        const y = drop.y * height;
        const gloss = ctx.createRadialGradient(
          x - drop.radius * 0.28,
          y - drop.radius * 0.35,
          drop.radius * 0.05,
          x,
          y,
          drop.radius,
        );
        gloss.addColorStop(0, `rgba(255,255,255,${drop.alpha})`);
        gloss.addColorStop(0.42, `rgba(214,232,255,${drop.alpha * 0.45})`);
        gloss.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gloss;
        ctx.beginPath();
        ctx.ellipse(x, y, drop.radius * 0.7, drop.radius * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      if (rect.width <= 0) return;
      pointer = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else if (parent.getBoundingClientRect().bottom > 0 && parent.getBoundingClientRect().top < window.innerHeight) {
        start();
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && document.visibilityState === "visible") start();
        else stop();
      },
      { threshold: 0.08 },
    );
    intersectionObserver.observe(parent);

    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
