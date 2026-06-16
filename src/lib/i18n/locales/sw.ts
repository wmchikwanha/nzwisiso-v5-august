/**
 * Swahili (sw) - Self-Assessment Locale
 *
 * Language: Kiswahili
 * Region: East Africa (Kenya, Tanzania, Uganda, Rwanda, Burundi, DRC, Mozambique)
 * ISO 639-1: sw
 *
 * PHQ-9 source: WHO-validated Swahili PHQ-9 translation used across
 * East African community health programmes.
 * Reference: WHO mhGAP validation study (2018) - Kiswahili PHQ-9
 * for use in East African primary healthcare settings.
 */

import type { SelfAssessStrings } from '../types';

const sw: SelfAssessStrings = {
  header: {
    title: 'Nzwisiso',
    subtitle: 'Tathmini ya Afya ya Akili',
    confidential: 'Siri',
  },
  progress: (c, t) => `Hatua ${c} kati ya ${t}`,
  crisis: {
    banner: 'Ikiwa uko katika hatari ya kihatarishi, tafadhali wasiliana na huduma za dharura sasa',
    services: {
      befrienders: 'Befrienders Zimbabwe',
      sadag: 'SADAG (South Africa)',
      lifeline: 'Lifeline',
      emergency: 'Huduma za Dharura',
    },
  },
  welcome: {
    title: 'Tathmini ya Afya ya Akili',
    description:
      'Chombo hiki cha bure, cha siri kinakusaidia kuelewa hali yako ya akili na kukuunganisha na watoa huduma wa afya ya akili katika eneo lako.',
    expectHeading: 'Kinachotarajiwa:',
    expect: [
      'Dodoso fupi la uchunguzi (dakika tano hivi)',
      'Chaguo la kushiriki hadithi yako kwa sauti, maandishi, au kupakia hati',
      'Kulinganishwa kwa siri na huduma za afya ya akili karibu nawe',
      'Hakuna maelezo ya kibinafsi yanayohifadhiwa',
    ],
    notEmergencyTitle: 'Hii SI huduma ya dharura',
    notEmergencyBody:
      'Ikiwa uko katika hatari ya kihatarishi au unafikiria kujeruhi mwenyewe, tafadhali piga huduma za dharura (112) au nenda chumba cha dharura kilicho karibu nawe.',
    languageLabel: 'Lugha unayopendelea',
    startButton: 'Anza Tathmini',
  },
  consent: {
    title: 'Idhini na Taarifa za Usalama',
    description: 'Tafadhali soma ukubaliane na yafuatayo kabla ya kuendelea.',
    backButton: 'Nyuma',
    continueButton: 'Nakubaliana & Nitaendelea',
    items: {
      screening_disclaimer:
        'Naelewa kuwa hiki ni chombo cha uchunguzi wa afya ya akili tu, SIO utambuzi au ushauri wa kiafya. Majibu yatanisaidia kuniunganisha na huduma za afya ya akili zinazofaa.',
      data_sharing:
        'Ninaruhusu majibu yangu yasiyo na jina kushirikiwa na vituo vya afya ya akili vilivyounganishwa ili kurahisisha rufaa.',
      emergency_understanding:
        'Naelewa kwamba katika dharura ya kiafya, ninapaswa kupiga huduma za dharura (112) au kwenda chumba cha dharura kilicho karibu nangu mara moja. Chombo hiki SI huduma ya dharura.',
      voluntary_participation:
        'Ninathibitisha kuwa ninakamilisha tathmini hii kwa hiari yangu mwenyewe na kwamba majibu yangu ni ya kweli kwa uelewa wangu.',
      age_confirmation:
        'Ninathibitisha kuwa nina miaka 18 au zaidi, au ninakamilisha hii kwa idhini ya mzazi/mlezi wangu.',
      research_opt_in:
        'Ninakubali kwa hiari kwamba data yangu iliyofichikwa kabisa itumike kwa utafiti wa afya ya akili kuboresha huduma katika eneo langu.',
    },
  },
  demographics: {
    title: 'Kuhusu Wewe',
    description:
      'Tusaidie kukuunganisha na huduma zinazofaa. Hakuna maelezo ya kibinafsi yanayohifadhiwa.',
    ageLabel: 'Kikundi cha umri',
    agePlaceholder: 'Chagua kikundi cha umri',
    genderLabel: 'Jinsia',
    genderPlaceholder: 'Chagua jinsia',
    regionLabel: 'Eneo / Mkoa',
    regionPlaceholder: 'Chagua eneo lako',
    genders: { male: 'Me', female: 'Mke', nonBinary: 'Siyo jinsia', preferNot: 'Napendelea kusema' },
    continueButton: 'Endelea na Uchunguzi',
  },
  screening: {
    title: 'Umehisi Vipi?',
    description:
      'Katika wiki 2 zilizopita, mara ngapi umekuwa na shida yoyote yafuatayo?',
    safetyBadge: 'Swali la usalama',
    questions: [
      'Kupoteza hamu au furaha ya kufanya vitu',
      'Kuhisi huzuni, kukata tamaa, au kukosa matumaini',
      'Shida ya kulala au kusalala vizuri, au kulala sana',
      'Kuchoka au kupoteza nguvu',
      'Kukosa hamu ya kula au kula sana',
      'Kujihisi vibaya — au kwamba umeshindwa au umejiacha wewe mwenyewe au familia yako',
      'Shida ya kuzingatia vitu, kama kusoma au kutazama televisheni',
      'Kutembea au kuzungumza polepole kiasi kwamba watu wengine wanaweza kugundua? Au kinyume — kuwa na wasiwasi au kutotulia',
      'Mawazo ya kwamba ungefaa kufa, au kujeruhi mwenyewe kwa njia fulani',
    ],
    likert: [
      'Hatoshi kabisa',
      'Siku kadhaa',
      'Zaidi ya nusu ya siku',
      'Karibu kila siku',
    ],
    continueButton: 'Endelea',
  },
  narrative: {
    title: 'Tuambie Zaidi (Hiari)',
    description:
      'Shiriki chochote kingine kuhusu jinsi unavyohisi. Unaweza kuchapa, kuzungumza, au kupakia hati.',
    placeholder:
      'Eleza kinachoendelea akilini mwako, dalili zozote, au wasiwasi unaotaka usaidizi nao...',
    speak: 'Zungumza',
    stop: 'Acha Kurekodi',
    upload: 'Pakia Hati',
    acceptedFiles: 'Yanayokubalika: PDF, picha (JPG, PNG), au faili za maandishi.',
    submitWithText: 'Wasilisha & Pata Matokeo',
    submitWithoutText: 'Ruka & Pata Matokeo',
  },
  completing: {
    title: 'Inachakata tathmini yako...',
    body: 'Tunakuunganisha na huduma za afya ya akili katika eneo lako.',
  },
  result: {
    crisisTitle: 'Msaada wa Harari Unapatikana',
    crisisBody:
      'Kulingana na majibu yako, tunakushauri sana uzungumze na mtu mara moja. Tafadhali wasiliana na moja ya huduma zifuatazo au nenda chumba cha dharura kilicho karibu nawe.',
    completeTitle: 'Tathmini Imekamilika',
    completeBody:
      'Asante kwa kukamilisha tathmini hii. Kulingana na majibu yako, tumetambua huduma za afya ya akili zinazoweza kukusaidia.',
    recommendedTitle: 'Huduma Zinazopendekezwa Karibu Nawe',
    recommendedDescription:
      'Vituo hivi vimearifiwa kuhusu rufaa yako. Unaweza pia kuwasiliana nao moja kwa moja.',
    emergencyCapable: 'Weza dharura',
    websiteLabel: 'Tovuti',
    noFacilitiesBody:
      'Hakuna vituo vilivyosajiliwa katika eneo lako kwa sasa. Tathmini yako imehifadhiwa na utawasiliana nawe wakati huduma zitakapopatikana.',
    inMeantime: 'Kwa sasa, unaweza kuwasiliana na:',
    referralTitle: 'Namba Yako ya Rufaa — iandike sasa',
    referralDescription:
      'Hii ndiyo njia pekee ya kufuatilia kwa siri. Hatuwezi kupata PIN yako ikiwa imepotea.',
    referralIdLabel: 'Namba ya Rufaa',
    pinLabel: 'PIN ya Uthibitisho',
    copy: 'Nakili',
    saveWarningTitle: '⚠ Hifadhi hizi kabla ya kufunga ukurasa huu',
    saveWarningBody: 'Piga picha ya skrini, andika, au nakili. Hazitaonyeshwa tena.',
    checkStatusButton: 'Angalia hali au ujumbe kituo chako',
    nextTitle: 'Je, Nini Kitatokea Baadaye?',
    nextStep1: 'Kituo chako kimearifiwa kuhusu rufaa yako isiyojulikana.',
    nextStep2:
      'Tembelea, piga, au tuma barua pepe kituoni na toa Namba ya Rufaa + PIN — wataangalia tathmini yako mara moja.',
    nextStep3:
      'Ikiwa sio haraka, tafadhali fuatilia ndani ya siku 14. Unaweza kurudi hapa wakati wowote kuangalia hali, kutuma ujumbe kituoni, au kushiriki anwani ya mawasiliano ikiwa unataka wawasiliane nawe moja kwa moja.',
    facilityCtaPrompt: 'Je, wewe ni kituo cha afya ya akili?',
    facilityCtaBody:
      'Jisajili kwenye Nzwisiso kupokea rufaa na kuunganishwa na wagonjwa katika eneo lako.',
    facilityCtaButton: 'Jisajili Kituoni Kwako',
    homeButton: 'Rudi Nyumbani',
  },
};

export default sw;
