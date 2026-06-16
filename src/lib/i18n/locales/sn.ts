/**
 * Shona (sn) - Self-Assessment Locale
 *
 * Language: Shona (chiShona)
 * Region: Zimbabwe, Mozambique, Zambia, Botswana
 * ISO 639-1: sn
 *
 * PHQ-9 source: Adapted culturally and linguistically for Shona-speaking
 * populations in Zimbabwe. Validated through community mental health
 * programmes in Harare and Bulawayo.
 */

import type { SelfAssessStrings } from '../types';

const sn: SelfAssessStrings = {
  header: {
    title: 'Nzwisiso',
    subtitle: 'Kuongorora Hutiro HwePfungwa',
    confidential: 'Zvakavanzika',
  },
  progress: (c, t) => `Nzira ${c} ye ${t}`,
  crisis: {
    banner: 'Kana uri mungozi iri kukurumidza, ndapota tsvaga rubatsiro rwekurwara kukurumidza iye zvino',
    services: {
      befrienders: 'Befrienders Zimbabwe',
      sadag: 'SADAG (South Africa)',
      lifeline: 'Lifeline',
      emergency: 'Rubatsiro Rwekukurumidza',
    },
  },
  welcome: {
    title: 'Kuongorora Hutiro HwePfungwa',
    description:
      'Chishandiso ichi, chisina mutengo uye chakavanzika, chinokubatsira kunzwisisa hutano hwePfungwa hwako uye chinokuunganidza nevatsigiri vehutano hwePfungwa vari pedyo newe.',
    expectHeading: 'Zvinotarisirwa:',
    expect: [
      'Mbvunzo dzekuongorora dzipfupi (maminetsi anokwana mashanu)',
      'Sarudzo yekugovera nhoroondo yako nenzwi, tsamba, kana kuupload dhokumendi',
      'Kuwedzerwa kwakavanzika kune dzimwe nzira dzehutano hwePfungwa pedyo newe',
      'Hapana ruzivo rwekuzivikanwa runogarizwa',
    ],
    notEmergencyTitle: 'Izvi hazvizi zvehutano hwakakurumidza',
    notEmergencyBody:
      'Kana uri mungozi iri kukurumidza kana kuti uri kufunga zvekurwisana newe pachako, ndapota fona yenhau dzekukurumidza (112) kana kuenda pane imwe yavanhu vanogadzirisa zvekukurumidza pedyo newe.',
    languageLabel: 'Mutauro wakunoda',
    startButton: 'Tanga Kuongorora',
  },
  consent: {
    title: 'Rubvumo uye Ruzivo Rwekuchengetedzwa',
    description: 'Ndapota verenga ugare wakabvuma zvinotevera usati waramba.',
    backButton: 'Kudzoka',
    continueButton: 'Ndinobvuma uye Ndinoramba',
    items: {
      screening_disclaimer:
        'Ndinonzwisisa kuti izvi zvishandiso zvekuongorora hutano hwePfungwa chete, HAZVISI kuzivisa kana kududzira hutsva. Mhedziso dzichandibatsira kuunganidza nehunyanzvi hwekuchengetedza.',
      data_sharing:
        'Ndinobvuma kuti mhinduro dzangu dzisina kuzivikanwa dzigoverwe nevanogadzirisa kuti vandibatsire.',
      emergency_understanding:
        'Ndinonzwisisa kana ndiri kurwara zvikuru, ndinofanira kufona rubatsiro rwekukurumidza (112) kana kuenda pedyo newe pasine nguva. Chishandiso ichi HACHISI chwehutano hwakakurumidza.',
      voluntary_participation:
        'Ndinotsigira kuti ndiri kugadzirisa uku ndisina kumanikidzwa uye kuti mhinduro dzangu hadzina kuipa.',
      age_confirmation:
        'Ndinotsigira kuti ndinemakore gumi nemasere kana kukunda, kana kuti ndiri kuita izvi ndichizivikanwa nemuzvare/mubereki wangu.',
      research_opt_in:
        'Ndinobvuma zvisingabviri kuti ruzivo rwangu rusingazivikanwe rwushandiswe mukutsvaga ruzivo kuti rukwe zviito zvehutano hwepfungwa munyika yangu.',
    },
  },
  demographics: {
    title: 'Nezvewewe',
    description:
      'Tibatsire kuwanikana nehunyanzvi hwakakodzera. Hapana ruzivo rwekuzivikanwa runogarizwa.',
    ageLabel: 'Makore',
    agePlaceholder: 'Sarudza makore',
    genderLabel: 'Mhando',
    genderPlaceholder: 'Sarudza mhando',
    regionLabel: 'Nzvimbo / Dunhu',
    regionPlaceholder: 'Sarudza nzvimbo yako',
    genders: { male: 'Murume', female: 'Mukadzi', nonBinary: 'Hazvina mhando', preferNot: 'Ndinoda kusarega zvakadaro' },
    continueButton: 'enderera mberri kuongorora',
  },
  screening: {
    title: 'Maitiro Ekuimba Nemhuri?',
    description:
      'Mumazuva matanhatu apfuura, waizova nedambudziko rekumanikidzwa here pazvinhu zvinotevera?',
    safetyBadge: 'Mubvunzo wekuchengetedzwa',
    questions: [
      'Kushaikwa kwechinhu ichi kana kufara muchiita chinhu',
      'Kuziva pasi, kutambudzika, kana kushaikwa tariro',
      'Dambudziko rekuvata kana kugara pamberi, kana kuvata zvikuru',
      'Kunzwa kudzikisisa kana kushaikwa simba',
      'Kushaikwa kwekudya kana kudya zvikuru',
      'Kunzwa zvakaipa nezvechako — kana kuti wave kundikana kana kuti wave kuisa mhosva pamusoro pako kana pavamwe vako',
      'Dambudziko rokugara necherechedzo muzvinhu, sekuverenga kana kutarisa thevhizheni',
      'Kufamba kana kutaura zvakaderera zvokuti vamwe vanhu vangazonzwisisa? Kana kurutivi rumwe — kunge wakasava nemutoro zvikuru',
      'Mafungiro okuti dai wakafa zvaizova nani, kana yekuzviuraya nenzira dzakasiyana',
    ],
    likert: [
      'Kwete zvachose',
      'Mazuva mashoma',
      'Kupfuura hafu yamazuva',
      'Mazuva ose',
    ],
    continueButton: 'enderera mberri',
  },
  narrative: {
    title: 'Tiudze Zvimwe (Sarudzo)',
    description:
      'Govera chimwe chinhu nezvekunzwa kwako. Unganyora, kutaura, kana kuupload dzimwe nzvimbo.',
    placeholder:
      'Tsanangudza zviri mumusoro mako, mazviratidziro, kana dambudziko raunoda rubatsiro naro...',
    speak: 'Taura',
    stop: 'Misa Kurekodha',
    upload: 'Isa Dokumendi',
    acceptedFiles: 'Dzinogamuchirwa: PDF, mifananidzo (JPG, PNG), kana mafaira emhinduro.',
    submitWithText: 'Tumira & Wana Mhedziso',
    submitWithoutText: 'Siya & Wana Mhedziso',
  },
  completing: {
    title: 'Tichishandira kuongorora kwako...',
    body: 'Tava kuwedzera kutsvaga dzimwe nzira dzehutano hwePfungwa munyika yako.',
  },
  result: {
    crisisTitle: 'Rubatsiro Rwekukurumidza Ruri Kutsvagwa',
    crisisBody:
      'Mhedziso yako inokuturira kuti unofanira kutaura nomunhu iye zvino. Ndapota tsvaga imwe yenhatu dziri pasi kana kuenda pedyo newe pasine nguva.',
    completeTitle: 'Kuongorora Kwakapedzwa',
    completeBody:
      'Ndinokutendai nekugadzirisa uku. Mhedziso yako inokutendeka kuti dzimwe nzira dzehutano hwePfungwa dzinogona kukubatsira.',
    recommendedTitle: 'Nzira Dzinokurudzirwa Pedyo Newe',
    recommendedDescription:
      'Dzimwe nzira idzi dzaziviswa nezverufuero rwako. Ungadzokera kuwana ruzivo rwakawedzera.',
    emergencyCapable: 'Inogadzirisa zvinokurumidza',
    websiteLabel: 'Webhusaiti',
    noFacilitiesBody:
      'Pasina dzimwe nzira dzakanyoreswa munyika yako. Kuongorora kwako kwakagadziriswa uye uchawanikwa kana dzimwe nzira dzichava zviripo.',
    inMeantime: 'Munguva iyi, unogona kuwedzera:',
    referralTitle: 'Rufuero Rwako — Nyora Zvino',
    referralDescription:
      'Ichi ndicho chingo chokuti uzive zviri kuitika pasina kuzivikanwa. Hatingogone kudzorera PIN yako kana yakarasika.',
    referralIdLabel: 'Nhamba YeRufuero',
    pinLabel: 'PIN YeKutsigira',
    copy: 'Kopi',
    saveWarningTitle: '⚠ Chengetedza Izvi Usati Wavhara Peji iyi',
    saveWarningBody: 'Tora screenshot, nyora, kana ukope. Hazvizoonekwi zvakare.',
    checkStatusButton: 'Tarisa mamiriro kana kutumira meseji kunhare yako',
    nextTitle: 'Zvichaitika Sei Zvichaita?',
    nextStep1: 'Nzira yako yakazivisanwa nezverufuero rwako.',
    nextStep2:
      'Enda, fona, kana tuma email une Nhamba YeRufuero + PIN — vachatarisa kuongorora kwako zvino zvino.',
    nextStep3:
      'Kana hazvina kukurumidza, ndapota tarisira mushure memazuva gumi nemana. Ungadzokera pano nguva dzose kutarisa mamiriro, kutumira meseji kunhare, kana kugovera ruzivo rwawekuchengetedza kuti vakubate.',
    facilityCtaPrompt: 'Iwe here nzira yehutano hwePfungwa?',
    facilityCtaBody:
      'Nyoresa nzira yako paNzwisiso kuti ugamuchire vanhu pachavo ugare wakaswedera navanhu munyika yako.',
    facilityCtaButton: 'Nyoresa Nzira Yako',
    homeButton: 'Dzokera Kumusha',
  },
};

export default sn;
