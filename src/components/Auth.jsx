import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      });
      setLoading(false);
      if (error) setError(error.message);
      else setInfo("Un email de confirmation vous a ete envoye. Cliquez sur le lien dans cet email pour activer votre compte, puis connectez-vous.");
    } else if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) setError(error.message);
      else setInfo("Un email de reinitialisation a ete envoye. Suivez le lien pour choisir un nouveau mot de passe.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setError(error.message);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.watermark}>KIVU CULTURE HUB</div>

      <div style={styles.card}>
        <div style={styles.logoCircle}>
          <span style={{ fontSize: 30, fontWeight: 800, color: "#fff" }}>W</span>
        </div>
        <h2 style={styles.title}>
          {mode === "signup" ? "Creer un compte" : mode === "reset" ? "Mot de passe oublie" : "Bon retour"}
        </h2>
        <p style={styles.subtitle}>
          {mode === "signup"
            ? "Rejoignez WifiShare et partagez votre connexion"
            : mode === "reset"
            ? "Recevez un lien pour reinitialiser votre mot de passe"
            : "Connectez-vous a votre compte WifiShare"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <>
              <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
              <input placeholder="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} required style={styles.input} />
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
          {mode !== "reset" && (
            <input type="password" placeholder="Mot de passe (6 caracteres min)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={styles.input} />
          )}

          {error && <p style={styles.error}>{error}</p>}
          {info && <p style={styles.info}>{info}</p>}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "..." : mode === "signup" ? "Creer mon compte" : mode === "reset" ? "Envoyer le lien" : "Se connecter"}
          </button>
        </form>

        {mode === "login" && (
          <button onClick={() => { setMode("reset"); setError(""); setInfo(""); }} style={styles.linkBtn}>
            Mot de passe oublie ?
          </button>
        )}

        <button
          onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setInfo(""); }}
          style={styles.linkBtnMain}
        >
          {mode === "signup" ? "J'ai deja un compte" : "Creer un nouveau compte"}
        </button>

        {mode === "reset" && (
          <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={styles.linkBtn}>
            Retour a la connexion
          </button>
        )}

        <p style={styles.contact}>
          Probleme de connexion ? Ecrivez-nous : <a href="mailto:kivuculturehub@gmail.com" style={{ color: "#0F6B5C" }}>kivuculturehub@gmail.com</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0F6B5C 0%, #E8862B 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "sans-serif",
    padding: 16,
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-20deg)",
    fontSize: "min(20vw, 140px)",
    fontWeight: 900,
    color: "rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    userSelect: "none",
    letterSpacing: 4,
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 380,
    background: "rgba(255,255,255,0.97)",
    borderRadius: 20,
    padding: "32px 28px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#E8862B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 6px 16px rgba(232,134,43,0.4)",
  },
  title: { textAlign: "center", margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#222" },
  subtitle: { textAlign: "center", margin: "0 0 20px", fontSize: 13, color: "#777" },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #E0E0E0",
    fontSize: 14,
    outline: "none",
  },
  btn: {
    padding: 13,
    borderRadius: 10,
    border: "none",
    background: "#E8862B",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 4,
  },
  linkBtn: {
    marginTop: 10,
    background: "none",
    border: "none",
    color: "#0F6B5C",
    cursor: "pointer",
    fontSize: 13,
    textAlign: "center",
  },
  linkBtnMain: {
    marginTop: 14,
    background: "none",
    border: "none",
    color: "#0F6B5C",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },
  error: { color: "#D9534F", fontSize: 13, margin: 0 },
  info: { color: "#0F6B5C", fontSize: 13, margin: 0, background: "#E6F4F1", padding: 10, borderRadius: 8 },
  contact: { marginTop: 20, fontSize: 11, color: "#999", textAlign: "center" },
};
