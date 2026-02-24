import { MOCK_SPECIES } from "./mockData.js";

// Deterministic pseudo-random based on a string (stable UI demo)
function hashToUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // map to [0,1)
  return ((h >>> 0) % 100000) / 100000;
}

function dateBuckets(start, end, granularity) {
  const s = new Date(start);
  const e = new Date(end);

  const buckets = [];
  const d = new Date(s);

  const step = () => {
    if (granularity === "day") d.setDate(d.getDate() + 1);
    else if (granularity === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  };

  const label = (dt) => {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    if (granularity === "month") return `${yyyy}-${mm}`;
    if (granularity === "week") return `${yyyy}-${mm}-${dd}`;
    return `${yyyy}-${mm}-${dd}`;
  };

  while (d <= e) {
    buckets.push(label(new Date(d)));
    step();
  }
  return buckets;
}

export function buildMockTimeseries({ speciesId, selectedLanguages, start, end, granularity, metric }) {
  const langsKey = selectedLanguages.slice().sort().join(",");
  const buckets = dateBuckets(start, end, granularity);

  return buckets.map((t, idx) => {
    const base = 400 + 3000 * hashToUnit(`${speciesId}|${langsKey}|${t}`);
    const wave = 1 + 0.25 * Math.sin(idx / 2);
    let v = base * wave;

    if (metric === "log") v = Math.log(1 + v) * 1000;
    if (metric === "growth") {
      // mock "growth": centered around 0
      v = (hashToUnit(`g|${speciesId}|${langsKey}|${t}`) - 0.5) * 200;
    }

    return { t, value: Math.max(0, v) };
  });
}

export function buildMockTopSpecies({ selectedLanguages, start, end }) {
  const langsKey = selectedLanguages.slice().sort().join(",");
  const timeKey = `${start}|${end}`;

  const rows = MOCK_SPECIES.map((s) => {
    const v = 10000 * hashToUnit(`top|${langsKey}|${timeKey}|${s.id}`) + 2000;
    return { species_id: s.id, latin_name: s.latin_name, value: v };
  });

  rows.sort((a, b) => b.value - a.value);
  return rows.slice(0, 10);
}

// For the map: return a value per ISO3 code.
// Since we don't have ISO3 list here, we just generate values on demand in WorldMap via lookup.
// But WorldMap expects an object. We'll pre-fill common ISO3s lightly and fallback will be 0.
export function buildMockMapIntensity({ selectedLanguages, speciesId, start, end }) {
  const langsKey = selectedLanguages.slice().sort().join(",");
  const timeKey = `${start}|${end}`;

  // Some common ISO3 codes (not exhaustive). This is just for demo coloring.
  const iso3s = [
    "FIN","SWE","NOR","DNK","DEU","FRA","ESP","ITA","GBR","IRL",
    "USA","CAN","MEX","BRA","ARG","CHL","AUS","NZL","CHN","JPN",
    "KOR","IND","RUS","UKR","POL","NLD","BEL","CHE","AUT","CZE",
    "PRT","GRC","TUR","ISR","SAU","ZAF","EGY","NGA","KEN"
  ];

  const obj = {};
  for (const iso3 of iso3s) {
    const v = 1000 + 18000 * hashToUnit(`map|${iso3}|${langsKey}|${speciesId}|${timeKey}`);
    obj[iso3] = v;
  }
  return obj;
}
