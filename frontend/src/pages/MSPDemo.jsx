import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  QrCode,
  ShieldAlert,
  UserCheck,
  UserRound,
} from "lucide-react";

const timeline = [
  ["Orientation créée", "Aujourd'hui, 09:12", true],
  ["Patient invité", "Aujourd'hui, 09:13", true],
  ["Informations complétées", "Aujourd'hui, 09:21", true],
  ["Demande envoyée", "Aujourd'hui, 09:22", true],
  ["Patient contacté", "Aujourd'hui, 11:05", true],
  ["Rendez-vous programmé", "Vendredi à 14:00", true],
  ["Accompagnement commencé", "À confirmer après le rendez-vous", false],
];

export default function MSPDemo() {
  return (
    <main className="min-h-screen bg-[#F3F6F4]" data-testid="msp-demo-page">
      <div className="bg-[#FFF3CD] border-b-2 border-[#E8CF75]">
        <div className="max-w-6xl mx-auto px-5 py-3 flex gap-3 text-[#664D03]">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <p><strong>Démonstration — données entièrement fictives.</strong> Cet espace est isolé des données réelles et n'enregistre aucune information de patient.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-10 py-10">
        <Link to="/msp" className="inline-flex items-center gap-2 font-semibold text-[#2D6A4F]">
          <ArrowLeft className="h-4 w-4" /> Retour à la présentation
        </Link>
        <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-sm uppercase tracking-wider font-bold text-[#B85042]">Espace fictif</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-heading font-bold">Maison de santé des Boucles de Seine</h1>
            <p className="mt-2 text-[#4B5563]">Vue coordinatrice · démonstration du parcours en trois à cinq minutes</p>
          </div>
          <div className="rounded-xl border-2 border-[#B8D2C0] bg-white px-4 py-3 text-sm font-semibold text-[#2D6A4F]">
            Référence fictive : DEMO-APA-024
          </div>
        </div>

        <section className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Statistiques fictives">
          <Metric value="18" label="Orientations créées" />
          <Metric value="14" label="Patients contactés" />
          <Metric value="11" label="Rendez-vous programmés" />
          <Metric value="8" label="Accompagnements commencés" />
        </section>

        <section className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <article className="rounded-3xl border-2 border-[#E5E7EB] bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#4B5563]">Orientation fictive en cours</p>
                <h2 className="mt-2 text-2xl font-heading font-bold">Reprise progressive d'activité</h2>
                <p className="mt-2 text-[#4B5563]">Rouen 76000 · activité sur chaise · proximité souhaitée</p>
              </div>
              <span className="rounded-full bg-[#DFF3E5] px-4 py-2 text-sm font-bold text-[#1B6338]">Rendez-vous programmé</span>
            </div>

            <div className="mt-7 grid sm:grid-cols-3 gap-4">
              <DemoStep icon={<UserRound className="h-5 w-5" />} label="Patient" value="Camille D. (fictif)" />
              <DemoStep icon={<UserCheck className="h-5 w-5" />} label="Intervenante" value="Élise Martin (fictive)" />
              <DemoStep icon={<Clock3 className="h-5 w-5" />} label="Premier contact" value="1 h 53 min" />
            </div>

            <h3 className="mt-8 text-lg font-heading font-bold">Suivi partagé</h3>
            <ol className="mt-4">
              {timeline.map(([label, date, complete], index) => (
                <li key={label} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < timeline.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 bg-[#D9E2DC]" />}
                  <span className={`relative z-10 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${complete ? "bg-[#2D6A4F] text-white" : "border-2 border-[#BFC9C2] bg-white text-[#718078]"}`}>
                    {complete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <div>
                    <p className={`font-semibold ${complete ? "text-[#1C1917]" : "text-[#6B7280]"}`}>{label}</p>
                    <p className="text-sm text-[#6B7280]">{date}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <div className="space-y-6">
            <article className="rounded-3xl bg-[#173F35] p-6 md:p-8 text-white">
              <p className="text-sm font-bold uppercase tracking-wider text-white/70">Invitation patient fictive</p>
              <h2 className="mt-2 text-2xl font-heading font-bold">Un lien simple, sans compte obligatoire</h2>
              <div className="mt-6 flex gap-5 items-center">
                <div className="h-28 w-28 shrink-0 rounded-xl bg-white flex items-center justify-center text-[#173F35]" aria-label="Exemple de QR code non fonctionnel">
                  <QrCode className="h-20 w-20" />
                </div>
                <div>
                  <p className="text-white/85">Le QR code présenté ici est décoratif et ne contient aucune donnée.</p>
                  <button type="button" disabled className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-semibold text-white/70 cursor-not-allowed">
                    Aperçu du lien <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border-2 border-[#E5E7EB] bg-white p-6 md:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-[#B85042]">Exemple non abouti</p>
              <h2 className="mt-2 text-xl font-heading font-bold">DEMO-APA-019</h2>
              <p className="mt-3 text-[#4B5563]">L'intervenant initial n'était plus disponible. La demande a été réorientée vers un cours collectif local fictif.</p>
              <span className="mt-5 inline-flex rounded-full bg-[#FDE8E5] px-3 py-1.5 text-sm font-bold text-[#8F392F]">Réorientation proposée</span>
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border-2 border-[#C8DDD0] bg-[#EDF4EF] p-6 md:p-8">
          <div className="flex gap-4">
            <CheckCircle2 className="h-7 w-7 shrink-0 text-[#2D6A4F]" />
            <div>
              <h2 className="text-xl font-heading font-bold">Ce que cette démonstration prouve</h2>
              <p className="mt-2 text-[#374151]">
                La MSP peut suivre l'aboutissement d'une orientation sans consulter un diagnostic, une prescription ou le contenu des séances. Les actions visibles ici sont volontairement non fonctionnelles tant que les contrôles d'accès et la base MSP ne sont pas validés.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }) {
  return (
    <article className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-5">
      <p className="text-3xl font-heading font-bold text-[#2D6A4F]">{value}</p>
      <p className="mt-1 text-sm text-[#4B5563]">{label}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#B85042]">Donnée fictive</p>
    </article>
  );
}

function DemoStep({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#F5F7F5] p-4">
      <div className="text-[#2D6A4F]">{icon}</div>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#6B7280]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
