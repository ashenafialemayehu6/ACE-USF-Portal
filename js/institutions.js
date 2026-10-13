// js/institutions.js - Comprehensive Directory of Public Universities & Accredited Private University Colleges in Ethiopia

export const ethiopianInstitutions = [
  // --- Central & Addis Ababa Institutions ---
  { id: "aau", name: "Addis Ababa University (AAU)", region: "Addis Ababa & Central", type: "Public" },
  { id: "aastu", name: "Addis Ababa Science & Tech University (AASTU)", region: "Addis Ababa & Central", type: "Public" },
  { id: "keu", name: "Kotebe Education University (KEU)", region: "Addis Ababa & Central", type: "Public" },
  { id: "ecsu", name: "Ethiopian Civil Service University (ECSU)", region: "Addis Ababa & Central", type: "Public" },
  { id: "fdef", name: "Defence University (College of Engineering)", region: "Addis Ababa & Central", type: "Public" },
  { id: "eatc", name: "Ethiopian Aviation University (EAL)", region: "Addis Ababa & Central", type: "Public" },

  // --- Oromia Region Public Universities ---
  { id: "astu", name: "Adama Science & Tech University (ASTU)", region: "Oromia Region", type: "Public" },
  { id: "jimma", name: "Jimma University (JU)", region: "Oromia Region", type: "Public" },
  { id: "hramaya", name: "Haramaya University", region: "Oromia Region", type: "Public" },
  { id: "ambo", name: "Ambo University", region: "Oromia Region", type: "Public" },
  { id: "wollega", name: "Wollega University (Nekemte)", region: "Oromia Region", type: "Public" },
  { id: "bule_hora", name: "Bule Hora University", region: "Oromia Region", type: "Public" },
  { id: "mettu", name: "Mettu University", region: "Oromia Region", type: "Public" },
  { id: "arsi", name: "Arsi University (Asella)", region: "Oromia Region", type: "Public" },
  { id: "madda_walabu", name: "Madda Walabu University (Bale Robe)", region: "Oromia Region", type: "Public" },
  { id: "oda_bultum", name: "Oda Bultum University (Chiro)", region: "Oromia Region", type: "Public" },
  { id: "selale", name: "Salale University (Fitche)", region: "Oromia Region", type: "Public" },
  { id: "dembi_dolo", name: "Dembi Dolo University", region: "Oromia Region", type: "Public" },
  { id: "borena", name: "Borena University (Yabelo)", region: "Oromia Region", type: "Public" },

  // --- Sidama, Central & South Ethiopia Public Universities ---
  { id: "hawassa", name: "Hawassa University (HU)", region: "Sidama & Southern Regions", type: "Public" },
  { id: "arba_minch", name: "Arba Minch University (AMU)", region: "Sidama & Southern Regions", type: "Public" },
  { id: "dilla", name: "Dilla University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "wolaita_sodo", name: "Wolaita Sodo University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "wachamo", name: "Wachamo University (Hossana)", region: "Sidama & Southern Regions", type: "Public" },
  { id: "werabe", name: "Werabe University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "wolkite", name: "Wolkite University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "bonga", name: "Bonga University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "mizan_tepi", name: "Mizan-Tepi University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "jinka", name: "Jinka University", region: "Sidama & Southern Regions", type: "Public" },
  { id: "tarcha", name: "Dawro Tarcha University", region: "Sidama & Southern Regions", type: "Public" },

  // --- Amhara Region Public Universities ---
  { id: "bahirdar", name: "Bahir Dar University (BDU)", region: "Amhara Region", type: "Public" },
  { id: "gondar", name: "University of Gondar (UoG)", region: "Amhara Region", type: "Public" },
  { id: "wollo", name: "Wollo University (Dessie)", region: "Amhara Region", type: "Public" },
  { id: "debre_markos", name: "Debre Markos University", region: "Amhara Region", type: "Public" },
  { id: "debre_birhan", name: "Debre Berhan University", region: "Amhara Region", type: "Public" },
  { id: "woldia", name: "Woldia University", region: "Amhara Region", type: "Public" },
  { id: "debre_tabor", name: "Debre Tabor University", region: "Amhara Region", type: "Public" },
  { id: "injibara", name: "Injibara University", region: "Amhara Region", type: "Public" },
  { id: "debark", name: "Debark University", region: "Amhara Region", type: "Public" },
  { id: "mekdela_amba", name: "Mekdela Amba University", region: "Amhara Region", type: "Public" },

  // --- Tigray Region Public Universities ---
  { id: "mekelle", name: "Mekelle University (MU)", region: "Tigray Region", type: "Public" },
  { id: "aksum", name: "Aksum University", region: "Tigray Region", type: "Public" },
  { id: "adigrat", name: "Adigrat University", region: "Tigray Region", type: "Public" },
  { id: "raya", name: "Raya University (Maychew)", region: "Tigray Region", type: "Public" },

  // --- Dire Dawa, Eastern & Emerging Regions ---
  { id: "diredawa", name: "Dire Dawa University (DDU)", region: "Eastern & Emerging Regions", type: "Public" },
  { id: "jigjiga", name: "Jigjiga University", region: "Eastern & Emerging Regions", type: "Public" },
  { id: "kebri_dehar", name: "Kebri Dehar University", region: "Eastern & Emerging Regions", type: "Public" },
  { id: "samara", name: "Samara University (Afar)", region: "Eastern & Emerging Regions", type: "Public" },
  { id: "assosa", name: "Assosa University (Benishangul)", region: "Eastern & Emerging Regions", type: "Public" },
  { id: "gambella", name: "Gambella University", region: "Eastern & Emerging Regions", type: "Public" },

  // --- Accredited Private Universities & University Colleges ---
  { id: "st_mary", name: "St. Mary's University", region: "Private Universities & Colleges", type: "Private" },
  { id: "unity_univ", name: "Unity University", region: "Private Universities & Colleges", type: "Private" },
  { id: "rift_valley", name: "Rift Valley University", region: "Private Universities & Colleges", type: "Private" },
  { id: "admas_univ", name: "Admas University", region: "Private Universities & Colleges", type: "Private" },
  { id: "harambee", name: "Harambee University", region: "Private Universities & Colleges", type: "Private" },
  { id: "hope_ent", name: "Hope Enterprise University College", region: "Private Universities & Colleges", type: "Private" },
  { id: "hilcoe", name: "HilCoE School of Computer Science", region: "Private Universities & Colleges", type: "Private" },
  { id: "cpu_college", name: "CPU College", region: "Private Universities & Colleges", type: "Private" },
  { id: "microlink", name: "Microlink Information Technology College", region: "Private Universities & Colleges", type: "Private" },
  { id: "infolink", name: "Infolink University College", region: "Private Universities & Colleges", type: "Private" },
  { id: "yardstick", name: "Yardstick International College", region: "Private Universities & Colleges", type: "Private" },
  { id: "leadstar", name: "Leadstar University College", region: "Private Universities & Colleges", type: "Private" },
  { id: "royal_college", name: "Royal College", region: "Private Universities & Colleges", type: "Private" },
  { id: "dandii_boru", name: "Dandii Boru College", region: "Private Universities & Colleges", type: "Private" },
  { id: "africa_beza", name: "Africa Beza University College", region: "Private Universities & Colleges", type: "Private" },
  { id: "grace_college", name: "Grace College", region: "Private Universities & Colleges", type: "Private" },
  { id: "paradise_valley", name: "Paradise Valley University College", region: "Private Universities & Colleges", type: "Private" },
  { id: "queens_college", name: "Queens' College", region: "Private Universities & Colleges", type: "Private" },
  { id: "gideon_college", name: "Gideon College", region: "Private Universities & Colleges", type: "Private" },
  { id: "other_inst", name: "Other University / College", region: "Private Universities & Colleges", type: "Other" }
];

/**
 * Single-line function to populate any <select> element across your portal!
 */
export function populateInstitutionSelect(selectElementId, defaultText = "Select university or college...") {
  const select = document.getElementById(selectElementId);
  if (!select) return;

  let optionsHTML = `<option value="" disabled selected>${defaultText}</option>`;

  const regions = [...new Set(ethiopianInstitutions.map(i => i.region))];

  regions.forEach(region => {
    const list = ethiopianInstitutions.filter(i => i.region === region);
    optionsHTML += `<optgroup label="🏢 ${region}">`;
    list.forEach(inst => {
      optionsHTML += `<option value="${inst.id}">${inst.name}</option>`;
    });
    optionsHTML += `</optgroup>`;
  });

  select.innerHTML = optionsHTML;
}