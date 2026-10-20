// ACE-USF Fellowship Leaders Network data.
// Add only verified, public records with each leader's consent.
// This file is public website data; never put private notes or credentials here.
// After an annual election, append the outgoing team's full term under leadershipHistory,
// then replace leaders with the newly elected team. Do not erase the earlier term.
//
// Record shape:
// {
//   id: "dire-dawa-university",
//   universityName: "Official University Name",
//   city: "City",
//   latitude: 9.60, longitude: 41.86, // verified campus coordinates for current weather
//   fellowshipName: "Optional verified fellowship name",
//   description: "Optional approved public description",
//   active: true,
//   leaders: [{ fullName: "", department: "", phone: "", phonePublic: false }],
//   leadershipHistory: [
//     { academicYear: "2025/2026", electionDate: "2025-10", leaders: [/* previous term's approved roster */] }
//   ]
// }

import { db } from "./firebase_config.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const branch = (name, leaders) => ({
  name,
  leaders: leaders.map(([fullName, phone]) => ({ fullName, phone, phonePublic: Boolean(phone) }))
});
const campusRecord = (id, universityName, branches, extra = {}) => ({
  id, universityName, active: true, published: true, rosterYear: "2019 E.C.", leaders: [],
  branches: branches.map(([name, people]) => branch(name, people)), ...extra
});

// Public roster and phone contacts supplied for 2019 E.C. by the fellowship.
// Names and phone numbers are published as provided; campus locations use the
// existing weather-service coordinates so each branch shows local weather.
const currentRoster = [
  campusRecord("jigjiga-university", "Jigjiga University", [["University fellowship", [["BROTHER GENETU TAMIRE", "0948392666"], ["SISTER EYERUSELEM ALEMAYEHU", "0940742184"]]]], { city: "Jigjiga", latitude: 9.3509, longitude: 42.8004 }),
  campusRecord("haramaya-university", "Haramaya University", [
    ["Main campus", [["BROTHER ይድድያ", "0986040441"], ["SISTER ፅዮን", "0954041445"]]],
    ["Gendeje / Techno campus", [["BROTHER ዮሴፍ", "0990389146"]]],
    ["Station / Veterinary campus", [["BROTHER ሰለሞን", "0978728261"], ["BROTHER ይድድያ", "0986040441"]]],
    ["University fellowship", [["ቄስ በትሩ", "091 208 5326"]]]
  ], { city: "Haramaya", latitude: 9.4120, longitude: 42.0160 }),
  campusRecord("ambo-university", "Ambo University", [
    ["Hachalu campus", [["BROTHER ANTIYE", "+251 954 721 886"], ["BROTHER KERAJ", "+251 991 986 630"], ["SISTER AYANTU", "+251 991 151 555"]]],
    ["Main campus", [["BROTHER JOHN", "+251 934 398 886"], ["BROTHER SAMUEL", "+251 902 845 631"], ["SISTER ZION", "0960 338 547"]]]
  ], { city: "Ambo", latitude: 8.9821, longitude: 37.8554 }),
  campusRecord("werabe-university", "Werabe University", [["University fellowship", [["KES DAGNACHEW MERSHA", "0925308499"], ["BROTHER TEMESGENTE SEMA", "0948246053"], ["BROTHER YOHANES BELAYCHEW", "0991409486"]]]], { city: "Werabe", latitude: 7.8420, longitude: 38.1630 }),
  campusRecord("debre-birhan-university", "Debre Berhan University", [["Main campus", [["BROTHER BINIAM", "0939498551"], ["SISTER RAHEL", "0929914032"]]]], { city: "Debre Berhan", latitude: 9.6752, longitude: 39.5325 }),
  campusRecord("wolkite-university", "Wolkite University", [["Main campus", [["BROTHER ዳንኤል ይልማ", "0979940819"], ["BROTHER ማርክነህ ማርቆስ", "0919594899"], ["BROTHER ብሩክ ደሳለኝ", "+25190164737"]]]], { city: "Wolkite", latitude: 8.2833, longitude: 37.7833 }),
  campusRecord("wollega-university", "Wollega University (Nekemte)", [["Robe campus", [["BROTHER ROBE", "0942503619"], ["BROTHER ZENEBE", "0916325859"]]]], { city: "Nekemte", latitude: 9.0833, longitude: 36.5500 }),
  campusRecord("wachemo-university", "Wachamo University (Hossana)", [
    ["Durame campus", [["BROTHER SINTE", "093 917 8718"]]],
    ["Main campus", [["BROTHER MEDANE TARIKU", "0953369922"], ["BROTHER MARANATA DANGISO", "096265 8250"], ["SISTER BEZAWIT GIRMA", "097657 7427"]]]
  ], { city: "Hossana", latitude: 7.5500, longitude: 37.8500 }),
  campusRecord("addis-ababa-university", "Addis Ababa University", [
    ["6 Kilo", [["ምስክር", "0938558830"], ["መረርቱ", "0977939503"]]],
    ["4 Kilo", [["ኖህ", "0976370736"], ["ናሆም", "0922457651"]]],
    ["ሠፈረ ሰላም", [["ሶፎንያስ", "0926532536"], ["ቶለዋቅ", "0985819796"]]]
  ], { city: "Addis Ababa", latitude: 9.0300, longitude: 38.7400 }),
  campusRecord("jimma-university", "Jimma University", [
    ["Main Gib", [["BROTHER FIKRE FISEHA", "0927473341"], ["SISTER MIHRET TLAHUN", "0996033155"]]],
    ["JIT / Techno campus", [["BROTHER MELAKU MATEWOS", "0989507236"], ["BROTHER OBSAN HABTAMU", "0945424754"]]],
    ["Agriculture campus", [["BROTHER AMON ABERA", "0986951124"], ["ESAYAS AGAGO", "0922676078"]]],
    ["Agaro campus", [["KES DEMISSEW", "0917312994"]]],
    ["University fellowship", [["KES DEREJE", "0985045805"]]]
  ], { city: "Jimma", latitude: 7.6757, longitude: 36.8482 }),
  campusRecord("dire-dawa-university", "Dire Dawa University (DDU)", [["University fellowship", [["BROTHER BEREKET ZELEKE", "0925617717"], ["BROTHER ANTENEH ASSEFA", "0931477057"], ["SISTER ARIYAM ABERA", "0933138082"]]]], { city: "Dire Dawa", latitude: 9.5931, longitude: 41.8661 }),
  campusRecord("gambella-university", "Gambella University", [["University fellowship", [["KES DESALEGN YONAS", "0916575228"], ["BROTHER MENGESHA", "0952610101"], ["SISTER MARTHA", "0926726815"]]]], { city: "Gambella", latitude: 8.2504, longitude: 34.5877 }),
  campusRecord("dilla-university", "Dilla University", [["University fellowship", [["BROTHER GETACHEW LECHAMO", "0948289063"], ["BROTHER SIMON SHIFERAW", "0928806774"], ["BROTHER MELAKU", "0926871920"], ["BROTHER BINIYAM ABTI", "0987054107"]]]], { city: "Dilla", latitude: 6.4100, longitude: 38.3103 }),
  campusRecord("jinka-university", "Jinka University", [["University fellowship", [["BROTHER TEMESGEN ALBAZO", "0961853236"], ["BROTHER LEW KUSSE", "+251 98 562 3195"]]]], { city: "Jinka", latitude: 5.7833, longitude: 36.5667 }),
  campusRecord("astu", "Adama Science & Tech University (ASTU)", [["University fellowship", [["BROTHER ደሳለኝ", "0980408831"], ["SISTER አዝመራይ", "0967815485"], ["BROTHER ቢንያም", "0936447466"], ["BROTHER እስራኤል", "0948603911"]]]], { city: "Adama", latitude: 8.5410, longitude: 39.2705 }),
  campusRecord("bule-hora-university", "Bule Hora University", [["University fellowship", [["BROTHER ESRAEL", "+251923685228"]]]], { city: "Bule Hora", latitude: 5.6333, longitude: 38.2333 }),
  campusRecord("salale-university", "Salale University (Fitche)", [["University fellowship", [["BROTHER MELKAMU MAMO", "0975052868"], ["BROTHER TOMAS DIRA", "0928802911"]]]], { city: "Fitche", latitude: 9.8000, longitude: 38.7333 }),
  campusRecord("hawassa-university", "Hawassa University (HU)", [["University fellowship", [["BROTHER ABENEZER ALEMU", "0934524811"], ["BROTHER ZERGAWU", "0921686164"], ["BROTHER BELETE BEZABHI", "0926434527"], ["BROTHER JOSH", "0955810141"], ["SISTER BEREKET MEHAMED", "0994037179"]]]], { city: "Hawassa", latitude: 7.0621, longitude: 38.4763 }),
  campusRecord("arsi-university", "Arsi University (Asella)", [
    ["University fellowship", [["BROTHER ኢዮስያስ ሲሳይ", "09 45 03 85 29"], ["KES ደቀባ ቱፋ", "09 66 99 07 76"]]],
    ["Dinsho campus", [["BROTHER ገመዳ ተሰማ", "09 34 46 41 68"]]],
    ["Ardu campus", [["BROTHER ካሌብ በሻዳ", "09 02 29 76 12"]]]
  ], { city: "Asella", latitude: 7.9500, longitude: 39.1167 }),
  campusRecord("wolaita-sodo-university", "Wolaita Sodo University", [
    ["Main campus", [["BROTHER ዳና ደሳለኝ", "0936499288"], ["BROTHER ፍፁም ደሳለኝ", "0967426586"], ["SISTER አዲስ", "0930981193"]]],
    ["Dewro Tarcha campus", [["BROTHER AMANUEL GEZUMA", "+251929781329"], ["BROTHER TEDDY FANITAHUN", "0942491046"]]]
  ], { city: "Wolaita Sodo" }),
  campusRecord("bahir-dar-university", "Bahir Dar University (BDU)", [["University fellowship", [["BROTHER ተክለ", "+251946737503"]]]], { city: "Bahir Dar", latitude: 11.5936, longitude: 37.3908 }),
  campusRecord("kotebe-shared-fellowship", "Kotebe Education University (KEU) / Ethiopian Civil Service University (ECSU) / Ethiopian Technical University", [["Kotebe Nifas Silk shared congregation", [["BROTHER ALEX", "0935118858"]]]], {
    fellowshipName: "Kotebe Nifas Silk Fellowship",
    description: "The supplied roster notes that Kotebe Education University, Ethiopian Civil Service University, and Ethiopian Technical University worship together at Kotebe Nifas Silk.",
    city: "Addis Ababa (Kotebe)", latitude: 9.0220, longitude: 38.8350
  }),
  campusRecord("debre-tabor-university", "Debre Tabor University", [["University fellowship", [["BROTHER ALAZAR TAREKEGN", "+251900267450"]]]], { city: "Debre Tabor", latitude: 11.8500, longitude: 38.0167 }),
  campusRecord("woldia-university", "Woldia University", [["University fellowship", [["SISTER BETEL HABTAMU", "+251963678954"], ["SISTER EYERUSALEM ARAHEW", "+251965272923"], ["BROTHER DANIEL", "+251919169383"], ["BROTHER DEMUYE", "+251933262391"]]]], { city: "Woldia", latitude: 11.8333, longitude: 39.6000 }),
  campusRecord("injibara-university", "Injibara University", [["University fellowship", [["SISTER LIDYA", "0906243052"], ["PASTOR DAGNE ZELEKE", "0904912349"]]]], { city: "Injibara", latitude: 10.9833, longitude: 36.9167 }),
  campusRecord("gondar-university", "University of Gondar (UoG)", [["University fellowship", [["MARANATHA FEKADU", "0997255355"]]]], { city: "Gondar", latitude: 12.6104, longitude: 37.4668 }),
  campusRecord("assosa-university", "Assosa University (Benishangul)", [["University fellowship", [["KES DESALEGN", "0913481573"], ["BROTHER EZRA OSSA", "092 763 5268"], ["BROTHER TIZAZU AMARU", "0920519658"]]]], { city: "Assosa", latitude: 10.0646, longitude: 34.5437 }),
  campusRecord("mizan-tepi-university", "Mizan-Tepi University", [["Tepi campus", [["SISTER TSION", "0911290527"], ["BROTHER EYASU", "0919136305"], ["BROTHER TESFA", "0973531376"]]]], { city: "Tepi" })
];

export const fellowshipUniversityRecords = [...currentRoster];
let hasStarted = false;

const recordKey = value => String(value || "").toLocaleLowerCase().replace(/wolayta/g, "wolaita").replace(/wachemo|wechamo/g, "wachemo").replace(/[^\p{L}\p{N}]/gu, "");
const sameCampus = (left, right) => {
  const a = recordKey(left);
  const b = recordKey(right);
  return Boolean(a && b && (a === b || (Math.min(a.length, b.length) >= 9 && (a.includes(b) || b.includes(a)))));
};
function mergeManagedBranches(seedBranches = [], liveBranches = []) {
  if (!liveBranches.length) return seedBranches;
  const merged = seedBranches.map(branch => ({ ...branch, leaders: [...(branch.leaders || [])] }));
  for (const liveBranch of liveBranches) {
    const target = merged.find(branch => recordKey(branch.name) === recordKey(liveBranch.name));
    if (!target) { merged.push(liveBranch); continue; }
    for (const liveLeader of liveBranch.leaders || []) {
      const existing = target.leaders.find(person => recordKey(person.fullName) === recordKey(liveLeader.fullName));
      if (existing) Object.assign(existing, liveLeader);
      else target.leaders.push(liveLeader);
    }
  }
  return merged;
}

// Admin changes saved at siteContent/leaders/items/{campusId} flow into the
// public leaders room in real time. Only approved/published rows are queried.
export function watchFellowshipUniversityRecords(onChange = () => {}, onError = () => {}) {
  if (hasStarted) { onChange(fellowshipUniversityRecords); return () => {}; }
  hasStarted = true;
  const ref = query(collection(db, "siteContent", "leaders", "items"), where("published", "==", true));
  const unsubscribe = onSnapshot(ref, snapshot => {
    const liveRows = snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(row => row.active !== false);
    const usedLiveIds = new Set();
    const rows = currentRoster.map(seed => {
      const liveMatches = liveRows.filter(row => sameCampus(row.universityName, seed.universityName));
      liveMatches.forEach(row => usedLiveIds.add(row.id));
      const live = liveMatches.at(-1);
      return {
        ...seed, ...(live || {}),
        universityName: seed.universityName,
        id: live?.id || seed.id,
        active: live?.active !== false && seed.active !== false,
        branches: mergeManagedBranches(seed.branches, liveMatches.flatMap(row => row.branches || []))
      };
    });
    rows.push(...liveRows.filter(row => !usedLiveIds.has(row.id) && !currentRoster.some(seed => sameCampus(seed.universityName, row.universityName))));
    fellowshipUniversityRecords.splice(0, fellowshipUniversityRecords.length, ...rows);
    window.dispatchEvent(new CustomEvent("ace:fellowship-leaders-updated"));
    onChange(fellowshipUniversityRecords);
  }, error => onError(error));
  return unsubscribe;
}
