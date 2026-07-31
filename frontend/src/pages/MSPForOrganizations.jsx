import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  Link2,
  LockKeyhole,
  PlayCircle,
  QrCode,
  UserCheck,
} from "lucide-react";

const steps = [
  {
    icon: <UserCheck className="h-6 w-6" />,
    title: "1. Choisissez une solution",
    text: "Recherchez un intervenant diplômé, vérifié et dont la disponibilité a été confirmée récemment.",
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    title: "2. Invitez le patient",
    text: "Remettez-lui un lien sécurisé ou un QR code. Il renseigne lui-même ses coordonnées et son accord.",
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: "3. Suivez le résultat",
    text: "Voyez si le patient a été contacté, si un rendez-vous est programmé et si l'accompagnement a commencé.",
  },
];

export default function MSPForOrganizations() {
  return (
    <main data-testid="msp-public-page">
      <section className="bg-[#173F35] text-white">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-16 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
            <Building2 className="h-4 w-4" /> APA Connect pour les MSP
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl md:text-6xl font-heading font-bold leading-tight">
            Une orientation APA simple, traçable et centrée sur le résultat.
          </h1>
          <p className="mt-6 max-w-3xl text-xl text-white/85">
            En moins de deux minutes, vous orientez votre patient vers un professionnel APA vérifié et disponible, puis vous savez si sa prise en charge a réellement commencé.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/msp/demonstration" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-[#173F35] hover:bg-[#F2F5F3]">
              <PlayCircle className="h-5 w-5" /> Voir la démonstration
            </Link>
            <a href="#pilote" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3 font-bold hover:bg-white/10">
              Demander un pilote <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-10 py-16">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-start">
          <div>
            <p className="font-bold uppercase tracking-wider text-sm text-[#B85042]">Le constat</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-heading font-bold">Trouver un professionnel ne suffit pas.</h2>
            <p className="mt-5 text-lg text-[#4B5563]">
              Une équipe de santé manque souvent de temps pour vérifier les zones d'intervention, appeler plusieurs professionnels et savoir ce que l'orientation est devenue.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-6">
                <div className="h-12 w-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">{step.icon}</div>
                <h3 className="mt-5 text-xl font-heading font-bold">{step.title}</h3>
                <p className="mt-3 text-[#4B5563]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-y-2 border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-16 grid md:grid-cols-3 gap-8">
          <AudienceCard title="Ce que voit le patient" icon={<Link2 className="h-6 w-6" />} items={[
            "la raison simple de l'invitation",
            "la solution APA proposée",
            "un formulaire court pour ses coordonnées",
            "les informations de confidentialité",
          ]} />
          <AudienceCard title="Ce que reçoit l'intervenant" icon={<UserCheck className="h-6 w-6" />} items={[
            "une demande limitée au nécessaire",
            "la commune et les modalités souhaitées",
            "la possibilité d'accepter ou refuser",
            "des statuts de suivi très simples",
          ]} />
          <AudienceCard title="Ce que suit la MSP" icon={<Eye className="h-6 w-6" />} items={[
            "l'utilisation du lien patient",
            "le premier contact",
            "le rendez-vous programmé",
            "le démarrage de l'accompagnement",
          ]} />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 md:px-10 py-16">
        <div className="grid lg:grid-cols-2 gap-7">
          <div className="rounded-3xl bg-[#EDF4EF] p-7 md:p-9">
            <div className="flex items-center gap-3 text-[#2D6A4F]">
              <LockKeyhole className="h-7 w-7" />
              <h2 className="text-2xl font-heading font-bold">Confidentialité par conception</h2>
            </div>
            <p className="mt-4 text-[#374151]">
              La première version n'est pas un dossier médical. Elle ne demande ni diagnostic détaillé, ni prescription, ni bilan clinique. Elle conserve uniquement ce qui est nécessaire à la mise en relation et au suivi de son résultat.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-[#E5E7EB] bg-white p-7 md:p-9">
            <p className="text-sm font-bold uppercase tracking-wider text-[#B85042]">Exemple fictif</p>
            <h2 className="mt-3 text-2xl font-heading font-bold">Maison de santé des Boucles de Seine</h2>
            <p className="mt-4 text-[#4B5563]">
              Une coordinatrice propose une activité sur chaise à proximité. Le patient complète son numéro, l'intervenante accepte et confirme le premier rendez-vous. La MSP voit ensuite « accompagnement commencé », sans accéder au contenu des séances.
            </p>
            <Link to="/msp/demonstration" className="mt-6 inline-flex items-center gap-2 font-bold text-[#2D6A4F] hover:text-[#1B4332]">
              Parcourir cet exemple <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="pilote" className="scroll-mt-28 max-w-6xl mx-auto px-5 md:px-10 pb-20">
        <div className="rounded-3xl bg-[#B85042] px-7 py-10 md:px-12 text-white">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold"><Clock3 className="h-5 w-5" /> Pilote de trois mois</div>
              <h2 className="mt-3 text-3xl font-heading font-bold">Préparer un premier pilote en Seine-Maritime</h2>
              <p className="mt-3 max-w-2xl text-white/90">
                Le formulaire de candidature sécurisé sera ajouté à l'étape suivante. La démonstration permet déjà de valider le parcours avec votre équipe sans utiliser de données réelles.
              </p>
            </div>
            <Link to="/msp/demonstration" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-[#8F392F] hover:bg-[#FFF8F6]">
              Ouvrir la démonstration
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function AudienceCard({ title, icon, items }) {
  return (
    <article>
      <div className="h-12 w-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">{icon}</div>
      <h2 className="mt-4 text-2xl font-heading font-bold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[#4B5563]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2D6A4F]" /> {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
