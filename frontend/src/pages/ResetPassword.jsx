import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, password });
      setMessage(data.message);
      setPassword("");
      setConfirmation("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-md bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
          <h1 className="font-heading font-bold text-3xl">Lien invalide</h1>
          <p className="mt-3 text-[#4B5563]">
            Demandez un nouveau lien de rÃ©initialisation.
          </p>
          <Link
            to="/intervenant/forgot-password"
            className="inline-block mt-5 text-[#2D6A4F] font-semibold"
          >
            Demander un nouveau lien
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
        <h1 className="font-heading font-bold text-3xl text-[#1C1917]">
          Nouveau mot de passe
        </h1>
        <p className="text-[#4B5563] mt-2">
          Choisissez au minimum 12 caractÃ¨res.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <PasswordField
            label="Nouveau mot de passe"
            value={password}
            onChange={setPassword}
          />
          <PasswordField
            label="Confirmer le mot de passe"
            value={confirmation}
            onChange={setConfirmation}
          />
          {message && (
            <div className="rounded-xl bg-[#E8F3ED] p-4 text-[#1B4332]" role="status">
              {message}{" "}
              <Link to="/intervenant/login" className="font-semibold underline">
                Se connecter
              </Link>
            </div>
          )}
          {error && (
            <div className="text-[#B85042] font-semibold" role="alert">
              {error}
            </div>
          )}
          <button
            disabled={loading || password.length < 12}
            className="w-full min-h-[56px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-2xl font-semibold text-lg"
          >
            {loading ? "Modificationâ€¦" : "Modifier le mot de passe"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-base font-semibold mb-2 block">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputCls}
        minLength={12}
        autoComplete="new-password"
        required
      />
    </label>
  );
}

const inputCls =
  "w-full min-h-[56px] px-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";
