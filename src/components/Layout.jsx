import { useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

// Layout component with sidebar, topbar, and global styles
export default function Layout({ children, pageTitle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* global style tokens from design reference */}
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{
          --bg:#05080f;
          --surface:#0c1220;
          --border:rgba(255,255,255,0.07);
          --accent:#00d4ff;
          --accent2:#7c3aed;
          --green:#00e5a0;
          --red:#ff4560;
          --text:#e8edf5;
          --muted:rgba(232,237,245,0.4);
        }
        body{background:var(--bg);color:var(--text);font-family:'Instrument Sans',sans-serif;min-height:100vh;overflow-x:hidden;}
        body::before{content:"";position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:0.4;}
        .glow-1{position:fixed;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(0,212,255,0.06) 0%,transparent 70%);top:-200px;left:-100px;pointer-events:none;}
        .glow-2{position:fixed;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%);bottom:-100px;right:-100px;pointer-events:none;}
        .wrapper{position:relative;z-index:1;display:grid;grid-template-columns:240px 1fr;min-height:100vh;}
        .sidebar{background:rgba(12,18,32,0.8);border-right:1px solid var(--border);padding:28px 0;display:flex;flex-direction:column;backdrop-filter:blur(20px);}
        .logo{padding:0 24px 32px;display:flex;align-items:center;gap:12px;}
        .logo-icon{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .logo-text{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:17px;letter-spacing:-0.02em;}
        .logo-text span{color:var(--accent);}
        .nav-section{padding:0 16px 8px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;}
        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 24px;font-size:13.5px;color:var(--muted);cursor:pointer;border-radius:0;transition:all 0.15s;position:relative;margin-bottom:2px;text-decoration:none;}
        .nav-item:hover{color:var(--text);background:rgba(255,255,255,0.04);}
        .nav-item.active{color:var(--text);background:rgba(0,212,255,0.08);}
        .nav-item.active::before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--accent);border-radius:0 2px 2px 0;}
        .nav-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:16px;}
        .nav-badge{margin-left:auto;background:var(--accent2);color:#fff;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600;}
        .sidebar-bottom{margin-top:auto;padding:20px 16px;border-top:1px solid var(--border);}
        .user-card{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;cursor:pointer;}
        .avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
        .user-info{flex:1;min-width:0;}
        .user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .user-role{font-size:11px;color:var(--muted);}
        .main{padding:32px;overflow-y:auto;display:flex;flex-direction:column;gap:28px;}
        .topbar{display:flex;align-items:center;justify-content:space-between;}
        .page-title{font-family:'Cabinet Grotesk',sans-serif;font-size:26px;font-weight:900;letter-spacing:-0.03em;}
        .page-title span{background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .topbar-right{display:flex;align-items:center;gap:12px;}
        .search-bar{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:9px 14px;width:220px;}
        .search-bar input{background:none;border:none;outline:none;color:var(--text);font-size:13px;font-family:'Instrument Sans',sans-serif;width:100%;}
        .search-bar input::placeholder{color:var(--muted);}
        .icon-btn{width:38px;height:38px;border-radius:10px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;position:relative;}
        .notif-dot{position:absolute;top:8px;right:8px;width:7px;height:7px;border-radius:50%;background:var(--red);border:2px solid var(--bg);}
        /* stat grid, content grid, etc will be used in pages */
        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
        .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;position:relative;overflow:hidden;transition:border-color 0.2s;}
        .stat-card:hover{border-color:rgba(255,255,255,0.12);}
        .stat-card::after{content:"";position:absolute;top:0;right:0;width:60px;height:60px;border-radius:0 16px 0 60px;opacity:0.08;}
        .stat-card.c1::after{background:var(--accent);}        
        .stat-card.c2::after{background:var(--green);}        
        .stat-card.c3::after{background:var(--accent2);}        
        .stat-card.c4::after{background:var(--red);}        
        .stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;}
        .stat-value{font-family:'Cabinet Grotesk',sans-serif;font-size:28px;font-weight:900;letter-spacing:-0.03em;margin-bottom:6px;}
        .stat-value.c1{color:var(--accent);}        
        .stat-value.c2{color:var(--green);}        
        .stat-value.c3{color:var(--accent2);}        
        .stat-value.c4{color:var(--red);}        
        .stat-sub{font-size:12px;color:var(--muted);}
        .content-grid{display:grid;grid-template-columns:1fr 340px;gap:20px;}
        .anatomy-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;position:relative;}
        .anatomy-header{padding:20px 24px 0;display:flex;align-items:center;justify-content:space-between;}
        .anatomy-header h3{font-family:'Cabinet Grotesk',sans-serif;font-size:17px;font-weight:800;}
        .model-switcher{display:flex;gap:6px;}
        .model-btn{padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:12px;cursor:pointer;font-family:'Instrument Sans',sans-serif;}
        .model-btn.active{background:rgba(0,212,255,0.1);border-color:rgba(0,212,255,0.3);color:var(--accent);}        
        .anatomy-body{display:flex;align-items:flex-end;justify-content:center;height:300px;position:relative;padding:20px;}        
        /* RIGHT PANEL */
        .right-panel{display:flex;flex-direction:column;gap:16px;}
        .ai-status-card{background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,58,237,0.08));border:1px solid rgba(0,212,255,0.15);border-radius:16px;padding:18px;}
        .ai-status-top{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
        .ai-avatar{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:22px;}
        .ai-name{font-family:'Cabinet Grotesk',sans-serif;font-weight:800;font-size:15px;}
        .ai-online{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--green);}
        .online-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 2s ease infinite;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
        .ai-message{font-size:13px;color:var(--muted);line-height:1.6;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:14px;}
        .consult-btn{width:100%;padding:11px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Cabinet Grotesk',sans-serif;letter-spacing:0.01em;}
        .vitals-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;}
        .card-title{font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;}
        .card-title span{font-size:11px;color:var(--accent);font-family:'Instrument Sans',sans-serif;font-weight:400;}
        .vital-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
        .vital-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
        .vital-info{flex:1;}
        .vital-name{font-size:12px;color:var(--muted);margin-bottom:2px;}
        .vital-value{font-size:15px;font-weight:700;font-family:'Cabinet Grotesk',sans-serif;}
        .vital-bar{height:4px;background:rgba(255,255,255,0.08);border-radius:2px;margin-top:4px;}
        .vital-fill{height:100%;border-radius:2px;}
        .symptoms-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;}
        .symptom-item{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);}
        .symptom-item:last-child{border-bottom:none;}
        .symptom-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .symptom-text{flex:1;font-size:13px;}
        .symptom-time{font-size:11px;color:var(--muted);}
        .severity-badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;}
        /* FEATURES */
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
        .feature-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
        .feature-card:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-2px);}
        .feature-card::before{content:"";position:absolute;inset:0;opacity:0;transition:opacity 0.2s;}
        .feature-card:hover::before{opacity:1;}
        .fc-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;}
        .fc-label{font-size:10px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;margin-bottom:6px;}
        .fc-title{font-family:'Cabinet Grotesk',sans-serif;font-size:17px;font-weight:800;margin-bottom:6px;}
        .fc-desc{font-size:12px;color:var(--muted);line-height:1.5;}
        .fc-arrow{position:absolute;bottom:20px;right:20px;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:14px;}
        .redflag-banner{background:linear-gradient(135deg,rgba(255,69,96,0.15),rgba(255,69,96,0.05));border:1px solid rgba(255,69,96,0.3);border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:14px;}
        .rf-icon{font-size:24px;flex-shrink:0;}
        .rf-text h4{font-family:'Cabinet Grotesk',sans-serif;font-size:14px;font-weight:800;color:var(--red);margin-bottom:3px;}
        .rf-text p{font-size:12px;color:var(--muted);}
        .rf-btn{margin-left:auto;padding:8px 16px;background:var(--red);border:none;border-radius:8px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Cabinet Grotesk',sans-serif;flex-shrink:0;}
      `}</style>

      {/* glow layers */}
      <div className="glow-1" />
      <div className="glow-2" />

      <div className="wrapper">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-icon">🫀</div>
            <div className="logo-text">AI<span>Symptom</span></div>
          </div>
          <div className="nav-section">Main</div>
          <Link to="/home" className={`nav-item ${isActive('/home') ? 'active' : ''}`}>
            <span className="nav-icon">🏠</span> Dashboard
          </Link>
          <Link to="/body" className={`nav-item ${isActive('/body') ? 'active' : ''}`}>
            <span className="nav-icon">🫁</span> 3D Anatomy <span className="nav-badge">NEW</span>
          </Link>
          <Link to="/doctor" className={`nav-item ${isActive('/doctor') ? 'active' : ''}`}>
            <span className="nav-icon">🩺</span> AI Doctor
          </Link>
          <Link to="/diet" className={`nav-item ${isActive('/diet') ? 'active' : ''}`}>
            <span className="nav-icon">🥗</span> Diet Advisor
          </Link>

          <div className="nav-section">Health</div>
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            <span className="nav-icon">📊</span> Dashboard
          </Link>
          <Link to="/appointments" className={`nav-item ${isActive('/appointments') ? 'active' : ''}`}>
            <span className="nav-icon">🗓</span> Appointments
          </Link>
          <Link to="/reports" className={`nav-item ${isActive('/reports') ? 'active' : ''}`}>
            <span className="nav-icon">📋</span> Reports
          </Link>
          <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span> Settings
          </Link>

          <div className="sidebar-bottom">
            <div className="user-card" onClick={() => navigate('/profile')}>
              <div className="avatar">{user?.name?.[0] || ''}</div>
              <div className="user-info">
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-role">Patient Profile</div>
              </div>
              <div style={{ fontSize: 14, color: "rgba(232,237,245,0.3)" }}>⋯</div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="page-title">
                {pageTitle ? pageTitle : `${greeting()}, ${user?.name || ''}`}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year:'numeric' })}
              </div>
            </div>
            <div className="topbar-right">
              <div className="search-bar">
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>🔍</span>
                <input placeholder="Search symptoms, body parts…" />
              </div>
              <div className="icon-btn">🔔<div className="notif-dot"></div></div>
              <div className="icon-btn">👤</div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </>
  );
}
