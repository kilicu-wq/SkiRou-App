# SkiRou-App

Skincare-Routine-PWA: zeigt die tägliche Hautpflege-Routine (Morgen/Abend, pro
Wochentag) und ein read-only Produktinventar, das aus einem öffentlich
veröffentlichten Google Sheet geladen wird. Läuft offline als installierbare
Progressive Web App, ohne eigenes Backend.

## Funktionsumfang

- **Routine**: Wochentag- und Morgen/Abend-Auswahl, nummerierte Schritt-Liste
  je Produkt
- **Routine-Sets**: aktuell "Standard", die Struktur erlaubt beliebig weitere
  Sets (z. B. Sommer/Winter/Urlaub) zum Umschalten
- **Inventar**: durchsuchbare Produktliste mit Marke, Anwendungsschritt und
  Status-Badge (Ungeöffnet/Geöffnet/Leer), read-only aus Google Sheets
- **Offline-fähig**: Service Worker cached App-Shell und den zuletzt
  geladenen Inventar-Stand
- **Code-Sperre**: einfache 4-stellige PIN (`0123`) beim ersten Öffnen, kein
  echter Schutz, nur eine kleine Hürde auf dem Familien-Handy

## Architektur

- Kein Backend, kein OAuth: das Google Sheet wird über
  *Datei → Freigeben → Im Web veröffentlichen* als CSV bereitgestellt und von
  der App direkt per `fetch()` gelesen.
- Die Routinen liegen **nicht** im Sheet, sondern als JSON im Repo
  (`data/routines.json`), die die App per `fetch()` lädt. Änderungen an der
  Routine werden im Chat besprochen, die Datei angepasst, committed und neu
  deployed.
- Produktstatus ist bewusst einfach gehalten: `Ungeöffnet` (Vorrat/Ersatz),
  `Geöffnet` (aktuell in Benutzung), `Leer` (muss ersetzt werden).

## Setup

### 1. Google Sheet einrichten

1. Die Vorlage [`docs/skincare-inventar-vorlage.xlsx`](docs/skincare-inventar-vorlage.xlsx)
   in Google Drive hochladen und mit Google Sheets öffnen (oder Inhalte in ein
   bestehendes Sheet übernehmen).
2. Tab **Inventar** mit den eigenen Produkten befüllen (Beispielzeilen können
   gelöscht werden). Tab **Legende** erklärt alle Spalten, Tab **Schritte**
   listet die Anwendungsschritte in empfohlener Reihenfolge.
3. *Datei → Freigeben → Im Web veröffentlichen*, dabei **nur den Tab
   "Inventar"** und Format **CSV** wählen, dann veröffentlichen.
4. Die angezeigte URL kopieren.

### 2. App konfigurieren

In [`config.js`](config.js) die kopierte URL eintragen:

```js
window.SKINCARE_CONFIG = {
  sheetCsvUrl: "https://docs.google.com/.../pub?gid=0&single=true&output=csv",
};
```

### 3. Routine anpassen

Die tatsächliche Routine (welche Produkte an welchem Wochentag morgens/abends
in welcher Reihenfolge) steht in [`data/routines.json`](data/routines.json):

- `sets`: pro Routine-Set (z. B. `Standard`) für jeden Wochentag die
  Schritt-Liste für `morgen` und `abend`. Jeder Schritt hat
  `step` (Anwendungsschritt/Kategorie), `product` (Produktname -- sollte
  exakt mit dem Namen im Inventar-Sheet übereinstimmen) und optional `note`
  (z. B. "nur T-Zone", "optional, alle 2 Wochen").
- `adHoc`: Produkte ohne festen Tag (z. B. ein Spot-Treatment "bei Bedarf"),
  werden in der Routine-Ansicht immer zusätzlich angezeigt.
- `reserves` / `reserveStock`: Zuordnung von Ersatzprodukten für den Fall,
  dass ein aktives Produkt leer ist -- aktuell nur zur Referenz, wird noch
  nicht in der UI angezeigt.

Neue Anwendungsschritte (Kategorien) brauchen ein Icon in
[`js/routines.js`](js/routines.js) (`SKINCARE_STEP_ICONS`), sonst wird ein
generisches Icon angezeigt.

Änderungen an der Routine am besten im separaten Planungs-Chat besprechen
und die fertige Struktur hier einpflegen, committen und neu deployen.

## Lokal testen

Da die App einen Service Worker registriert, sollte sie über einen lokalen
HTTP-Server (nicht `file://`) geöffnet werden, z. B.:

```bash
npx http-server -c-1 .
```

Danach `http://localhost:8080` im Browser öffnen.

## Deployment (GitHub Pages)

1. Repository-Einstellungen → *Pages* → als Quelle den Branch mit dem
   Projektinhalt (z. B. `main`) und Root-Verzeichnis auswählen.
2. Nach dem Push ist die App unter `https://<user>.github.io/<repo>/`
   erreichbar.
3. Auf dem Smartphone die Seite öffnen und über den Browser
   ("Zum Startbildschirm hinzufügen" / "App installieren") als PWA
   installieren.

## Projektstruktur

```
index.html              App-Shell (Tabs, Routine- und Inventar-Ansicht, Lock-Screen)
css/styles.css           Styling (hell/dunkel automatisch)
data/routines.json       Routine-Sets, Schritte, Bei-Bedarf, Ersatzprodukte (hier anpassen)
js/routines.js           Icon-Zuordnung je Anwendungsschritt + Wochentage
js/auth.js               Einfache PIN-Sperre (0123)
js/app.js                App-Logik: Rendering, Google-Sheets-CSV-Fetch, Caching
config.js                Google-Sheets-CSV-URL
manifest.json            PWA-Manifest
service-worker.js        Offline-Caching (App-Shell + Routine-JSON + Inventar-CSV)
icons/                   App-Icons
docs/skincare-inventar-vorlage.xlsx   Google-Sheets-Vorlage zum Hochladen
```
