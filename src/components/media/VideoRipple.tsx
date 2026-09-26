"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform vec2 uTexRes;
  uniform vec2 uMouse;
  uniform float uForce;
  uniform float uVel;
  uniform float uTime;

  // cover-fit the video like object-fit: cover
  vec2 coverUV(vec2 uv) {
    float ra = uRes.x / uRes.y;
    float rt = uTexRes.x / uTexRes.y;
    vec2 s = ra > rt ? vec2(1.0, rt / ra) : vec2(ra / rt, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 d = vUv - uMouse;
    d.x *= aspect;
    float dist = length(d);

    // cursor ripple: the film bends away from the pointer
    float ripple = exp(-dist * dist * 46.0) * uForce;
    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
    vec2 off = -dir * ripple * 0.038;

    // gentle heat shimmer, always on
    off.x += sin(vUv.y * 42.0 + uTime * 1.4) * 0.0012;
    off.y += cos(vUv.x * 38.0 - uTime * 1.1) * 0.0012;

    vec2 uv = coverUV(vUv + off);

    // chromatic aberration driven by scroll velocity + ripple
    float ab = uVel * 0.0035 + ripple * 0.012;
    float r = texture2D(uTex, uv + vec2(ab, 0.0)).r;
    vec2 gb = vec2(texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(ab, 0.0)).b);

    gl_FragColor = vec4(r, gb.x, gb.y, 1.0);
  }
`;

type VideoRippleProps = {
  video: HTMLVideoElement | null;
  className?: string;
};

/**
 * Draws a <video> through a WebGL shader: the film ripples away from the
 * cursor and picks up chromatic aberration with cursor proximity and scroll
 * speed. If WebGL is unavailable the canvas never activates and the plain
 * <video> underneath keeps working — this is a progressive-enhancement
 * layer, not a replacement for the video.
 *
 * Perf note: scroll position is read from a passive `scroll` listener, not
 * `window.scrollY` inside the RAF loop — reading scroll/layout properties
 * inside a render loop forces the browser to recompute layout on every
 * frame (it can't trust its cached value once a script asks), and that
 * per-frame forced reflow, stacked on top of GSAP's own scrub work during
 * the same scroll, was the dominant cause of visible scroll jank.
 */
export default function VideoRipple({ video, className }: VideoRippleProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion || !finePointer) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    const uniforms = {
      uTex: { value: texture },
      uRes: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
      uTexRes: { value: new THREE.Vector2(16, 9) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uForce: { value: 0 },
      uVel: { value: 0 },
      uTime: { value: 0 },
    };
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    );
    scene.add(quad);

    const onMeta = () => uniforms.uTexRes.value.set(video.videoWidth || 16, video.videoHeight || 9);
    if (video.readyState >= 1) onMeta();
    video.addEventListener("loadedmetadata", onMeta);

    // Cache the mount's rect once and on resize, not on every pointermove —
    // getBoundingClientRect() also forces a layout read.
    let mountRect = mount.getBoundingClientRect();
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, speed: 0 };
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX - mountRect.left) / mountRect.width;
      const ny = 1 - (e.clientY - mountRect.top) / mountRect.height;
      mouse.speed = Math.min(1.6, mouse.speed + Math.hypot(nx - mouse.tx, ny - mouse.ty) * 9);
      mouse.tx = nx;
      mouse.ty = ny;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Scroll velocity from a passive listener's own event timestamp/value,
    // never read inside the RAF tick.
    let lastY = window.scrollY;
    let lastT = performance.now();
    let vel = 0;
    // Rendering this shader every frame while the page is also scrolling
    // (GSAP's own scrub work) is expensive enough to visibly stall scroll —
    // pause the WebGL render loop entirely for the duration of a scroll and
    // a short settle window after, resuming once things are still. The
    // ripple/aberration is a hover flourish; it doesn't need to run while
    // the page itself is moving.
    let scrolling = false;
    let scrollEndTimer: number | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      const t = performance.now();
      const dt = Math.max(1, t - lastT);
      vel = vel * 0.7 + (Math.abs(y - lastY) / dt) * 12;
      lastY = y;
      lastT = t;

      scrolling = true;
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        scrolling = false;
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    let started = false;
    const clock = new THREE.Clock();
    let raf: number;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      if (scrolling) {
        // Keep the underlying video visible/playing normally while paused —
        // only skip the expensive shader render pass itself.
        if (started) video.style.visibility = "";
        started = false;
        return;
      }

      mouse.x += (mouse.tx - mouse.x) * 0.1;
      mouse.y += (mouse.ty - mouse.y) * 0.1;
      mouse.speed *= 0.94;
      vel *= 0.9;

      uniforms.uMouse.value.set(mouse.x, mouse.y);
      uniforms.uForce.value = Math.min(mouse.speed, 1.2);
      uniforms.uVel.value = Math.min(vel, 2.2);
      uniforms.uTime.value = clock.getElapsedTime();

      if (video.readyState >= 2) {
        renderer.render(scene, camera);
        if (!started) {
          started = true;
          video.style.visibility = "hidden"; // shader owns the pixels now
        }
      }
    };
    tick();

    const onResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      uniforms.uRes.value.set(mount.clientWidth, mount.clientHeight);
      mountRect = mount.getBoundingClientRect();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(scrollEndTimer);
      io.disconnect();
      video.style.visibility = "";
      video.removeEventListener("loadedmetadata", onMeta);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      texture.dispose();
      quad.geometry.dispose();
      quad.material.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [video]);

  return <div ref={mountRef} className={className ?? "ripple-canvas"} aria-hidden="true" />;
}
