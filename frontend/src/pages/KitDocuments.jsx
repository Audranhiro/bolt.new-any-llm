import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, FileText, ArrowLeft, Info } from "lucide-react";

const TEMPLATES = [
  {
    id: "avis-medecin",
    title: "Demande d'avis au médecin",
    description: "Courrier-type adressé au médecin traitant pour obtenir un avis avant la mise en place d'un programme APA.",
    body: `Objet : Demande d'avis médical pour la mise en place d'un programme d'Activité Physique Adaptée (APA)

Docteur,

Votre patient(e) [Prénom NOM], né(e) le [date de naissance], envisage de débuter un programme d'Activité Physique Adaptée (APA) que je serai amené(e) à encadrer en qualité de professionnel(le) APA.

Avant toute mise en œuvre, je sollicite votre avis sur :
- l'absence de contre-indication à la pratique d'une activité physique adaptée,
- les éventuelles précautions particulières à respecter (cardiovasculaires, articulaires, métaboliques, autres),
- les zones du corps ou efforts à éviter,
- la fréquence et l'intensité que vous jugez compatibles avec l'état de santé du/de la patient(e).

Le programme proposé sera individualisé, progressif, et réalisé dans un cadre sécurisé. Un compte-rendu d'évolution pourra vous être adressé sur simple demande.

Je reste à votre disposition pour tout échange complémentaire.

Vous remerciant par avance pour votre retour,

[Prénom NOM de l'intervenant APA]
[Diplôme / qualification]
[Téléphone] – [Email]
[Date]`,
  },
  {
    id: "devis",
    title: "Devis de programme APA",
    description: "Devis-type détaillant le programme proposé, sa durée, son tarif et les conditions.",
    body: `DEVIS – PROGRAMME D'ACTIVITÉ PHYSIQUE ADAPTÉE (APA)

Devis n° : [numéro]
Date d'émission : [date]
Date de validité : 30 jours

Intervenant APA
[Prénom NOM]
[Diplôme / qualification]
[Adresse]
[Téléphone] – [Email]
[N° SIRET, le cas échéant]

Bénéficiaire
[Prénom NOM]
[Adresse]
[Téléphone] – [Email]

Description du programme
- Objectifs : [reprise d'activité / maintien / réhabilitation / prévention …]
- Format : [séances individuelles / petit groupe]
- Lieu : [domicile / cabinet / salle / extérieur]
- Durée d'une séance : [60 minutes]
- Fréquence : [1 séance par semaine]
- Nombre total de séances : [10]
- Période prévisionnelle : du [date] au [date]

Tarification
Prix unitaire par séance : [   ] €
Nombre de séances : [   ]
Total HT : [   ] €
TVA : non applicable, art. 293 B du CGI (à ajuster selon situation)
TOTAL À RÉGLER : [   ] €

Modalités de règlement
[Espèces / chèque / virement] – à réception de facture / au début du programme.

Conditions
- Toute séance non décommandée 24 h à l'avance pourra être facturée.
- Le programme est ajustable en fonction de l'évolution du/de la bénéficiaire.
- Une attestation de participation pourra être délivrée en fin de programme.

Bon pour accord
Date : ______________   Signature du bénéficiaire : ______________`,
  },
  {
    id: "facture",
    title: "Facture modèle",
    description: "Facture-type pour des séances APA réalisées.",
    body: `FACTURE

Facture n° : [numéro]
Date : [date]

Émetteur
[Prénom NOM]
[Diplôme / qualification]
[Adresse]
[Téléphone] – [Email]
[N° SIRET, le cas échéant]

Destinataire
[Prénom NOM]
[Adresse]

Détail des prestations

Désignation                                  Quantité   PU HT     Total HT
Séance d'Activité Physique Adaptée            [   ]     [   ] €   [   ] €
[autre prestation éventuelle]                 [   ]     [   ] €   [   ] €

Total HT : [   ] €
TVA : non applicable, art. 293 B du CGI (à ajuster selon situation)
TOTAL TTC : [   ] €

Modalités de règlement
Mode : [chèque / virement / espèces]
Échéance : [date]

Mentions légales
- Pas d'escompte pour règlement anticipé.
- En cas de retard de paiement, pénalités au taux légal en vigueur.

Fait à [ville], le [date].
[Signature]`,
  },
  {
    id: "attestation",
    title: "Attestation de participation",
    description: "Attestation remise au bénéficiaire à l'issue d'un programme APA.",
    body: `ATTESTATION DE PARTICIPATION À UN PROGRAMME D'ACTIVITÉ PHYSIQUE ADAPTÉE (APA)

Je soussigné(e) [Prénom NOM], professionnel(le) en Activité Physique Adaptée,
[Diplôme / qualification],
exerçant à [ville / structure],

atteste que [Prénom NOM du/de la bénéficiaire], né(e) le [date de naissance],
a participé à un programme d'Activité Physique Adaptée encadré par mes soins.

Caractéristiques du programme :
- Période : du [date] au [date]
- Nombre de séances réalisées : [   ]
- Durée moyenne : [60 minutes]
- Format : [individuel / petit groupe]
- Lieu(x) : [domicile / cabinet / salle / extérieur]
- Objectifs travaillés : [reprise d'activité / endurance / mobilité / équilibre / renforcement / autre]

La présente attestation est délivrée à l'intéressé(e) pour faire valoir ce que de droit.

Fait à [ville], le [date].
[Prénom NOM]
[Signature]`,
  },
  {
    id: "mutuelle",
    title: "Courrier pour la mutuelle",
    description: "Courrier-type à transmettre à l'organisme complémentaire santé pour demander une éventuelle prise en charge.",
    body: `Objet : Demande de prise en charge – Programme d'Activité Physique Adaptée (APA)

Madame, Monsieur,

Je suis bénéficiaire de votre contrat sous le numéro [n° d'adhérent], et je sollicite par la présente l'examen d'une éventuelle prise en charge, totale ou partielle, des séances d'Activité Physique Adaptée (APA) que je suis dans le cadre de [reprise d'activité / suivi post-pathologie / prévention …].

Vous trouverez ci-joint :
- l'avis du médecin traitant (le cas échéant),
- le devis émis par l'intervenant(e) APA,
- la/les facture(s) acquittée(s),
- l'attestation de participation en fin de programme.

Programme suivi
- Intervenant(e) : [Prénom NOM] – [diplôme]
- Période : du [date] au [date]
- Nombre de séances : [   ]
- Coût total : [   ] €

Je vous remercie de bien vouloir m'indiquer les modalités de remboursement applicables à mon contrat ainsi que les éventuelles pièces complémentaires à fournir.

Restant à votre disposition pour tout renseignement,

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

[Prénom NOM]
[Adresse]
[Téléphone] – [Email]
[Date]`,
  },
];

function CopyButton({ text, id }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      onClick={copy}
      data-testid={`copy-btn-${id}`}
      className={`inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl font-semibold text-base transition-colors ${
        copied
          ? "bg-[#74A57F] text-white"
          : "bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
      }`}
    >
      {copied ? <><Check className="w-4 h-4" /> Copié</> : <><Copy className="w-4 h-4" /> Copier le texte</>}
    </button>
  );
}

export default function KitDocuments() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="kit-documents-page">
      <Link to="/" className="inline-flex items-center gap-2 text-[#2D6A4F] font-semibold mb-4" data-testid="kit-back-btn">
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>

      <header className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">Kit documents APA</h1>
        </div>
        <p className="text-[#4B5563] text-lg">
          Modèles administratifs prêts à l'emploi pour préparer ou suivre un programme d'Activité Physique Adaptée. Chaque texte est copiable en un clic.
        </p>

        <div className="mt-5 flex items-start gap-3 bg-[#B85042]/10 border-2 border-[#B85042]/30 rounded-xl p-4" data-testid="kit-disclaimer">
          <Info className="w-5 h-5 text-[#B85042] mt-0.5 shrink-0" />
          <p className="text-[#1C1917] text-base">
            <span className="font-semibold">À adapter :</span> ces modèles sont fournis à titre indicatif. Ils doivent être adaptés par le professionnel selon sa situation, son statut juridique, sa réglementation et le cas particulier de chaque bénéficiaire.
          </p>
        </div>
      </header>

      <div className="mt-6 space-y-5">
        {TEMPLATES.map((t) => (
          <article
            key={t.id}
            className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 md:p-7"
            data-testid={`template-${t.id}`}
          >
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-[260px]">
                <h2 className="font-heading font-bold text-2xl text-[#1C1917]">{t.title}</h2>
                <p className="text-[#4B5563] text-base mt-1">{t.description}</p>
              </div>
              <CopyButton text={t.body} id={t.id} />
            </div>
            <pre
              data-testid={`template-body-${t.id}`}
              className="mt-4 bg-[#F9F8F6] border border-[#E5E7EB] rounded-xl p-4 md:p-5 text-[#1C1917] text-base whitespace-pre-wrap font-sans leading-relaxed overflow-x-auto"
            >
{t.body}
            </pre>
          </article>
        ))}
      </div>

      <p className="mt-8 text-sm italic text-[#4B5563]">
        Ces modèles ne se substituent pas à un avis juridique, comptable ou médical.
      </p>
    </div>
  );
}
