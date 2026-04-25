import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';

function buildTexture(): THREE.CanvasTexture {
    const W = 2048, H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Ocean — warm amber gradient pole-to-pole
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   '#6a5035');
    grad.addColorStop(0.12,'#9a7048');
    grad.addColorStop(0.5, '#b08848');
    grad.addColorStop(0.88,'#9a7048');
    grad.addColorStop(1,   '#6a5035');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── World map via d3-geo equirectangular projection ──────────
    const projection = geoEquirectangular()
        .scale(W / (2 * Math.PI))
        .translate([W / 2, H / 2]);
    const path = geoPath(projection, ctx);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = worldData as any;

    // Land fill — lighter warm parchment
    const land = feature(topo, topo.objects.land);
    ctx.beginPath();
    path(land);
    ctx.fillStyle = '#d4b485';
    ctx.fill();

    // Country borders — subtle dark lines
    const countries = feature(topo, topo.objects.countries);
    ctx.beginPath();
    path(countries);
    ctx.strokeStyle = '#7a5030';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Grid lines ───────────────────────────────────────────────
    const latY = (lat: number) => ((90 - lat) / 180) * H;
    const lonX = (lon: number) => ((lon + 180) / 360) * W;

    // Minor grid — every 10°
    ctx.strokeStyle = '#5c3d1a';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.2;
    for (let lat = -80; lat <= 80; lat += 10) {
        if (lat === 0) continue;
        ctx.beginPath(); ctx.moveTo(0, latY(lat)); ctx.lineTo(W, latY(lat)); ctx.stroke();
    }
    for (let lon = -170; lon <= 180; lon += 10) {
        if (lon === 0 || lon === 180 || lon === -180) continue;
        ctx.beginPath(); ctx.moveTo(lonX(lon), 0); ctx.lineTo(lonX(lon), H); ctx.stroke();
    }

    // Tropics & polar circles — dashed
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#5c3d1a';
    ctx.setLineDash([14, 10]);
    for (const lat of [23.5, -23.5, 66.5, -66.5]) {
        ctx.beginPath(); ctx.moveTo(0, latY(lat)); ctx.lineTo(W, latY(lat)); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Equator & prime meridian — bold
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3a1e08';
    ctx.beginPath(); ctx.moveTo(0, latY(0)); ctx.lineTo(W, latY(0)); ctx.stroke();
    for (const lon of [0, 180, -180]) {
        ctx.beginPath(); ctx.moveTo(lonX(lon), 0); ctx.lineTo(lonX(lon), H); ctx.stroke();
    }

    // Subtle paper grain
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 60000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(canvas);
}

export default function GlobeModel() {
    const mountRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const mount = mountRef.current!;
        const W = mount.clientWidth;
        const H = mount.clientHeight;

        // Scene & camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
        camera.position.set(0, 0.1, 3.6);

        // Renderer — transparent so the page bg shows through
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W, H);
        mount.appendChild(renderer.domElement);

        // ── Root group — scaled to 70% ─────────────────────────
        const rootGroup = new THREE.Group();
        rootGroup.scale.setScalar(0.7);
        scene.add(rootGroup);

        // outerGroup tilted 23.5° so the spin axis matches Earth's tilt
        const outerGroup = new THREE.Group();
        outerGroup.rotation.z = THREE.MathUtils.degToRad(23.5);
        outerGroup.position.y = 0.15;
        rootGroup.add(outerGroup);

        // spinGroup rotates around outerGroup's (tilted) Y axis
        const spinGroup = new THREE.Group();
        outerGroup.add(spinGroup);

        // Globe sphere
        const texture = buildTexture();
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 72, 72),
            new THREE.MeshPhongMaterial({
                map: texture,
                specular: new THREE.Color(0x331a00),
                shininess: 18,
            }),
        );
        spinGroup.add(sphere);

        // Thin wireframe overlay for vintage depth
        const wire = new THREE.Mesh(
            new THREE.SphereGeometry(1.003, 36, 36),
            new THREE.MeshBasicMaterial({ color: 0x3d1e08, wireframe: true, transparent: true, opacity: 0.05 }),
        );
        spinGroup.add(wire);

        // ── Stand ──────────────────────────────────────────────
        const woodMat = new THREE.MeshPhongMaterial({ color: 0x3d2314, shininess: 40 });

        // Axis pole — inherits the tilt from outerGroup
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0, 16), woodMat);
        outerGroup.add(pole);

        // Decorative meridian ring around the globe
        const meridianRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.028, 12, 64), woodMat);
        outerGroup.add(meridianRing);

        // Horizontal base ring — stays level (not tilted)
        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 12, 60), woodMat);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.y = -0.97;
        rootGroup.add(baseRing);

        // Pedestal knob
        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.1, 20), woodMat);
        pedestal.position.y = -1.15;
        rootGroup.add(pedestal);

        // ── Lights ─────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xfdf0d8, 0.55));

        const sun = new THREE.DirectionalLight(0xfff4d8, 1.3);
        sun.position.set(4, 3, 4);
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0xc8a060, 0.25);
        fill.position.set(-3, -1, -2);
        scene.add(fill);

        // ── Interaction ────────────────────────────────────────
        let dragging = false;
        let prevX = 0;
        let velocityY = 0;
        let dragDistance = 0;

        const onDown = (x: number) => { dragging = true; prevX = x; velocityY = 0; dragDistance = 0; };
        const onMove = (x: number) => {
            if (!dragging) return;
            const dx = x - prevX;
            dragDistance += Math.abs(dx);
            spinGroup.rotation.y += dx * 0.006;
            velocityY = dx * 0.006;
            prevX = x;
        };
        const onUp = () => {
            if (dragDistance < 4) navigate('/app');
            dragging = false;
        };

        const onMouseDown  = (e: MouseEvent) => onDown(e.clientX);
        const onMouseMove  = (e: MouseEvent) => onMove(e.clientX);
        const onTouchStart = (e: TouchEvent) => onDown(e.touches[0].clientX);
        const onTouchMove  = (e: TouchEvent) => onMove(e.touches[0].clientX);

        mount.addEventListener('mousedown',  onMouseDown);
        mount.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup',   onUp);
        window.addEventListener('touchmove', onTouchMove,  { passive: true });
        window.addEventListener('touchend',  onUp);

        // ── Animation loop ─────────────────────────────────────
        let rafId: number;
        const tick = () => {
            rafId = requestAnimationFrame(tick);
            if (!dragging) {
                velocityY *= 0.92;
                spinGroup.rotation.y += 0.0018 + velocityY;
            }
            renderer.render(scene, camera);
        };
        tick();

        // ── Resize ─────────────────────────────────────────────
        const onResize = () => {
            const w = mount.clientWidth, h = mount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(rafId);
            mount.removeEventListener('mousedown',  onMouseDown);
            mount.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup',   onUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend',  onUp);
            window.removeEventListener('resize',    onResize);
            texture.dispose();
            renderer.dispose();
            mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{ width: '100%', height: '100%', cursor: 'grab' }}
            onMouseDown={(e) => e.preventDefault()}
        />
    );
}
