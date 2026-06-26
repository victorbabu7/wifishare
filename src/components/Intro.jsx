import { useState } from "react";
import { Wifi } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Intro({ onContinue }) {
  const [tab, setTab] = useState("client");

  const clientFeatures = [
    { emoji: "🔍", title: "Cherchez pres de vous", text: "Voyez sur la carte les hotes Wifi autour de vous, et reglez le rayon de recherche (1 a 50 km)." },
    { emoji: "⭐", title: "Avis et hotes verifies", text: "Consultez les notes et avis des autres clients. Un badge 'Verifie' apparait pour les hotes serieux." },
    { emoji: "📨", title: "Envoyez une demande", text: "Choisissez une duree (5min, 1h, 1 jour) et envoyez votre demande a l'hote." },
    { emoji: "💵", title: "Payez en toute confiance", text: "Une fois la demande acceptee, payez en cash ou mobile money directement avec l'hote." },
    { emoji: "🔑", title: "Recevez le mot de passe", text: "Apres confirmation du paiement, le vrai mot de passe Wifi vous est partage." },
    { emoji: "💬", title: "Discutez avec l'hote", text: "Un chat integre vous permet de vous coordonner facilement (lieu, horaire, etc)." },
    { emoji: "🔔", title: "Notifications en direct", text: "Recevez une alerte sonore et une bannière dès qu'un message ou une reponse arrive." },
    { emoji: "🚩", title: "Signalez un probleme", text: "Si un hote ne respecte pas l'accord, signalez-le en un clic." },
    { emoji: "🎮", title: "Mode demo disponible", text: "Pas encore sur ? Essayez l'app en mode demo sans creer de compte." },
  ];

  const hostFeatures = [
    { emoji: "🏠", title: "Creez votre annonce", text: "Donnez un nom a votre Wifi, fixez vos tarifs (par heure, jour ou minute) et ajoutez une description." },
    { emoji: "📍", title: "Position automatique", text: "Votre position est detectee automatiquement, pas besoin de la saisir vous-meme." },
    { emoji: "✏️", title: "Modifiez ou supprimez", text: "Changez vos tarifs ou votre description a tout moment, ou retirez votre annonce." },
    { emoji: "🔌", title: "Activez/desactivez", text: "Mettez votre annonce en ligne ou hors ligne selon votre disponibilite." },
    { emoji: "📥", title: "Recevez des demandes", text: "Voyez les demandes de reservation et choisissez d'accepter ou refuser." },
    { emoji: "💰", title: "Confirmez le paiement", text: "Une fois paye (cash ou mobile money), confirmez-le pour debloquer le mot de passe au client." },
    { emoji: "🔐", title: "Partagez le vrai mot de passe", text: "Renseignez le mot de passe reel de votre hotspot, partage seulement apres paiement." },
    { emoji: "💬", title: "Chattez avec vos clients", text: "Repondez a tous vos clients depuis 'Conversations actives', avec leur numero affiche." },
    { emoji: "🌟", title: "Recevez des avis", text: "Vos clients peuvent vous noter. Plus vous avez d'avis, plus vous gagnez en confiance." },
    { emoji: "📲", title: "Partagez sur WhatsApp", text: "Un clic pour partager votre annonce a vos contacts WhatsApp." },
    { emoji: "🚩", title: "Signalez un client", text: "En cas d'abus, signalez le client directement depuis l'app." },
  ];

  const features = tab === "client" ? clientFeatures : hostFeatures;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoCircle}>
          <Wifi size={32} color="#fff"/>
        </div>
        <h1 style={styles.title}>Bienvenue sur WifiShare 👋</h1>
        <p style={styles.subtitle}>Partagez ou trouvez du Wifi autour de vous</p>
        <p style={styles.dataNote}>📶 Meme avec tres peu de megas, vous pouvez ouvrir l'app et chercher du secours autour de vous.</p>

        <div style={styles.tabs}>
          <button onClick={() => setTab("client")} style={tab==="client" ? styles.tabActive : styles.tab}>🔍 Je cherche du Wifi</button>
          <button onClick={() => setTab("host")} style={tab==="host" ? styles.tabActive : styles.tab}>📡 Je partage mon Wifi</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:18 }}>
          {features.map((s, i) => (
            <div key={i} style={styles.stepRow}>
              <div style={styles.stepIcon}>{s.emoji}</div>
              <div>
                <p style={styles.stepTitle}>{s.title}</p>
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
          🎮 Essayer en mode demo (sans compte)
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
    maxWidth: 440,
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
  stepIcon: { width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #5B5FEF, #8B5FEF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 },
  stepTitle: { fontSize: 14, fontWeight: 700, color: "#1A1B2E", margin: "0 0 2px" },
  stepText: { fontSize: 12, color: "#6B6D85", margin: 0 },
  btn: { marginTop: 24, width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #FF8B5C, #EF5B7A)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  demoBtn: { marginTop: 10, width: "100%", padding: 12, borderRadius: 12, border: "1.5px solid #5B5FEF", background: "transparent", color: "#5B5FEF", fontWeight: 700, fontSize: 13, cursor: "pointer" },
};
