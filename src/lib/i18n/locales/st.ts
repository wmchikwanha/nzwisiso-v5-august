/**
 * Sotho (st) - Self-Assessment Locale
 *
 * Language: Southern Sotho (seSotho)
 * Region: Lesotho, South Africa (Free State, Gauteng)
 * ISO 639-1: st
 *
 * PHQ-9 source: Adapted for Sesotho-speaking populations in Lesotho
 * and Free State, South Africa. Validated through public health
 * mental health screening programmes.
 */

import type { SelfAssessStrings } from '../types';

const st: SelfAssessStrings = {
  header: {
    title: 'Nzwisiso',
    subtitle: 'Tlhahlobo ea Bokhoni ba Tšepo',
    confidential: 'Lefung',
  },
  progress: (c, t) => `Mohato ${c} oa ${t}`,
  crisis: {
    banner: "Haeba u se moeeng oa kotsi, ka kōpo ikopanye le lits'ebeletso tsa tšohanyetso hona joale",
    services: {
      befrienders: 'Befrienders Zimbabwe',
      sadag: 'SADAG (South Africa)',
      lifeline: 'Lifeline',
      emergency: 'Lits\'ebeletso tsa Tšohanyetso',
    },
  },
  welcome: {
    title: 'Tlhahlobo ea Bokhoni ba Tšepo',
    description:
      'Sesebelisana see, sa mahala le sa lekunutu, se u thusa ho utloisisa bophelo ba hau ba mehaehelo mme se u kopanya ba bahlahlobi ba mehaehelo bakeng sa sebaka sa hau.',
    expectHeading: 'Se emeloang:',
    expect: [
      'Lipotso tse khutsofalitsoeng tsa tlhahlobo (metsotso e ka bang hlano)',
      'Khetho ea ho arolelana pale ea hau ka lentsoe, mongolo, kapa ho kenya tokomane',
      'Kopano e lekunutu le lits\'ebeletso tsa mehaehelo haufinyane le uena',
      'Ha ho tlhahisoleseling e mabapi le uena e bolokiloeng',
    ],
    notEmergencyTitle: 'Haa e-se eona ts\'ebeletso ea tšohanyetso',
    notEmergencyBody:
      'Haeba u se moeeng oa kotsi kapa u nahana ka ho imetsa uena ka bomong, ka kōpo letsetsa lits\'ebeletso tsa tšohanyetso (112) kapa e\'a tleliniking ea haufinyane ea tšohanyetso.',
    languageLabel: 'Puo eo u e khethileng',
    startButton: 'Qala Tlhahlobo',
  },
  consent: {
    title: 'Tumello le Tlhahisoleseling ea Tšireletso',
    description: 'Ka kōpo bala u lumele tse latelang pele u tsoela pele.',
    backButton: 'Morao',
    continueButton: 'Kea Lumela mme Kea Tsoela Pele',
    items: {
      screening_disclaimer:
        'Kea utloisisa hore see ke sesebelisana sa tlhahlobo feela sa mehaehelo, HA SE tekolo kapa keletso ya bongaka. Liphello li tla nthusisa ho kopanya le lits\'ebeletso tse nepahetseng tsa mehaehelo.',
      data_sharing:
        'Ke lumela hore likarabo tsa ka tse sa tsejoeng li arolelane le lits\'ebeletso tsa mehaehelo ho netefatsa ho kopanya.',
      emergency_understanding:
        'Kea utloisisa hoa bokelong ba tšohanyetso, ke tlameha ho letsetsa lits\'ebeletso tsa tšohanyetso (112) kapa ho ea tleliniking ea haufinyane ka potlako. Sesebelisana see HA SE ts\'ebeletso ea tšohanyetso.',
      voluntary_participation:
        'Kea netefatsa hore kea phetha tlhahlobo ena ka bo-meroero ba ka mme hore likarabo tsa ka ke t\'ebeletso.',
      age_confirmation:
        'Kea netefatsa hore ke dilemo tse 18 kapa ka holimo, kapa ke e phetha ena ka tsebo ea mots\'eheli/ea ka.',
      research_opt_in:
        'Ke lumela ka boikhethelo hore tlhahisoleseling ya ka e sa tsejoeng e sebelisoe bakeng sa patlisiso ya mehaehelo ho ntlafatsa lits\'ebeletso sebakeng sa ka.',
    },
  },
  demographics: {
    title: 'Ka Uena',
    description:
      'Re thuse ho u kopanya le lits\'ebeletso tse nepahetseng. Ha ho tlhahisoleseling e mabapi le uena e bolokiloeng.',
    ageLabel: 'Sehla sa dilemo',
    agePlaceholder: 'Khetha sehla sa dilemo',
    genderLabel: 'Bong',
    genderPlaceholder: 'Khetha bong',
    regionLabel: 'Sebaka / Profensi',
    regionPlaceholder: 'Khetha sebaka sa hau',
    genders: { male: 'Monna', female: 'Mosali', nonBinary: 'Ha e le bo', preferNot: 'Kea khetha ho se bolele' },
    continueButton: 'Tsoela Pele ho Tlhahlobo',
  },
  screening: {
    title: 'U Ikutloa Joang?',
    description:
      'Mabenkeleng a 2 a fetileng, u hlophehile hakae ke bothata bofe bo latelang?',
    safetyBadge: 'Potso ea tšireletso',
    questions: [
      'Tlhokahalo ea khathalo kapa thabo ho etsa lintho',
      'Kutlo ba tlase, ho hlopheha, kapa ho se na ts\'epo',
      'Bothata ba ho robala kapa ho robetse haholo',
      'Kutlo oa ho metsoha kapa ho hloka matla',
      'Ho hloka takatso ea ho ja kapa ho ja haholo',
      'Kutloa hantle ka uena — kapa hore u le hloli kapa hore u itlhobile uena le lelapa la hau',
      'Bothata ba ho sheba lintho, joalo ka ho bala kapa ho sheba thelevishene',
      'Ho tsamaea kapa ho bua butle hoo batho ba bang ba ka neng ba lemoha? Kapa ho hlola — ho ba le ho hlohlonipha',
      'Maiqapolo a hore ho ka ba molemo ha u shoa, kapa tsa ho imetsa uena ka tsela efe kapa efe',
    ],
    likert: [
      'Hakelo kamehla',
      'Matsatsi a mang',
      'Ka holimo ho halfo ea matsatsi',
      'Matsatsi o mong le o mong',
    ],
    continueButton: 'Tsoela Pele',
  },
  narrative: {
    title: 'Re Bolelle Hape (Ka Boikhethelo)',
    description:
      'Arolelana ka lintho tse ling mabapi le kamoo u ikutloang kateng. U ka ngola, bua, kapa kenya litokomane.',
    placeholder:
      'Hlalosa seo u se nahang, mefuta ea matšoaelelo, kapa bothata boo u batlang thuso ka bona...',
    speak: 'Bua',
    stop: 'Emisa Ho Rekhota',
    upload: 'Kenya Tokomane',
    acceptedFiles: 'Tse amohetsoeng: PDF, litšoantšo (JPG, PNG), kapa lifaele tsa mongolo.',
    submitWithText: 'Romela & Fumana Liphello',
    submitWithoutText: 'Tlola & Fumana Liphello',
  },
  completing: {
    title: 'Re se re sebetsa tlhahlobo ya hau...',
    body: 'Re u kopanya le lits\'ebeletso tsa mehaehelo sebakeng sa hau.',
  },
  result: {
    crisisTitle: 'Thuso e Potlakileng e Fumaneha',
    crisisBody:
      'Ka ho latela likarabo tsa hau, re u khothalletsa haholo hore u buisane le mang kapa mang hona joale. Ka kōpo ikopanye le ts\'ebeletso e nngwe tse ka tlase kapa e\'a tleliniking ea haufinyane.',
    completeTitle: 'Tlhahlobo E Phethiloe',
    completeBody:
      'Kea leboha ka ho phetha tlhahlobo ena. Ka ho latela likarabo tsa hau, re fumane lits\'ebeletso tsa mehaehelo tse ka u thusang.',
    recommendedTitle: 'Lits\'ebeletso Tse Khothalletsweng Haufinyane le Uena',
    recommendedDescription:
      'Lits\'ebeletso tsena li tsebisoe ka mabapi le phoso ya hau. U ka ikopanya le tsona ka tsela e tobileng.',
    emergencyCapable: 'E khonehang ea tšohanyetso',
    websiteLabel: 'Websaete',
    noFacilitiesBody:
      'Ha ho lits\'ebeletso tse ngolisitsoeng sebakeng sa hau hona joale. Tlhahlobo ya hau e bolokiloe mme u tla ikopanishwa ha lits\'ebeletso li fumaneha.',
    inMeantime: 'Nakong ena, u ka ikopanya le:',
    referralTitle: 'Nomoro ea Phoso ya Hau — ngola hona joale',
    referralDescription:
      'Ena ke tsela e le nngoe ea ho latela ka lekunutu. Ha re khone ho khutlisa PIN ya hau ha e lahleha.',
    referralIdLabel: 'Nomoro ea Phoso',
    pinLabel: 'PIN ea Netefatso',
    copy: 'Kopa',
    saveWarningTitle: '⚠ Boloka tsena pele u koala leqepha lena',
    saveWarningBody: 'Nka setšoantšo sa skrine, ngola, kapa ukope. Li ke ke tsa bontšoha hape.',
    checkStatusButton: 'Hlola maemo kapa romela molaetsa setsibing sa hau',
    nextTitle: 'Ho Tla Etsahala Eng Hape?',
    nextStep1: 'Setsibi sa hau se tsebisoe ka mabapi le phoso ya hau e sa tsejoeng.',
    nextStep2:
      'Etela, letsetsa, kapa romela imeili mme u fange Nomoro ea Phoso + PIN — ba tla hlahloba tlhahlobo ya hau ka potlako.',
    nextStep3:
      'Haeba e se bohlokoa haholo, ka kōpo latela ka mor\'a matsatsi a 14. U ka khutlela mona neng kapa neng ho hlola maemo, ho romela molaetsa setsibing, kapa ho arolelana lintlha tsa ho ikopanya ha u batla hore ba ikopanye le uena ka tsela e tobileng.',
    facilityCtaPrompt: 'Na u setsibi sa mehaehelo?',
    facilityCtaBody:
      'Ngolisa setsibi sa hau Nzwisiso ho fumana diphethoho tsa botho le ho ikopanya le bakuli sebakeng sa hau.',
    facilityCtaButton: 'Ngolisa Setsibi sa Hau',
    homeButton: 'Khutlela Hae',
  },
};

export default st;
