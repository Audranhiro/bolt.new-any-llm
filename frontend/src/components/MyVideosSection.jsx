import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { VIDEO_CATEGORIES, VIDEO_LEVELS, CLASS_PUBLICS, labelFromKey } from "@/lib/constants";
import { Armchair, Video, Edit, Power, X, Plus, ExternalLink } from "lucide-react";

const inputCls = "w-full min-h-[48px] px-4 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";

const EMPTY = {
  title: "", description: "", video_url: "",
  category: "exercices_sur_chaise", video_type: "exercice",
  adapted_chair_video: true, level: "debutant",
  target_public: ["seniors"], duration_minutes: 10, access_level: "free",
};

export default function MyVideosSection() {
  const [videos, setVideos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/intervenants/me/videos");
      setVideos(data);
    } catch (e) { setErr(formatApiError(e)); }
  }
  useEffect(() => { load(); }, []);

  async function toggleStatus(v) {
    const next = v.status === "active" ? "inactive" : "active";
    await api.patch(`/intervenants/me/videos/${v.id}/status`, { status: next });
    load();
  }

  return (
    <section className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6" data-testid="my-videos-section">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-[#2D6A4F]" />
          <h2 className="font-heading font-bold text-2xl">Mes vidéos APA</h2>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} data-testid="video-new-btn" className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold">
          <Plus className="w-4 h-4" /> Ajouter une vidéo
        </button>
      </div>

      {videos.length === 0 && (
        <div className="bg-[#F9F8F6] border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center text-[#4B5563]" data-testid="my-videos-empty">
          Aucune vidéo publiée pour le moment.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {videos.map((v) => (
          <div key={v.id} className={`border-2 rounded-xl p-4 ${v.status === "active" ? "border-[#E5E7EB]" : "border-[#E5E7EB] opacity-60"}`} data-testid={`my-video-${v.id}`}>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-base flex-1">{v.title}</h3>
              {v.adapted_chair_video && <span className="bg-[#2D6A4F] text-white text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1"><Armchair className="w-3 h-3" /> Chaise</span>}
            </div>
            <div className="text-xs text-[#4B5563] mt-2 flex flex-wrap gap-1">
              <span className="bg-[#F9F8F6] border border-[#E5E7EB] px-2 py-1 rounded-full">{labelFromKey(VIDEO_CATEGORIES, v.category)}</span>
              <span className="bg-[#F9F8F6] border border-[#E5E7EB] px-2 py-1 rounded-full">{labelFromKey(VIDEO_LEVELS, v.level)}</span>
              <span className="bg-[#F9F8F6] border border-[#E5E7EB] px-2 py-1 rounded-full">{v.duration_minutes} min</span>
              <span className={`px-2 py-1 rounded-full font-semibold ${v.access_level === "premium" ? "bg-[#B85042] text-white" : v.access_level === "private" ? "bg-[#4B5563] text-white" : "bg-[#74A57F] text-white"}`}>
                {v.access_level === "premium" ? "Premium bientôt" : v.access_level === "private" ? "Privé" : "Gratuit"}
              </span>
              <span className={`px-2 py-1 rounded-full font-semibold ${v.status === "active" ? "bg-[#74A57F] text-white" : "bg-[#4B5563] text-white"}`}>
                {v.status === "active" ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2D6A4F] text-sm font-semibold underline" data-testid={`my-video-open-${v.id}`}>
                <ExternalLink className="w-3 h-3" /> Ouvrir
              </a>
              <div className="flex gap-2">
                <button onClick={() => setEditing(v)} data-testid={`video-edit-${v.id}`} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold">
                  <Edit className="w-3 h-3" /> Modifier
                </button>
                <button onClick={() => toggleStatus(v)} data-testid={`video-toggle-${v.id}`} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold">
                  <Power className="w-3 h-3" /> {v.status === "active" ? "Désactiver" : "Activer"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {err && <div className="mt-3 text-[#B85042]">{err}</div>}

      {editing && <VideoFormDialog v={editing} onClose={(saved) => { setEditing(null); if (saved) load(); }} />}
    </section>
  );
}

function VideoFormDialog({ v, onClose }) {
  const isEdit = !!v.id;
  const [form, setForm] = useState({
    title: v.title || "", description: v.description || "",
    video_url: v.video_url || "",
    category: v.category || "exercices_sur_chaise",
    video_type: v.video_type || "exercice",
    adapted_chair_video: v.adapted_chair_video !== false,
    level: v.level || "debutant",
    target_public: v.target_public || ["seniors"],
    duration_minutes: v.duration_minutes || 10,
    access_level: v.access_level || "free",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  function setField(k, val) { setForm((f) => ({ ...f, [k]: val })); }
  function togglePublic(p) {
    setField("target_public", form.target_public.includes(p) ? form.target_public.filter((x) => x !== p) : [...form.target_public, p]);
  }

  async function submit(e) {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const payload = { ...form, duration_minutes: parseInt(form.duration_minutes) || 0 };
      if (isEdit) await api.put(`/intervenants/me/videos/${v.id}`, payload);
      else await api.post("/intervenants/me/videos", payload);
      onClose(true);
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" data-testid="video-form-dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-2xl">{isEdit ? "Modifier la vidéo" : "Nouvelle vidéo"}</h3>
          <button onClick={() => onClose(false)} className="p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titre *"><input data-testid="vf-title" required className={inputCls} value={form.title} onChange={(e) => setField("title", e.target.value)} /></Field>
          <Field label="URL vidéo *"><input data-testid="vf-url" type="url" required className={inputCls} placeholder="https://www.youtube.com/watch?v=..." value={form.video_url} onChange={(e) => setField("video_url", e.target.value)} /></Field>
          <Field label="Description"><textarea rows={2} data-testid="vf-desc" className={`${inputCls} py-3`} value={form.description} onChange={(e) => setField("description", e.target.value)} /></Field>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#2D6A4F]/5 rounded-xl border-2 border-[#2D6A4F]/30" data-testid="vf-chair">
            <input type="checkbox" checked={form.adapted_chair_video} onChange={(e) => setField("adapted_chair_video", e.target.checked)} className="w-5 h-5 accent-[#2D6A4F]" />
            <Armchair className="w-5 h-5 text-[#2D6A4F]" />
            <span className="text-base font-semibold">Vidéo d'exercices sur chaise</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select data-testid="vf-category" className={inputCls} value={form.category} onChange={(e) => setField("category", e.target.value)}>
                {VIDEO_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Niveau">
              <select data-testid="vf-level" className={inputCls} value={form.level} onChange={(e) => setField("level", e.target.value)}>
                {VIDEO_LEVELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Durée (min)"><input type="number" min="1" data-testid="vf-duration" className={inputCls} value={form.duration_minutes} onChange={(e) => setField("duration_minutes", e.target.value)} /></Field>
            <Field label="Accès">
              <select data-testid="vf-access" className={inputCls} value={form.access_level} onChange={(e) => setField("access_level", e.target.value)}>
                <option value="free">Gratuit</option>
                <option value="premium">Premium (bientôt)</option>
                <option value="private">Privé</option>
              </select>
            </Field>
          </div>

          <div>
            <div className="text-base font-semibold text-[#1C1917] mb-2">Public concerné</div>
            <div className="flex flex-wrap gap-2">
              {CLASS_PUBLICS.map((p) => (
                <button key={p.key} type="button" onClick={() => togglePublic(p.key)} data-testid={`vf-public-${p.key}`}
                  className={`px-3 py-2 rounded-full border-2 text-sm ${form.target_public.includes(p.key) ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white border-[#E5E7EB]"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {err && <div className="text-[#B85042] font-semibold">{err}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => onClose(false)} className="flex-1 min-h-[48px] border-2 border-[#E5E7EB] rounded-xl font-semibold">Annuler</button>
            <button type="submit" disabled={saving} data-testid="vf-submit" className="flex-1 min-h-[48px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-xl font-semibold">
              {saving ? "Enregistrement…" : (isEdit ? "Enregistrer" : "Publier la vidéo")}
            </button>
          </div>
        </form>
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
