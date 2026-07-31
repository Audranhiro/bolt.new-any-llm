import { Link } from "react-router-dom";
import { Search, UserCog, HeartHandshake, ShieldCheck, Map, FileText, Armchair, Building2, ArrowRight, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-81px)]" data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-[#74A57F]/20 blur-3xl" />
          <div className="absolute top-40 -left-24 w-[320px] h-[320px] rounded-full bg-[#B85042]/10 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-5 md:px-10 pt-14 pb-10 md:pt-24 md:pb-16">
          <span className="inline-flex items-center gap-2 bg-white border-2 border-[#E5E7EB] px-4 py-2 rounded-full text-sm font-semibold text-[#2D6A4F]">
            <HeartHandshake className="w-4 h-4" /> Activité Physique Adaptée
          </span>
          <h1 className="font-heading font-bold tracking-tight text-[#1C1917] text-4xl sm:text-5xl lg:text-6xl mt-6 leading-tight">
            Trouvez un intervenant APA <span className="text-[#2D6A4F]">proche de chez vous</span>.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-[#4B5563] max-w-2xl">
            APA Connect met en relation patients et professionnels de l'activité physique adaptée, avec des disponibilités mises à jour chaque semaine.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Link
              to="/patient"
              data-testid="home-patient-btn"
              className="group bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-2xl p-6 md:p-8 flex items-center gap-5 min-h-[120px] transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-xl md:text-2xl font-heading font-bold">Je cherche un intervenant APA</div>
                <div className="text-sm md:text-base text-white/85 mt-1">Recherche par ville, filtres, prise de contact</div>
              </div>
            </Link>

            <Link
              to="/intervenant/login"
              data-testid="home-intervenant-btn"
              className="group bg-white hover:bg-[#F9F8F6] text-[#1C1917] border-2 border-[#E5E7EB] hover:border-[#2D6A4F] rounded-2xl p-6 md:p-8 flex items-center gap-5 min-h-[120px] transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F]/10 flex items-center justify-center text-[#2D6A4F]">
                <UserCog className="w-7 h-7" />
              </div>
              <div className="text-left">
                <div className="text-xl md:text-2xl font-heading font-bold">Je suis intervenant APA</div>
                <div className="text-sm md:text-base text-[#4B5563] mt-1">Créer mon profil et mes disponibilités</div>
              </div>
            </Link>
          </div>

          <Link
            to="/cours"
              data-testid="home-courses-btn"
                className="mt-5 group bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-2xl p-5 md:p-6 flex items-center gap-4 min-h-[104px] transition-colors shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                      <Armchair className="w-6 h-6" />
                        </div>
                          <div className="text-left">
                              <div className="font-heading font-bold text-xl md:text-2xl">
                                    Réserver un cours sur chaise
                                        </div>
                                            <div className="text-sm md:text-base text-white/85 mt-1">
                                                  Cours doux, adaptés et progressifs, près de chez vous
                                                      </div>
                                                        </div>
                                                        </Link>

          <Link
            to="/kit-documents"
            data-testid="home-kit-btn"
            className="mt-5 inline-flex items-center gap-3 bg-white hover:bg-[#F9F8F6] text-[#1C1917] border-2 border-[#E5E7EB] hover:border-[#2D6A4F] rounded-2xl px-5 py-4 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-lg">Kit documents APA</div>
              <div className="text-sm text-[#4B5563]">5 modèles administratifs prêts à copier</div>
            </div>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 md:px-10 pb-10" aria-labelledby="msp-home-title">
        <div className="relative overflow-hidden rounded-3xl bg-[#173F35] text-white p-7 md:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#74A57F]/25" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              <Building2 className="h-4 w-4" /> Maisons de santé et professionnels de santé
            </span>
            <h2 id="msp-home-title" className="mt-5 max-w-3xl text-3xl md:text-4xl font-heading font-bold leading-tight">
              Orientez un patient vers un professionnel APA vérifié et disponible.
            </h2>
            <p className="mt-4 max-w-3xl text-lg text-white/85">
              En moins de deux minutes, transmettez un lien au patient puis suivez si sa prise en charge a réellement commencé.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link to="/msp" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-[#173F35] hover:bg-[#F2F5F3]" data-testid="home-msp-discover">
                Découvrir APA Connect pour les MSP <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/msp/demonstration" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-5 py-3 font-bold text-white hover:bg-white/10" data-testid="home-msp-demo">
                <PlayCircle className="h-5 w-5" /> Voir la démonstration
              </Link>
              <Link to="/msp#pilote" className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 font-bold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white" data-testid="home-msp-pilot">
                Demander un pilote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 md:px-10 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          <Feature
            icon={<Map className="w-6 h-6" />}
            title="Une carte claire"
            text="Visualisez les intervenants autour de vous avec OpenStreetMap."
          />
          <Feature
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Diplôme vérifié"
            text="Filtrez les professionnels dont le diplôme a été validé par nos équipes."
          />
          <Feature
            icon={<HeartHandshake className="w-6 h-6" />}
            title="Disponibilités réelles"
            text="Seuls les intervenants ayant confirmé leurs créneaux cette semaine sont visibles."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6">
      <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-heading font-bold text-xl mt-4 text-[#1C1917]">{title}</h3>
      <p className="text-[#4B5563] mt-2">{text}</p>
    </div>
  );
}
