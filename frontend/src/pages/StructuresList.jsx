import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { STRUCTURE_TYPES, labelFromKey } from "@/lib/constants";
import { Building2, MapPin, Phone, Mail, Globe, Filter, Armchair, Accessibility, ChevronRight } from "lucide-react";

export default function StructuresList() {
  const [items, setItems] = useState([]);
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (type) params.type = type;
      const { data } = await api.get("/structures", { params });
      setItems(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [type]);

  // group by city
  const grouped = items.reduce((acc, s) => {
    (acc[s.city || "Autre"] = acc[s.city || "Autre"] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="structures-page">
      <header className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">Associations & lieux Sport-Santé</h1>
        </div>
        <p className="text-[#4B5563] text-base md:text-lg">
          Associations, Maisons Sport-Santé, résidences seniors, clubs et mairies partenaires qui accueillent des cours APA — en priorité des cours sur chaise adaptés.
        </p>
      </header>

      <section className="mt-6 bg-white border-2 border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3 text-[#4B5563]"><Filter className="w-4 h-4" /> Filtres</div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            data-testid="structure-filter-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Ville"
            className="min-h-[48px] px-4 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white"
          />
          <select data-testid="structure-filter-type" value={type} onChange={(e) => setType(e.target.value)}
            className="min-h-[48px] px-3 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white">
            <option value="">Tous les types</option>
            {STRUCTURE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <button onClick={load} data-testid="structure-filter-search" className="min-h-[48px] px-5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold">Rechercher</button>
        </div>
      </section>

      <section className="mt-6 space-y-8" data-testid="structures-grouped">
        {loading && <div className="text-[#4B5563]">Chargement…</div>}
        {!loading && items.length === 0 && (
          <div className="bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center text-[#4B5563]">
            Aucune structure pour ces critères. Les structures sont ajoutées par notre équipe — contactez-nous pour référencer la vôtre.
          </div>
        )}
        {Object.keys(grouped).sort().map((cityKey) => (
          <div key={cityKey}>
            <h2 className="font-heading font-bold text-2xl text-[#1C1917] mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2D6A4F]" /> {cityKey}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {grouped[cityKey].map((s) => <StructureCard key={s.id} s={s} />)}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function StructureCard({ s }) {
  const [classes, setClasses] = useState(null);
  const [open, setOpen] = useState(false);

  async function toggle() {
    if (!open && classes === null) {
      try {
        const { data } = await api.get(`/structures/${s.id}/classes`);
        setClasses(data);
      } catch { setClasses([]); }
    }
    setOpen(!open);
  }

  return (
    <article className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5" data-testid={`structure-card-${s.id}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="font-heading font-bold text-xl text-[#1C1917] flex-1">{s.name}</h3>
        <span className="bg-[#74A57F]/15 text-[#1B4332] text-xs font-semibold px-3 py-1 rounded-full">
          {labelFromKey(STRUCTURE_TYPES, s.type)}
        </span>
      </div>

      {s.description && <p className="text-[#4B5563] text-sm mt-2">{s.description}</p>}

      <div className="mt-3 space-y-1 text-base text-[#1C1917]">
        {s.address && <div className="inline-flex items-center gap-2 text-[#4B5563] text-sm"><MapPin className="w-4 h-4" /> {s.address}</div>}
        <div className="flex flex-wrap gap-3 text-sm">
          {s.phone && <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-[#1C1917] hover:text-[#2D6A4F]"><Phone className="w-4 h-4" /> {s.phone}</a>}
          {s.email && <a href={`mailto:${s.email}`} className="inline-flex items-center gap-1 text-[#1C1917] hover:text-[#2D6A4F]"><Mail className="w-4 h-4" /> {s.email}</a>}
          {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#2D6A4F] hover:underline"><Globe className="w-4 h-4" /> Site web</a>}
        </div>
        {s.accessibility_info && (
          <div className="inline-flex items-start gap-2 text-sm text-[#1B4332] bg-[#74A57F]/10 px-3 py-2 rounded-lg mt-2">
            <Accessibility className="w-4 h-4 mt-0.5" /> <span>{s.accessibility_info}</span>
          </div>
        )}
      </div>

      <button onClick={toggle} data-testid={`structure-classes-${s.id}`} className="mt-4 inline-flex items-center gap-1 text-[#2D6A4F] font-semibold text-sm">
        {open ? "Masquer les cours" : "Voir les cours proposés"} <ChevronRight className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-2" data-testid={`structure-classes-list-${s.id}`}>
          {classes === null && <div className="text-sm text-[#4B5563]">Chargement…</div>}
          {Array.isArray(classes) && classes.length === 0 && <div className="text-sm text-[#4B5563] italic">Aucun cours programmé pour le moment.</div>}
          {Array.isArray(classes) && classes.map((c) => (
            <Link key={c.id} to="/cours" className="block border border-[#E5E7EB] rounded-xl p-3 hover:border-[#2D6A4F]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#1C1917]">{c.title}</span>
                {c.adapted_chair_class && (
                  <span className="bg-[#2D6A4F] text-white text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Armchair className="w-3 h-3" /> Sur chaise
                  </span>
                )}
              </div>
              <div className="text-xs text-[#4B5563] mt-1">
                {c.date} • {c.start_time || "—"} • {c.duration_minutes} min • {c.places_left}/{c.capacity} places • {c.intervenant_name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
