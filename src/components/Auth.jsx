import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      });
      setLoading(false);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setError(error.message);
    }
  }

  return (
    <div style={{ maxWidth: 340, margin: "70px auto", fontFamily: "sans-serif", padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>{mode === "signup" ? "Créer un compte" : "Se connecter"}</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mode === "signup" && (
          <>
            <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            <input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} required style={inputStyle} />
          </>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Mot de passe (6 caractères min)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
        {error && <p style={{ color: "#D9534F", fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "signup" ? "login" : "signup")}
        style={{ marginTop: 14, background: "none", border: "none", color: "#0F6B5C", cursor: "pointer", fontSize: 13 }}
      >
        {mode === "signup" ? "J'ai déjà un compte" : "Créer un nouveau compte"}
      </button>
    </div>
  );
}

const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #D9E2DA", fontSize: 14 };
const btnStyle = { padding: 11, borderRadius: 8, border: "none", background: "#E8862B", color: "#fff", fontWeight: 700, cursor: "pointer" };