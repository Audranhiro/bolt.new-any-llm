import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CLASS_CATEGORIES, CLASS_PUBLICS, labelFromKey } from "@/lib/constants";
import { Armchair, MapPin, Calendar, Clock, Users, Filter, ShieldAlert, Check } from "lucide-react";

const FREE_DISCLAIMER = "Cours adaptés, doux et progressifs. En cas de doute médical, demandez l'avis de votre médecin.";

export default function ClassesList() {
  const [items, setItems] = useState([]);
  const [chairOnly, setChairOnly] = useState(true);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingFor, setBookingFor] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (chairOnly) params.chair = true;
      if (city) params.city = city;
      if (category) params.category = category;
      const { data } = await api.get("/classes", { params });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [chairOnly, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="classes-page">
      {/* Hero — cours sur chaise mis en avant */}
      <section className="bg-white border-2 border-[#2D6A4F] rounded-2xl p-6 md:p-8" data-testid="chair-hero">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center">
            <Armchair className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">Cours sur chaise & cours collectifs</h1>
            <p className="text-[#4B5563] text-base md:text-lg mt-1">Notre offre principale : cours APA <strong>sur chaise</strong>, doux et progressifs, près de chez vous.</p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 bg-[#74A57F]/10 border-2 border-[#74A57F]/30 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-[#2D6A4F] mt-0.5 shrink-0" />
          <p className="text-[#1C1917] text-base">{FREE_DISCLAIMER}</p>
        </div>
      </section>

      {/* Filtres */}
      <section className="mt-6 bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3 text-[#4B5563]"><Filter className="w-4 h-4" /> Filtres</div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 cursor-pointer" data-testid="filter-chair-only">
            <input type="checkbox" checked={chairOnly} onChange={(e) => setChairOnly(e.target.checked)} className="w-5 h-5 accent-[#2D6A4F]" />
            <span className="text-base font-semibold">Uniquement les cours sur chaise</span>
          </label>
          <input
            data-testid="filter-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Ville"
            className="min-h-[48px] px-4 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white"
          />
          <select
            data-testid="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-[48px] px-3 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white"
          >
            <option value="">Toutes les catégories</option>
            {CLASS_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button onClick={load} data-testid="filter-search" className="min-h-[48px] px-5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold text-base">Rechercher</button>
        </div>
      </section>

      {/* Liste */}
      <section className="mt-6 grid md:grid-cols-2 gap-5" data-testid="classes-list">
        {loading && <div className="text-[#4B5563]">Chargement…</div>}
        {!loading && items.length === 0 && (
          <div className="md:col-span-2 bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center text-[#4B5563]">
            Aucun cours disponible avec ces critères.
          </div>
        )}
        {items.map((c) => <ClassCard key={c.id} c={c} onBook={() => setBookingFor(c)} />)}
      </section>

      {bookingFor && <BookingDialog c={bookingFor} onClose={(ok) => { setBookingFor(null); if (ok) load(); }} />}
    </div>
  );
}

function ClassCard({ c, onBook }) {
  const full = c.places_left <= 0;
  return (
    <article className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 md:p-6" data-testid={`class-card-${c.id}`}>
      <div className="flex items-start justify-between flex-wrap gap-2">
        <h3 className="font-heading font-bold text-xl md:text-2xl text-[#1C1917]">{c.title}</h3>
        <div className="flex flex-wrap gap-2">
          {c.adapted_chair_class && (
            <span className="inline-flex items-center gap-1 bg-[#2D6A4F] text-white text-sm font-semibold px-3 py-1 rounded-full">
              <Armchair className="w-4 h-4" /> Sur chaise
            </span>
          )}
          <span className="bg-[#F9F8F6] border border-[#E5E7EB] text-[#1C1917] text-sm font-semibold px-3 py-1 rounded-full">
            {labelFromKey(CLASS_CATEGORIES, c.category)}
          </span>
        </div>
      </div>

      {c.description && <p className="text-[#4B5563] text-base mt-2">{c.description}</p>}

      <div className="mt-3 grid grid-cols-2 gap-2 text-base text-[#1C1917]">
        <div className="inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-[#4B5563]" /> {c.city}</div>
        <div className="inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-[#4B5563]" /> {c.date}</div>
        <div className="inline-flex items-center gap-2"><Clock className="w-4 h-4 text-[#4B5563]" /> {c.start_time || "—"} ({c.duration_minutes} min)</div>
        <div className="inline-flex items-center gap-2"><Users className="w-4 h-4 text-[#4B5563]" /> {c.places_left}/{c.capacity} places</div>
      </div>

      {c.address && <div className="mt-2 text-sm text-[#4B5563]">📍 {c.address}</div>}

      {c.target_public.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {c.target_public.map((p) => (
            <span key={p} className="bg-[#74A57F]/15 text-[#1B4332] text-xs font-semibold px-2 py-1 rounded-full">
              {labelFromKey(CLASS_PUBLICS, p)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm text-[#4B5563]">Prix indicatif</div>
          <div className="font-heading font-bold text-2xl text-[#1C1917]">{c.price > 0 ? `${c.price} €` : "Gratuit"}</div>
          {c.intervenant_name && <div className="text-sm text-[#4B5563] mt-1">Avec {c.intervenant_name}</div>}
        </div>
        <button
          onClick={onBook}
          disabled={full}
          data-testid={`class-book-${c.id}`}
          className={`min-h-[48px] px-5 rounded-2xl font-semibold text-base ${full ? "bg-[#E5E7EB] text-[#4B5563] cursor-not-allowed" : "bg-[#2D6A4F] hover:bg-[#1B4332] text-white"}`}
        >
          {full ? "Complet" : "Réserver ma place"}
        </button>
      </div>
    </article>
  );
}

function BookingDialog({ c, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.name) return setErr("Merci d'indiquer votre nom.");
    if (!form.email && !form.phone) return setErr("Merci d'indiquer un email ou un téléphone.");
    setLoading(true);
    try {
      const { data } = await api.post(`/classes/${c.id}/book`, form);
      setBookingId(data.id);
      setDone(true);
    } catch (e) { setErr(formatApiError(e)); } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" data-testid="booking-dialog">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        {!done ? (
          <>
            <h3 className="font-heading font-bold text-2xl text-[#1C1917]">Réserver : {c.title}</h3>
            <p className="text-[#4B5563] text-sm mt-1">{c.date} • {c.start_time} • {c.city}</p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <Input label="Votre nom *" testid="book-name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Input label="Email" testid="book-email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Input label="Téléphone" testid="book-phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
              <p className="text-sm text-[#4B5563]">Email ou téléphone obligatoire.</p>
              {err && <div className="text-[#B85042] font-semibold" data-testid="book-error">{err}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => onClose(false)} className="flex-1 min-h-[48px] border-2 border-[#E5E7EB] rounded-xl font-semibold">Annuler</button>
                <button type="submit" disabled={loading} data-testid="book-submit" className="flex-1 min-h-[48px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-xl font-semibold">
                  {loading ? "Envoi…" : "Confirmer"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center" data-testid="book-success">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#2D6A4F] text-white flex items-center justify-center"><Check className="w-7 h-7" /></div>
            <h3 className="font-heading font-bold text-2xl mt-4">Réservation confirmée</h3>
            <p className="text-[#4B5563] mt-2">Votre place est réservée pour {c.title} ({c.date}).</p>
            {bookingId && <p className="text-xs text-[#4B5563] mt-2 break-all">Réf : {bookingId}</p>}
            <button onClick={() => onClose(true)} className="mt-5 min-h-[48px] px-6 bg-[#2D6A4F] text-white rounded-xl font-semibold">Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, testid, type = "text" }) {
  return (
    <label className="block">
      <div className="text-base font-semibold text-[#1C1917] mb-2">{label}</div>
      <input
        data-testid={testid}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[48px] px-4 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white"
      />
    </label>
  );
}
