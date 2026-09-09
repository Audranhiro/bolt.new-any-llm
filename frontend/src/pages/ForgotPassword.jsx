import { useState } from "react";
import { Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
        <h1 className="font-heading font-bold text-3xl text-[#1C1917]">
          Mot de passe oublié
        </h1>
        <p className="text-[#4B5563] mt-2">
          Indiquez votre email. Si un compte correspond, vous recevrez un lien
          temporaire.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-base font-semibold mb-2 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputCls}
              autoComplete="email"
              required
              data-testid="forgot-password-email"
            />
          </label>
          {message && (
            <div className="rounded-xl bg-[#E8F3ED] p-4 text-[#1B4332]" role="status">
              {message}
            </div>
          )}
          {error && (
            <div className="text-[#B85042] font-semibold" role="alert">
              {error}
            </div>
          )}
          <button
            disabled={loading}
            className="w-full min-h-[56px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-2xl font-semibold text-lg"
          >
            {loading ? "Envoiâ€¦" : "Recevoir le lien"}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/intervenant/login" className="text-[#2D6A4F] font-semibold">
            Retour à la connexion
          </Link>
        </p>
      </section>
    </main>
  );
}

const inputCls =
  "w-full min-h-[56px] px-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";
