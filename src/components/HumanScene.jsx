import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import HumanModel from "./HumanModel";

// ── Auto-fit camera — fires ONCE per box value change ────────────────────────
// Uses the full bounding-box diagonal as the reference dimension so every
// model (male/female, muscle/skeleton) always fits head-to-toe with room to spare.
function CameraFitter({ box }) {
  const { camera } = useThree();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!box) return;
    // Allow re-fire when box changes (model swap)
    firedRef.current = false;
  }, [box]);

  useEffect(() => {
    if (!box || firedRef.current) return;
    firedRef.current = true;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Use the full diagonal of the bounding box — guarantees every model fits
    // regardless of which axis (X/Y/Z) is largest after normalisation.
    const diagonal = Math.sqrt(size.x ** 2 + size.y ** 2 + size.z ** 2);
    const fovRad = (camera.fov * Math.PI) / 180;
    // 1.6× multiplier = generous padding so head/feet are never clipped
    const dist = (diagonal * 1.6) / (2 * Math.tan(fovRad / 2));

    camera.position.set(center.x, center.y, center.z + dist);
    camera.lookAt(center);
    camera.near = 0.1;
    camera.far = dist * 4;
    camera.updateProjectionMatrix();
  }, [box, camera]);

  return null;
}

// ── Smooth damped controls — full 360° rotation, anatomy-optimised ───────────
// Full azimuth (no min/max) so users can spin the model all the way around.
// Polar limited to 30°–150° only to prevent flipping upside down.
// Pan + zoom ON for close-up region inspection.
function SmoothControls({ fitBox }) {
  const controlsRef = useRef();

  useEffect(() => {
    if (!fitBox || !controlsRef.current) return;
    const c = new THREE.Vector3();
    fitBox.getCenter(c);
    controlsRef.current.target.set(c.x, c.y, c.z);
    controlsRef.current.update();
  }, [fitBox]);

  useFrame(() => controlsRef.current?.update());

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableDamping={true}
      dampingFactor={0.08}
      rotateSpeed={0.6}
      panSpeed={0.5}
      minDistance={1.0}
      maxDistance={14}
      minPolarAngle={Math.PI / 6}    /* 30° — can look from slightly above */
      maxPolarAngle={Math.PI * 0.83} /* 150° — can look from below but not flip */
    /* NO azimuth limits → full 360° horizontal rotation */
    />
  );
}

// ── Loading spinner (outside Canvas) ─────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        border: "3px solid rgba(255,80,80,0.15)",
        borderTop: "3px solid #ff4444",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ margin: 0, fontFamily: "sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Loading…
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function HumanScene({ modelPath, onMuscleSelect }) {
  const [tooltip, setTooltip] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [fitBox, setFitBox] = useState(null);

  // Reset loaded + fitBox whenever the model changes so spinner shows and
  // CameraFitter re-fires for the new model's bounding box.
  useEffect(() => {
    setLoaded(false);
    setFitBox(null);
    setTooltip(null);
  }, [modelPath]);

  const handleLoaded = useCallback((box) => {
    setLoaded(true);
    // Always update fitBox — object identity changes each load so CameraFitter will re-fire
    setFitBox(box);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Spinner */}
      {!loaded && <Spinner />}

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 16,
          top: tooltip.y - 8,
          pointerEvents: "none", zIndex: 50,
          background: "rgba(8,10,18,0.92)",
          border: "1px solid rgba(255,60,60,0.35)",
          borderRadius: 8, padding: "8px 13px",
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ff6b6b", fontFamily: "sans-serif" }}>{tooltip.info.label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Click for symptoms</p>
        </div>
      )}

      {/* Canvas */}
      {/* 60° FOV + camera at z=6 ensures full body always visible on load */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        style={{ position: "absolute", inset: 0 }}
        shadows
      >
        <CameraFitter box={fitBox} />

        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 5, 3]} intensity={2.0} castShadow />
        <directionalLight position={[-3, 3, 2]} intensity={1.0} />
        <directionalLight position={[0, 2, -4]} intensity={0.6} color="#88aaff" />
        <directionalLight position={[0, -3, 2]} intensity={0.4} />
        <Environment preset="city" />

        {/*
          Key: modelPath — forces React to unmount + remount HumanModel when the
          path changes. This guarantees a fresh useGLTF load + fresh firedRef,
          so onLoaded fires correctly for every new model.
        */}
        <Suspense fallback={
          <mesh visible={false}>
            <boxGeometry args={[0.001, 0.001, 0.001]} />
            <meshBasicMaterial />
          </mesh>
        }>
          <HumanModel
            key={modelPath}
            modelPath={modelPath}
            onHover={(_, d, cx, cy) => {
              setTooltip(d ? { info: d, x: cx, y: cy } : null);
            }}
            onSelect={(n, d) => onMuscleSelect(n, d)}
            onLoaded={handleLoaded}
          />
        </Suspense>

        <SmoothControls fitBox={fitBox} />
      </Canvas>
    </div>
  );
}