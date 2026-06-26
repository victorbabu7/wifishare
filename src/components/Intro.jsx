import { useState } from "react";
import { Wifi, Search, Send, CreditCard, Key, Home, UserCheck, Wallet } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Intro({ onContinue }) {
  const [tab, setTab] = useState("client");

  const clientSteps = [
    { icon: Search, title: "Cherchez", text: "Trouvez un hote Wifi pres de vous sur la carte" },
    { icon: Send, title: "Demandez", text: "Choisissez une duree et envoyez votre demande" },
    { icon: CreditCard, title: "Payez", text: "Une fois accepte, payez en cash ou mobile money" },
    { icon: Key, title: "Connectez-vous", text: "Recevez le mot de passe Wifi et profitez !" },
  ];

  const hostSteps = [
    { icon: Home, title: "Creez votre annonce", text: "Indiquez votre Wifi, vos tarifs et votre position" },
    { icon: UserCheck, title: "Acceptez", text: "Recevez des demandes et choisissez d'accepter" },
    { icon: Wallet, title: "Encaissez", text: "Confirmez le paiement recu du client" },
    { icon: Wifi, title: "Partagez", text: "Donnez le mot de passe et gagnez de l'argent" },
  ];

  const steps = tab === "client" ? clientSteps : hostSteps;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>
          <Wifi size={32} color="#fff"/>
        </div>
        <h1 style={styles.title}>Bienvenue sur WifiShare</h1>
        <p style={styles.subtitle}>Partagez ou trouvez du Wifi autour de vous</p>
        <p style={styles.dataNote}>Meme avec tres peu de megas, vous pouvez ouvrir l'app et chercher du secours autour de vous.</p>

        <div style={styles.tabs}>
          <button onClick={() => setTab("client")} style={tab==="client" ? styles.tabActive : styles.tab}>Je cherche du Wifi</button>
          <button onClick={() => setTab("host")} style={tab==="host" ? styles.tabActive : styles.tab}>Je partage mon Wifi</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:18 }}>
          {steps.map((s, i) => (
            <div key={i} style={styles.stepRow}>
              <div style={styles.stepIcon}><s.icon size={20} color="#fff"/></div>
              <div>
                <p style={styles.stepTitle}>{i+1}. {s.title}</p>
                <p style={styles.stepText}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onContinue} style={styles.btn}>Retour</button>
        <button onClick={async () => {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) alert("Mode demo indisponible: " + error.message);
        }} style={styles.demoBtn}>
          Essayer en mode demo (sans compte)
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #5B5FEF 0%, #8B5FEF 50%, #FF8B5C 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(255,255,255,0.98)",
    borderRadius: 22,
    padding: "32px 26px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoCircle: {
    width: 64, height: 64, borderRadius: "50%",
    background: "linear-gradient(135deg, #FF8B5C, #EF5B7A)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  title: { textAlign: "center", fontSize: 24, fontWeight: 800, color: "#1A1B2E", margin: "0 0 6px" },
  subtitle: { textAlign: "center", fontSize: 14, color: "#6B6D85", margin: "0 0 8px" },
  dataNote: { textAlign: "center", fontSize: 12, color: "#5B5FEF", fontWeight: 600, margin: "0 0 20px", background:"#E8E9FD", padding:"8px 12px", borderRadius:10 },
  tabs: { display: "flex", gap: 8, background: "#F4F5FB", borderRadius: 12, padding: 4 },
  tab: { flex: 1, padding: "10px 8px", border: "none", background: "transparent", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "#6B6D85", cursor: "pointer" },
  tabActive: { flex: 1, padding: "10px 8px", border: "none", background: "#5B5FEF", borderRadius: 9, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" },
  stepRow: { display: "flex", gap: 12, alignItems: "flex-start" },
  stepIcon: { width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #5B5FEF, #8B5FEF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepTitle: { fontSize: 14, fontWeight: 700, color: "#1A1B2E", margin: "0 0 2px" },
  stepText: { fontSize: 12, color: "#6B6D85", margin: 0 },
  btn: { marginTop: 24, width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #FF8B5C, #EF5B7A)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  demoBtn: { marginTop: 10, width: "100%", padding: 12, borderRadius: 12, border: "1.5px solid #5B5FEF", background: "transparent", color: "#5B5FEF", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};
