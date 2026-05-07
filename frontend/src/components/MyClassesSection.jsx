import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { CLASS_CATEGORIES, CLASS_PUBLICS, labelFromKey } from "@/lib/constants";
import { Armchair, CalendarPlus, Edit, Power, Users, X } from "lucide-react";

const inputCls = "w-full min-h-[48px] px-4 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";

const EMPTY = {
  title: "", description: "", category: "cours_sur_chaise", class_type: "groupe",
  adapted_chair_class: true, target_public: ["seniors"], city: "", address: "",
  date: "", start_time: "", duration_minutes: 60, price: 0, capacity: 8,
};

export default function MyClassesSection() {
  const [classes, setClasses] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} (form state) | obj from list
  const [bookingsFor, setBookingsFor] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/intervenants/me/classes");
      setClasses(data);
    } catch (e) { setErr(formatApiError(e)); }
  }
  useEffect(() => { load(); }, []);

  async function toggleStatus(c) {
    const next = c.status === "active" ? "inactive" : "active";
    await api.patch(`/intervenants/me/classes/${c.id}/status`, { status: next });
    load();
  }

  return (
    <section className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6" data-testid="my-classes-section">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Armchair className="w-6 h-6 text-[#2D6A4F]" />
          <h2 className="font-heading font-bold text-2xl">Mes cours sur chaise / cours collectifs</h2>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          data-testid="class-new-btn"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold"
        >
          <CalendarPlus className="w-4 h-4" /> Créer un cours
        </button>
      </div>

      {classes.length === 0 && (
        <div className="bg-[#F9F8F6] border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center text-[#4B5563]" data-testid="my-classes-empty">
          Aucun cours créé pour le moment.
        </div>
      )}

      <div className="space-y-3">
        {classes.map((c) => (
          <div key={c.id} className={`border-2 rounded-xl p-4 ${c.status === "active" ? "border-[#E5E7EB]" : "border-[#E5E7EB] opacity-60"}`} data-testid={`my-class-${c.id}`}>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-bold text-lg">{c.title}</h3>
                  {c.adapted_chair_class && <span className="bg-[#2D6A4F] text-white text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1"><Armchair className="w-3 h-3" /> Sur chaise</span>}
                  <span className="bg-[#F9F8F6] border border-[#E5E7EB] text-xs font-semibold px-2 py-1 rounded-full">{labelFromKey(CLASS_CATEGORIES, c.category)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.status === "active" ? "bg-[#74A57F] text-white" : "bg-[#4B5563] text-white"}`}>
                    {c.status === "active" ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="text-sm text-[#4B5563] mt-1">
                  {c.date} • {c.start_time || "—"} • {c.duration_minutes} min • {c.city} • {c.booked}/{c.capacity} inscrits • {c.price > 0 ? `${c.price} €` : "Gratuit"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setBookingsFor(c)} data-testid={`class-bookings-${c.id}`} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold">
                  <Users className="w-4 h-4" /> Inscrits ({c.booked})
                </button>
                <button onClick={() => setEditing(c)} data-testid={`class-edit-${c.id}`} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold">
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button onClick={() => toggleStatus(c)} data-testid={`class-toggle-${c.id}`} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold">
                  <Power className="w-4 h-4" /> {c.status === "active" ? "Désactiver" : "Activer"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {err && <div className="mt-3 text-[#B85042]">{err}</div>}

      {editing && <ClassFormDialog c={editing} onClose={(saved) => { setEditing(null); if (saved) load(); }} />}
      {bookingsFor && <BookingsDialog c={bookingsFor} onClose={() => setBookingsFor(null)} onChanged={load} />}
    </section>
  );
}

function ClassFormDialog({ c, onClose }) {
  const isEdit = !!c.id;
  const [form, setForm] = useState({
    title: c.title || "", description: c.description || "",
    category: c.category || "cours_sur_chaise",
    class_type: c.class_type || "groupe",
    adapted_chair_class: c.adapted_chair_class !== false,
    target_public: c.target_public || ["seniors"],
    city: c.city || "", address: c.address || "",
    date: c.date || "", start_time: c.start_time || "",
    duration_minutes: c.duration_minutes || 60,
    price: c.price ?? 0, capacity: c.capacity || 8,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function togglePublic(p) {
    setField("target_public", form.target_public.includes(p) ? form.target_public.filter((x) => x !== p) : [...form.target_public, p]);
  }

  async function submit(e) {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const payload = {
        ...form,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        capacity: parseInt(form.capacity) || 1,
        price: parseFloat(form.price) || 0,
      };
      if (isEdit) await api.put(`/intervenants/me/classes/${c.id}`, payload);
      else await api.post("/intervenants/me/classes", payload);
      onClose(true);
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" data-testid="class-form-dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-2xl">{isEdit ? "Modifier le cours" : "Nouveau cours"}</h3>
          <button onClick={() => onClose(false)} className="p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titre *"><input data-testid="cf-title" required className={inputCls} value={form.title} onChange={(e) => setField("title", e.target.value)} /></Field>
          <Field label="Description"><textarea rows={2} data-testid="cf-desc" className={`${inputCls} py-3`} value={form.description} onChange={(e) => setField("description", e.target.value)} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select data-testid="cf-category" className={inputCls} value={form.category} onChange={(e) => setField("category", e.target.value)}>
                {CLASS_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Type de cours">
              <select data-testid="cf-type" className={inputCls} value={form.class_type} onChange={(e) => setField("class_type", e.target.value)}>
                <option value="groupe">Groupe</option><option value="individuel">Individuel</option><option value="duo">Duo</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#2D6A4F]/5 rounded-xl border-2 border-[#2D6A4F]/30" data-testid="cf-chair">
            <input type="checkbox" checked={form.adapted_chair_class} onChange={(e) => setField("adapted_chair_class", e.target.checked)} className="w-5 h-5 accent-[#2D6A4F]" />
            <Armchair className="w-5 h-5 text-[#2D6A4F]" />
            <span className="text-base font-semibold">Cours sur chaise adapté</span>
          </label>

          <div>
            <div className="text-base font-semibold text-[#1C1917] mb-2">Public concerné</div>
            <div className="flex flex-wrap gap-2">
              {CLASS_PUBLICS.map((p) => (
                <button key={p.key} type="button" onClick={() => togglePublic(p.key)} data-testid={`cf-public-${p.key}`}
                  className={`px-3 py-2 rounded-full border-2 text-sm ${form.target_public.includes(p.key) ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white border-[#E5E7EB]"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville *"><input data-testid="cf-city" required className={inputCls} value={form.city} onChange={(e) => setField("city", e.target.value)} /></Field>
            <Field label="Adresse"><input data-testid="cf-address" className={inputCls} value={form.address} onChange={(e) => setField("address", e.target.value)} /></Field>
            <Field label="Date *"><input type="date" data-testid="cf-date" required className={inputCls} value={form.date} onChange={(e) => setField("date", e.target.value)} /></Field>
            <Field label="Heure (HH:MM)"><input type="time" data-testid="cf-time" className={inputCls} value={form.start_time} onChange={(e) => setField("start_time", e.target.value)} /></Field>
            <Field label="Durée (min)"><input type="number" min="15" data-testid="cf-duration" className={inputCls} value={form.duration_minutes} onChange={(e) => setField("duration_minutes", e.target.value)} /></Field>
            <Field label="Places"><input type="number" min="1" data-testid="cf-capacity" className={inputCls} value={form.capacity} onChange={(e) => setField("capacity", e.target.value)} /></Field>
            <Field label="Prix indicatif (€)"><input type="number" min="0" step="0.5" data-testid="cf-price" className={inputCls} value={form.price} onChange={(e) => setField("price", e.target.value)} /></Field>
          </div>

          {err && <div className="text-[#B85042] font-semibold">{err}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => onClose(false)} className="flex-1 min-h-[48px] border-2 border-[#E5E7EB] rounded-xl font-semibold">Annuler</button>
            <button type="submit" disabled={saving} data-testid="cf-submit" className="flex-1 min-h-[48px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-xl font-semibold">
              {saving ? "Enregistrement…" : (isEdit ? "Enregistrer" : "Créer le cours")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingsDialog({ c, onClose, onChanged }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get(`/intervenants/me/classes/${c.id}/bookings`);
    setList(data);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function setStatus(b, status) {
    await api.patch(`/intervenants/me/bookings/${b.id}/status`, { status });
    await load();
    onChanged();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" data-testid="bookings-dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-xl">Inscrits — {c.title}</h3>
          <button onClick={onClose} className="p-2"><X className="w-5 h-5" /></button>
        </div>
        {loading && <div>Chargement…</div>}
        {!loading && list.length === 0 && <div className="text-center text-[#4B5563] p-8">Aucune inscription pour ce cours.</div>}
        {list.map((b) => (
          <div key={b.id} className="border-2 border-[#E5E7EB] rounded-xl p-3 mb-3" data-testid={`booking-${b.id}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-sm text-[#4B5563]">{b.phone} {b.phone && b.email && "•"} {b.email}</div>
                <div className="text-xs text-[#4B5563] mt-1">Le {new Date(b.created_at).toLocaleString("fr-FR")}</div>
              </div>
              <select
                data-testid={`booking-status-${b.id}`}
                value={b.status}
                onChange={(e) => setStatus(b, e.target.value)}
                className="min-h-[40px] px-3 text-sm rounded-xl border-2 border-[#E5E7EB] bg-white"
              >
                <option value="reserved">Réservé</option>
                <option value="attended">Présent</option>
                <option value="no_show">Absent</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-base font-semibold text-[#1C1917] mb-2">{label}</div>
      {children}
    </label>
  );
}
