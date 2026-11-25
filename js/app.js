(function () {
  "use strict";

  var STORAGE_KEYS = {
    set: "skincare.selectedSet",
    day: "skincare.selectedDay",
    time: "skincare.selectedTime",
    inventoryCache: "skincare.inventoryCache",
  };

  var STATUS_CLASS = {
    "Ungeöffnet": "status-ungeoeffnet",
    "Geöffnet": "status-geoeffnet",
    "Leer": "status-leer",
  };

  var state = {
    set: localStorage.getItem(STORAGE_KEYS.set) || "Standard",
    day: localStorage.getItem(STORAGE_KEYS.day) || currentWeekday(),
    time: localStorage.getItem(STORAGE_KEYS.time) || currentTimeOfDay(),
  };

  function currentWeekday() {
    // JS: 0 = Sonntag ... 6 = Samstag
    var jsDay = new Date().getDay();
    var index = jsDay === 0 ? 6 : jsDay - 1;
    return window.SKINCARE_WEEKDAYS[index];
  }

  function currentTimeOfDay() {
    return new Date().getHours() < 12 ? "morgen" : "abend";
  }

  // ---- Tabs ----

  function initTabs() {
    var tabRoutine = document.getElementById("tab-routine");
    var tabInventar = document.getElementById("tab-inventar");
    var viewRoutine = document.getElementById("view-routine");
    var viewInventar = document.getElementById("view-inventar");

    tabRoutine.addEventListener("click", function () {
      setActiveTab(tabRoutine, tabInventar, viewRoutine, viewInventar);
    });
    tabInventar.addEventListener("click", function () {
      setActiveTab(tabInventar, tabRoutine, viewInventar, viewRoutine);
      loadInventory();
    });
  }

  function setActiveTab(activeTab, inactiveTab, activeView, inactiveView) {
    activeTab.classList.add("active");
    activeTab.setAttribute("aria-selected", "true");
    inactiveTab.classList.remove("active");
    inactiveTab.setAttribute("aria-selected", "false");
    activeView.hidden = false;
    inactiveView.hidden = true;
  }

  // ---- Routine view ----

  var routineData = null; // geladen aus data/routines.json, siehe loadRoutineData()

  function loadRoutineData() {
    return fetch("data/routines.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        routineData = json;
      })
      .catch(function () {
        routineData = { sets: {}, adHoc: [] };
      });
  }

  function initSetSelect() {
    var select = document.getElementById("set-select");
    select.innerHTML = "";
    Object.keys(routineData.sets).forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = routineData.sets[key].label || key;
      select.appendChild(opt);
    });
    if (!routineData.sets[state.set]) {
      state.set = Object.keys(routineData.sets)[0];
    }
    select.value = state.set;
    select.addEventListener("change", function () {
      state.set = select.value;
      localStorage.setItem(STORAGE_KEYS.set, state.set);
      renderSteps();
    });
  }

  function initDayRow() {
    var row = document.getElementById("day-row");
    row.innerHTML = "";
    window.SKINCARE_WEEKDAYS.forEach(function (day) {
      var btn = document.createElement("button");
      btn.className = "day-btn" + (day === state.day ? " active" : "");
      btn.textContent = day;
      btn.setAttribute("data-day", day);
      btn.addEventListener("click", function () {
        state.day = day;
        localStorage.setItem(STORAGE_KEYS.day, day);
        row.querySelectorAll(".day-btn").forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-day") === day);
        });
        renderSteps();
      });
      row.appendChild(btn);
    });
  }

  function initTimeToggle() {
    var btnMorgen = document.getElementById("btn-morgen");
    var btnAbend = document.getElementById("btn-abend");

    function apply(time) {
      state.time = time;
      localStorage.setItem(STORAGE_KEYS.time, time);
      btnMorgen.classList.toggle("active", time === "morgen");
      btnAbend.classList.toggle("active", time === "abend");
      renderSteps();
    }

    btnMorgen.classList.toggle("active", state.time === "morgen");
    btnAbend.classList.toggle("active", state.time === "abend");
    btnMorgen.addEventListener("click", function () { apply("morgen"); });
    btnAbend.addEventListener("click", function () { apply("abend"); });
  }

  function buildStepRow(step, index) {
    var icon = window.SKINCARE_STEP_ICONS[step.step] || "•";
    var row = document.createElement("div");
    row.className = "step-row";
    row.innerHTML =
      '<div class="step-icon">' + icon + "</div>" +
      '<div class="step-body">' +
        '<div class="step-name"></div>' +
        '<div class="step-category"></div>' +
        '<div class="step-note"></div>' +
      "</div>";
    if (index !== null) {
      var badge = document.createElement("div");
      badge.className = "step-index";
      badge.textContent = index + 1;
      row.insertBefore(badge, row.firstChild);
    }
    row.querySelector(".step-name").textContent = step.product;
    row.querySelector(".step-category").textContent = step.step;
    var noteEl = row.querySelector(".step-note");
    if (step.note) {
      noteEl.textContent = step.note;
    } else {
      noteEl.hidden = true;
    }
    return row;
  }

  function renderSteps() {
    var list = document.getElementById("step-list");
    var emptyHint = document.getElementById("empty-routine");
    var routineSet = routineData.sets[state.set];
    var dayPlan = routineSet && routineSet.days[state.day];
    var steps = (dayPlan && dayPlan[state.time]) || [];

    list.innerHTML = "";

    if (steps.length === 0) {
      emptyHint.hidden = false;
    } else {
      emptyHint.hidden = true;
      steps.forEach(function (step, index) {
        list.appendChild(buildStepRow(step, index));
      });
    }

    renderAdHoc();
  }

  function renderAdHoc() {
    var section = document.getElementById("adhoc-section");
    var list = document.getElementById("adhoc-list");
    var items = (routineData && routineData.adHoc) || [];

    if (items.length === 0) {
      section.hidden = true;
      return;
    }

    section.hidden = false;
    list.innerHTML = "";
    items.forEach(function (step) {
      list.appendChild(buildStepRow(step, null));
    });
  }

  // ---- Inventory view (Google Sheets CSV) ----

  var inventoryLoaded = false;
  var inventoryData = [];

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter(function (r) {
      return r.some(function (cell) { return cell.trim() !== ""; });
    });
  }

  function csvToProducts(text) {
    var rows = parseCsv(text);
    if (rows.length < 2) return [];
    var headers = rows[0].map(function (h) { return h.trim(); });

    function col(row, name) {
      var idx = headers.indexOf(name);
      return idx === -1 ? "" : (row[idx] || "").trim();
    }

    return rows.slice(1).map(function (row) {
      return {
        name: col(row, "Produktname"),
        brand: col(row, "Marke"),
        step: col(row, "Anwendungsschritt"),
        status: col(row, "Status"),
        openedOn: col(row, "Geöffnet am"),
        notes: col(row, "Notizen"),
      };
    }).filter(function (p) { return p.name !== ""; });
  }

  function renderInventoryStatus(message) {
    document.getElementById("inv-status").textContent = message;
  }

  function renderInventoryList(products) {
    var list = document.getElementById("inv-list");
    var query = document.getElementById("inv-search").value.trim().toLowerCase();

    var filtered = products.filter(function (p) {
      if (!query) return true;
      return (p.name + " " + p.brand).toLowerCase().indexOf(query) !== -1;
    });

    list.innerHTML = "";
    if (filtered.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-hint";
      empty.textContent = "Keine Produkte gefunden.";
      list.appendChild(empty);
      return;
    }

    filtered.forEach(function (p) {
      var row = document.createElement("div");
      row.className = "inv-row";
      var statusClass = STATUS_CLASS[p.status] || "status-ungeoeffnet";
      row.innerHTML =
        '<div class="inv-info">' +
          '<div class="inv-name"></div>' +
          '<div class="inv-meta"></div>' +
        "</div>" +
        '<span class="status-badge ' + statusClass + '"></span>';
      row.querySelector(".inv-name").textContent = p.name;
      row.querySelector(".inv-meta").textContent = [p.brand, p.step].filter(Boolean).join(" · ");
      row.querySelector(".status-badge").textContent = p.status || "?";
      list.appendChild(row);
    });
  }

  function loadInventory(forceReload) {
    if (inventoryLoaded && !forceReload) {
      renderInventoryList(inventoryData);
      return;
    }

    var sheetUrl = window.SKINCARE_CONFIG && window.SKINCARE_CONFIG.sheetCsvUrl;
    if (!sheetUrl) {
      renderInventoryStatus("Noch kein Google Sheet verknüpft (config.js).");
      inventoryData = readCachedInventory();
      renderInventoryList(inventoryData);
      return;
    }

    renderInventoryStatus("Lade Inventar …");

    fetch(sheetUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (text) {
        inventoryData = csvToProducts(text);
        inventoryLoaded = true;
        cacheInventory(inventoryData);
        renderInventoryStatus("Aktualisiert · " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
        renderInventoryList(inventoryData);
      })
      .catch(function () {
        var cached = readCachedInventory();
        if (cached.length > 0) {
          inventoryData = cached;
          renderInventoryStatus("Offline · zeige zuletzt geladenen Stand");
        } else {
          renderInventoryStatus("Inventar konnte nicht geladen werden.");
        }
        renderInventoryList(inventoryData);
      });
  }

  function cacheInventory(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.inventoryCache, JSON.stringify(products));
    } catch (e) { /* Speicher voll oder nicht verfügbar - ignorieren */ }
  }

  function readCachedInventory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.inventoryCache);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function initInventorySearch() {
    document.getElementById("inv-search").addEventListener("input", function () {
      renderInventoryList(inventoryData.length > 0 ? inventoryData : readCachedInventory());
    });
  }

  // ---- Offline indicator ----

  function initOfflineBadge() {
    var badge = document.getElementById("offline-badge");
    function update() {
      badge.hidden = navigator.onLine;
    }
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  }

  // ---- Service worker ----

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(function () {
        // Registrierung fehlgeschlagen (z.B. lokal ohne HTTPS) - App bleibt online nutzbar.
      });
    }
  }

  // ---- Init ----

  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initDayRow();
    initTimeToggle();
    initInventorySearch();
    initOfflineBadge();
    registerServiceWorker();

    loadRoutineData().then(function () {
      initSetSelect();
      renderSteps();
    });
  });
})();
