import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import {
  Wifi, Smartphone, MapPin, Star, MessageCircle, Send, X,
  ChevronLeft, Plus, Clock, CheckCircle2, BatteryCharging,
  ArrowLeft, ShieldCheck, Loader2, Users, LogOut,
} from "lucide-react";

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function genCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
function formatFC(n) { return `${Number(n).toLocaleString("fr-FR")} FC`; }
function cheapest(l) {
  const tiers = [
    { label: "5 min", price: l.price_5min },
    { label: "10 min", price: l.price_10min },
    { label: "1 heure", price: l.price_hour },
    { label: "1 jour", price: l.price_day },
  ].filter(t => t.price);
  return tiers[0] || null;
}

function StarRow({ value, size = 14 }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(value) ? "var(--amber)" : "none"}
          color={i <= Math.round(value) ? "var(--amber)" : "#D9D4C8"} />
      ))}
    </span>
  );
}
function TypeBadge({ type }) {
  const r = type === "routeur";
  return (
    <span style={{
      fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:999,
      display:"inline-flex", alignItems:"center", gap:4,
      background: r ? "var(--teal-pale)" : "var(--amber-pale)",
      color: r ? "var(--teal-dark)" : "var(--amber-dark)",
    }}>
      {r ? <Wifi size={12}/> : <Smartphone size={12}/>}
      {r ? "Routeur" : "Hotspot"}
    </span>
  );
}

function ChatThread({ contactName, messages, input, setInput, onSend, onBack }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  return (
    <div className="panel">
      <div className="panel-header">
        <button className="icon-btn" onClick={onBack}><ArrowLeft size={18}/></button>
        <span className="font-display font-semibold">{contactName}</span>
        <div style={{width:18}}/>
      </div>
      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.mine ? "flex-end" : "flex-start", marginBottom:10 }}>
            <div style={{
              maxWidth:"78%", padding:"8px 12px", borderRadius:14,
              background: m.mine ? "var(--amber)" : "var(--teal-pale)",
              color: m.mine ? "#fff" : "var(--teal-dark)",
            }}>
              <p style={{fontSize:14, margin:0}}>{m.text}</p>
              <span style={{fontSize:10, opacity:0.7, marginTop:3, display:"block"}}>{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="chat-input-row">
        <input className="chat-input" placeholder="Écris ton message..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSend()} />
        <button className="send-btn" onClick={onSend}><Send size={16}/></button>
      </div>
    </div>
  );
}

export default function WifiShareApp({ user }) {
  const [mode, setMode] = useState("client");
  const [profile, setProfile] = useState(null);

  // CLIENT
  const [listings, setListings] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [resLoading, setResLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [listingReviews, setListingReviews] = useState([]);

  // HÔTE
  const [myListing, setMyListing] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardType, setWizardType] = useState(null);
  const [wizardForm, setWizardForm] = useState({
    emoji:"🏠", price_hour:"", price_day:"", price_5min:"", price_10min:"",
    description:"", hours:"", lat:"", lng:"", wifi_name:"", wifi_password:""
  });
  const [myReservations, setMyReservations] = useState([]);
  const [hostMessages, setHostMessages] = useState([]);
  const [myAcceptedReservations, setMyAcceptedReservations] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [notifBanner, setNotifBanner] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [userPos, setUserPos] = useState(null);
  const [hostChatTarget, setHostChatTarget] = useState(null);
  const [hostChatInput, setHostChatInput] = useState("");
  const [myReviews, setMyReviews] = useState([]);
  const [saving, setSaving] = useState(false);

  // Demande permission notifications navigateur
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  function showBrowserNotif(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  }
  // Notifications globales temps reel
  useEffect(() => {
    if (!user) return;
    const sub = supabase.channel("global-notifs-" + user.id)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"reservations" },
        (payload) => {
          loadMyReservations();
          setNotifBanner("Nouvelle demande de reservation !");
          showBrowserNotif("WifiShare", "Nouvelle demande de reservation !");
          playNotifSound();
          setTimeout(() => setNotifBanner(null), 5000);
        })
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" },
        async (payload) => {
          if (payload.new.sender_id === user.id) return;
          const { data: senderProfile } = await supabase.from("profiles").select("name").eq("id", payload.new.sender_id).single();
          setNotifBanner({
            text: `Nouveau message de ${senderProfile?.name || "quelqu'un"}`,
            resId: payload.new.reservation_id,
          });
          showBrowserNotif("WifiShare", `Nouveau message de ${senderProfile?.name || "quelqu'un"}`);
          playNotifSound();
          setTimeout(() => setNotifBanner(null), 6000);
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [user]);
  // Geolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);
  // Charger profil
  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user.id]);

  // Charger annonces (client)
  useEffect(() => {
    if (mode !== "client") return;
    supabase.from("listings").select("*, profiles(name,phone)")
      .eq("online", true)
      .neq("user_id", user.id)
      .then(({ data }) => setListings(data || []));
  }, [mode]);

  // Charger mon annonce (hôte)
  useEffect(() => {
    if (mode !== "host") return;
    supabase.from("listings").select("*").eq("user_id", user.id).single()
      .then(({ data }) => setMyListing(data || null));
    supabase.from("reservations").select("*, profiles(name,phone)")
      .in("listing_id", [])
      .then(() => {});
    loadMyReservations();
  }, [mode]);

  async function loadMyReservations() {
    const { data: lst } = await supabase.from("listings").select("id").eq("user_id", user.id);
    if (!lst || lst.length === 0) return;
    const { data } = await supabase.from("reservations")
      .select("*, profiles(name,phone)").eq("listing_id", lst[0].id).eq("status", "pending");
    setMyReservations(data || []);
    const { data: acc } = await supabase.from("reservations")
      .select("*, profiles(name,phone)").eq("listing_id", lst[0].id).in("status", ["accepted","paid"]);
    setMyAcceptedReservations(acc || []);
    const { data: rev } = await supabase.from("reviews")
      .select("*").eq("listing_id", lst[0].id);
    setMyReviews(rev || []);
  }
  async function markAsPaid(resId) {
    if (!window.confirm("Confirmer que le paiement a ete recu ?")) return;
    await supabase.from("reservations").update({ status: "paid" }).eq("id", resId);
    loadMyReservations();
  }
  async function clearConversation(resId) {
    if (!window.confirm("Effacer tous les messages de cette conversation ?")) return;
    await supabase.from("messages").delete().eq("reservation_id", resId);
    if (hostChatTarget?.id === resId) setHostMessages([]);
  }
  async function cancelReservationAsHost(resId) {
    if (!window.confirm("Annuler definitivement cette reservation ?")) return;
    await supabase.from("reservations").delete().eq("id", resId);
    loadMyReservations();
  }
  async function deleteListing() {
    if (!myListing) return;
    if (!window.confirm("Supprimer definitivement cette annonce ?")) return;
    await supabase.from("listings").delete().eq("id", myListing.id);
    setMyListing(null);
  }
  function editListing() {
    if (!myListing) return;
    setWizardType(myListing.type);
    setWizardForm({
      emoji: myListing.emoji || "\ud83c\udfe0",
      price_hour: myListing.price_hour || "",
      price_day: myListing.price_day || "",
      price_5min: myListing.price_5min || "",
      price_10min: myListing.price_10min || "",
      description: myListing.description || "",
      wifi_name: myListing.wifi_name || "",
      wifi_password: myListing.wifi_password || "",
      hours: myListing.hours || "",
      lat: myListing.lat || "",
      lng: myListing.lng || "",
    });
    setWizardStep(2);
    setWizardOpen(true);
  }
  async function loadHostMessages(resId) {
    const { data } = await supabase.from("messages").select("*")
      .eq("reservation_id", resId).order("created_at");
    setHostMessages((data || []).map(m => ({ ...m, mine: m.sender_id === user.id, time: nowTime() })));
  }
  async function sendHostMessage() {
    if (!hostChatInput.trim() || !hostChatTarget) return;
    const text = hostChatInput.trim();
    setHostChatInput("");
    await supabase.from("messages").insert({
      reservation_id: hostChatTarget.id,
      sender_id: user.id,
      text,
    });
    loadHostMessages(hostChatTarget.id);
  }
  useEffect(() => {
    if (hostChatTarget) {
      loadHostMessages(hostChatTarget.id);
      const sub = supabase.channel("hostmsgs-" + hostChatTarget.id)
        .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages",
          filter:`reservation_id=eq.${hostChatTarget.id}` },
          () => loadHostMessages(hostChatTarget.id))
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [hostChatTarget]);

  // Ouvrir détail annonce
  async function openDetail(listing) {
    setSelectedListing(listing);
    setActivePanel("detail");
    setReservation(null);
    // Chercher réservation existante
    const { data } = await supabase.from("reservations")
      .select("*").eq("listing_id", listing.id).eq("client_id", user.id)
      .order("created_at", { ascending: false }).limit(1).single();
    if (data) setReservation(data);
    // Avis
    const { data: rev } = await supabase.from("reviews").select("*").eq("listing_id", listing.id);
    setListingReviews(rev || []);
  }

  // Réserver
  async function reserve() {
    setResLoading(true);
    const code = genCode();
    const { data, error } = await supabase.from("reservations").insert({
      listing_id: selectedListing.id,
      client_id: user.id,
      status: "pending",
      access_code: code,
    }).select().single();
    setResLoading(false);
    if (!error) setReservation(data);
  }
  async function cancelReservation() {
    if (!reservation) return;
    await supabase.from("reservations").delete().eq("id", reservation.id);
    setReservation(null);
  }

  // Envoyer message (client)
  async function sendMessage() {
    if (!chatInput.trim() || !reservation) return;
    const text = chatInput.trim();
    setChatInput("");
    await supabase.from("messages").insert({
      reservation_id: reservation.id,
      sender_id: user.id,
      text,
    });
    loadMessages(reservation.id);
  }

  async function loadMessages(resId) {
    const { data } = await supabase.from("messages").select("*")
      .eq("reservation_id", resId).order("created_at");
    setMessages((data || []).map(m => ({ ...m, mine: m.sender_id === user.id, time: nowTime() })));
  }

  useEffect(() => {
    if (activePanel === "chat" && reservation) {
      loadMessages(reservation.id);
      const sub = supabase.channel("msgs-" + reservation.id)
        .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages",
          filter:`reservation_id=eq.${reservation.id}` },
          () => loadMessages(reservation.id))
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [activePanel, reservation]);

  // Soumettre avis
  async function submitReview() {
    await supabase.from("reviews").insert({
      listing_id: selectedListing.id,
      reviewer_id: user.id,
      stars: reviewStars,
      comment: reviewText,
    });
    setActivePanel("detail");
  }

  // Accepter demande (hôte)
  async function acceptReservation(res) {
    await supabase.from("reservations").update({ status:"accepted" }).eq("id", res.id);
    loadMyReservations();
  }
  async function declineReservation(res) {
    await supabase.from("reservations").update({ status:"declined" }).eq("id", res.id);
    loadMyReservations();
  }

  // Toggle online
  async function toggleOnline() {
    const val = !myListing.online;
    await supabase.from("listings").update({ online: val }).eq("id", myListing.id);
    setMyListing(l => ({ ...l, online: val }));
  }

  // Wizard — créer annonce
  async function finishWizard() {
    setSaving(true);
    const payload = {
      user_id: user.id,
      type: wizardType,
      emoji: wizardForm.emoji,
      price_hour: Number(wizardForm.price_hour),
      price_day: wizardForm.price_day ? Number(wizardForm.price_day) : null,
      price_5min: wizardForm.price_5min ? Number(wizardForm.price_5min) : null,
      price_10min: wizardForm.price_10min ? Number(wizardForm.price_10min) : null,
      description: wizardForm.description,
      wifi_name: wizardForm.wifi_name,
      wifi_password: wizardForm.wifi_password,
      hours: wizardForm.hours,
      lat: userPos ? userPos[0] : 0,
      lng: userPos ? userPos[1] : 0,
    };
    let data, error;
    if (myListing) {
      ({ data, error } = await supabase.from("listings").update(payload).eq("id", myListing.id).select().single());
    } else {
      ({ data, error } = await supabase.from("listings").insert({ ...payload, online: false }).select().single());
    }
    setSaving(false);
    if (!error) { setMyListing(data); setWizardOpen(false); }
  }

  const wizardValid = wizardForm.price_hour !== "" && wizardForm.description.trim() !== "" && !!userPos;
  const filteredListings = listings
    .filter(l => filterType === "all" ? true : l.type === filterType)
    .filter(l => {
      if (!userPos || !l.lat || !l.lng) return true;
      return distanceKm(userPos[0], userPos[1], l.lat, l.lng) <= searchRadius;
    });

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <div className="app-shell font-body">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        :root{
          --bg:#F4F5FB; --surface:#FFFFFF; --ink:#1A1B2E; --ink-soft:#6B6D85;
          --teal:#5B5FEF; --teal-dark:#4347C4; --teal-pale:#E8E9FD;
          --amber:#FF8B5C; --amber-dark:#E66B3A; --amber-pale:#FFE5D9;
          --coral:#EF5B7A; --coral-pale:#FDE3EA; --border:#E5E6F0;
        }
        *{ box-sizing:border-box; margin:0; padding:0; }
        .app-shell{ background:var(--bg); color:var(--ink); min-height:100vh; font-family:'Work Sans',sans-serif; }
        .font-display{ font-family:'Sora',sans-serif; }
        .font-body{ font-family:'Work Sans',sans-serif; }
        .font-mono{ font-family:'JetBrains Mono',monospace; }
        .card{ background:var(--surface); border:1px solid var(--border); border-radius:18px; padding:14px; box-shadow:0 2px 12px rgba(91,95,239,0.06); transition:box-shadow 0.2s; }
        .card:hover{ box-shadow:0 6px 20px rgba(91,95,239,0.12); }
        .btn-amber{ background:linear-gradient(135deg, #FF8B5C, #EF5B7A); color:#fff; font-weight:700; font-family:'Sora',sans-serif; border:none; border-radius:14px; padding:12px 16px; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; width:100%; box-shadow:0 4px 14px rgba(255,139,92,0.35); }
        .btn-amber:disabled{ background:#D8CDBE; }
        .btn-teal-outline{ background:transparent; color:var(--teal); font-weight:700; font-family:'Sora',sans-serif; border:1.5px solid var(--teal); border-radius:12px; padding:10px 16px; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer; width:100%; }
        .btn-coral-outline{ background:transparent; color:var(--coral); font-weight:600; border:1.5px solid var(--coral); border-radius:12px; padding:8px 14px; font-size:13px; cursor:pointer; }
        .icon-btn{ background:transparent; border:none; color:var(--ink); padding:4px; display:flex; cursor:pointer; }
        .chip{ font-size:12px; font-weight:600; padding:6px 12px; border-radius:999px; border:1px solid var(--border); background:var(--surface); color:var(--ink-soft); cursor:pointer; }
        .chip-active{ background:var(--teal); border-color:var(--teal); color:#fff; }
        .seg-btn{ font-family:'Sora',sans-serif; font-weight:700; font-size:13px; padding:8px 14px; border-radius:10px; border:none; background:transparent; color:var(--ink-soft); display:flex; align-items:center; gap:6px; cursor:pointer; }
        .seg-btn-active{ background:var(--teal); color:#fff; }
        .toggle{ width:46px; height:26px; border-radius:999px; padding:3px; display:flex; align-items:center; border:none; cursor:pointer; }
        .toggle-on{ background:var(--teal); justify-content:flex-end; }
        .toggle-off{ background:#D9D4C8; justify-content:flex-start; }
        .toggle-knob{ width:20px; height:20px; border-radius:50%; background:#fff; }
        .overlay-back{ position:fixed; inset:0; background:rgba(22,36,31,0.45); display:flex; align-items:flex-end; justify-content:center; z-index:40; }
        .panel{ background:var(--surface); width:100%; max-width:420px; border-radius:20px 20px 0 0; max-height:88vh; overflow:hidden; display:flex; flex-direction:column; }
        .panel-header{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border); }
        .panel-body{ padding:16px; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
        .chat-body{ padding:14px 16px; overflow-y:auto; flex:1; min-height:280px; max-height:380px; }
        .chat-input-row{ display:flex; gap:8px; padding:12px 16px; border-top:1px solid var(--border); }
        .chat-input{ flex:1; border:1px solid var(--border); border-radius:999px; padding:9px 14px; font-family:'Work Sans',sans-serif; font-size:14px; }
        .chat-input:focus{ outline:none; border-color:var(--teal); }
        .send-btn{ background:var(--teal); color:#fff; border:none; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .code-box{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:20px; letter-spacing:4px; background:var(--teal-pale); color:var(--teal-dark); padding:10px 0; text-align:center; border-radius:12px; }
        .wizard-card{ border:1.5px solid var(--border); border-radius:16px; padding:16px; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; cursor:pointer; background:var(--surface); width:100%; }
        .wizard-card-selected{ border-color:var(--teal); background:var(--teal-pale); }
        .step-num{ width:24px; height:24px; border-radius:50%; background:var(--teal); color:#fff; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        input[type="text"], input[type="number"], textarea{ border:1px solid var(--border); border-radius:10px; padding:9px 12px; font-family:'Work Sans',sans-serif; font-size:14px; width:100%; }
        input[type="text"]:focus, input[type="number"]:focus, textarea:focus{ outline:none; border-color:var(--teal); }
        label{ font-size:12px; font-weight:600; color:var(--ink-soft); display:block; margin-bottom:4px; }
      `}</style>
      {notifBanner && (
        <div onClick={() => {
            if (typeof notifBanner === "object" && notifBanner.resId) {
              if (mode === "host") {
                const target = myAcceptedReservations.find(r => r.id === notifBanner.resId) || myReservations.find(r => r.id === notifBanner.resId);
                if (target) setHostChatTarget(target);
              } else {
                setActivePanel("chat");
              }
            }
            setNotifBanner(null);
          }}
          style={{
          position:"fixed", top:0, left:0, right:0, zIndex:9999,
          background:"#E8862B", color:"white", textAlign:"center",
          padding:"10px 16px", fontWeight:600, fontSize:14, cursor:"pointer",
        }}>
          {typeof notifBanner === "object" ? notifBanner.text : notifBanner}
        </div>
      )}

      <div style={{ maxWidth:420, margin:"0 auto", paddingBottom:40 }}>

        {/* Header */}
        <div style={{ background:"#FF8B5C", boxShadow:"0 4px 20px rgba(255,139,92,0.3)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ background:"rgba(255,255,255,0.25)", width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Wifi size={18} color="#fff"/>
              </div>
              <span className="font-display" style={{ fontWeight:800, fontSize:18, color:"#fff" }}>WifiShare</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:12, padding:3, display:"flex" }}>
                <button className={`seg-btn ${mode==="client" ? "seg-btn-active" : ""}`} onClick={() => setMode("client")}>
                  <Users size={14}/> Client
                </button>
                <button className={`seg-btn ${mode==="host" ? "seg-btn-active" : ""}`} onClick={() => setMode("host")}>
                  <Wifi size={14}/> Hôte
                </button>
              </div>
              <button className="icon-btn" onClick={signOut} title="Se déconnecter"><LogOut size={18}/></button>
            </div>
          </div>
          {profile && (
            <div style={{ padding:"4px 16px 10px", fontSize:13, color:"var(--ink-soft)" }}>
              👋 {profile.name || user.email}
            </div>
          )}
        </div>

        {/* ===== MODE CLIENT ===== */}
        {mode === "client" && (
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:16 }}>
            {/* Filtres */}
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"all",l:"Tous"},{v:"routeur",l:"Routeur"},{v:"hotspot",l:"Hotspot"}].map(f => (
                <button key={f.v} className={`chip ${filterType===f.v ? "chip-active" : ""}`}
                  onClick={() => setFilterType(f.v)}>{f.l}</button>
              ))}
            </div>

            {/* Rayon de recherche */}
            <div className="card" style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:13, fontWeight:600 }}>Rayon de recherche : {searchRadius} km</label>
              <input type="range" min="1" max="50" value={searchRadius}
                onChange={e => setSearchRadius(Number(e.target.value))}/>
            </div>
            {/* Toggle vue */}
            <div style={{ display:"flex", gap:8 }}>
              <button className={`chip ${viewMode==="list" ? "chip-active" : ""}`} onClick={() => setViewMode("list")}>Liste</button>
              <button className={`chip ${viewMode==="map" ? "chip-active" : ""}`} onClick={() => setViewMode("map")}>Carte</button>
            </div>
            {viewMode === "map" && (
              <div style={{ height: 400, borderRadius: 12, overflow: "hidden" }}>
                <MapContainer center={userPos || [-1.6789, 29.2345]} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                  {userPos && (
                    <Marker position={userPos} icon={L.divIcon({ className:"", html:'<div style="background:#0F6B5C;width:14px;height:14px;border-radius:50%;border:3px solid white"></div>' })}>
                      <Popup>Vous êtes ici</Popup>
                    </Marker>
                  )}
                  {filteredListings.filter(l => l.lat && l.lng).map(l => (
                    <Marker key={l.id} position={[l.lat, l.lng]}
                      icon={L.divIcon({
                        className: "",
                        html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px)">
                                 <div style="background:#E8862B;color:white;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);margin-bottom:2px">
                                   ${(l.wifi_name || l.profiles?.name || "Hote").replace(/</g,"")}
                                 </div>
                                 <div style="background:#0F6B5C;width:14px;height:14px;border-radius:50%;border:3px solid white"></div>
                               </div>`,
                        iconSize: [0, 0],
                      })}>
                      <Popup>
                        <b>{l.wifi_name || l.profiles?.name || "Hôte"}</b><br/>
                        {cheapest(l) && `${formatFC(cheapest(l).price)} / ${cheapest(l).label}`}<br/>
                        <button onClick={() => openDetail(l)} style={{marginTop:6, cursor:"pointer"}}>Voir l'annonce</button>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
            {/* Liste */}
            {viewMode === "list" && filteredListings.length === 0 && (
              <p style={{ textAlign:"center", color:"var(--ink-soft)", fontSize:14, padding:"32px 0" }}>
                Aucun hôte disponible pour le moment.
              </p>
            )}
            {viewMode === "list" && filteredListings.map(l => (
              <button key={l.id} className="card" style={{ textAlign:"left", border:"none", cursor:"pointer", width:"100%" }}
                onClick={() => openDetail(l)}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:28 }}>{l.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span className="font-display" style={{ fontWeight:600, fontSize:14 }}>
                        {l.wifi_name || l.profiles?.name || "Hôte"}
                      </span>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--teal)", display:"inline-block" }}/>
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:4 }}>
                      <TypeBadge type={l.type}/>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {cheapest(l) && <>
                      <p style={{ fontSize:11, color:"var(--ink-soft)" }}>à partir de</p>
                      <p className="font-mono" style={{ fontWeight:700, fontSize:13 }}>{formatFC(cheapest(l).price)}</p>
                      <p style={{ fontSize:11, color:"var(--ink-soft)" }}>/ {cheapest(l).label}</p>
                    </>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ===== MODE HÔTE ===== */}
        {mode === "host" && (
          <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:16 }}>
            {!myListing ? (
              <div className="card" style={{ textAlign:"center", padding:"40px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ background:"var(--teal-pale)", width:56, height:56, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Wifi size={26} color="var(--teal)"/>
                </div>
                <p className="font-display" style={{ fontWeight:600 }}>Pas encore d'annonce</p>
                <p style={{ fontSize:14, color:"var(--ink-soft)" }}>Crée ton annonce pour partager ta connexion.</p>
                <button className="btn-amber" style={{ width:"auto", padding:"10px 24px" }} onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                      () => {}
                    );
                  }
                  setWizardOpen(true); setWizardStep(1); setWizardType(null);
                }}>
                  <Plus size={16}/> Créer mon annonce
                </button>
              </div>
            ) : (
              <>
                {/* Mon annonce */}
                <div className="card" style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:28 }}>{myListing.emoji}</span>
                      <div>
                        <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>Mon annonce</p>
                        <TypeBadge type={myListing.type}/>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      {cheapest(myListing) && <>
                        <p style={{ fontSize:11, color:"var(--ink-soft)" }}>à partir de</p>
                        <p className="font-mono" style={{ fontWeight:700, fontSize:13 }}>{formatFC(cheapest(myListing).price)}</p>
                      </>}
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:"var(--ink-soft)" }}>{myListing.description}</p>
                  {myListing.hours && <p style={{ fontSize:12, color:"var(--ink-soft)", display:"flex", alignItems:"center", gap:4 }}><Clock size={13}/> {myListing.hours}</p>}
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn-coral-outline" style={{flex:1}} onClick={editListing}>Modifier</button>
                    <button className="btn-coral-outline" style={{flex:1}} onClick={deleteListing}>Supprimer</button>
                  </div>
                </div>

                {/* Toggle online */}
                <div className="card" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>Partage actif</p>
                    <p style={{ fontSize:12, color:"var(--ink-soft)" }}>
                      {myListing.online ? "Visible par les clients" : "Hors ligne — invisible"}
                    </p>
                  </div>
                  <button className={`toggle ${myListing.online ? "toggle-on" : "toggle-off"}`} onClick={toggleOnline}>
                    <span className="toggle-knob"/>
                  </button>
                </div>

                {/* Demandes */}
                <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>Demandes en attente</p>
                {myReservations.length === 0 && (
                  <p className="card" style={{ fontSize:13, color:"var(--ink-soft)" }}>Aucune demande pour l'instant.</p>
                )}
                {myReservations.map(res => (
                  <div key={res.id} className="card" style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:14 }}>{res.profiles?.name || "Client"}</p>
                      <p style={{ fontSize:12, color:"var(--ink-soft)" }}>En attente</p>
                    </div>
                    <button className="btn-coral-outline" onClick={() => declineReservation(res)}>Refuser</button>
                    <button className="btn-amber" style={{ width:"auto", padding:"8px 12px", fontSize:13 }} onClick={() => acceptReservation(res)}>Accepter</button>
                  </div>
                ))}
                <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>Conversations actives</p>
                {myAcceptedReservations.map(res => (
                  <div key={res.id} className="card" style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:14 }}>{res.profiles?.name || "Client"}</p>
                      <p style={{ fontSize:12, color:"var(--ink-soft)" }}>Demande acceptee</p>
                      {res.profiles?.phone && (
                        <p style={{ fontSize:12, color:"var(--ink-soft)" }}>Tel: {res.profiles.phone}</p>
                      )}
                      {res.status === "paid" && (
                        <p style={{ fontSize:12, color:"var(--teal-dark)", fontWeight:600 }}>Paye - mot de passe partage</p>
                      )}
                    </div>
                    <button className="btn-amber" style={{ width:"auto", padding:"8px 12px", fontSize:13 }} onClick={() => setHostChatTarget(res)}>
                      <MessageCircle size={16}/>
                    </button>
                    <button className="btn-coral-outline" style={{ width:"auto", padding:"8px 10px", fontSize:12 }} onClick={() => clearConversation(res.id)}>
                      Effacer
                    </button>
                    <button className="btn-coral-outline" style={{ width:"auto", padding:"8px 10px", fontSize:12 }} onClick={() => cancelReservationAsHost(res.id)}>
                      Annuler
                    </button>
                    {res.status === "accepted" && (
                      <button className="btn-amber" style={{ width:"auto", padding:"8px 10px", fontSize:12 }} onClick={() => markAsPaid(res.id)}>
                        Paiement recu
                      </button>
                    )}
                  </div>
                ))}

                {/* Avis reçus */}
                {myReviews.length > 0 && <>
                  <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>Avis reçus</p>
                  {myReviews.map(r => (
                    <div key={r.id} className="card" style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontWeight:600, fontSize:13 }}>Client</span>
                        <StarRow value={r.stars} size={13}/>
                      </div>
                      {r.comment && <p style={{ fontSize:12, color:"var(--ink-soft)" }}>{r.comment}</p>}
                    </div>
                  ))}
                </>}
              </>
            )}
          </div>
        )}
      </div>

      {/* ===== PANEL DÉTAIL ===== */}
      {activePanel === "detail" && selectedListing && (
        <div className="overlay-back" onClick={() => setActivePanel(null)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <button className="icon-btn" onClick={() => setActivePanel(null)}><ChevronLeft size={20}/></button>
              <span className="font-display" style={{ fontWeight:600 }}>Détail</span>
              <div style={{width:20}}/>
            </div>
            <div className="panel-body">
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:36 }}>{selectedListing.emoji}</span>
                <div>
                  <p className="font-display" style={{ fontWeight:700, fontSize:16 }}>{selectedListing.wifi_name || selectedListing.profiles?.name || "Hôte"}</p>
                  <TypeBadge type={selectedListing.type}/>
                </div>
              </div>

              <p style={{ fontSize:14, color:"var(--ink-soft)" }}>{selectedListing.description}</p>

              {selectedListing.hours && (
                <p style={{ fontSize:13, color:"var(--ink-soft)", display:"flex", alignItems:"center", gap:4 }}>
                  <Clock size={13}/> {selectedListing.hours}
                </p>
              )}

              <div style={{ display:"flex", gap:12 }}>
                {selectedListing.price_hour && (
                  <div className="card" style={{ flex:1, textAlign:"center" }}>
                    <p className="font-mono" style={{ fontWeight:700 }}>{formatFC(selectedListing.price_hour)}</p>
                    <p style={{ fontSize:12, color:"var(--ink-soft)" }}>/ heure</p>
                  </div>
                )}
                {selectedListing.price_day && (
                  <div className="card" style={{ flex:1, textAlign:"center" }}>
                    <p className="font-mono" style={{ fontWeight:700 }}>{formatFC(selectedListing.price_day)}</p>
                    <p style={{ fontSize:12, color:"var(--ink-soft)" }}>/ jour</p>
                  </div>
                )}
              </div>

              {/* Avis */}
              {listingReviews.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <p className="font-display" style={{ fontWeight:600, fontSize:13 }}>Avis</p>
                  {listingReviews.map(r => (
                    <div key={r.id} className="card" style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      <StarRow value={r.stars} size={13}/>
                      {r.comment && <p style={{ fontSize:12, color:"var(--ink-soft)" }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton réserver */}
              {!reservation && (
                <button className="btn-amber" disabled={resLoading} onClick={reserve}>
                  {resLoading ? <Loader2 size={16}/> : "Réserver un accès"}
                </button>
              )}
              {reservation?.status === "pending" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center", color:"var(--ink-soft)", fontSize:14 }}>
                    <Loader2 size={16}/> Demande envoyee, en attente...
                  </div>
                  <button className="btn-coral-outline" onClick={cancelReservation}>Annuler la demande</button>
                </div>
              )}
              {reservation?.status === "paid" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--teal-dark)" }}>
                    <CheckCircle2 size={16}/> <span style={{ fontWeight:600, fontSize:14 }}>Paiement confirme !</span>
                  </div>
                  <div>
                    <p style={{ fontSize:12, color:"var(--ink-soft)", marginBottom:4 }}>Nom du Wifi</p>
                    <p className="code-box">{selectedListing?.wifi_name || "Voir l'hote"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:12, color:"var(--ink-soft)", marginBottom:4 }}>Mot de passe Wifi</p>
                    <p className="code-box">{selectedListing?.wifi_password}</p>
                  </div>
                  {selectedListing?.profiles?.phone && (
                    <p style={{ fontSize:13, color:"var(--ink-soft)" }}>Tel hote: {selectedListing.profiles.phone}</p>
                  )}
                  <button className="btn-teal-outline" onClick={() => setActivePanel("chat")}>
                    <MessageCircle size={16}/> Discuter avec l'hôte
                  </button>
                  <button className="btn-amber" onClick={() => setActivePanel("review")}>
                    <Star size={16}/> Laisser un avis
                  </button>
                  <button className="btn-coral-outline" onClick={cancelReservation}>Annuler la reservation</button>
                </div>
              )}
              {reservation?.status === "accepted" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, color:"var(--teal-dark)" }}>
                    <CheckCircle2 size={16}/> <span style={{ fontWeight:600, fontSize:14 }}>Demande acceptée !</span>
                  </div>
                  <p style={{ fontSize:13, color:"var(--ink-soft)" }}>
                    Payez l'hote (cash ou mobile money) pour recevoir le mot de passe Wifi.
                  </p>
                  {selectedListing?.profiles?.phone && (
                    <p style={{ fontSize:13, color:"var(--ink-soft)" }}>Tel hote: {selectedListing.profiles.phone}</p>
                  )}
                  <button className="btn-teal-outline" onClick={() => setActivePanel("chat")}>
                    <MessageCircle size={16}/> Discuter avec l'hôte
                  </button>
                  <button className="btn-coral-outline" onClick={cancelReservation}>Annuler la reservation</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== PANEL CHAT CLIENT ===== */}
      {activePanel === "chat" && selectedListing && (
        <div className="overlay-back" onClick={() => setActivePanel("detail")}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:420 }}>
            <ChatThread
              contactName={selectedListing.profiles?.name || "Hôte"}
              messages={messages}
              input={chatInput}
              setInput={setChatInput}
              onSend={sendMessage}
              onBack={() => setActivePanel("detail")}
            />
          </div>
        </div>
      )}

      {/* ===== PANEL AVIS ===== */}
      {activePanel === "review" && selectedListing && (
        <div className="overlay-back" onClick={() => setActivePanel("detail")}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <button className="icon-btn" onClick={() => setActivePanel("detail")}><ArrowLeft size={18}/></button>
              <span className="font-display" style={{ fontWeight:600 }}>Laisser un avis</span>
              <div style={{width:18}}/>
            </div>
            <div className="panel-body">
              <p style={{ fontSize:14, color:"var(--ink-soft)" }}>Comment s'est passée ta connexion ?</p>
              <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} style={{ background:"none", border:"none", cursor:"pointer" }} onClick={() => setReviewStars(i)}>
                    <Star size={28} fill={i <= reviewStars ? "var(--amber)" : "none"} color={i <= reviewStars ? "var(--amber)" : "#D9D4C8"}/>
                  </button>
                ))}
              </div>
              <textarea rows={3} placeholder="Décris ton expérience..."
                value={reviewText} onChange={e => setReviewText(e.target.value)}/>
              <button className="btn-amber" disabled={reviewStars === 0} onClick={submitReview}>
                Envoyer mon avis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== WIZARD HÔTE ===== */}
      {wizardOpen && (
        <div className="overlay-back" onClick={() => setWizardOpen(false)}>
          <div className="panel" onClick={e => e.stopPropagation()}>
            <div className="panel-header">
              <button className="icon-btn" onClick={() => wizardStep === 1 ? setWizardOpen(false) : setWizardStep(s => s-1)}>
                <ArrowLeft size={18}/>
              </button>
              <span className="font-display" style={{ fontWeight:600 }}>Créer mon annonce — {wizardStep}/3</span>
              <div style={{width:18}}/>
            </div>
            <div className="panel-body">
              {wizardStep === 1 && (
                <>
                  <p style={{ fontSize:14, color:"var(--ink-soft)" }}>Comment vas-tu partager ta connexion ?</p>
                  <button className={`wizard-card ${wizardType==="routeur" ? "wizard-card-selected" : ""}`}
                    onClick={() => { setWizardType("routeur"); setWizardStep(2); }}>
                    <Wifi size={26} color="var(--teal)"/>
                    <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>J'ai un routeur ou une box</p>
                    <p style={{ fontSize:12, color:"var(--ink-soft)" }}>Connexion fixe à la maison ou au bureau.</p>
                  </button>
                  <button className={`wizard-card ${wizardType==="hotspot" ? "wizard-card-selected" : ""}`}
                    onClick={() => { setWizardType("hotspot"); setWizardStep(2); }}>
                    <Smartphone size={26} color="var(--teal)"/>
                    <p className="font-display" style={{ fontWeight:600, fontSize:14 }}>Je partage le Wi-Fi de mon téléphone</p>
                    <p style={{ fontSize:12, color:"var(--ink-soft)" }}>Point d'accès mobile via forfait data.</p>
                  </button>
                </>
              )}
              {wizardStep === 2 && wizardType === "routeur" && (
                <>
                  <p style={{ fontSize:14, color:"var(--ink-soft)" }}>Configure un réseau séparé pour tes clients :</p>
                  {["Ouvre l'application ou la page de gestion de ta box.","Active l'option réseau invité si disponible.","Donne un nom et mot de passe différents de ton réseau principal."].map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span className="step-num">{i+1}</span>
                      <p style={{ fontSize:13, color:"var(--ink-soft)", paddingTop:2 }}>{s}</p>
                    </div>
                  ))}
                  <div style={{ background:"var(--amber-pale)", borderRadius:12, padding:12, display:"flex", gap:8 }}>
                    <ShieldCheck size={16} color="var(--amber-dark)" style={{ flexShrink:0, marginTop:2 }}/>
                    <p style={{ fontSize:12, color:"var(--amber-dark)" }}>Pas de réseau invité ? Un petit routeur portable (15-25$) fait l'affaire.</p>
                  </div>
                  <button className="btn-amber" onClick={() => setWizardStep(3)}>Suivant</button>
                </>
              )}
              {wizardStep === 2 && wizardType === "hotspot" && (
                <>
                  <p style={{ fontSize:14, color:"var(--ink-soft)" }}>Active le point d'accès sur ton téléphone :</p>
                  {["Ouvre les réglages et active le point d'accès personnel.","Choisis un mot de passe fort, change-le après chaque client.","Branche ton téléphone sur secteur pendant le partage."].map((s,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span className="step-num">{i+1}</span>
                      <p style={{ fontSize:13, color:"var(--ink-soft)", paddingTop:2 }}>{s}</p>
                    </div>
                  ))}
                  <div style={{ background:"var(--coral-pale)", borderRadius:12, padding:12, display:"flex", gap:8 }}>
                    <BatteryCharging size={16} color="var(--coral)" style={{ flexShrink:0, marginTop:2 }}/>
                    <p style={{ fontSize:12, color:"var(--coral)" }}>Le hotspot vide la batterie rapidement et a une portée limitée.</p>
                  </div>
                  <button className="btn-amber" onClick={() => setWizardStep(3)}>Suivant</button>
                </>
              )}
              {wizardStep === 3 && (
                <>
                  <div>
                    <label>Symbole</label>
                    <div style={{ display:"flex", gap:8, marginTop:4 }}>
                      {["🏠","📶","🏡","🏢"].map(e => (
                        <button key={e} onClick={() => setWizardForm(f => ({...f, emoji:e}))}
                          style={{ fontSize:22, padding:8, borderRadius:10, cursor:"pointer",
                            border: wizardForm.emoji===e ? "2px solid var(--teal)" : "1px solid var(--border)",
                            background: wizardForm.emoji===e ? "var(--teal-pale)" : "var(--surface)" }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label>Prix / heure (FC) *</label>
                    <input type="number" placeholder="ex : 500" value={wizardForm.price_hour}
                      onChange={e => setWizardForm(f => ({...f, price_hour:e.target.value}))}/>
                  </div>
                  <div>
                    <label>Prix / jour (FC)</label>
                    <input type="number" placeholder="ex : 3000" value={wizardForm.price_day}
                      onChange={e => setWizardForm(f => ({...f, price_day:e.target.value}))}/>
                  </div>
                  <div>
                    <label>Prix / 5 min (FC)</label>
                    <input type="number" placeholder="ex : 100" value={wizardForm.price_5min}
                      onChange={e => setWizardForm(f => ({...f, price_5min:e.target.value}))}/>
                  </div>
                  <div>
                    <label>Nom du Wifi</label>
                    <input type="text" placeholder="ex : MaisonChezNous_5G" value={wizardForm.wifi_name}
                      onChange={e => setWizardForm(f => ({...f, wifi_name:e.target.value}))}/>
                  </div>
                  <div>
                    <label>Mot de passe Wifi reel</label>
                    <input type="text" placeholder="ex : motdepasse123" value={wizardForm.wifi_password}
                      onChange={e => setWizardForm(f => ({...f, wifi_password:e.target.value}))}/>
                  </div>
                  <div>
                    <label>Description *</label>
                    <textarea rows={2} placeholder="ex : Fibre stable, idéale pour étudier."
                      value={wizardForm.description}
                      onChange={e => setWizardForm(f => ({...f, description:e.target.value}))}/>
                  </div>
                  <div>
                    <label>Horaires</label>
                    <input type="text" placeholder="ex : 7h - 22h" value={wizardForm.hours}
                      onChange={e => setWizardForm(f => ({...f, hours:e.target.value}))}/>
                  </div>
                  <div className="card" style={{ fontSize:13, color: userPos ? "var(--ink-soft)" : "#D9534F" }}>
                    {userPos
                      ? <>📍 Position detectee automatiquement</>
                      : <>📍 Detection de votre position en cours... (autorisez la geolocalisation pour publier)</>}
                  </div>
                  <button className="btn-amber" disabled={!wizardValid || saving} onClick={finishWizard}>
                    {saving ? <Loader2 size={16}/> : "Publier mon annonce"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    {hostChatTarget && (
      <div className="overlay-back" onClick={() => setHostChatTarget(null)}>
        <div className="panel" onClick={e => e.stopPropagation()}>
          <div className="panel-header">
            <button className="icon-btn" onClick={() => setHostChatTarget(null)}><ChevronLeft size={20}/></button>
            <span className="font-display" style={{ fontWeight:600 }}>{hostChatTarget.profiles?.name || "Client"}</span>
            <div style={{width:20}}/>
          </div>
          <div className="panel-body" style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {hostMessages.map(m => (
              <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", background: m.mine ? "var(--amber)" : "#eee", padding:"8px 12px", borderRadius:10, maxWidth:"75%" }}>
                {m.text}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, padding:12 }}>
            <input style={{flex:1}} value={hostChatInput} onChange={e => setHostChatInput(e.target.value)} placeholder="Message..." onKeyDown={e => e.key==="Enter" && sendHostMessage()}/>
            <button className="btn-amber" style={{width:"auto", padding:"8px 14px"}} onClick={sendHostMessage}><Send size={16}/></button>
          </div>
        </div>
      </div>
    )}
      {/* Footer */}
      <div style={{ textAlign:"center", padding:"24px 16px 32px", fontSize:12, color:"var(--ink-soft)" }}>
        <p style={{ marginBottom:8, fontWeight:600, color:"var(--teal)" }}>
          Meme avec tres peu de megas, vous pouvez ouvrir WifiShare et chercher du secours autour de vous.
        </p>
        <p style={{ marginBottom:8 }}>
          Tu veux voir plus de produits de Kivu Culture Hub ?{" "}
          <a href="https://kivu-culture-hub-78805.web.app" target="_blank" rel="noopener noreferrer" style={{ color:"var(--teal)", fontWeight:600 }}>
            kivu-culture-hub-78805.web.app
          </a>{" "}
          ou{" "}
          <a href="https://kivujobia.web.app/" target="_blank" rel="noopener noreferrer" style={{ color:"var(--teal)", fontWeight:600 }}>
            kivujobia.web.app
          </a>
        </p>
        <p style={{ marginBottom:8 }}>
          <a href="mailto:kivuculturehub@gmail.com?subject=Commentaire WifiShare" style={{ color:"var(--amber)", fontWeight:600 }}>
            Envoyer un commentaire ou une suggestion au concepteur
          </a>
        </p>
        <p style={{ marginBottom:4 }}>Contact : kivuculturehub@gmail.com</p>
        <p style={{ marginBottom:4 }}>Tel : +243972212629</p>
        <p style={{ fontWeight:700, color:"var(--ink)" }}>— MBvictor, concepteur</p>
      </div>
    </div>
  );
}
