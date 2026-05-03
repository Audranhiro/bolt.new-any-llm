import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await register(form);
      navigate("/intervenant/dashboard");
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10" data-testid="register-page">
      <div className="w-full max-w-md bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
        <h1 className="font-heading font-bold text-3xl text-[#1C1917]">Créer mon profil intervenant</h1>
        <p className="text-[#4B5563] mt-1">Inscrivez-vous pour gérer vos disponibilités.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="text-base font-semibold mb-2">Prénom</div>
              <input data-testid="reg-first-name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} required />
            </label>
            <label className="block">
              <div className="text-base font-semibold mb-2">Nom</div>
              <input data-testid="reg-last-name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} required />
            </label>
          </div>
          <label className="block">
            <div className="text-base font-semibold mb-2">Email</div>
            <input type="email" data-testid="reg-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required />
          </label>
          <label className="block">
            <div className="text-base font-semibold mb-2">Mot de passe</div>
            <input type="password" data-testid="reg-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} required minLength={6} />
          </label>
          {err && <div className="text-[#B85042] font-semibold" data-testid="reg-error">{err}</div>}
          <button disabled={loading} data-testid="reg-submit" className="w-full min-h-[56px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-2xl font-semibold text-lg">
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center mt-6 text-[#4B5563]">
          Déjà un compte ? <Link to="/intervenant/login" className="text-[#2D6A4F] font-semibold" data-testid="to-login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

const inputCls = "w-full min-h-[56px] px-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";
