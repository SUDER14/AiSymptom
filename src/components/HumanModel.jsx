import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ─── Map hit-point → body region ─────────────────────────────────────────────
function getRegion(point, bbox) {
  const h = bbox.max.y - bbox.min.y;
  if (h === 0) return null;
  const y = (point.y - bbox.min.y) / h;
  const x = point.x;
  const z = point.z;

  if (y > 0.88) return "head";
  if (y > 0.82) return "neck";
  if (y > 0.72) {
    if (x < -0.08) return "deltoid_left";
    if (x >  0.08) return "deltoid_right";
    return "trapezius";
  }
  if (y > 0.60) {
    if (z >= 0) return x < 0 ? "pectoralis_major_left" : "pectoralis_major_right";
    return x < 0 ? "latissimus_dorsi_left" : "latissimus_dorsi_right";
  }
  if (y > 0.52 && Math.abs(x) > 0.12) {
    const s = x < 0 ? "left" : "right";
    return z >= 0 ? `bicep_${s}` : `tricep_${s}`;
  }
  if (y > 0.42) {
    if (z >= 0) return Math.abs(x) > 0.06 ? (x < 0 ? "obliques_left" : "obliques_right") : "rectus_abdominis";
    return x < 0 ? "latissimus_dorsi_left" : "latissimus_dorsi_right";
  }
  if (y > 0.32) {
    if (z < 0) return x < 0 ? "gluteus_maximus_left" : "gluteus_maximus_right";
    return x < 0 ? "obliques_left" : "obliques_right";
  }
  if (y > 0.18) {
    const s = x <= 0 ? "left" : "right";
    return z >= 0 ? `quadriceps_${s}` : `hamstrings_${s}`;
  }
  if (y > 0.05) return x <= 0 ? "gastrocnemius_left" : "gastrocnemius_right";
  return null;
}

export const MUSCLE_DATA = {
  head:                   { label:"Head",                   symptoms:["Headache","Dizziness","Blurred vision","Facial pain"] },
  neck:                   { label:"Neck",                   symptoms:["Stiff neck","Pain turning head","Radiating arm pain"] },
  trapezius:              { label:"Trapezius",              symptoms:["Upper back stiffness","Tension headaches","Knots between shoulder blades"] },
  pectoralis_major_left:  { label:"Pectoralis Major (L)",   symptoms:["Chest tightness","Pain lifting arms","Weakness pushing"] },
  pectoralis_major_right: { label:"Pectoralis Major (R)",   symptoms:["Chest tightness","Pain lifting arms","Weakness pushing"] },
  deltoid_left:           { label:"Deltoid (L)",            symptoms:["Shoulder pain","Difficulty reaching overhead"] },
  deltoid_right:          { label:"Deltoid (R)",            symptoms:["Shoulder pain","Difficulty reaching overhead"] },
  bicep_left:             { label:"Biceps Brachii (L)",     symptoms:["Front elbow ache","Weakness bending arm"] },
  bicep_right:            { label:"Biceps Brachii (R)",     symptoms:["Front elbow ache","Weakness bending arm"] },
  tricep_left:            { label:"Triceps Brachii (L)",    symptoms:["Pain straightening arm","Swelling behind elbow"] },
  tricep_right:           { label:"Triceps Brachii (R)",    symptoms:["Pain straightening arm","Swelling behind elbow"] },
  rectus_abdominis:       { label:"Rectus Abdominis",       symptoms:["Central abdominal pain","Pain after crunches"] },
  obliques_left:          { label:"Obliques (L)",           symptoms:["Side stitch","Pain twisting torso"] },
  obliques_right:         { label:"Obliques (R)",           symptoms:["Side stitch","Pain twisting torso"] },
  latissimus_dorsi_left:  { label:"Latissimus Dorsi (L)",   symptoms:["Pain below shoulder blade","Lower back ache"] },
  latissimus_dorsi_right: { label:"Latissimus Dorsi (R)",   symptoms:["Pain below shoulder blade","Lower back ache"] },
  gluteus_maximus_left:   { label:"Gluteus Maximus (L)",    symptoms:["Deep buttock pain","Pain sitting long periods"] },
  gluteus_maximus_right:  { label:"Gluteus Maximus (R)",    symptoms:["Deep buttock pain","Pain sitting long periods"] },
  quadriceps_left:        { label:"Quadriceps (L)",         symptoms:["Knee pain on stairs","Thigh weakness"] },
  quadriceps_right:       { label:"Quadriceps (R)",         symptoms:["Knee pain on stairs","Thigh weakness"] },
  hamstrings_left:        { label:"Hamstrings (L)",         symptoms:["Sharp thigh pain","Tightness bending"] },
  hamstrings_right:       { label:"Hamstrings (R)",         symptoms:["Sharp thigh pain","Tightness bending"] },
  gastrocnemius_left:     { label:"Calf (L)",               symptoms:["Calf cramps","Pain walking uphill"] },
  gastrocnemius_right:    { label:"Calf (R)",               symptoms:["Calf cramps","Pain walking uphill"] },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function HumanModel({ modelPath, onHover, onSelect, onLoaded }) {
  const { scene }    = useGLTF(modelPath);
  const groupRef     = useRef();
  const bboxRef      = useRef(new THREE.Box3());
  const hoveredRef   = useRef(null);
  const matsRef      = useRef([]);
  const firedRef     = useRef(false);

  useEffect(() => {
    if (!scene || !groupRef.current) return;

    matsRef.current = [];

    // Fix materials — ensure visible even without environment map
    scene.traverse((obj) => {
      if (!obj.isMesh) return;

      const raw    = Array.isArray(obj.material) ? obj.material : [obj.material];
      const clones = raw.map((m) => {
        const c = m.clone();

        // If no base color texture and no color factor, set a visible default
        const pbr = c;
        if (!pbr.map && !pbr.color) {
          pbr.color = new THREE.Color(0.8, 0.75, 0.7);
        }

        // Ensure emissive fields exist
        if (!c.emissive)               c.emissive          = new THREE.Color(0, 0, 0);
        if (c.emissiveIntensity == null) c.emissiveIntensity = 0;

        // Bump up roughness so it catches light nicely
        if (c.roughness != null && c.roughness < 0.3) c.roughness = 0.5;

        c.needsUpdate = true;
        return c;
      });

      obj.material = Array.isArray(obj.material) ? clones : clones[0];
      obj.castShadow    = true;
      obj.receiveShadow = true;

      clones.forEach((c) => matsRef.current.push({
        mat:           c,
        origEmissive:  c.emissive.clone(),
        origIntensity: c.emissiveIntensity,
      }));
    });

    // ── Auto-center & scale to fit in a ~2-unit tall box ────────────────────
    const box    = new THREE.Box3().setFromObject(groupRef.current);
    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim   = Math.max(size.x, size.y, size.z);
    const scale    = 2.0 / maxDim;           // normalise to 2 units tall
    groupRef.current.scale.setScalar(scale);

    // Re-center after scaling
    const box2   = new THREE.Box3().setFromObject(groupRef.current);
    const center2 = new THREE.Vector3();
    box2.getCenter(center2);
    groupRef.current.position.sub(center2);  // center on origin
    groupRef.current.position.y += 0;        // keep feet near ground

    // Store final bbox for region detection
    bboxRef.current.setFromObject(groupRef.current);

    if (!firedRef.current) {
      firedRef.current = true;
      onLoaded?.();
    }
  }, [scene]);   // eslint-disable-line

  const highlight = (on) => {
    matsRef.current.forEach(({ mat, origEmissive, origIntensity }) => {
      mat.emissive.set(on ? 0xff2200 : 0);
      mat.emissiveIntensity = on ? 0.5 : origIntensity;
      mat.needsUpdate = true;
    });
  };

  const handleMove = (e) => {
    e.stopPropagation();
    const region = getRegion(e.point, bboxRef.current);
    if (region === hoveredRef.current) return;
    hoveredRef.current = region;
    highlight(!!region);
    onHover?.(region, region ? (MUSCLE_DATA[region] ?? null) : null);
    document.body.style.cursor = region ? "pointer" : "auto";
  };

  const handleOut = () => {
    if (hoveredRef.current === null) return;
    hoveredRef.current = null;
    highlight(false);
    onHover?.(null, null);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const region = getRegion(e.point, bboxRef.current);
    if (region && MUSCLE_DATA[region]) onSelect?.(region, MUSCLE_DATA[region]);
  };

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onPointerMove={handleMove}
        onPointerOut={handleOut}
        onClick={handleClick}
      />
    </group>
  );
}