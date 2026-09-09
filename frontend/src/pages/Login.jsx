import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function Login({ mode = "intervenant" }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === "admin") navigate("/admin");
      else navigate("/intervenant/dashboard");
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10" data-testid="login-page">
      <div className="w-full max-w-md bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
        <h1 className="font-heading font-bold text-3xl text-[#1C1917]">
          {mode === "admin" ? "Connexion Admin" : "Connexion Intervenant"}
        </h1>
        <p className="text-[#4B5563] mt-1">Accédez à votre espace.</p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block">
            <div className="text-base font-semibold mb-2">Email</div>
            <input type="email" data-testid="login-email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
          </label>
          <label className="block">
            <div className="text-base font-semibold mb-2">Mot de passe</div>
            <input type="password" data-testid="login-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
            <div className="text-right mt-2">
              <Link
                to="/intervenant/forgot-password"
                className="text-[#2D6A4F] font-semibold"
                data-testid="forgot-password-link"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </label>
          {err && <div className="text-[#B85042] font-semibold text-base" data-testid="login-error">{err}</div>}
          <button disabled={loading} data-testid="login-submit" className="w-full min-h-[56px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-2xl font-semibold text-lg">
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {mode !== "admin" && (
          <p className="text-center mt-6 text-[#4B5563]">
            Pas encore de compte ? <Link to="/intervenant/register" className="text-[#2D6A4F] font-semibold" data-testid="to-register">Créer un profil intervenant</Link>
          </p>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full min-h-[56px] px-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";
