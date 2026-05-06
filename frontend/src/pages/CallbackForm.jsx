import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react";

export default function CallbackForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [i, setI] = useState(null);
  const [form, setForm] = useState({ first_name: "", phone: "", email: "", city: "", need: "", message: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/intervenants/${id}`).then(({ data }) => setI(data));
  }, [id]);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.first_name || !form.city || !form.need) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    if (!form.phone && !form.email) {
      setError("Merci de renseigner un téléphone ou un email.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/callbacks", { intervenant_id: id, ...form });
      setDone(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-10" data-testid="callback-success">
        <div className="bg-white border-2 border-[#2D6A4F] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl mt-4 text-[#1C1917]">Demande envoyée</h1>
          <p className="text-[#4B5563] mt-2 text-lg">
            {i ? `${i.first_name} ${i.last_name}` : "L'intervenant"} sera informé(e) de votre demande de rappel.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to="/patient" data-testid="callback-back-search" className="px-6 py-3 bg-[#2D6A4F] text-white rounded-2xl font-semibold">Retour à la recherche</Link>
            <Link to="/" className="px-6 py-3 border-2 border-[#E5E7EB] text-[#1C1917] rounded-2xl font-semibold">Accueil</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="callback-form-page">
      <Link to={`/patient/intervenant/${id}`} className="inline-flex items-center gap-2 text-[#2D6A4F] font-semibold mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour à la fiche
      </Link>
      <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-10">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#1C1917]">Demander un rappel</h1>
        {i && <p className="text-[#4B5563] mt-1 text-lg">à {i.first_name} {i.last_name} ({i.city})</p>}

        <div className="mt-5 flex items-start gap-3 bg-[#B85042]/10 border-2 border-[#B85042]/30 rounded-xl p-4" data-testid="medical-disclaimer">
          <AlertTriangle className="w-5 h-5 text-[#B85042] mt-0.5" />
          <p className="text-[#1C1917] text-base">
            <span className="font-semibold">Important :</span> Ne renseignez pas d'informations médicales détaillées.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <Field label="Prénom *" htmlFor="f-name">
            <input id="f-name" data-testid="cb-first-name" value={form.first_name} onChange={(e) => setField("first_name", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Téléphone *" htmlFor="f-phone">
            <input id="f-phone" type="tel" data-testid="cb-phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} placeholder="ex: 06 12 34 56 78" />
          </Field>
          <Field label="Email (facultatif)" htmlFor="f-email">
            <input id="f-email" type="email" data-testid="cb-email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="ex: prenom@email.fr" />
          </Field>
          <p className="text-sm text-[#4B5563] -mt-2">Renseignez au moins un téléphone ou un email.</p>
          <Field label="Ville *" htmlFor="f-city">
            <input id="f-city" data-testid="cb-city" value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Besoin général *" htmlFor="f-need">
            <select id="f-need" data-testid="cb-need" value={form.need} onChange={(e) => setField("need", e.target.value)} className={inputCls} required>
              <option value="">Sélectionnez…</option>
              <option>Reprise d'activité</option>
              <option>Prévention / bien-être</option>
              <option>Accompagnement seniors</option>
              <option>Suivi post-hospitalisation</option>
              <option>Autre</option>
            </select>
          </Field>
          <Field label="Message (facultatif)" htmlFor="f-msg">
            <textarea id="f-msg" data-testid="cb-message" rows={4} value={form.message} onChange={(e) => setField("message", e.target.value)} className={`${inputCls} py-3`} />
          </Field>

          {error && <div className="text-[#B85042] text-base font-semibold" data-testid="cb-error">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            data-testid="cb-submit"
            className="w-full min-h-[56px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-2xl font-semibold text-lg"
          >
            {submitting ? "Envoi…" : "Envoyer la demande"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full min-h-[56px] px-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <div className="text-base font-semibold text-[#1C1917] mb-2">{label}</div>
      {children}
    </label>
  );
}
