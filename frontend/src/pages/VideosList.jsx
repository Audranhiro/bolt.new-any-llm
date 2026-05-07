import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { VIDEO_CATEGORIES, VIDEO_LEVELS, CLASS_PUBLICS, labelFromKey } from "@/lib/constants";
import { Armchair, PlayCircle, Filter, ShieldAlert, Crown, ExternalLink } from "lucide-react";

const VIDEO_DISCLAIMER = "Ces vidéos ne remplacent pas un avis médical. Adaptez les exercices à vos capacités et arrêtez en cas de douleur inhabituelle, malaise ou essoufflement anormal.";

export default function VideosList() {
  const [items, setItems] = useState([]);
  const [chairOnly, setChairOnly] = useState(true);
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (chairOnly) params.chair = true;
      if (category) params.category = category;
      if (level) params.level = level;
      const { data } = await api.get("/videos", { params });
      setItems(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [chairOnly, category, level]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="videos-page">
      <section className="bg-white border-2 border-[#2D6A4F] rounded-2xl p-6 md:p-8" data-testid="chair-video-hero">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center">
            <Armchair className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">Vidéos APA sur chaise</h1>
            <p className="text-[#4B5563] text-base md:text-lg mt-1">Notre contenu principal : séances <strong>sur chaise</strong> à refaire à la maison.</p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 bg-[#B85042]/10 border-2 border-[#B85042]/30 rounded-xl p-4">
          <ShieldAlert className="w-5 h-5 text-[#B85042] mt-0.5 shrink-0" />
          <p className="text-[#1C1917] text-base">{VIDEO_DISCLAIMER}</p>
        </div>
      </section>

      <section className="mt-6 bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3 text-[#4B5563]"><Filter className="w-4 h-4" /> Filtres</div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 cursor-pointer" data-testid="video-filter-chair">
            <input type="checkbox" checked={chairOnly} onChange={(e) => setChairOnly(e.target.checked)} className="w-5 h-5 accent-[#2D6A4F]" />
            <span className="text-base font-semibold">Uniquement les vidéos sur chaise</span>
          </label>
          <select data-testid="video-filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-[48px] px-3 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white">
            <option value="">Toutes les catégories</option>
            {VIDEO_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select data-testid="video-filter-level" value={level} onChange={(e) => setLevel(e.target.value)} className="min-h-[48px] px-3 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white">
            <option value="">Tous niveaux</option>
            {VIDEO_LEVELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </section>

      <section className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="videos-list">
        {loading && <div className="text-[#4B5563]">Chargement…</div>}
        {!loading && items.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center text-[#4B5563]">
            Aucune vidéo disponible pour ces critères.
          </div>
        )}
        {items.map((v) => <VideoCard key={v.id} v={v} />)}
      </section>
    </div>
  );
}

function VideoCard({ v }) {
  const isPremium = v.access_level === "premium";
  return (
    <article className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 flex flex-col" data-testid={`video-card-${v.id}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="font-heading font-bold text-xl text-[#1C1917] flex-1">{v.title}</h3>
        {v.adapted_chair_video && (
          <span className="inline-flex items-center gap-1 bg-[#2D6A4F] text-white text-xs font-semibold px-2 py-1 rounded-full">
            <Armchair className="w-3 h-3" /> Sur chaise
          </span>
        )}
      </div>

      {v.description && <p className="text-[#4B5563] text-sm mt-2 line-clamp-3">{v.description}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="bg-[#F9F8F6] border border-[#E5E7EB] text-[#1C1917] text-xs font-semibold px-2 py-1 rounded-full">
          {labelFromKey(VIDEO_CATEGORIES, v.category)}
        </span>
        <span className="bg-[#F9F8F6] border border-[#E5E7EB] text-[#1C1917] text-xs font-semibold px-2 py-1 rounded-full">
          {labelFromKey(VIDEO_LEVELS, v.level)}
        </span>
        {v.duration_minutes > 0 && (
          <span className="bg-[#F9F8F6] border border-[#E5E7EB] text-[#1C1917] text-xs font-semibold px-2 py-1 rounded-full">
            {v.duration_minutes} min
          </span>
        )}
        {isPremium ? (
          <span className="inline-flex items-center gap-1 bg-[#B85042] text-white text-xs font-semibold px-2 py-1 rounded-full">
            <Crown className="w-3 h-3" /> Premium bientôt
          </span>
        ) : (
          <span className="bg-[#74A57F] text-white text-xs font-semibold px-2 py-1 rounded-full">Gratuit</span>
        )}
      </div>

      {v.target_public.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {v.target_public.map((p) => (
            <span key={p} className="bg-[#74A57F]/15 text-[#1B4332] text-xs font-semibold px-2 py-1 rounded-full">
              {labelFromKey(CLASS_PUBLICS, p)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        {v.intervenant_name && <div className="text-sm text-[#4B5563]">Par {v.intervenant_name}</div>}
        <a
          href={v.video_url}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={`video-watch-${v.id}`}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold text-base"
        >
          <PlayCircle className="w-4 h-4" /> Regarder <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
