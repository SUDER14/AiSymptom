// backend/data/medicalKnowledge.js
// Each entry will be embedded as a vector chunk in ChromaDB

const medicalKnowledge = [

  // ── HEAD ────────────────────────────────────────────────────────────────────
  {
    id: "head_001",
    region: "head",
    category: "symptoms",
    text: "Headaches originating from tension in the scalp and neck muscles often present as a band-like pressure around the forehead or back of the head. Common triggers include stress, dehydration, poor posture, and eye strain. Tension headaches typically respond well to over-the-counter analgesics and rest.",
  },
  {
    id: "head_002",
    region: "head",
    category: "symptoms",
    text: "Migraines are severe, often unilateral headaches accompanied by nausea, vomiting, and sensitivity to light and sound. They can last 4–72 hours. Aura (visual disturbances, tingling) may precede migraine in about 25% of cases. Triggers include hormonal changes, certain foods, and sleep disruption.",
  },
  {
    id: "head_003",
    region: "head",
    category: "red_flags",
    text: "Sudden severe 'thunderclap' headache, headache with fever and stiff neck, headache after head injury, or progressive headache worsening over weeks are red-flag symptoms requiring immediate medical evaluation. These may indicate subarachnoid hemorrhage, meningitis, or increased intracranial pressure.",
  },
  {
    id: "head_004",
    region: "head",
    category: "treatment",
    text: "For tension headaches: rest in a quiet dark room, apply cold or warm compress to the forehead, stay hydrated, take ibuprofen or paracetamol. For migraines: triptans (prescription), avoid triggers, maintain sleep schedule. Chronic headache (>15 days/month) requires neurological evaluation.",
  },

  // ── NECK ────────────────────────────────────────────────────────────────────
  {
    id: "neck_001",
    region: "neck",
    category: "symptoms",
    text: "Cervical muscle strain (wry neck or torticollis) causes pain and stiffness that limits range of motion. Often caused by sleeping in an awkward position, prolonged screen time, or sudden movement. Pain may radiate to the shoulder or cause headache at the base of the skull.",
  },
  {
    id: "neck_002",
    region: "neck",
    category: "symptoms",
    text: "Cervical radiculopathy occurs when a cervical nerve root is compressed or irritated, causing pain, numbness, tingling, or weakness radiating down the arm into the fingers. Common levels affected: C5-C6 (thumb and index finger), C6-C7 (middle finger), C7-T1 (ring and little finger).",
  },
  {
    id: "neck_003",
    region: "neck",
    category: "treatment",
    text: "Neck strain treatment: gentle range-of-motion exercises, heat or ice application (20 mins on, 20 mins off), NSAIDs for pain, and ergonomic adjustments to workstation. Physiotherapy including manual therapy and strengthening exercises is effective for chronic neck pain. Avoid prolonged immobilisation.",
  },
  {
    id: "neck_004",
    region: "neck",
    category: "red_flags",
    text: "Red flags in neck pain: pain following trauma (whiplash), progressive neurological deficit, bilateral arm weakness, difficulty swallowing, unexplained weight loss, fever with neck stiffness, or pain unrelieved by rest. These warrant urgent imaging and specialist referral.",
  },

  // ── TRAPEZIUS ───────────────────────────────────────────────────────────────
  {
    id: "trap_001",
    region: "trapezius",
    category: "symptoms",
    text: "Trapezius muscle strain is extremely common and presents as tightness, aching, or knots (myofascial trigger points) between the shoulder blades and at the base of the neck. Often caused by prolonged poor posture, repetitive overhead work, or psychological stress causing chronic muscle guarding.",
  },
  {
    id: "trap_002",
    region: "trapezius",
    category: "symptoms",
    text: "Myofascial trigger points in the trapezius can refer pain to the neck, temple, behind the eye, and jaw — mimicking tension headache. The upper trapezius is the most commonly affected area. Palpation reveals taut bands and hyperirritable nodules that reproduce the patient's pain.",
  },
  {
    id: "trap_003",
    region: "trapezius",
    category: "treatment",
    text: "Trapezius trigger point treatment: deep tissue massage, dry needling or acupuncture, stretching (ear-to-shoulder stretch, chin tucks), strengthening of lower and middle trapezius, postural correction. Heat application before stretching improves tissue extensibility. Ergonomic desk setup is critical for prevention.",
  },

  // ── PECTORALIS MAJOR ────────────────────────────────────────────────────────
  {
    id: "pec_001",
    region: "pectoralis_major",
    category: "symptoms",
    text: "Pectoralis major strain typically occurs during bench press, push-ups, or throwing activities. Presents as sharp pain in the chest or anterior shoulder, bruising, swelling, and weakness in pushing or arm adduction. A 'pop' at the time of injury suggests possible tear. Pain is reproduced by resisted adduction.",
  },
  {
    id: "pec_002",
    region: "pectoralis_major",
    category: "symptoms",
    text: "Pectoralis major trigger points can mimic cardiac pain — presenting as anterior chest pain, breast tenderness, and hypersensitivity. The pain pattern may extend into the arm. It is important to rule out cardiac causes first. Trigger points are typically found in the sternal portion of the muscle.",
  },
  {
    id: "pec_003",
    region: "pectoralis_major",
    category: "treatment",
    text: "Grade I-II pectoralis strains: RICE protocol (Rest, Ice, Compression, Elevation) for 48-72 hours, then progressive range-of-motion and strengthening. Return to sport typically 6-10 weeks. Grade III tears (complete rupture) may require surgical repair, especially in athletes.",
  },

  // ── DELTOID ─────────────────────────────────────────────────────────────────
  {
    id: "delt_001",
    region: "deltoid",
    category: "symptoms",
    text: "Deltoid strain presents as localised pain and tenderness over the anterior, middle, or posterior deltoid. Pain is reproduced by resisted shoulder abduction. Common in throwing athletes, swimmers, and weight lifters. Distinguish from rotator cuff pathology by checking internal and external rotation strength.",
  },
  {
    id: "delt_002",
    region: "deltoid",
    category: "symptoms",
    text: "Shoulder impingement syndrome involves compression of supraspinatus and deltoid bursa under the acromion. Presents as painful arc between 60-120° of shoulder abduction, pain at night, and weakness. Neer's and Hawkins-Kennedy tests are positive. Often related to repetitive overhead activities.",
  },
  {
    id: "delt_003",
    region: "deltoid",
    category: "treatment",
    text: "Deltoid strain and shoulder impingement management: activity modification, NSAIDs, corticosteroid injection for refractory cases, physiotherapy focusing on rotator cuff strengthening, scapular stabilisation, and posture correction. Surgery (subacromial decompression) reserved for cases failing 3-6 months of conservative care.",
  },

  // ── BICEPS ──────────────────────────────────────────────────────────────────
  {
    id: "bic_001",
    region: "bicep",
    category: "symptoms",
    text: "Biceps brachii strain or tendinopathy presents as pain in the anterior shoulder or elbow. Proximal biceps tendinopathy causes anterior shoulder pain worsened by overhead activities and lifting. Speed's and Yergason's tests are positive. Distal biceps tendon rupture causes acute pain, weakness in supination, and 'Popeye' deformity.",
  },
  {
    id: "bic_002",
    region: "bicep",
    category: "symptoms",
    text: "Biceps muscle belly strain typically follows eccentric loading (lowering heavy weights). Presents as sudden pain, bruising, swelling, and weakness in elbow flexion. Grade I: mild, Grade II: moderate with partial tear, Grade III: complete rupture with significant functional deficit.",
  },
  {
    id: "bic_003",
    region: "bicep",
    category: "treatment",
    text: "Biceps strain treatment: RICE for 48-72 hours, progressive loading program starting with isometric exercises then concentric/eccentric strengthening. Proximal biceps tendinopathy responds to physiotherapy and corticosteroid injection. Distal tendon ruptures in young active patients benefit from surgical repair within 2-3 weeks of injury.",
  },

  // ── TRICEPS ─────────────────────────────────────────────────────────────────
  {
    id: "tric_001",
    region: "tricep",
    category: "symptoms",
    text: "Triceps strain commonly occurs during bench press (negative phase), overhead throwing, or gymnastics. Pain is felt at the posterior arm or olecranon. Triceps tendon rupture (rare) causes inability to extend the elbow against gravity, palpable defect above the olecranon, and acute severe pain.",
  },
  {
    id: "tric_002",
    region: "tricep",
    category: "treatment",
    text: "Triceps strain management: rest from aggravating activities, ice for acute phase, progressive strengthening program. Triceps tendinopathy responds to eccentric exercises (slow lowering phase). Steroid injections used cautiously near the tendon. Complete tendon ruptures require surgical repair.",
  },

  // ── RECTUS ABDOMINIS ────────────────────────────────────────────────────────
  {
    id: "abs_001",
    region: "rectus_abdominis",
    category: "symptoms",
    text: "Rectus abdominis strain presents as localised tenderness, pain on sit-ups or coughing, and muscle spasm. Common in sports requiring explosive trunk flexion. Distinguish from abdominal hernia (reducible bulge) and referred pain from thoracic or lumbar spine. Bruising may appear 24-48 hours post-injury.",
  },
  {
    id: "abs_002",
    region: "rectus_abdominis",
    category: "symptoms",
    text: "Diastasis recti is separation of the rectus abdominis muscles along the linea alba, common postpartum. Presents as a visible ridge or gap down the midline of the abdomen when contracting. Associated with lower back pain, pelvic floor dysfunction, and poor core stability.",
  },
  {
    id: "abs_003",
    region: "rectus_abdominis",
    category: "treatment",
    text: "Abdominal strain treatment: activity modification, ice/heat, progressive core strengthening avoiding high-load flexion exercises initially. Diastasis recti responds to specific rehabilitation focusing on transversus abdominis activation and avoiding exercises that worsen the separation (crunches, sit-ups, heavy lifting).",
  },

  // ── OBLIQUES ────────────────────────────────────────────────────────────────
  {
    id: "obl_001",
    region: "obliques",
    category: "symptoms",
    text: "Oblique muscle strain ('side strain') is common in cricket bowlers, baseball pitchers, tennis players, and golfers. Presents as sharp pain in the lateral chest/abdomen, worsened by trunk rotation, deep breathing, or coughing. MRI confirms the diagnosis and guides return-to-sport timeline.",
  },
  {
    id: "obl_002",
    region: "obliques",
    category: "treatment",
    text: "Oblique strain management: rest from rotational activities, progressive rehabilitation starting with isometric core exercises, then rotation under control. Return to sport typically 4-8 weeks depending on grade. Breathing exercises important to maintain intercostal mobility during recovery.",
  },

  // ── LATISSIMUS DORSI ────────────────────────────────────────────────────────
  {
    id: "lat_001",
    region: "latissimus_dorsi",
    category: "symptoms",
    text: "Latissimus dorsi strain presents as pain in the mid-back, posterior shoulder, or axilla. Common in swimmers (lat pull-downs, freestyle), gymnasts, and rock climbers. Pain is reproduced by resisted shoulder extension and internal rotation. Trigger points in the lat can refer pain down the arm and into the hand.",
  },
  {
    id: "lat_002",
    region: "latissimus_dorsi",
    category: "treatment",
    text: "Lat strain treatment: relative rest, ice/heat, trigger point massage, progressive strengthening of shoulder and back muscles. Stretching: reach overhead and laterally to lengthen the latissimus. Return to pulling activities (pull-ups, rowing) gradually over 3-6 weeks.",
  },

  // ── GLUTEUS MAXIMUS ─────────────────────────────────────────────────────────
  {
    id: "glut_001",
    region: "gluteus_maximus",
    category: "symptoms",
    text: "Gluteus maximus strain presents as deep buttock pain worsened by sitting, stair climbing, and resisted hip extension. Piriformis syndrome (sciatic nerve irritation by piriformis muscle) can mimic gluteal pain but is associated with sciatica — burning, tingling down the posterior leg. FAIR test may be positive.",
  },
  {
    id: "glut_002",
    region: "gluteus_maximus",
    category: "symptoms",
    text: "Greater trochanteric pain syndrome (trochanteric bursitis) causes lateral hip pain, often worse lying on the affected side and with prolonged walking. More common in women. Pain is reproduced by palpation over the greater trochanter. Associated with hip abductor weakness.",
  },
  {
    id: "glut_003",
    region: "gluteus_maximus",
    category: "treatment",
    text: "Gluteal strain and piriformis syndrome treatment: activity modification, NSAIDs, physiotherapy including hip strengthening (glute bridges, clams, hip thrusts), piriformis stretching, and addressing biomechanical factors (hip drop in running). Corticosteroid injection for refractory bursitis.",
  },

  // ── QUADRICEPS ──────────────────────────────────────────────────────────────
  {
    id: "quad_001",
    region: "quadriceps",
    category: "symptoms",
    text: "Quadriceps strain most commonly involves the rectus femoris (two-joint muscle). Presents as anterior thigh pain and tenderness, worsened by resisted knee extension. A palpable defect indicates tear. Common mechanism: explosive kicking, sprinting, or sudden deceleration. Bruising appears 24-72 hours later.",
  },
  {
    id: "quad_002",
    region: "quadriceps",
    category: "symptoms",
    text: "Patellofemoral pain syndrome (runner's knee) presents as anterior knee pain worsened by stairs, squatting, and prolonged sitting (theatre sign). Caused by maltracking of the patella due to hip abductor weakness, tight IT band, or VMO insufficiency. No structural damage on imaging.",
  },
  {
    id: "quad_003",
    region: "quadriceps",
    category: "treatment",
    text: "Quadriceps strain: RICE protocol, progressive strengthening from isometric quad sets to full squats and lunges. Avoid passive stretching in acute phase (first 48 hours). Return to sprint training typically 3-6 weeks. Patellofemoral syndrome: VMO strengthening, hip abductor exercises, patellar taping, and footwear assessment.",
  },

  // ── HAMSTRINGS ──────────────────────────────────────────────────────────────
  {
    id: "ham_001",
    region: "hamstrings",
    category: "symptoms",
    text: "Hamstring strain is the most common muscle injury in sport. Mechanism: rapid eccentric load during sprinting (late swing phase). Presents as sudden posterior thigh pain, 'pop', and inability to continue activity. Proximal hamstring avulsion causes sitting pain and is more common in older athletes.",
  },
  {
    id: "ham_002",
    region: "hamstrings",
    category: "symptoms",
    text: "Hamstring tendinopathy (proximal) presents as deep buttock/sit bone pain worse with sitting on hard surfaces, running uphill, and forward trunk lean. Different from acute strain — insidious onset, no bruising, but significant functional limitation. Associated with reduced hip hinge capacity.",
  },
  {
    id: "ham_003",
    region: "hamstrings",
    category: "treatment",
    text: "Hamstring strain treatment: RICE acutely, then progressive loading program — isometric, then isotonic (Nordic hamstring curls are gold standard for strengthening and prevention), then sport-specific. Proximal tendinopathy: reduce compressive load (avoid forward lean), progressive tendon loading program over 12+ weeks. Re-injury rate is high without proper rehabilitation.",
  },

  // ── GASTROCNEMIUS / CALF ────────────────────────────────────────────────────
  {
    id: "calf_001",
    region: "gastrocnemius",
    category: "symptoms",
    text: "Gastrocnemius ('tennis leg') strain presents as sudden sharp pain in the calf, often described as being 'hit by a ball'. Common in middle-aged recreational athletes. Pain and swelling at the musculotendinous junction, worsened by plantarflexion and walking on tiptoe. Must exclude DVT as differential diagnosis.",
  },
  {
    id: "calf_002",
    region: "gastrocnemius",
    category: "symptoms",
    text: "Achilles tendinopathy causes posterior heel and lower calf pain, stiffness in the morning, and pain with running. Royal London Hospital test (pain reduced when loaded in dorsiflexion) helps distinguish insertional from mid-portion tendinopathy. Associated with sudden increase in training load.",
  },
  {
    id: "calf_003",
    region: "gastrocnemius",
    category: "red_flags",
    text: "Calf pain differential diagnoses requiring urgent attention: DVT (deep vein thrombosis) — unilateral calf swelling, warmth, redness, positive Homan's sign; compartment syndrome — severe pain out of proportion, tightness, paraesthesia; vascular claudication — pain with walking relieved by rest.",
  },
  {
    id: "calf_004",
    region: "gastrocnemius",
    category: "treatment",
    text: "Calf strain treatment: RICE, walking boot for grade II-III, progressive calf raises (bilateral to unilateral, flat to decline). Achilles tendinopathy: eccentric heel drops on a step (Alfredson protocol) — 3 sets of 15 twice daily for 12 weeks is the gold standard. Avoid stretching in insertional tendinopathy.",
  },

  // ── GENERAL MEDICAL GUIDANCE ────────────────────────────────────────────────
  {
    id: "gen_001",
    region: "general",
    category: "guidance",
    text: "RICE protocol for acute muscle and soft tissue injuries: Rest (stop activity, use crutches if weight-bearing is painful), Ice (apply for 15-20 minutes every 2 hours for first 48-72 hours), Compression (elastic bandage to reduce swelling), Elevation (raise injured limb above heart level).",
  },
  {
    id: "gen_002",
    region: "general",
    category: "guidance",
    text: "Muscle strain grading: Grade I (mild) — few fibres torn, minimal strength loss, return to activity 1-2 weeks. Grade II (moderate) — partial tear, significant pain and swelling, return 3-6 weeks. Grade III (severe) — complete rupture, major functional deficit, possible surgical repair, return 3-6+ months.",
  },
  {
    id: "gen_003",
    region: "general",
    category: "guidance",
    text: "When to seek immediate medical attention: severe pain rated 8+/10, inability to bear weight or move a joint, significant deformity or visible bone, numbness or tingling in the limb, loss of circulation (pale, cold, pulseless extremity), head injury with loss of consciousness, chest pain with shortness of breath.",
  },
  {
    id: "gen_004",
    region: "general",
    category: "guidance",
    text: "NSAIDs (ibuprofen, naproxen) are effective for musculoskeletal pain and inflammation. Take with food to reduce GI side effects. Avoid with kidney disease, peptic ulcer, or heart failure. Paracetamol (acetaminophen) is safer for long-term use but has no anti-inflammatory effect. Topical NSAIDs (diclofenac gel) effective for localised pain with fewer systemic side effects.",
  },
  {
    id: "gen_005",
    region: "general",
    category: "guidance",
    text: "Physiotherapy referral is recommended for: any grade II or III muscle injury, pain lasting more than 6 weeks, recurrent injuries in the same location, weakness or neurological symptoms, post-surgical rehabilitation, and when initial self-management has failed.",
  },
];

module.exports = medicalKnowledge;