// js/weather_service.js - Live Campus Weather Service for ACE-USF

// OpenWeatherMap Free API Key
const WEATHER_API_KEY = "895284fb2d2c50a520ea537456963d9c"; // Standard OWM public key

// Geographic Coordinates for Ethiopian University & College Cities
const CAMPUS_COORDINATES = {
  // Central & Addis Ababa Region
  aau: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  aastu: { name: "Addis Ababa (Akaki)", lat: 8.8850, lon: 38.8100 },
  kotebe: { name: "Addis Ababa (Kotebe)", lat: 9.0220, lon: 38.8350 },
  ecsu: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  st_mary: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  unity_aa: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  rift_valley_aa: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  hope_ent: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  cpu_college: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  microlink: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },
  hilcoe: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 },

  // Oromia Region
  astu: { name: "Adama", lat: 8.5410, lon: 39.2705 },
  jimma: { name: "Jimma", lat: 7.6757, lon: 36.8482 },
  hramaya: { name: "Haramaya", lat: 9.4120, lon: 42.0160 },
  ambo: { name: "Ambo", lat: 8.9821, lon: 37.8554 },
  wollega: { name: "Nekemte", lat: 9.0833, lon: 36.5500 },
  bule_hora: { name: "Bule Hora", lat: 5.6333, lon: 38.2333 },
  mettu: { name: "Mettu", lat: 8.3000, lon: 35.5833 },
  arsu: { name: "Asella", lat: 7.9500, lon: 39.1167 },
  bale_robe: { name: "Robe (Bale)", lat: 7.1333, lon: 40.0000 },
  oda_bultum: { name: "Chiro", lat: 9.0833, lon: 40.8667 },
  salale: { name: "Fitche", lat: 9.8000, lon: 38.7333 },
  rift_valley_or: { name: "Adama", lat: 8.5410, lon: 39.2705 },
  unity_or: { name: "Adama", lat: 8.5410, lon: 39.2705 },

  // Sidama & South Ethiopia
  hawassa: { name: "Hawassa", lat: 7.0621, lon: 38.4763 },
  arba_minch: { name: "Arba Minch", lat: 6.0215, lon: 37.5540 },
  dilla: { name: "Dilla", lat: 6.4100, lon: 38.3103 },
  wachamo: { name: "Hossana", lat: 7.5500, lon: 37.8500 },
  werabe: { name: "Werabe", lat: 7.8420, lon: 38.1630 },
  wolkite: { name: "Wolkite", lat: 8.2833, lon: 37.7833 },
  bonga: { name: "Bonga", lat: 7.2667, lon: 36.2333 },
  jinka: { name: "Jinka", lat: 5.7833, lon: 36.5667 },
  tercha: { name: "Tarcha", lat: 7.1500, lon: 37.1500 },

  // Amhara Region
  bahirdar: { name: "Bahir Dar", lat: 11.5936, lon: 37.3908 },
  gondar: { name: "Gondar", lat: 12.6104, lon: 37.4668 },
  wollo: { name: "Dessie", lat: 11.1226, lon: 39.6350 },
  debre_markos: { name: "Debre Markos", lat: 10.3333, lon: 37.7333 },
  debre_birhan: { name: "Debre Berhan", lat: 9.6752, lon: 39.5325 },
  woldia: { name: "Woldia", lat: 11.8333, lon: 39.6000 },
  debre_tabor: { name: "Debre Tabor", lat: 11.8500, lon: 38.0167 },
  injibara: { name: "Injibara", lat: 10.9833, lon: 36.9167 },
  mekdela: { name: "Tenta (Mekdela)", lat: 11.3167, lon: 39.2500 },

  // Tigray Region
  mekelle: { name: "Mekelle", lat: 13.4967, lon: 39.4768 },
  aksum: { name: "Aksum", lat: 14.1240, lon: 38.7244 },
  adigrat: { name: "Adigrat", lat: 14.2770, lon: 39.4600 },
  raya: { name: "Maychew", lat: 12.7833, lon: 39.5333 },

  // Eastern & Emerging Regions
  diredawa: { name: "Dire Dawa", lat: 9.5931, lon: 41.8661 },
  jigjiga: { name: "Jigjiga", lat: 9.3509, lon: 42.8004 },
  kebri_dehar: { name: "Kebri Dehar", lat: 6.7333, lon: 44.2667 },
  semera: { name: "Samara", lat: 11.7933, lon: 41.0061 },
  assosa: { name: "Assosa", lat: 10.0646, lon: 34.5437 },
  gambella: { name: "Gambella", lat: 8.2504, lon: 34.5877 },
  
  other_private: { name: "Addis Ababa", lat: 9.0300, lon: 38.7400 }
};

/**
 * Fetch live weather data from OpenWeatherMap API
 * @param {string} campusKey 
 */
export async function fetchCampusWeather(campusKey = "aau") {
  const cityInfo = CAMPUS_COORDINATES[campusKey] || CAMPUS_COORDINATES["aau"];
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${cityInfo.lat}&lon=${cityInfo.lon}&units=metric&appid=${WEATHER_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API request failed");
    
    const data = await res.json();

    const weatherData = {
      cityName: cityInfo.name,
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    };

    updateWeatherUI(weatherData);
  } catch (error) {
    console.warn("Live weather fetch error:", error.message);
    // Fallback UI display in case of network issue
    updateWeatherUI({
      cityName: cityInfo.name,
      temp: 22,
      description: "Mild & Pleasant",
      icon: "https://openweathermap.org/img/wn/01d@2x.png"
    });
  }
}

/**
 * Update DOM elements with retrieved weather values
 */
function updateWeatherUI({ cityName, temp, description, icon }) {
  const cityEl = document.getElementById("weather-city");
  const tempEl = document.getElementById("weather-temp");
  const descEl = document.getElementById("weather-desc");
  const iconEl = document.getElementById("weather-icon");

  if (cityEl) cityEl.textContent = cityName;
  if (tempEl) tempEl.textContent = `${temp}°C`;
  if (descEl) descEl.textContent = description;
  if (iconEl) iconEl.src = icon;
}

/**
 * Initialize weather widget event listeners
 */
export function initWeatherWidget() {
  const selectEl = document.getElementById("weather-uni-select");
  
  if (selectEl) {
    selectEl.addEventListener("change", (e) => {
      fetchCampusWeather(e.target.value);
    });

    // Initial weather load for default selection
    fetchCampusWeather(selectEl.value || "aau");
  }
}