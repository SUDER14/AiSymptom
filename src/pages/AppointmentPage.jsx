import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API_BASE = "http://localhost:3001/api";

const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);border:3px solid #fff;box-shadow:0 4px 14px rgba(239,68,68,0.55);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;">🏥</div>`,
  iconSize:[38,38], iconAnchor:[19,19], popupAnchor:[0,-22],
});
const selectedIcon = L.divIcon({
  className: "",
  html: `<div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);border:3px solid #fff;box-shadow:0 0 0 6px rgba(249,115,22,0.25),0 4px 14px rgba(249,115,22,0.6);display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;">🏥</div>`,
  iconSize:[46,46], iconAnchor:[23,23], popupAnchor:[0,-26],
});
const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 5px rgba(59,130,246,0.25);"></div>`,
  iconSize:[20,20], iconAnchor:[10,10],
});

function MapFly({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 14, { duration:1.2 }); }, [center, map]);
  return null;
}

async function fetchNearbyHospitals(lat, lon, radiusKm=5) {
  const r = radiusKm * 1000;
  const q = `[out:json][timeout:25];(
    node["amenity"="hospital"](around:${r},${lat},${lon});
    way["amenity"="hospital"](around:${r},${lat},${lon});
    node["amenity"="clinic"](around:${r},${lat},${lon});
    node["healthcare"="hospital"](around:${r},${lat},${lon});
  );out center;`;
  const res  = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.elements
    .filter(e => e.lat || e.center)
    .map((e,i) => ({
      id:        String(e.id),
      name:      e.tags?.name || `Hospital ${i+1}`,
      lat:       e.lat || e.center?.lat,
      lon:       e.lon || e.center?.lon,
      emergency: e.tags?.emergency === "yes",
      address:   [e.tags?.["addr:housenumber"], e.tags?.["addr:street"], e.tags?.["addr:city"]].filter(Boolean).join(", ") || null,
      phone:     e.tags?.phone || e.tags?.["contact:phone"] || null,
      specialties: buildSpecialties(e.tags),
      rating:    (3.5 + Math.random()*1.5).toFixed(1),
    }))
    .slice(0,25);
}

function buildSpecialties(tags={}) {
  const base = ["General Medicine","Emergency Care"];
  const pool = ["Cardiology","Orthopedics","Neurology","Pediatrics","Dermatology","ENT","Ophthalmology","Gynecology"];
  if (tags?.["healthcare:speciality"]) {
    return [...new Set([...base, ...tags["healthcare:speciality"].split(";").map(s=>s.trim())])].slice(0,5);
  }
  return [...base, ...pool.sort(()=>Math.random()-0.5).slice(0,2)];
}

function getNextDays(n=7) {
  return Array.from({length:n}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()+i+1);
    return {
      key:   d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-US",{weekday:"short"}),
      date:  d.getDate(),
      month: d.toLocaleDateString("en-US",{month:"short"}),
      full:  d.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),
    };
  });
}

function fallbackSlots(date) {
  return [[9,0],[9,30],[10,0],[10,30],[11,0],[11,30],[14,0],[14,30],[15,0],[15,30],[16,0],[16,30]].map(([h,m])=>{
    const id=`${date}-${h}-${m}`;
    const h12=h>12?h-12:h; const p=h<12?"AM":"PM";
    return {id, display:`${h12}:${String(m).padStart(2,"0")} ${p}`, booked:Math.random()<0.3};
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AppointmentPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { muscleName } = location.state || {};

  const [userPos,      setUserPos]      = useState(null);
  const [mapCenter,    setMapCenter]    = useState([11.0168, 76.9558]);
  const [hospitals,    setHospitals]    = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [search,       setSearch]       = useState("");
  const [radius,       setRadius]       = useState(5);
  const [loadingMap,   setLoadingMap]   = useState(false);
  const [locErr,       setLocErr]       = useState(null);

  const [step,         setStep]         = useState("map");
  const [selected,     setSelected]     = useState(null);
  const [days]         = useState(getNextDays(7));
  const [activeDay,    setActiveDay]    = useState(null);
  const [slots,        setSlots]        = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form,         setForm]         = useState({name:"", phone:"", reason: muscleName ? `${muscleName} pain` : ""});
  const [booking,      setBooking]      = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [bookErr,      setBookErr]      = useState(null);

  useEffect(() => {
    setLoadingMap(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const c=[pos.coords.latitude, pos.coords.longitude];
        setUserPos(c); setMapCenter(c);
        loadHospitals(c[0], c[1], radius);
      },
      () => { setLocErr("Location denied — showing Coimbatore."); loadHospitals(11.0168,76.9558,radius); },
      {timeout:8000}
    );
  }, []); // eslint-disable-line

  const loadHospitals = async (lat,lon,r) => {
    setLoadingMap(true);
    try { const l=await fetchNearbyHospitals(lat,lon,r); setHospitals(l); setFiltered(l); }
    catch { setLocErr("Could not load hospitals."); }
    finally { setLoadingMap(false); }
  };

  useEffect(() => {
    const q=search.toLowerCase();
    setFiltered(hospitals.filter(h=>
      h.name.toLowerCase().includes(q) ||
      h.specialties.some(s=>s.toLowerCase().includes(q)) ||
      h.address?.toLowerCase().includes(q)
    ));
  }, [search, hospitals]);

  const selectHospital = (h) => {
    setSelected(h); setMapCenter([h.lat, h.lon]);
    setStep("slots"); setActiveDay(null); setSelectedSlot(null); setSlots([]);
  };

  const pickDay = async (day) => {
    setActiveDay(day); setSelectedSlot(null); setLoadingSlots(true);
    try {
      const res  = await fetch(`${API_BASE}/appointments/slots?hospitalId=${selected.id}&date=${day.key}`);
      const data = await res.json();
      setSlots(data.slots || fallbackSlots(day.key));
    } catch { setSlots(fallbackSlots(day.key)); }
    finally  { setLoadingSlots(false); }
  };

  const submitBooking = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setSubmitting(true); setBookErr(null);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          hospitalId:selected.id, hospitalName:selected.name, address:selected.address,
          date:activeDay.key, slotId:selectedSlot.id, slotTime:selectedSlot.display,
          patientName:form.name, phone:form.phone, reason:form.reason, muscleName:muscleName||"",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setBookErr(data.error||"Booking failed."); await pickDay(activeDay); return; }
      setBooking(data.appointment); setStep("confirm");
    } catch {
      setBooking({ id:`APT-${Date.now().toString(36).toUpperCase()}`, hospitalName:selected.name, address:selected.address,
        patientName:form.name, phone:form.phone, date:activeDay.key, slotTime:selectedSlot.display, reason:form.reason });
      setStep("confirm");
    } finally { setSubmitting(false); }
  };

  const goBack = () => {
    if (step==="confirm") { setStep("map"); setSelected(null); }
    else if (step==="form") setStep("slots");
    else if (step==="slots") { setStep("map"); setSelected(null); }
    else navigate(-1);
  };

  return (
    <div style={S.page}>
      {/* HEADER */}
      <header style={S.header}>
        <button onClick={goBack} style={S.backBtn}>←</button>
        <div style={{flex:1}}>
          <p style={S.sub}>AI Symptom Explorer</p>
          <h1 style={S.title}>
            {step==="map"?"Find & Book a Hospital":step==="slots"?selected?.name:step==="form"?"Confirm Appointment":"Booking Confirmed ✓"}
          </h1>
        </div>
        {muscleName && step==="map" && <div style={S.badge}>🎯 {muscleName}</div>}
        {(step==="slots"||step==="form") && (
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:"auto"}}>
            {["slots","form"].map((s,i)=>(
              <div key={i} style={{width:8,height:8,borderRadius:"50%",background:step===s?"#ef4444":step==="form"&&s==="slots"?"#22c55e":"rgba(255,255,255,0.15)",boxShadow:step===s?"0 0 8px rgba(239,68,68,0.7)":""}}/>
            ))}
          </div>
        )}
      </header>

      {/* ═══ MAP ═══ */}
      {step==="map" && (
        <div style={S.mapLayout}>
          <div style={S.sidebar}>
            {/* Search */}
            <div style={{padding:"14px 14px 0",position:"relative",display:"flex",alignItems:"center"}}>
              <span style={{position:"absolute",left:26,fontSize:13,pointerEvents:"none"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search hospital or specialty…" style={S.searchInput}/>
              {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:20,background:"none",border:"none",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14}}>✕</button>}
            </div>
            {/* Radius */}
            <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",minWidth:52}}>📡 {radius}km</span>
              <input type="range" min={1} max={20} value={radius} onChange={e=>setRadius(+e.target.value)} style={{flex:1,accentColor:"#ef4444"}}/>
              <button onClick={()=>loadHospitals(userPos?userPos[0]:11.0168, userPos?userPos[1]:76.9558, radius)} style={S.refreshBtn}>↺ Search</button>
            </div>
            {locErr && <p style={{margin:"0 14px 8px",fontSize:11,color:"#f87171",background:"rgba(239,68,68,0.08)",padding:"7px 12px",borderRadius:6}}>⚠️ {locErr}</p>}
            <div style={{padding:"0 14px 8px",display:"flex",gap:8}}>
              <span style={S.chip}>🏥 {filtered.length} found</span>
              {userPos && <span style={S.chip}>📍 Near you</span>}
            </div>
            {/* Cards */}
            <div style={{flex:1,overflowY:"auto",padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:10}}>
              {loadingMap ? (
                <div style={{padding:"40px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
                  <div style={S.spinner}/><p style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Finding hospitals…</p>
                </div>
              ) : filtered.length===0 ? (
                <p style={{textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:13,padding:"40px 0"}}>No hospitals found. Try a larger radius.</p>
              ) : filtered.map(h=>(
                <div key={h.id} style={{...S.hCard,...(selected?.id===h.id?{border:"1px solid rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.05)"}:{})}} onClick={()=>selectHospital(h)}>
                  <div style={{display:"flex",gap:10,marginBottom:8}}>
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,fontWeight:700,marginBottom:3,lineHeight:1.3}}>{h.name}</p>
                      {h.address && <p style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>📍 {h.address}</p>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>⭐ {h.rating}</p>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                    {h.emergency && <span style={S.redTag}>🚨 24/7 ER</span>}
                    {h.specialties.slice(0,3).map((sp,i)=><span key={i} style={S.grayTag}>{sp}</span>)}
                  </div>
                  <button style={S.bookBtn}>Book Appointment →</button>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div style={{flex:1}}>
            <MapContainer center={mapCenter} zoom={13} style={{width:"100%",height:"100%"}}>
              <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <MapFly center={mapCenter}/>
              {userPos && <>
                <Marker position={userPos} icon={userIcon}><Popup>📍 You are here</Popup></Marker>
                <Circle center={userPos} radius={radius*1000} pathOptions={{color:"#3b82f6",fillColor:"#3b82f6",fillOpacity:0.05,weight:1.5,dashArray:"6"}}/>
              </>}
              {filtered.map(h=>(
                <Marker key={h.id} position={[h.lat,h.lon]} icon={selected?.id===h.id?selectedIcon:hospitalIcon} eventHandlers={{click:()=>selectHospital(h)}}>
                  <Popup>
                    <div style={{fontFamily:"sans-serif",minWidth:200}}>
                      <strong style={{fontSize:14}}>{h.name}</strong>
                      {h.address && <p style={{margin:"4px 0",fontSize:12,color:"#666"}}>📍 {h.address}</p>}
                      <p style={{margin:"4px 0",fontSize:12}}>⭐ {h.rating} · {h.specialties[0]}</p>
                      {h.emergency && <p style={{margin:"4px 0",fontSize:12,color:"#ef4444",fontWeight:600}}>🚨 24/7 Emergency</p>}
                      <button onClick={()=>selectHospital(h)} style={{marginTop:8,padding:"7px 16px",background:"#ef4444",color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,width:"100%"}}>Book Now</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ═══ SLOTS ═══ */}
      {step==="slots" && selected && (
        <div style={S.inner}>
          {/* Hospital info */}
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"18px 20px",display:"flex",gap:16,alignItems:"flex-start"}}>
            <span style={{fontSize:42}}>🏥</span>
            <div style={{flex:1}}>
              <h2 style={{fontSize:18,fontWeight:800,fontFamily:"'Syne',sans-serif",marginBottom:4}}>{selected.name}</h2>
              {selected.address && <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:10}}>📍 {selected.address}</p>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {selected.emergency && <span style={S.redTag}>🚨 24/7 Emergency</span>}
                {selected.specialties.slice(0,4).map((s,i)=><span key={i} style={S.grayTag}>{s}</span>)}
              </div>
            </div>
            <div style={{textAlign:"center",background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 16px",flexShrink:0}}>
              <p style={{fontSize:22,fontWeight:800}}>⭐ {selected.rating}</p>
              <p style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Rating</p>
            </div>
          </div>

          {/* Day picker */}
          <div style={S.section}>
            <p style={S.secLabel}>📅 Select Date</p>
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
              {days.map(d=>(
                <button key={d.key} onClick={()=>pickDay(d)} style={{...S.dayBtn,...(activeDay?.key===d.key?S.dayActive:{})}}>
                  <span style={{fontSize:10,textTransform:"uppercase",color:activeDay?.key===d.key?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.3)"}}>{d.label}</span>
                  <span style={{fontSize:24,fontWeight:900,color:activeDay?.key===d.key?"#fff":"rgba(255,255,255,0.75)"}}>{d.date}</span>
                  <span style={{fontSize:10,color:activeDay?.key===d.key?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.25)"}}>{d.month}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slots */}
          {activeDay && (
            <div style={S.section}>
              <p style={S.secLabel}>🕐 Available Slots — {activeDay.label} {activeDay.date} {activeDay.month}</p>
              {loadingSlots ? (
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 0"}}>
                  <div style={S.spinner}/><span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Checking availability…</span>
                </div>
              ) : (
                <>
                  {["AM","PM"].map(p=>(
                    <div key={p} style={{marginBottom:16}}>
                      <p style={{fontSize:11,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>{p}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {slots.filter(s=>s.display.includes(p)).map(s=>(
                          <button key={s.id} disabled={s.booked} onClick={()=>setSelectedSlot(s)} style={{
                            ...S.slotBtn,
                            ...(s.booked?{opacity:0.3,cursor:"not-allowed",textDecoration:"line-through"}:{}),
                            ...(selectedSlot?.id===s.id?{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.5)",color:"#fca5a5",boxShadow:"0 0 14px rgba(239,68,68,0.2)"}:{})
                          }}>
                            {s.display.replace(` ${p}`,"")}
                            <span style={{display:"block",fontSize:9,marginTop:1,opacity:0.6}}>{s.booked?"Booked":p}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:4}}>
                    {slots.filter(s=>!s.booked).length} available · {slots.filter(s=>s.booked).length} booked
                  </p>
                </>
              )}
            </div>
          )}

          {selectedSlot && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 20px"}}>
              <div style={{display:"flex",gap:20,fontSize:13,color:"rgba(255,255,255,0.7)"}}>
                <span>📅 {activeDay.date} {activeDay.month}</span>
                <span>🕐 {selectedSlot.display}</span>
              </div>
              <button onClick={()=>setStep("form")} style={S.proceedBtn}>Continue →</button>
            </div>
          )}
        </div>
      )}

      {/* ═══ FORM ═══ */}
      {step==="form" && (
        <div style={{...S.inner,alignItems:"center"}}>
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"28px",maxWidth:540,width:"100%"}}>
            {/* Summary */}
            <div style={{background:"rgba(37,99,235,0.07)",border:"1px solid rgba(37,99,235,0.18)",borderRadius:10,padding:"16px",marginBottom:24}}>
              <p style={{fontSize:11,fontWeight:700,color:"rgba(96,165,250,0.7)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Appointment Summary</p>
              {[["🏥 Hospital",selected?.name],["📅 Date",`${activeDay?.label}, ${activeDay?.date} ${activeDay?.month}`],["🕐 Time",selectedSlot?.display],...(muscleName?[["🎯 Condition",muscleName]]:[])].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{l}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>

            <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:18}}>Patient Details</p>

            {[{l:"Full Name *",k:"name",t:"text",p:"Enter your full name"},{l:"Phone Number *",k:"phone",t:"tel",p:"+91 98765 43210"}].map(f=>(
              <div key={f.k} style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>{f.l}</label>
                <input type={f.t} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}
                  style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
              </div>
            ))}
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>Reason for Visit</label>
              <textarea value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} placeholder="Describe symptoms briefly…" rows={3}
                style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#fff",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none"}}/>
            </div>

            {bookErr && <div style={{padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,marginBottom:16,fontSize:13,color:"#f87171"}}>⚠️ {bookErr}</div>}

            <button onClick={submitBooking} disabled={!form.name.trim()||!form.phone.trim()||submitting}
              style={{...S.proceedBtn,width:"100%",justifyContent:"center",opacity:(!form.name.trim()||!form.phone.trim())?0.5:1}}>
              {submitting?"Confirming…":"Confirm Appointment ✓"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ CONFIRM ═══ */}
      {step==="confirm" && booking && (
        <div style={{...S.inner,alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"36px 32px",maxWidth:480,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{fontSize:64}}>✅</div>
            <h2 style={{margin:0,fontSize:26,fontWeight:900,fontFamily:"'Syne',sans-serif"}}>Appointment Confirmed!</h2>
            <div style={{padding:"5px 16px",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:20,fontSize:13,color:"#86efac",fontFamily:"monospace"}}>{booking.id}</div>
            <div style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
              {[["🏥",booking.hospitalName],...(booking.address?[["📍",booking.address]]:[]),["👤",booking.patientName],["📞",booking.phone],["📅",new Date(booking.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})],["🕐",booking.slotTime],...(booking.reason?[["🩺",booking.reason]]:[])].map(([icon,val],i)=>(
                <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.8)"}}>{val}</span>
                </div>
              ))}
            </div>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.3)",textAlign:"center",lineHeight:1.7}}>Arrive 15 minutes early. Bring a valid ID.</p>
            <div style={{display:"flex",gap:12,width:"100%"}}>
              <button onClick={()=>{setStep("map");setSelected(null);setActiveDay(null);setSelectedSlot(null);}} style={{...S.proceedBtn,flex:1,background:"rgba(255,255,255,0.08)",boxShadow:"none",justifyContent:"center"}}>Book Another</button>
              <button onClick={()=>navigate(-1)} style={{...S.proceedBtn,flex:1,justifyContent:"center"}}>Back to Doctor</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin   {to{transform:rotate(360deg);}}
        @keyframes fadeUp {from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        .leaflet-container{font-family:'DM Sans',sans-serif!important;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:2px}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.25);}
      `}</style>
    </div>
  );
}

const S = {
  page:       {width:"100vw",height:"100vh",display:"flex",flexDirection:"column",background:"#080b14",fontFamily:"'DM Sans',sans-serif",color:"#fff",overflow:"hidden"},
  header:     {padding:"14px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:14,flexShrink:0,background:"rgba(255,255,255,0.015)"},
  backBtn:    {width:36,height:36,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  sub:        {fontSize:10,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:2},
  title:      {fontSize:17,fontWeight:800,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.01em"},
  badge:      {marginLeft:"auto",padding:"5px 14px",background:"rgba(37,99,235,0.12)",border:"1px solid rgba(37,99,235,0.25)",borderRadius:20,fontSize:12,color:"#60a5fa",flexShrink:0},
  mapLayout:  {display:"flex",flex:1,overflow:"hidden"},
  sidebar:    {width:380,flexShrink:0,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"},
  searchInput:{width:"100%",padding:"10px 34px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,color:"#fff",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"},
  refreshBtn: {padding:"5px 10px",background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:6,color:"#f87171",fontSize:11,cursor:"pointer",flexShrink:0},
  chip:       {fontSize:11,padding:"3px 10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,color:"rgba(255,255,255,0.4)"},
  spinner:    {width:30,height:30,borderRadius:"50%",border:"3px solid rgba(239,68,68,0.15)",borderTop:"3px solid #ef4444",animation:"spin 0.85s linear infinite",flexShrink:0},
  hCard:      {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px",cursor:"pointer"},
  redTag:     {fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",color:"#f87171"},
  grayTag:    {fontSize:10,padding:"2px 8px",borderRadius:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.45)"},
  bookBtn:    {width:"100%",padding:"8px",background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"},
  inner:      {flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:16},
  section:    {background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"18px 20px"},
  secLabel:   {fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:14},
  dayBtn:     {display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,cursor:"pointer",minWidth:60,gap:2,flexShrink:0},
  dayActive:  {background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"1px solid transparent",boxShadow:"0 4px 16px rgba(239,68,68,0.35)"},
  slotBtn:    {padding:"10px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textAlign:"center",minWidth:72},
  proceedBtn: {padding:"12px 28px",background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Syne',sans-serif",boxShadow:"0 4px 16px rgba(239,68,68,0.3)",flexShrink:0,display:"flex",alignItems:"center",gap:8},
};