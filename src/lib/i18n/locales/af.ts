/**
 * Afrikaans (af) - Self-Assessment Locale
 */

import type { SelfAssessStrings } from "../types";

const af: SelfAssessStrings = {
  header: {
    title: "Nzwisiso",
    subtitle: "Geestesgesondheid Self-Assessering",
    confidential: "Vertroulik",
  },
  progress: (c, t) => `Stap ${c} van ${t}`,
  crisis: {
    banner: "As jy in onmiddellike gevaar is, kontak asseblief nou nooddienste",
    services: {
      befrienders: "Befrienders Zimbabwe",
      sadag: "SADAG (Suid-Afrika)",
      lifeline: "Lifeline",
      emergency: "Nooddienste",
    },
  },
  welcome: {
    title: "Geestesgesondheid Self-Assessering",
    description:
      "Hierdie gratis, vertroulike hulpmiddel help jou om jou geesteswelstand te verstaan en verbind jou met geestesgesondheidspraktisyns in jou omgewing.",
    expectHeading: "Wat om te verwag:",
    expect: [
      "ʼn Kort siftingsvraelys (ongeveer 5 minute)",
      "Opsie om jou storie deur stem, teks, of dokumentoplaai te deel",
      "Vertroulike passing aan geestesgesondheidsdienste naby jou",
      "Geen persoonlike identifiserende inligting word gestoor nie",
    ],
    notEmergencyTitle: "Dit is NIE ʼn nooddiens nie",
    notEmergencyBody:
      "As jy in onmiddellike gevaar is of aan selfbesering dink, bel asseblief nooddienste (112) of gaan na jou naaste noodkamer.",
    languageLabel: "Voorkeurtaal",
    startButton: "Begin Self-Assessering",
  },
  consent: {
    title: "Toestemming & Veiligheidsinligting",
    description: "Lees asseblief en stem in tot die volgende voordat jy voortgaan.",
    backButton: "Terug",
    continueButton: "Ek Stem In & Gaan Voort",
    items: {
      screening_disclaimer:
        "Ek verstaan dat dit slegs ʼn geestesgesondheid-siftingshulpmiddel is, NIE ʼn diagnose of mediese advies nie.",
      data_sharing:
        "Ek gee toestemming dat my geanonimiseerde antwoorde gedeel word met gepaste geestesgesondheidsfasiliteite om ʼn verwysing te fasiliteer.",
      emergency_understanding:
        "Ek verstaan dat in ʼn mediese noodgeval ek onmiddellik nooddienste (112) moet bel of na my naaste noodkamer moet gaan.",
      voluntary_participation:
        "Ek bevestig dat ek hierdie assessering vrywillig voltooi en dat my antwoorde na my beste wete waar is.",
      age_confirmation:
        "Ek bevestig dat ek 18 jaar of ouer is, of dat ek dit met die wete van my ouer/voog voltooi.",
      research_opt_in:
        "Ek stem opsioneel toe dat my volledig geanonimiseerde data gebruik word vir geestesgesondheidsnavorsing.",
    },
  },
  demographics: {
    title: "Oor Jou",
    description: "Help ons om jou by die regte dienste aan te sluit. Geen identifiserende inligting word gestoor nie.",
    ageLabel: "Ouderdomsgroep",
    agePlaceholder: "Kies ouderdomsgroep",
    genderLabel: "Geslag",
    genderPlaceholder: "Kies geslag",
    regionLabel: "Streek / Provinsie",
    regionPlaceholder: "Kies jou streek",
    genders: { male: "Manlik", female: "Vroulik", nonBinary: "Nie-binêr", preferNot: "Verkies om nie te sê nie" },
    continueButton: "Gaan Voort na Sifting",
  },
  screening: {
    title: "Hoe Voel Jy?",
    description: "Oor die afgelope 2 weke, hoe gereeld is jy deur enige van die volgende probleme gepla?",
    safetyBadge: "Veiligheidsvraag",
    questions: [
      "Min belangstelling of plesier in die doen van dinge",
      "Om neerslagtig, depressief, of hooploos te voel",
      "Moeite om aan die slaap te raak of aan die slaap te bly, of te veel slaap",
      "Om moeg te voel of min energie te hê",
      "Swak eetlus of ooreet",
      "Om sleg oor jouself te voel — of dat jy ʼn mislukking is",
      "Moeite om op dinge te konsentreer, soos lees of televisie kyk",
      "Beweeg of praat so stadig dat ander mense dit kon opmerk? Of die teenoorgestelde — rusteloos",
      "Gedagtes dat jy beter af sou wees dood, of om jouself op ʼn manier seer te maak",
    ],
    likert: ["Glad nie", "Verskeie dae", "Meer as die helfte van die dae", "Byna elke dag"],
    continueButton: "Gaan Voort",
  },
  narrative: {
    title: "Vertel Ons Meer (Opsioneel)",
    description: "Deel enigiets anders oor hoe jy voel. Jy kan tik, praat, of dokumente oplaai.",
    placeholder: "Beskryf wat op jou gemoed is, enige simptome, of bekommernisse...",
    speak: "Praat",
    stop: "Stop Opname",
    upload: "Laai Dokument Op",
    acceptedFiles: "Aanvaar: PDF, prente (JPG, PNG), of tekslêers.",
    submitWithText: "Dien In & Kry Resultate",
    submitWithoutText: "Slaan Oor & Kry Resultate",
  },
  completing: { title: "Verwerk jou assessering...", body: "Ons pas jou aan by geestesgesondheidsdienste in jou omgewing." },
  result: {
    crisisTitle: "Onmiddellike Ondersteuning Beskikbaar",
    crisisBody: "Gebaseer op jou antwoorde, beveel ons sterk aan dat jy dadelik met iemand praat.",
    completeTitle: "Assessering Voltooi",
    completeBody: "Dankie dat jy hierdie self-assessering voltooi het. Ons het dienste geïdentifiseer wat jou kan help.",
    recommendedTitle: "Aanbevole Dienste Naby Jou",
    recommendedDescription: "Hierdie fasiliteite is in kennis gestel van jou verwysing.",
    emergencyCapable: "Nood-bekwaam",
    websiteLabel: "Webwerf",
    noFacilitiesBody: "Daar is tans geen fasiliteite in jou streek geregistreer nie.",
    inMeantime: "In die tussentyd, kan jy kontak maak met:",
    referralTitle: "Jou Verwysingsnommer — skryf dit nou neer",
    referralDescription: "Dit is die enigste manier om anoniem op te volg.",
    referralIdLabel: "Verwysingsnommer",
    pinLabel: "Verifikasie-PIN",
    copy: "Kopieer",
    saveWarningTitle: "⚠ Stoor hierdie voordat jy hierdie bladsy toemaak",
    saveWarningBody: "Neem ʼn skermkiekie, skryf neer, of kopieer dit. Dit sal nie weer gewys word nie.",
    checkStatusButton: "Kyk status of stuur boodskap aan jou fasiliteit",
    nextTitle: "Wat Gebeur Volgende?",
    nextStep1: "Jou gepaste fasiliteit is in kennis gestel van jou anonieme verwysing.",
    nextStep2: "Besoek, bel, of e-pos die fasiliteit en gee jou Verwysingsnommer + PIN.",
    nextStep3: "As dit nie dringend is nie, volg asseblief op binne 14 dae.",
    facilityCtaPrompt: "Is jy ʼn geestesgesondheidsfasiliteit?",
    facilityCtaBody: "Registreer jou fasiliteit op Nzwisiso om self-verwysings te ontvang.",
    facilityCtaButton: "Registreer Jou Fasiliteit",
    homeButton: "Keer Terug na Tuisblad",
  },
};

export default af;
