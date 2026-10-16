// ACE-USF Fellowship Leaders Network data.
// Add only verified, public records with each leader's consent.
// Keep role values exactly as: "Astebabari", "Genzeb Yazh", or "Tsehafi".
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
//   activeMembers: 145, // verified current fellowship count
//   fellowshipName: "Optional verified fellowship name",
//   description: "Optional approved public description",
//   active: true,
//   leaders: [
//     { role: "Astebabari", fullName: "", department: "", telegram: "", telegramPublic: false, photoUrl: "", photoApproved: false, introduction: "", electedYear: 2026, termStartYear: 2026, termEndYear: 2027 },
//     { role: "Genzeb Yazh", fullName: "", department: "", telegram: "", telegramPublic: false, photoUrl: "", photoApproved: false, introduction: "", electedYear: 2026, termStartYear: 2026, termEndYear: 2027 },
//     { role: "Tsehafi", fullName: "", department: "", telegram: "", telegramPublic: false, photoUrl: "", photoApproved: false, introduction: "", electedYear: 2026, termStartYear: 2026, termEndYear: 2027 }
//   ],
//   leadershipHistory: [
//     { academicYear: "2025/2026", electionDate: "2025-10", leaders: [/* previous term's three leader records */] }
//   ]
// }

import { db } from "./firebase_config.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

export const fellowshipUniversityRecords = [];
let hasStarted = false;

// Admin changes saved at siteContent/leaders/items/{campusId} flow into the
// public leaders room in real time. Only approved/published rows are queried.
export function watchFellowshipUniversityRecords(onChange = () => {}, onError = () => {}) {
  if (hasStarted) { onChange(fellowshipUniversityRecords); return () => {}; }
  hasStarted = true;
  const ref = query(collection(db, "siteContent", "leaders", "items"), where("published", "==", true));
  const unsubscribe = onSnapshot(ref, snapshot => {
    fellowshipUniversityRecords.splice(0, fellowshipUniversityRecords.length,
      ...snapshot.docs.map(item => ({ id: item.id, ...item.data() })).filter(row => row.active !== false)
    );
    window.dispatchEvent(new CustomEvent("ace:fellowship-leaders-updated"));
    onChange(fellowshipUniversityRecords);
  }, error => onError(error));
  return unsubscribe;
}
