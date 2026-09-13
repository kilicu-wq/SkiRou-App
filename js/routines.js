// Produktkatalog und Routinen der Skincare-PWA.
//
// Diese Datei wird -- wie bei der STAPEL-App -- direkt im Code gepflegt:
// Ihr besprecht Änderungen an der Routine im Chat mit Claude, die neue
// Fassung dieser Datei wird committed und die App neu deployed.
//
// Anwendungsschritte (step) sollten zu den Werten in der Google-Sheets-
// Vorlage passen, damit Icons/Badges in Routine und Inventar konsistent sind:
//   Reinigung, Toner, Serum, Augencreme, Feuchtigkeitscreme, SPF, Peeling, Maske, Sonstiges

window.SKINCARE_STEP_ICONS = {
  "Reinigung": "💧",
  "Toner": "🧴",
  "Serum": "🧪",
  "Augencreme": "👁️",
  "Feuchtigkeitscreme": "☁️",
  "SPF": "☀️",
  "Peeling": "✨",
  "Maske": "🎭",
  "Sonstiges": "📦",
};

// Produktkatalog: wird von den Routinen per ID referenziert.
window.SKINCARE_PRODUCTS = {
  cleanser: { name: "Gentle Skin Cleanser", step: "Reinigung" },
  toner: { name: "Hydrating Toner", step: "Toner" },
  peeling: { name: "AHA Peeling-Serum", step: "Peeling" },
  vitaminC: { name: "Vitamin C Serum", step: "Serum" },
  moisturizer: { name: "Feuchtigkeitscreme", step: "Feuchtigkeitscreme" },
};

var WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
window.SKINCARE_WEEKDAYS = WEEKDAYS;

function everyDay(morgen, abend) {
  var days = {};
  WEEKDAYS.forEach(function (day) {
    days[day] = { morgen: morgen, abend: abend };
  });
  return days;
}

// Routine-Sets: Standard sowie saisonale Varianten. Sommer/Winter/Urlaub
// starten als Kopie von Standard -- einfach die Produktlisten pro
// Wochentag/Tageszeit anpassen, sobald ihr die saisonalen Routinen
// besprochen habt.
window.SKINCARE_ROUTINE_SETS = {
  Standard: {
    label: "Standard",
    days: {
      Mo: { morgen: ["cleanser", "toner", "vitaminC", "moisturizer"], abend: ["cleanser", "vitaminC", "moisturizer"] },
      Di: { morgen: ["cleanser", "toner", "vitaminC", "moisturizer"], abend: ["cleanser", "vitaminC", "moisturizer"] },
      Mi: { morgen: ["cleanser", "toner", "vitaminC", "moisturizer"], abend: ["cleanser", "peeling", "vitaminC", "moisturizer"] },
      Do: { morgen: ["cleanser", "toner", "vitaminC", "moisturizer"], abend: ["cleanser", "vitaminC", "moisturizer"] },
      Fr: { morgen: ["cleanser", "toner", "vitaminC", "moisturizer"], abend: ["cleanser", "vitaminC", "moisturizer"] },
      Sa: { morgen: ["cleanser", "vitaminC", "moisturizer"], abend: ["cleanser", "peeling", "vitaminC", "moisturizer"] },
      So: { morgen: ["cleanser", "vitaminC", "moisturizer"], abend: ["cleanser", "peeling", "vitaminC", "moisturizer"] },
    },
  },
  Sommer: {
    label: "Sommer",
    days: everyDay(["cleanser", "toner", "vitaminC", "moisturizer"], ["cleanser", "vitaminC", "moisturizer"]),
  },
  Winter: {
    label: "Winter",
    days: everyDay(["cleanser", "toner", "vitaminC", "moisturizer"], ["cleanser", "vitaminC", "moisturizer"]),
  },
  Urlaub: {
    label: "Urlaub",
    days: everyDay(["cleanser", "vitaminC", "moisturizer"], ["cleanser", "moisturizer"]),
  },
};
