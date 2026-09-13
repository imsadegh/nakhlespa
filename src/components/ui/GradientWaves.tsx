'use client';

import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import './GradientWaves.css';

export type GradientWavesDetail = 'low' | 'medium' | 'high';

export interface GradientWavesProps {
  horizonColor?: string;
  waveColor?: string;
  crestColor?: string;
  speed?: number;
  amplitude?: number;
  waveScale?: number;
  waveRatio?: number;
  swell?: number;
  turbulence?: number;
  tilt?: number;
  zoom?: number;
  height?: number;
  fogDepth?: number;
  detail?: GradientWavesDetail;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  parallaxStrength?: number;
  grain?: boolean;
  grainIntensity?: number;
  className?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255]
    : [1, 1, 1];
};

const detailToSteps = (detail: GradientWavesDetail) =>
  detail === 'low' ? 40 : detail === 'high' ? 110 : 70;

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution; uniform float iTime; uniform float uSpeed;
uniform float uAmplitude; uniform float uWaveScale; uniform float uWaveRatio;
uniform float uSwell; uniform float uTurbulence; uniform float uTilt;
uniform float uZoom; uniform float uHeight; uniform float uFogDepth;
uniform float uSteps; uniform float uBrightness; uniform float uOpacity;
uniform float uGrain; uniform float uGrainIntensity; uniform vec2 uMouse;
uniform float uParallax; uniform bool uEnableMouse;
uniform vec3 uHorizonColor; uniform vec3 uWaveColor; uniform vec3 uCrestColor;
out vec4 fragColor; const float MAX_DIST = 20000.0;
float hash21(vec2 p) { vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float surface(vec3 p, vec2 f, float t) {
  float x=p.x+t/.13; float y=p.y-t/.81;
  x += uSwell*sin((p.y+x)/20.0+t/.2); y += uTurbulence*cos(p.x/23.0+t/.71);
  return p.z-(sin(x*f.x)*uAmplitude+sin(y*f.y)*uAmplitude+uHeight);
}
float march(vec3 p, vec3 d, vec2 f, float t) {
  float dist=0.0;
  for(int i=0;i<128;i++){ if(float(i)>=uSteps) break; float s=surface(p+dist*d,f,t); if(abs(s)<.1) break; dist+=.9*s; if(abs(dist)>=MAX_DIST) return MAX_DIST; }
  return dist;
}
void main() {
  float t=iTime*uSpeed; vec2 f=vec2(uWaveScale/7.0,uWaveScale*uWaveRatio/3.0);
  vec2 uv=gl_FragCoord.xy/iResolution.xy-.5; uv.x*=iResolution.x/iResolution.y; uv.y=-uv.y;
  float len=length(uv); float vfov=1.3659/max(uZoom,.05); vec3 d=vec3(0.,0.,-1.);
  float c=cos(vfov*len),s=sin(vfov*len); d=mat3(1.,0.,0.,0.,c,-s,0.,s,c)*d;
  vec2 n=len>1e-5?uv/len:vec2(1.,0.); d=mat3(n.x,-n.y,0.,n.y,n.x,0.,0.,0.,1.)*d;
  c=cos(uTilt);s=sin(uTilt);d=mat3(c,0.,s,0.,1.,0.,-s,0.,c)*d;
  if(uEnableMouse){ float yaw=(uMouse.x-.5)*uParallax*.4; float pitch=(uMouse.y-.5)*uParallax*.4;
    c=cos(yaw);s=sin(yaw);d=mat3(c,0.,s,0.,1.,0.,-s,0.,c)*d; c=cos(pitch);s=sin(pitch);d=mat3(1.,0.,0.,0.,c,-s,0.,s,c)*d; }
  vec3 cam=vec3(0.,0.,30.); float dist=march(cam,d,f,t); vec3 p=cam+dist*d;
  float fog=clamp(uFogDepth/max(dist,.001),0.,1.); vec3 body=mix(uWaveColor,uCrestColor,clamp(p.z*.08+.5,0.,1.));
  vec3 col=clamp(mix(uHorizonColor,body,fog)*uBrightness,0.,1.); float a=fog*uOpacity;
  if(uGrain>.5) a=clamp(a+(hash21(gl_FragCoord.xy+mod(iTime,64.)*11.)-.5)*uGrainIntensity,0.,1.);
  fragColor=vec4(col*a,a);
}`;

export default function GradientWaves({
  horizonColor = '#5227FF', waveColor = '#FF9FFC', crestColor = '#FFFFFF', speed = 0.4,
  amplitude = 2.5, waveScale = 0.6, waveRatio = 0.9, swell = 35, turbulence = 20,
  tilt = 1.11, zoom = 1, height = 5.5, fogDepth = 15, detail = 'medium', brightness = 1,
  opacity = 1, mouseInteraction = true, parallaxStrength = 0.5, grain = true,
  grainIntensity = 0.05, className = '',
}: GradientWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const supportCanvas = document.createElement('canvas');
    if (!supportCanvas.getContext('webgl2')) return;
    const renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(canvas);
    const program = new Program(gl, { vertex, fragment, uniforms: {
      iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) }, uSpeed: { value: speed },
      uAmplitude: { value: amplitude }, uWaveScale: { value: waveScale }, uWaveRatio: { value: waveRatio }, uSwell: { value: swell },
      uTurbulence: { value: turbulence }, uTilt: { value: tilt }, uZoom: { value: zoom }, uHeight: { value: height }, uFogDepth: { value: fogDepth },
      uSteps: { value: detailToSteps(detail) }, uBrightness: { value: brightness }, uOpacity: { value: opacity }, uGrain: { value: grain ? 1 : 0 },
      uGrainIntensity: { value: grainIntensity }, uMouse: { value: new Float32Array([.5, .5]) }, uParallax: { value: parallaxStrength },
      uEnableMouse: { value: mouseInteraction }, uHorizonColor: { value: new Float32Array(hexToRgb(horizonColor)) },
      uWaveColor: { value: new Float32Array(hexToRgb(waveColor)) }, uCrestColor: { value: new Float32Array(hexToRgb(crestColor)) },
    }});
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const setSize = () => { const r = container.getBoundingClientRect(); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height)); const v = program.uniforms.iResolution.value as Float32Array; v[0] = gl.drawingBufferWidth; v[1] = gl.drawingBufferHeight; };
    const resizeObserver = new ResizeObserver(setSize); resizeObserver.observe(container); setSize();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reducedMotion.matches; let raf = 0; let inViewport = true; let pageVisible = !document.hidden;
    const current = [.5, .5]; const target = [.5, .5];
    const render = (time: number) => { (program.uniforms.iTime.value as number) = time * .001; const m = program.uniforms.uMouse.value as Float32Array; current[0] += .05 * (target[0] - current[0]); current[1] += .05 * (target[1] - current[1]); m[0] = current[0]; m[1] = current[1]; renderer.render({ scene: mesh }); if (!reduced && inViewport && pageVisible) raf = requestAnimationFrame(render); };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!reduced && inViewport && pageVisible && !raf) raf = requestAnimationFrame(render); };
    const updateMotion = (event?: MediaQueryListEvent) => { reduced = event ? event.matches : reducedMotion.matches; program.uniforms.uEnableMouse.value = mouseInteraction && !reduced; stop(); if (reduced) render(0); else start(); };
    const pointerMove = (e: PointerEvent) => { if (reduced || !mouseInteraction) return; const r = canvas.getBoundingClientRect(); const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; if (!inside) { target[0] = .5; target[1] = .5; return; } target[0] = (e.clientX-r.left)/r.width; target[1] = 1-(e.clientY-r.top)/r.height; };
    const pointerLeave = () => { target[0] = .5; target[1] = .5; };
    const observer = new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; inViewport ? start() : stop(); });
    const visibilityChange = () => { pageVisible = !document.hidden; pageVisible ? start() : stop(); };
    window.addEventListener('pointermove', pointerMove); window.addEventListener('blur', pointerLeave); reducedMotion.addEventListener('change', updateMotion); document.addEventListener('visibilitychange', visibilityChange); observer.observe(container); updateMotion();
    return () => { stop(); resizeObserver.disconnect(); observer.disconnect(); reducedMotion.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', visibilityChange); window.removeEventListener('pointermove', pointerMove); window.removeEventListener('blur', pointerLeave); canvas.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); };
  }, [amplitude, brightness, crestColor, detail, fogDepth, grain, grainIntensity, height, horizonColor, mouseInteraction, opacity, parallaxStrength, speed, swell, tilt, turbulence, waveColor, waveRatio, waveScale, zoom]);

  return <div ref={containerRef} className={`gradient-waves-container ${className}`.trim()} />;
}
