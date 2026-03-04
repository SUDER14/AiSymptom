// backend/routes/appointments.js
const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");

const DB_FILE = path.join(__dirname, "../data/appointments.json");

// ── Ensure DB file exists ─────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify({ appointments: [], bookedSlots: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── GET /api/appointments/slots?hospitalId=&date= ─────────────────────────────
// Returns which slots are already booked for a hospital+date
router.get("/slots", (req, res) => {
  const { hospitalId, date } = req.query;
  if (!hospitalId || !date) {
    return res.status(400).json({ error: "hospitalId and date required" });
  }

  const db  = readDB();
  const key = `${hospitalId}_${date}`;
  const bookedSlots = db.bookedSlots[key] || [];

  // Generate all possible slots for the day
  const allSlots = generateDaySlots(date);

  // Mark which are booked
  const slots = allSlots.map(slot => ({
    ...slot,
    booked: bookedSlots.includes(slot.id),
  }));

  return res.json({ slots, date, hospitalId });
});

// ── POST /api/appointments ────────────────────────────────────────────────────
// Book an appointment
router.post("/", (req, res) => {
  const { hospitalId, hospitalName, address, date, slotId, slotTime,
          patientName, phone, reason, muscleName } = req.body;

  if (!hospitalId || !date || !slotId || !patientName || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db  = readDB();
  const key = `${hospitalId}_${date}`;

  // Check slot not already taken
  if (db.bookedSlots[key]?.includes(slotId)) {
    return res.status(409).json({ error: "Slot already booked. Please choose another time." });
  }

  // Mark slot as booked
  if (!db.bookedSlots[key]) db.bookedSlots[key] = [];
  db.bookedSlots[key].push(slotId);

  // Create appointment record
  const appointment = {
    id:          `APT-${Date.now().toString(36).toUpperCase()}`,
    hospitalId,
    hospitalName,
    address:     address || "",
    date,
    slotId,
    slotTime,
    patientName,
    phone,
    reason:      reason || "",
    muscleName:  muscleName || "",
    status:      "confirmed",
    bookedAt:    new Date().toISOString(),
  };

  db.appointments.push(appointment);
  writeDB(db);

  return res.status(201).json({ appointment });
});

// ── GET /api/appointments?phone= ──────────────────────────────────────────────
// Fetch all appointments for a phone number
router.get("/", (req, res) => {
  const { phone } = req.query;
  const db = readDB();

  const list = phone
    ? db.appointments.filter(a => a.phone === phone)
    : db.appointments;

  return res.json({ appointments: list.reverse() }); // newest first
});

// ── DELETE /api/appointments/:id ──────────────────────────────────────────────
// Cancel appointment
router.delete("/:id", (req, res) => {
  const db = readDB();
  const idx = db.appointments.findIndex(a => a.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Appointment not found" });

  const appt = db.appointments[idx];

  // Free the slot
  const key = `${appt.hospitalId}_${appt.date}`;
  if (db.bookedSlots[key]) {
    db.bookedSlots[key] = db.bookedSlots[key].filter(s => s !== appt.slotId);
  }

  // Mark as cancelled instead of deleting
  db.appointments[idx].status = "cancelled";
  db.appointments[idx].cancelledAt = new Date().toISOString();
  writeDB(db);

  return res.json({ cancelled: true });
});

// ── Helper: generate time slots for a given date ──────────────────────────────
function generateDaySlots(date) {
  const d     = new Date(date);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
  const slots = [];

  const times = isWeekend
    ? [ [9,0],[9,30],[10,0],[10,30],[11,0],[11,30] ]
    : [ [9,0],[9,30],[10,0],[10,30],[11,0],[11,30],
        [14,0],[14,30],[15,0],[15,30],[16,0],[16,30],[17,0] ];

  times.forEach(([h, m]) => {
    const id      = `${date}-${h}-${m}`;
    const hour12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const period  = h < 12 ? "AM" : "PM";
    const display = `${hour12}:${String(m).padStart(2,"0")} ${period}`;
    slots.push({ id, time: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`, display, period, booked: false });
  });

  return slots;
}

module.exports = router;