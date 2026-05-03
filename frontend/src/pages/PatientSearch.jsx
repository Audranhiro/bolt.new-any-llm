import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import IntervenantCard from "@/components/IntervenantCard";
import MapView from "@/components/MapView";
import { Search, Filter, MapIcon, List } from "lucide-react";

const FILTERS = [
  { key: "available_today", label: "Disponible aujourd'hui" },
  { key: "available_week", label: "Disponible cette semaine" },
  { key: "home", label: "À domicile" },
  { key: "verified", label: "Diplôme vérifié" },
];

export default function PatientSearch() {
  const [city, setCity] = useState("");
  const [filters, setFilters] = useState({ available_today: false, available_week: false, home: false, verified: false });
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list"); // mobile toggle: list/map

  async function search() {
    setLoading(true);
    try {
      const params = { ...filters };
      if (city) params.city = city;
      const { data } = await api.get("/intervenants", { params });
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search(); /* eslint-disable-next-line */ }, []);

  function toggle(key) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="patient-search-page">
      <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">Trouver un intervenant APA</h1>
      <p className="text-[#4B5563] text-base md:text-lg mt-2">Recherchez un professionnel autour de chez vous.</p>

      {/* Search bar */}
      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <label className="sr-only" htmlFor="city-input">Ville</label>
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563]" />
          <input
            id="city-input"
            data-testid="city-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Entrez une ville (ex: Rouen)"
            className="w-full min-h-[56px] pl-12 pr-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white"
          />
        </div>
        <button
          onClick={search}
          data-testid="search-btn"
          className="min-h-[56px] px-8 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold text-lg"
        >
          Rechercher
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[#4B5563] text-sm mt-2 mr-1">
          <Filter className="w-4 h-4" /> Filtres :
        </div>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { toggle(f.key); setTimeout(search, 0); }}
            data-testid={`filter-${f.key}`}
            className={`px-4 py-2 rounded-full border-2 text-base font-medium transition-colors ${
              filters[f.key]
                ? "bg-[#2D6A4F] text-white border-[#2D6A4F]"
                : "bg-white text-[#1C1917] border-[#E5E7EB] hover:border-[#2D6A4F]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mobile view toggle */}
      <div className="mt-6 md:hidden inline-flex bg-white border-2 border-[#E5E7EB] rounded-xl p-1">
        <button
          data-testid="view-list-btn"
          onClick={() => setView("list")}
          className={`px-4 py-2 rounded-lg text-base font-semibold inline-flex items-center gap-2 ${view === "list" ? "bg-[#2D6A4F] text-white" : "text-[#1C1917]"}`}
        >
          <List className="w-4 h-4" /> Liste
        </button>
        <button
          data-testid="view-map-btn"
          onClick={() => setView("map")}
          className={`px-4 py-2 rounded-lg text-base font-semibold inline-flex items-center gap-2 ${view === "map" ? "bg-[#2D6A4F] text-white" : "text-[#1C1917]"}`}
        >
          <MapIcon className="w-4 h-4" /> Carte
        </button>
      </div>

      <p className="mt-6 text-sm text-[#4B5563] italic" data-testid="disclaimer-text">
        Disponibilités déclarées par l'intervenant, à confirmer lors de la prise de contact.
      </p>

      {/* Content */}
      <div className="mt-5 grid md:grid-cols-2 gap-6">
        <div className={`${view === "map" ? "hidden md:block" : ""} space-y-4`} data-testid="results-list">
          {loading && <div className="text-[#4B5563]">Chargement…</div>}
          {!loading && list.length === 0 && (
            <div className="bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center text-[#4B5563]">
              Aucun intervenant trouvé avec ces critères.
            </div>
          )}
          {list.map((i) => <IntervenantCard key={i.id} i={i} />)}
        </div>
        <div className={`${view === "list" ? "hidden md:block" : ""} h-[500px] md:h-[calc(100vh-260px)] md:sticky md:top-24 rounded-2xl overflow-hidden border-2 border-[#E5E7EB]`}>
          <MapView items={list} />
        </div>
      </div>
    </div>
  );
}
