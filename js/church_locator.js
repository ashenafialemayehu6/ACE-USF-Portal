// js/church_locator.js - Church Locator Service for ACE-USF Portal

export const churchDatabase = {
  aau: {
    campusName: "Addis Ababa University (AAU) & Central Institutions",
    churches: [
      {
        name: "ACE National Headquarters (Gofa Main Church)",
        subcity: "Nefas Silk Lafto / Gofa Camp",
        distance: "3.5 km from Sidist Kilo Campus",
        meetingDays: "Sunday: 8:30 AM - 12:30 PM | Wednesday: 5:00 PM",
        contactPerson: "Fellowship Secretariat",
        phone: "+251 11 466 0086",
        mapQuery: "Apostolic Church of Ethiopia Head Quarter Gofa Addis Ababa"
      },
      {
        name: "ACE Megenagna / Yeka Worship Center",
        subcity: "Yeka / Megenagna",
        distance: "2.1 km from 6 Kilo / Arat Kilo",
        meetingDays: "Sunday: 9:00 AM | Friday Evening Prayer: 5:30 PM",
        contactPerson: "Campus Student Rep",
        phone: "+251 911 000 111",
        mapQuery: "Megenagna Apostolic Church Addis Ababa"
      },
      {
        name: "ACE Jemo / Saris Fellowship Center",
        subcity: "Jemo Condominium",
        distance: "Accessible via Anbessa Bus / LTV",
        meetingDays: "Sunday Worship: 8:30 AM",
        contactPerson: "Youth Coordinator",
        phone: "+251 922 000 222",
        mapQuery: "Jemo Apostolic Church Addis Ababa"
      }
    ]
  },
  astu: {
    campusName: "Adama Science and Technology University (ASTU)",
    churches: [
      {
        name: "Adama Central Apostolic Church",
        subcity: "Adama City Center (Near Posta)",
        distance: "1.8 km from ASTU Main Gate",
        meetingDays: "Sunday: 8:30 AM - 12:00 PM | Tuesday: 5:00 PM",
        contactPerson: "ASTU Fellowship Leader",
        phone: "+251 912 345 678",
        mapQuery: "Adama Apostolic Church Ethiopia"
      }
    ]
  },
  hawassa: {
    campusName: "Hawassa University (Main, Techno & Referral Campuses)",
    churches: [
      {
        name: "Hawassa Central Apostolic Church",
        subcity: "Piassa / Near Lake Shore",
        distance: "2.0 km from Main Campus",
        meetingDays: "Sunday: 8:30 AM | Thursday Student Prayer: 5:00 PM",
        contactPerson: "Hawassa Fellowship Coordinator",
        phone: "+251 916 112 233",
        mapQuery: "Hawassa Apostolic Church"
      }
    ]
  },
  jimma: {
    campusName: "Jimma University (Main & Agriculture Campuses)",
    churches: [
      {
        name: "Jimma Town Apostolic Church",
        subcity: "Kito Furdisa Road",
        distance: "1.5 km from Main Campus",
        meetingDays: "Sunday: 9:00 AM - 12:30 PM",
        contactPerson: "JU Fellowship Representative",
        phone: "+251 917 554 433",
        mapQuery: "Jimma Apostolic Church Ethiopia"
      }
    ]
  },
  bahirdar: {
    campusName: "Bahir Dar University (BDU)",
    churches: [
      {
        name: "Bahir Dar Apostolic Worship Center",
        subcity: "Kebele 11 / Near Poly Campus",
        distance: "1.2 km from Poly Campus Gate",
        meetingDays: "Sunday: 8:30 AM | Wednesday: 5:00 PM",
        contactPerson: "BDU Fellowship Leader",
        phone: "+251 918 778 899",
        mapQuery: "Bahir Dar Apostolic Church"
      }
    ]
  },
  diredawa: {
    campusName: "Dire Dawa University & Regional Colleges",
    churches: [
      {
        name: "Dire Dawa Apostolic Church",
        subcity: "Kezira / Taiwan Market area",
        distance: "3.0 km from Campus Gate",
        meetingDays: "Sunday: 8:30 AM - 12:00 PM",
        contactPerson: "DDU Student Coordinator",
        phone: "+251 925 443 322",
        mapQuery: "Dire Dawa Apostolic Church"
      }
    ]
  }
};

/**
 * Render Church Cards for Selected University Code
 */
export function renderChurchList(uniCode, containerElement) {
  if (!containerElement) return;

  const data = churchDatabase[uniCode] || churchDatabase["aau"];

  let htmlContent = `
    <div class="space-y-3">
      <div class="bg-teal-50 border border-teal-200 p-3 rounded-xl flex justify-between items-center">
        <div>
          <p class="text-xs font-bold text-teal-900">${data.campusName}</p>
          <p class="text-[10px] text-teal-700">Showing verified worship centers near your institution</p>
        </div>
        <span class="text-[10px] font-extrabold bg-teal-800 text-amber-400 px-2.5 py-1 rounded-lg">
          ${data.churches.length} ${data.churches.length === 1 ? 'Location' : 'Locations'}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-3 pt-1">
  `;

  data.churches.forEach(church => {
    htmlContent += `
      <div class="p-4 bg-slate-50 rounded-xl border border-gray-200 hover:border-teal-300 transition space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <i class="fa-solid fa-church text-teal-800"></i> ${church.name}
            </h4>
            <p class="text-[10px] text-gray-500"><i class="fa-solid fa-map-pin text-amber-500"></i> ${church.subcity} (${church.distance})</p>
          </div>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(church.mapQuery)}" target="_blank" class="bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1">
            <i class="fa-solid fa-location-arrow"></i> Map
          </a>
        </div>

        <div class="text-[10px] text-slate-700 space-y-1 bg-white p-2.5 rounded-lg border border-gray-100">
          <p class="flex items-center gap-2"><i class="fa-regular fa-clock text-amber-600"></i> <strong>Worship Hours:</strong> ${church.meetingDays}</p>
          <p class="flex items-center gap-2"><i class="fa-solid fa-phone text-emerald-600"></i> <strong>Contact:</strong> ${church.contactPerson} (${church.phone})</p>
        </div>
      </div>
    `;
  });

  htmlContent += `</div></div>`;
  containerElement.innerHTML = htmlContent;
}