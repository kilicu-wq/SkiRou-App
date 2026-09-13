// Konfiguration der Skincare-PWA.
//
// sheetCsvUrl: Liefert das Inventar als CSV. Zwei Wege dahin:
//
// A) Einfach (aktuell verwendet): Sheet-ID aus dem normalen "Teilen"-Link
//    entnehmen und in die URL unten einsetzen. Voraussetzung: Freigabe ist
//    auf "Jeder, der über den Link verfügt" (Betrachter) gestellt, und der
//    Tab heißt "Inventar" (Parameter "sheet=" am Ende der URL).
//    -> https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&sheet=Inventar
//
// B) Falls A nicht funktioniert (z.B. Freigabe eingeschränkt): Datei ->
//    Freigeben -> Im Web veröffentlichen -> Tab "Inventar" -> Format CSV ->
//    veröffentlichen, dann die dort angezeigte URL hier eintragen.
window.SKINCARE_CONFIG = {
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/11xbChdNn4jgmZrFLt5ZGTljqh3RueQr3cOluZopO-SU/gviz/tq?tqx=out:csv&sheet=Inventar",
};
