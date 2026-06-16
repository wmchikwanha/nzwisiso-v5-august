/**
 * Xhosa (xh) - Self-Assessment Locale
 *
 * Language: isiXhosa
 * Region: South Africa (Eastern Cape, Western Cape, Northern Cape, Gauteng)
 * ISO 639-1: xh
 *
 * PHQ-9 source: Clinically validated isiXhosa PHQ-9 translation used in
 * South African public health programmes.
 * Reference: Bhana & Pappenheim (2017) - PHQ-9 validation in isiXhosa
 * for Eastern Cape primary healthcare facilities.
 */

import type { SelfAssessStrings } from '../types';

const xh: SelfAssessStrings = {
  header: {
    title: 'Nzwisiso',
    subtitle: 'Uvavanyo Lweempilo Zengqondo',
    confidential: 'Iyimfihlo',
  },
  progress: (c, t) => `Inyathelo ${c} le ${t}`,
  crisis: {
    banner: 'Ukuba usesimweni esingaphephile, nceda uqhagamshelane neenkonzo zezokhuseleko ngoku',
    services: {
      befrienders: 'Befrienders Zimbabwe',
      sadag: 'SADAG (South Africa)',
      lifeline: 'Lifeline',
      emergency: 'Iinkonzo Zezokhuseleko',
    },
  },
  welcome: {
    title: 'Uvavanyo Lweempilo Zengqondo',
    description:
      'Esi sixhobo simahala, siyayifihla esekunceda ukuqonda impilo yengqondo yakho kwaye sikudibanisa nabantu abanikezeli bempilo yengqondo endaweni yakho.',
    expectHeading: 'Okuhloliweyo:',
    expect: [
      'Umbuzo omfutshane wokuhlola (malunga nemizuzu emihlanu)',
      'Ukhetho lokwabelana ngengingqi yakho ngelizwi, umbhalo, okanye ukulayisha uxwebhu',
      'Ukuhambelana okuyimfihlo neenkonzo zeempilo zengqondo kufutshane nawe',
      'Akukho nkcazelo yakho ebekwayo egcinwa',
    ],
    notEmergencyTitle: 'Esi asisiyo inkonzo yezokhuseleko',
    notEmergencyBody:
      'Ukuba usesimweni esingaphephile okanye ucabanga ngokuzenzakalisa, nceda ufakele iinkonzo zezokhuseleko (112) okanye uye esibhedlela esikufutshane nesakho.',
    languageLabel: 'Ulwimi olukhethwayo',
    startButton: 'Qala Uvavanyo',
  },
  consent: {
    title: 'Imvume Nenkcazelo Yokhuseleko',
    description: 'Nceda ufunde uvume ezilandelayo phambi kokuqhubeka.',
    backButton: 'Emva',
    continueButton: 'NdiyaVuma Futhi NdiyaQhubeka',
    items: {
      screening_disclaimer:
        'Ndiyaqonda oku sisixhobo sokuhlola impilo yengqondo kuphela, ASIYO kuxilongwa okanye icebiso lonyango. Iimveliso zondinceda ukuba ndidibane neenkonzo ezifanele zeempilo zengqondo.',
      data_sharing:
        'NdiyaVuma ukuba iimpendulo zam ezingaziwa zabelane neenkonzo zeempilo zengqondo ukuze kuqinisekiswe ukudibana.',
      emergency_understanding:
        'Ndiyaqonda ukuba xa ndigula kakhulu, kufuneka ndifowunele iinkonzo zezokhuseleko (112) okanye ndiye esibhedlela ngokukhawuleza. Esi sixhobo ASISI yenkonzo yezokhuseleko.',
      voluntary_participation:
        'Ndiqinisekisa ukuba ndizaliseka ngokwam oku kwaye ukuba iimpendulo zam ziyinyaniso ngokwazi kwam.',
      age_confirmation:
        'Ndiqinisekisa ukuba ndineminyaka eli-18 nangaphezulu, okanye ndiyaliseka oku ndaziwa ngumzali/umgcini wam.',
      research_opt_in:
        'NdiyaVuma ukuba inkcazelo yam ezigcinwe iyasetjenziswa kuphando lweempilo zengqondo ukuthuthukisa iinkonzo endaweni yam.',
    },
  },
  demographics: {
    title: 'Ngawe',
    description:
      'Sincede ukuba sidibane neenkonzo ezifanelekileyo. Akukho nkcazelo yakho egcinwayo.',
    ageLabel: 'Iminyaka',
    agePlaceholder: 'Khetha iminyaka',
    genderLabel: 'Isini',
    genderPlaceholder: 'Khetha isini',
    regionLabel: 'Indawo /iphondo',
    regionPlaceholder: 'Khetha indawo yakho',
    genders: { male: 'Indoda', female: 'UMfazi', nonBinary: 'Akukho sini', preferNot: 'Ndingakhethi ukutsho' },
    continueButton: 'Qhubela Ekubeni',
  },
  screening: {
    title: 'Uzizwa Njani?',
    description:
      'Kule veki ezi-2 ezidlulileyo, kube khona kaninzi na le ngxaki ilandelayo ekukhubekisayo?',
    safetyBadge: 'Umbuzo wokhuseleko',
    questions: [
      'Ukungabi nantlaka nokonwatywa kwemisebenzi',
      'Ukuzizwa kucinezelelwe, ukudakumba, okanye ukuphulukana nethemba',
      'Ingxaki yokulala noma ukugcina ubuthongo, okanye ukulala kakhulu',
      'Ukuzizwa udiniwe okanye ukungabi namandla',
      'Ukutya kancinane okanye ukutya kakhulu',
      'Ukuzizwa kakubi ngawe — okanye ukuba ulahlekile okanye ukuba uzidelele wena okanye umndeni wakho',
      'Ingxaki yokugxila ezintweni, ezifana nokufunda noma ukubuka i-television',
      'Ukuzimisela okanye ukuthetha kakhulu ukuze abanye bantu baqaphele? Okanye okuchaseneyo — ukuba nomsindo okanye ukungazoli',
      'Iingcinga zokuba kungcono ukufa, okanye zokuzenzakalisa ngandlela ithile',
    ],
    likert: [
      'Hayi nakancinci',
      'Iintsuku ezithile',
      'Ngaphezulu kwesiqingatha seentsuku',
      'Iintsuku zonke',
    ],
    continueButton: 'Qhubeka',
  },
  narrative: {
    title: 'Sixelele Okunye (Ukhetho)',
    description:
      'Yabelana ngokunye okumalunga nokuzizwa kwakho. Ungabhala, ukhulume, okanye ulayishe amaxwebhu.',
    placeholder:
      'Chaza okusezintlokweni, imizwa, okanye iingxaki ozifunayo uncedo ngazo...',
    speak: 'Thetha',
    stop: 'Yeka ukuRekhoda',
    upload: 'Layisha uxwebhu',
    acceptedFiles: 'Amkelekile: PDF, imifanekiso (JPG, PNG), okanye amafayela emibhalo.',
    submitWithText: 'Thumela & Fumana Iimveliso',
    submitWithoutText: 'Tsiba & Fumana Iimveliso',
  },
  completing: {
    title: 'Iyalungiselela uvavanyo lwakho...',
    body: 'Sikudibanisa neenkonzo zeempilo zengqondo endaweni yakho.',
  },
  result: {
    crisisTitle: 'Uncedo Lwangoku Luyafumaneka',
    crisisBody:
      'Ngokusekelwe kwiimpendulo zakho, sikukhuthaza kakhulu ukuba uthethe nomntu ngoko nangoko. Nceda uqhagamshelane nenye yeekonzo ezilandelayo okanye uye esibhedlela esikufutshane nesakho.',
    completeTitle: 'Uvavanyo Lugqityiwe',
    completeBody:
      'Enkosi ngokugqibezela uvavanyo olu. Ngokusekelwe kwiimpendulo zakho, sifumane iinkonzo zeempilo zengqondo ezinokukunceda.',
    recommendedTitle: 'Iinkonzo Ezikhuthaziweyo Kufutshane Nawe',
    recommendedDescription:
      'Ezi nkonzo zaziselwe ngendlela yokusetyenziswa. Ungaziqhagamshela ngokuthe ngqo.',
    emergencyCapable: 'Inokunceda ngexesha lezokhuseleko',
    websiteLabel: 'Iwebhusayithi',
    noFacilitiesBody:
      'Akukho zibonelelo ezibhalisiweyo endaweni yakho ngoku. Uvavanyo lwakho lugcinwe kwaye uyaqhagamshelwa xa iinkonzo zifumaneka.',
    inMeantime: 'Ngale ngxesha, ungaqhagamshelana ne:',
    referralTitle: 'Isazisi Sakho — kubhale phansi ngoku',
    referralDescription:
      'Esi yindlela eyodwa yokulandelela ngokungaziwa. Asinakubuyisela i-PIN yakho xa ilahlekile.',
    referralIdLabel: 'Isazisi Sokubonisa',
    pinLabel: 'I-PIN Yokuqinisekisa',
    copy: 'Kopa',
    saveWarningTitle: '⚠ Gcina ezi ngaphambi kokuvula eli phepha',
    saveWarningBody: 'Thatha isikrini, bhala phansi, okanye ukope. Aziyi kubonwa kwakhona.',
    checkStatusButton: 'Khangala isimo okanye thumela umyalezo kwisibonelelo sakho',
    nextTitle: 'Kuzakwenzeka Ntoni Na?',
    nextStep1: 'Isibonelelo sakho saziswa ngesazisi sakho esingaziwa.',
    nextStep2:
      'Tyelela, fowunela, okanye thumela i-imeyili uze unike i-Referral ID + PIN — baya kukhangala uvavanyo lwakho ngoko nangoko.',
    nextStep3:
      'Ukuba asiyonto ekukhawulezayo, nceda ulandelele emva kweentsuku ezili-14. Ungabuya apha nini na ukuba ukhangale isimo, uthumele umyalezo kwisibonelelo, okanye wabelane iinkcukacha zokuqhagamshelana ukuba uyafuna ukuba baqhagamshelane nawe ngokuthe ngqo.',
    facilityCtaPrompt: 'Ingaba uyisibonelelo seempilo zengqondo?',
    facilityCtaBody:
      'Bhalisa isibonelelo sakho kuNzwisiso ukuze ufumane iingcaciso zabantu ngabanye uzidibane nabagulisi endaweni yakho.',
    facilityCtaButton: 'Bhalisa Isibonelelo Sakho',
    homeButton: 'Buyela ekhaya',
  },
};

export default xh;
