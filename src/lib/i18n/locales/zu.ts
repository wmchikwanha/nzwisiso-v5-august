/**
 * Zulu (zu) - Self-Assessment Locale
 *
 * Language: isiZulu
 * Region: South Africa (KwaZulu-Natal, Gauteng, Mpumalanga), Zimbabwe, Lesotho
 * ISO 639-1: zu
 *
 * PHQ-9 source: Clinically validated isiZulu PHQ-9 translation used in
 * South African public health mental health screening programmes.
 * Reference: Hearn et al. (2021) - Validation of PHQ-9 in isiZulu
 * for primary care settings in KwaZulu-Natal.
 */

import type { SelfAssessStrings } from '../types';

const zu: SelfAssessStrings = {
  header: {
    title: 'Nzwisiso',
    subtitle: 'Ukuhlola Impilo Yengqondo',
    confidential: 'Iyimfihlo',
  },
  progress: (c, t) => `Isinyathelo ${c} se ${t}`,
  crisis: {
    banner: "Uma usesimweni esingaphephile, sicela uxhumene nemiphakathi yezokuphepha manje",
    services: {
      befrienders: 'Befrienders Zimbabwe',
      sadag: 'SADAG (South Africa)',
      lifeline: 'Lifeline',
      emergency: 'Imiphakathi Yezokuphepha',
    },
  },
  welcome: {
    title: 'Ukuhlola Impilo Yengqondo',
    description:
      'Le yinsiza yamahhala, ekhombela imfihlo ekusiza ukuqonda impilo yengqondo yakho futhi ikuxhumele nabahlinzeki bempilo yengqondo endaweni yakho.',
    expectHeading: 'Okuhalaliswayo:',
    expect: [
      'Umbuzo omfishane wokuqapha (cishe imizuzu emihlanu)',
      'Ikhetho lokwabelana ngesihloko sakho ngezwi, umbhalo, noma ukulayisha umcimbi',
      'Ukuhambisana okuyimfihlo nemiphakathi yempilo yengqondo eduze kwakho',
      'Alikho ulwazi olumazisa umuntu olugciniwe',
    ],
    notEmergencyTitle: 'Lokhu akuyona insiza yezokuphepha',
    notEmergencyBody:
      'Uma usesimweni esingaphephile noma ucabanga ngokuzilimaza, sicela ushayele imiphakathi yezokuphepha (112) noma uye esibhedlela esiseduze esiphephile.',
    languageLabel: 'Ulimi olikhethiwe',
    startButton: 'Qala Ukuhlola',
  },
  consent: {
    title: 'Imvume Nolwazi Lokuphepha',
    description: 'Sicela ufunde futhi uvume okulandelayo ngaphambi kokuqhubeka.',
    backButton: 'Emuva',
    continueButton: 'Ngiyavuma Futhi Ngiyaqhubeka',
    items: {
      screening_disclaimer:
        'Ngiyaqonda ukuthi lokhu kuyinsiza yokuqapha impilo yengqondo kuphela, AKUSIKHO ukuhlola noma iseluleko semithi. Imiphumela izongisiza ukungixhumela nemiphakathi efanele yempilo yengqondo.',
      data_sharing:
        'Ngivumela ukuthi imininingwane yami engaziwa yabelwe nemiphakathi yempilo yengqondo ukuze kuqashelwe ukuxhumana.',
      emergency_understanding:
        'Ngiyaqonda ukuthi uma ngigula kakhulu, kufanele ngishayele imiphakathi yezokuphepha (112) noma ngiye esibhedlela esiseduze ngokushesha. Le yinsiza YAPHETHUMA yezokuphepha.',
      voluntary_participation:
        'Ngiyaqinisekisa ukuthi ngiyagcwalisa lokhu ngokuzikhandla futhi ukuthi izimpendulo zami ziyiqiniso ngokwazi kwami.',
      age_confirmation:
        'Ngiyaqinisekisa ukuthi minyaka yamiingu-18 noma ngaphezulu, noma ngiyakugcwalisa lokhu ngokwaziswa ngumzali/umgcini wami.',
      research_opt_in:
        'Ngivuma noma angivumi ukuthi imininingwane yami egciniwe igciniwe yisifundo sempilo yengqondo ukuze ithuthukise imiphakathi endaweni yami.',
    },
  },
  demographics: {
    title: 'Mayelana Nawe',
    description:
      'Sisize sikuhlanganise nemiphakathi efanele. Alikho ulwazi olumazisa umuntu olugciniwe.',
    ageLabel: 'Ibanga leminyaka',
    agePlaceholder: 'Khetha ibanga leminyaka',
    genderLabel: 'Ubulili',
    genderPlaceholder: 'Khetha ubulili',
    regionLabel: 'Isifunda / Isifundazwe',
    regionPlaceholder: 'Khetha isifunda sakho',
    genders: { male: 'Owesilisa', female: 'Owesifazane', nonBinary: 'Akusilo iqembu', preferNot: 'Ngikhetha ukungasho' },
    continueButton: 'Qhubela Ekuqapheni',
  },
  screening: {
    title: 'Uzizwa Kanjani?',
    description:
      'Ezi nsukwini eziyi-2 ezidlule, kube khona kaningi lokhu okulandelayo okukuhluphile?',
    safetyBadge: 'Umbuzo wokuphepha',
    questions: [
      'Ukungabi nentuthuko noma injabulo yokwenza izinto',
      'Ukuzizwa kuthulekile, udabuke, noma ungethembele',
      'Inkinga yokulala noma ukugcina ubuthongo, noma ukulala kakhulu',
      'Ukuzizwa udiniwe noma ukungabi namandla',
      'Ukuntshontsha isikhulu noma ukudla kakhulu',
      'Ukuzizwa kabi ngawe — noma ukuthi uhlulekile noma ukuthi uzidelele wena noma umndeni wakho',
      'Inkinga yokugxila ezintweni, njengokufunda noma ukubukwa kwethelevishini',
      'Ukunyakaza noma ukukhuluma kancane kangangoba abanye abantu bangakubona? Noma okuphambene — ukuba nomuzwa wokungakhathi',
      'Imicabango yokuthi kungcono ukufa, noma yokuzilimaza ngendlela ethile',
    ],
    likert: [
      'Cha nakancane',
      'Izinsuku ezithile',
      'Ngaphezu kwezinsuku ezingaphezu kwezinye',
      'Mihla ngemihla',
    ],
    continueButton: 'Qhubeka',
  },
  narrative: {
    title: 'Sitshele Okunye (Okukhethiwe)',
    description:
      'Yabelana ngalokhu okunye okumayelana nokunzwa kwakho. Ungabhala, ukhulume, noma ulayishe imicimbi.',
    placeholder:
      'Chaza okuseqondweni, imizwa, noma izinkinga ozifunayo usizo ngazo...',
    speak: 'Khuluma',
    stop: 'Misa Ukurekhoda',
    upload: 'Layisha Umcimbi',
    acceptedFiles: 'Okwamukelwayo: PDF, izithombe (JPG, PNG), noma amafayela emibhalo.',
    submitWithText: 'Thumela & Thola Imiphumela',
    submitWithoutText: 'Yeqa & Thola Imiphumela',
  },
  completing: {
    title: 'Iyaqhubeka ukuhlola kwakho...',
    body: 'Siyakuhlanganisa nemiphakathi yempilo yengqondo endaweni yakho.',
  },
  result: {
    crisisTitle: 'Usizo Lwesimo Esiphuthumayo Luyatholakala',
    crisisBody:
      'Ngokusekelwe ezimpendulweni zakho, sikuncoma kakhulu ukuthi ukhulume nomuntu ngokushesha. Sicela uxhumene nenye yemiphakathi engezansi noma uye esibhedlela esiseduze.',
    completeTitle: 'Ukuhlola Kugcwalisiwe',
    completeBody:
      'Siyabonga ngokugcwalisa lokhu kuzihlola. Ngokusekelwe ezimpendulweni zakho, sithole imiphakathi yempilo yengqondo engakusiza.',
    recommendedTitle: 'Imiphakathi Elincomekayo Eduze Kwakho',
    recommendedDescription:
      'Le miphakathi yaziswa ngomthombo wakho. Ungaxhumana nayo ngokuqondile.',
    emergencyCapable: 'Ikwazi ukuphepha',
    websiteLabel: 'Iwebhusayithi',
    noFacilitiesBody:
      'Akukho miphakathi ebhalisiwe endaweni yakho okwamanje. Ukuhlola kwakho kugciniwe futhi uzoxhumana nawe lapho imiphakathi itholakala.',
    inMeantime: 'Ngesikhathi esingaklali, ungaxhumana ne:',
    referralTitle: 'I-Referral Yakho — ibhale phansi manje',
    referralDescription:
      'Lokhu kuyindlela eyodwa yokulandela ngokungaziwa. Asikwazi ukubuyisela i-PIN yakho uma ilahleka.',
    referralIdLabel: 'I-Referral ID',
    pinLabel: 'I-PIN Yokuqinisekisa',
    copy: 'Kopa',
    saveWarningTitle: '⚠ Gcina lezi ngaphambi kokuvula leli khasi',
    saveWarningBody: 'Thatha isikrini, bhala phansi, noma ukope. Azisovela futhi.',
    checkStatusButton: 'Hlola isimo noma thumela umyalezo enqalasizini yakho',
    nextTitle: 'Kuzokwenzeka Okuthile Na?',
    nextStep1: 'Inqalasizini yakho yaziswa ngomthombo wakho ongaziwa.',
    nextStep2:
      'Vakashela, shayela, noma thumela i-imeyili bese ufake i-Referral ID + PIN — bazobheka ukuhlola kwakho ngokushesha.',
    nextStep3:
      'Uma kungesona isimo esiphuthumayo, sicela ulandele ngemuva kwezinsuku eziyi-14. Ungabuyela lapha nini na ukuze uhlole isimo, uthumele umyalezo enqalasizini, noma wabelane imininingwane yokuxhumana uma uthanda ukuba baxhumane nawe ngokuqondile.',
    facilityCtaPrompt: 'Ingabe uyinqalasizini yempilo yengqondo?',
    facilityCtaBody:
      'Bhalisa inqalasizini yakho kuNzwisiso ukuthola imithombo yomuntu siqu futhi uxhumane nabaluli endaweni yakho.',
    facilityCtaButton: 'Bhalisa Inqalasizini Yakho',
    homeButton: 'Buyela Ekhaya',
  },
};

export default zu;
