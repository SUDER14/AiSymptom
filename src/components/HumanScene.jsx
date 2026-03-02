import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import HumanModel from "./HumanModel";

export default function HumanScene({ modelPath, onMuscleSelect }) {
  const [info, setInfo] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
    >
      {/* ── Spinner — outside Canvas ── */}
      {!loaded && (
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
      )}

      {/* ── Tooltip — outside Canvas ── */}
      {info && (
        <div style={{
          position: "fixed", left: pos.x + 16, top: pos.y - 8,
          pointerEvents: "none", zIndex: 50,
          background: "rgba(8,10,18,0.92)", border: "1px solid rgba(255,60,60,0.35)",
          borderRadius: 8, padding: "8px 13px",
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#ff6b6b", fontFamily: "sans-serif" }}>{info.label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Click for symptoms</p>
        </div>
      )}

      {/* ── Canvas — zero HTML inside ── */}
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        style={{ position: "absolute", inset: 0 }}
        shadows
      >
        {/* Bright ambient so textureless models are never black */}
        <ambientLight intensity={1.2} />

        {/* Key light — front top right */}
        <directionalLight position={[3, 5, 3]} intensity={2.0} castShadow />
        {/* Fill light — front left */}
        <directionalLight position={[-3, 3, 2]} intensity={1.0} />
        {/* Back light — rim */}
        <directionalLight position={[0, 2, -4]} intensity={0.6} color="#88aaff" />
        {/* Bottom fill — stops feet being black */}
        <directionalLight position={[0, -3, 2]} intensity={0.4} />

        {/* Environment map — gives PBR materials something to reflect */}
        <Environment preset="city" />

        <Suspense fallback={
          <mesh visible={false}>
            <boxGeometry args={[0.001, 0.001, 0.001]} />
            <meshBasicMaterial />
          </mesh>
        }>
          <HumanModel
            modelPath={modelPath}
            onHover={(_, d) => setInfo(d)}
            onSelect={(n, d) => onMuscleSelect(n, d)}
            onLoaded={() => setLoaded(true)}
          />
        </Suspense>

        <OrbitControls
          enablePan={true}
          panSpeed={0.8}
          minDistance={1.5}
          maxDistance={15}
          target={[0, 0.4, 0]}
        />
      </Canvas>
    </div>
  );
}