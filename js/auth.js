(function () {
  "use strict";

  // Einfache Code-Sperre wie bei der STAPEL-App -- kein echter Schutz,
  // sondern nur eine kleine Hürde gegen zufälliges Aufrufen auf dem
  // gemeinsam genutzten Familien-Handy.
  var PASSCODE = "0123";
  var STORAGE_KEY = "skirou.unlocked";

  var lockScreen = document.getElementById("lock-screen");
  var input = document.getElementById("lock-input");
  var error = document.getElementById("lock-error");
  var submit = document.getElementById("lock-submit");

  if (!lockScreen || lockScreen.hidden) return;

  function unlock() {
    lockScreen.hidden = true;
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* ignorieren */ }
  }

  function tryUnlock() {
    if (input.value === PASSCODE) {
      unlock();
    } else {
      error.hidden = false;
      input.value = "";
      input.focus();
    }
  }

  submit.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") tryUnlock();
  });
  input.addEventListener("input", function () {
    error.hidden = true;
    if (input.value.length === 4) tryUnlock();
  });

  setTimeout(function () { input.focus(); }, 0);
})();
