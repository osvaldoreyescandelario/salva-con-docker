import {
  childrenData,
  findObjectByKeyAndId,
  insertarNuevoObjEnChildrenData,
  exportFormToPDF,
  normalizeDateForInput,
  getTestName
} from "./definitions.js";

let validme34id;
let updateme34 = false;
let edulevel = "";

const ROWS_PER_PAGE = 5;
const TAB_ROWS_PER_PAGE = 3;

// ==========================
// ESTADO DE PAGINACIÓN
// ==========================
const pagination = {};

// ==========================
// ESTADO DE TABLAS (PERSISTENCIA)
// ==========================
const tableState = {};

// ==========================
// ARRAYS DESDE FETCH
// ==========================
let psico_pruebas = [];
let neuro_pruebas = [];
let psicometria_pruebas = [];
let psicopedagogia_pruebas = [];

let ped_lengua_areas = [];
let ped_matematica_areas = [];
let ped_historia_areas = [];
let ped_logopedia_areas = [];
let ped_pedagogia_areas = [];

const TABLE_TAB_NAMES = {
  "me34-psicologia-table": "Psicología",
  "neuro-table": "Neurocognitiva",
  "psicometria-table": "Psicometría",
  "psicopedagogia-table": "Psicopedagogía",

  "logopedia-table": "Logopedia",

  "ped-general-table": "Pedagogía",
  "ped-lengua-table": "Pedagogía · Lengua Española",
  "ped-mate-table": "Pedagogía · Matemática",
  "ped-hist-table": "Pedagogía · Historia"
};

// ==========================
// ARRAYS REACTIVOS POR TABLA
// ==========================
const reactiveTables = {}; // ahora solo usamos table.id como key

const saveBtn = document.getElementById("me34-guardar");
const exportToPDF = document.getElementById("m34-exportPDFBtn");

function getTabNameFromTableId(tableId) {
  return TABLE_TAB_NAMES[tableId] || tableId;
}

// ==========================
// FECHA HOY
// ==========================
function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

// ==========================
// FETCH AUX
// ==========================
async function fetchAuxTests(area, username) {
  try {
    const url = `${window.config.apiUrl}/auxtests/${area}/${username}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    console.error("fetchAuxTests error:", e);
    return [];
  }
}

// ==========================
// ORDENAR POR TESTID
// ==========================
function sortByTestId(arr) {
  return [...arr].sort((a, b) => Number(a.testid) - Number(b.testid));
}

// ==========================
// FILAS POR TABLA
// ==========================
function getRowsPerPage(tableId) {
  if (
    ["ped-lengua-table", "ped-mate-table", "ped-hist-table"].includes(tableId)
  )
    return TAB_ROWS_PER_PAGE;
  return ROWS_PER_PAGE;
}

// ==========================
// PAGINACIÓN
// ==========================
function getPageSlice(arr, tableId) {
  if (!pagination[tableId]) pagination[tableId] = 1;
  const rowsPerPage = getRowsPerPage(tableId);
  const page = pagination[tableId];
  const start = (page - 1) * rowsPerPage;
  return arr.slice(start, start + rowsPerPage);
}

// ==========================
// GUARDAR / RESTAURAR ESTADO
// ==========================
function saveTableState(tableId, dataArray) {
  if (!tableState[tableId]) tableState[tableId] = {};

  if (dataArray?.length) {
    dataArray.forEach((item) => {
      const tr = document.querySelector(
        `#${tableId} tbody tr[data-testid="${item.testid}"]`
      );
      tableState[tableId][item.testid] = {
        checked:
          tr?.querySelector('input[type="checkbox"]')?.checked ||
          item.checked ||
          false,
        date: tr?.querySelector('input[type="date"]')?.value || item.date || "",
        text: tr?.querySelector("textarea")?.value || item.text || ""
      };
    });
  } else {
    document.querySelectorAll(`#${tableId} tbody tr`).forEach((tr) => {
      const testid = tr.dataset.testid;
      tableState[tableId][testid] = {
        checked: tr.querySelector('input[type="checkbox"]')?.checked || false,
        date: tr.querySelector('input[type="date"]')?.value || "",
        text: tr.querySelector("textarea")?.value || ""
      };
    });
  }
}

function restoreTableState(tableId, tr) {
  const testid = tr.dataset.testid;
  const state = tableState[tableId]?.[testid];
  if (!state) return;

  const cb = tr.querySelector('input[type="checkbox"]');
  const date = tr.querySelector('input[type="date"]');
  const ta = tr.querySelector("textarea");

  if (cb) cb.checked = state.checked;
  if (date) {
    date.value = state.date;
    if (cb) date.disabled = !cb.checked;
  }
  if (ta) ta.value = state.text;
}

// ==========================
// PAGER
// ==========================
function renderPagerForTable(table, total, tableId, renderFn) {
  const rowsPerPage = getRowsPerPage(tableId);
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));

  let pager = table.nextElementSibling;
  if (!pager?.classList.contains("me34-pager")) {
    pager = document.createElement("div");
    pager.className = "me34-pager text-center mt-2";
    table.after(pager);
  }

  pager.innerHTML = `
    <button class="btn btn-sm btn-secondary" data-dir="-1">←</button>
    <span class="mx-2">Página ${pagination[tableId]} de ${totalPages}</span>
    <button class="btn btn-sm btn-secondary" data-dir="1">→</button>
  `;

  pager.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      saveTableState(tableId);
      pagination[tableId] += Number(btn.dataset.dir);
      pagination[tableId] = Math.max(
        1,
        Math.min(totalPages, pagination[tableId])
      );
      renderFn();
    };
  });
}

// ==========================
// RENDER CHECK + FECHA
// ==========================
// function renderCheckDateTable({ data, tbodySelector, tableId }) {
//   const tbody = document.querySelector(tbodySelector);
//   if (!tbody) return;

//   const table = tbody.closest('table');
//   const ordered = sortByTestId(data);
//   const pageData = getPageSlice(ordered, tableId);

//   tbody.innerHTML = '';
//   if (!reactiveTables[tableId]) reactiveTables[tableId] = {};

//   pageData.forEach(item => {
//     const tr = document.createElement('tr');
//     tr.dataset.testid = item.testid;
//     tr.innerHTML = `
//       <td><input type="checkbox"> ${item.testname}</td>
//       <td><input type="date" disabled></td>
//     `;
//     restoreTableState(tableId, tr);
//     tbody.appendChild(tr);

//     reactiveTables[tableId][item.testid] = {
//       checked: tr.querySelector('input[type="checkbox"]').checked,
//       date: tr.querySelector('input[type="date"]').value,
//       text: ''
//     };
//   });

//   renderPagerForTable(table, ordered.length, tableId, () =>
//     renderCheckDateTable({ data, tbodySelector, tableId })
//   );
// }

function renderCheckDateTable({ data, tbodySelector, tableId }) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;

  const table = tbody.closest("table");
  const ordered = sortByTestId(data);
  const pageData = getPageSlice(ordered, tableId);

  tbody.innerHTML = "";
  if (!reactiveTables[tableId]) reactiveTables[tableId] = {};

  pageData.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.testid = item.testid;
    tr.innerHTML = `
      <td><input type="checkbox"> ${item.testname}</td>
      <td><input type="date" disabled></td>
    `;

    // Restaurar desde reactiveTables si existe
    const state = reactiveTables[tableId][item.testid];
    const cb = tr.querySelector('input[type="checkbox"]');
    const date = tr.querySelector('input[type="date"]');

    if (state) {
      if (cb) cb.checked = state.checked;
      if (date) {
        date.value = state.date || "";
        date.disabled = !state.checked;
      }
    }

    tbody.appendChild(tr);

    // Inicializar reactiveTables si no existe
    reactiveTables[tableId][item.testid] = state || {
      checked: false,
      date: "",
      text: ""
    };
  });

  renderPagerForTable(table, ordered.length, tableId, () =>
    renderCheckDateTable({ data, tbodySelector, tableId })
  );
}

// ==========================
// RENDER ÁREA
// ==========================
// function renderAreaTable({ data, tableId }) {
//   const table = document.getElementById(tableId);
//   if (!table) return;

//   const ordered = sortByTestId(data);
//   const pageData = getPageSlice(ordered, tableId);
//   const tbody = table.querySelector('tbody');
//   tbody.innerHTML = '';
//   if (!reactiveTables[tableId]) reactiveTables[tableId] = {};

//   pageData.forEach(item => {
//     const tr = document.createElement('tr');
//     tr.dataset.testid = item.testid;
//     tr.innerHTML = `
//       <td class="area-col">${item.testname}</td>
//       <td><input type="date"></td>
//       <td><textarea></textarea></td>
//     `;
//     restoreTableState(tableId, tr);
//     tbody.appendChild(tr);

//     reactiveTables[tableId][item.testid] = {
//       checked: tr.querySelector('input[type="checkbox"]')?.checked || false,
//       date: tr.querySelector('input[type="date"]').value,
//       text: tr.querySelector('textarea').value
//     };
//   });

//   renderPagerForTable(table, ordered.length, tableId, () =>
//     renderAreaTable({ data, tableId })
//   );
// }

function renderAreaTable({ data, tableId }) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const ordered = sortByTestId(data);
  const pageData = getPageSlice(ordered, tableId);
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  if (!reactiveTables[tableId]) reactiveTables[tableId] = {};

  pageData.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.testid = item.testid;
    tr.innerHTML = `
      <td class="area-col">${item.testname}</td>
      <td><input type="date"></td>
      <td><textarea></textarea></td>
    `;

    // Restaurar desde reactiveTables si existe
    const state = reactiveTables[tableId][item.testid];
    const dateInput = tr.querySelector('input[type="date"]');
    const textArea = tr.querySelector("textarea");

    if (state) {
      if (dateInput) dateInput.value = state.date || "";
      if (textArea) textArea.value = state.text || "";
    }

    tbody.appendChild(tr);

    // Inicializar reactiveTables si no existe
    reactiveTables[tableId][item.testid] = state || {
      checked: false,
      date: "",
      text: ""
    };
  });

  renderPagerForTable(table, ordered.length, tableId, () =>
    renderAreaTable({ data, tableId })
  );
}

// ==========================
// INPUT → REACTIVE TABLE
// ==========================
// document.addEventListener('input', e => {
//   const tr = e.target.closest('tr');
//   if (!tr) return;
//   const table = e.target.closest('table');
//   if (!table) return;
//   const tableId = table.id;
//   const testid = tr.dataset.testid;

//   if (!reactiveTables[tableId]) reactiveTables[tableId] = {};
//   if (!reactiveTables[tableId][testid]) reactiveTables[tableId][testid] = { checked: false, date: '', text: '' };

//   if (e.target.type === 'checkbox') {
//     const date = tr.querySelector('input[type="date"]');
//     date.disabled = !e.target.checked;
//     date.value = e.target.checked ? hoyISO() : '';
//     reactiveTables[tableId][testid].checked = e.target.checked;
//     reactiveTables[tableId][testid].date = date.value;
//   }
//   if (e.target.type === 'date') reactiveTables[tableId][testid].date = e.target.value;
//   if (e.target.tagName === 'TEXTAREA') reactiveTables[tableId][testid].text = e.target.value;
// });

document.addEventListener("input", (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;
  const table = e.target.closest("table");
  if (!table) return;
  const tableId = table.id;

  // Ignorar eventos fuera de las tablas ME34
  const allowedTables = [
    "me34-psicologia-table",
    "neuro-table",
    "psicometria-table",
    "psicopedagogia-table",
    "logopedia-table",
    "ped-general-table",
    "ped-lengua-table",
    "ped-mate-table",
    "ped-hist-table"
  ];
  if (!allowedTables.includes(tableId)) return;

  const testid = tr.dataset.testid;
  if (!reactiveTables[tableId]) reactiveTables[tableId] = {};
  if (!reactiveTables[tableId][testid])
    reactiveTables[tableId][testid] = { checked: false, date: "", text: "" };

  if (e.target.type === "checkbox") {
    const date = tr.querySelector('input[type="date"]');
    if (date) {
      // <-- protegemos el acceso
      date.disabled = !e.target.checked;
      date.value = e.target.checked ? hoyISO() : "";
      reactiveTables[tableId][testid].date = date.value;
    }
    reactiveTables[tableId][testid].checked = e.target.checked;
  }
  if (e.target.type === "date")
    reactiveTables[tableId][testid].date = e.target.value;
  if (e.target.tagName === "TEXTAREA")
    reactiveTables[tableId][testid].text = e.target.value;
});

// ==========================
// PEDAGOGÍA
// ==========================
function initPedagogia() {
  const container = document.getElementById("me34-pedagogia-container");
  if (!container) return;

  if (edulevel === "Primera Infancia (PI)") {
    container.innerHTML = `
      <table id="ped-general-table" class="table table-bordered table-sm">
        <thead><tr><th>Área</th><th>Fecha</th><th>Explicación</th></tr></thead>
        <tbody></tbody>
      </table>
    `;
    renderAreaTable({
      data: ped_pedagogia_areas,
      tableId: "ped-general-table"
    });
  } else {
    container.innerHTML = `
      <ul class="nav nav-tabs">
        <li class="nav-item"><a class="nav-link active" data-toggle="tab" href="#ped-lengua">Lengua Española</a></li>
        <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#ped-mate">Matemática</a></li>
        <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#ped-hist">Historia</a></li>
      </ul>
      <div class="tab-content mt-3">
        <div class="tab-pane fade show active" id="ped-lengua">
          <table id="ped-lengua-table" class="table table-bordered table-sm"><tbody></tbody></table>
        </div>
        <div class="tab-pane fade" id="ped-mate">
          <table id="ped-mate-table" class="table table-bordered table-sm"><tbody></tbody></table>
        </div>
        <div class="tab-pane fade" id="ped-hist">
          <table id="ped-hist-table" class="table table-bordered table-sm"><tbody></tbody></table>
        </div>
      </div>
    `;
    renderAreaTable({ data: ped_lengua_areas, tableId: "ped-lengua-table" });
    renderAreaTable({ data: ped_matematica_areas, tableId: "ped-mate-table" });
    renderAreaTable({ data: ped_historia_areas, tableId: "ped-hist-table" });
  }
}

// ==========================
// LIMPIAR CONTROLES
// ==========================
function clearME34Controls(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal
    .querySelectorAll('input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));
  modal.querySelectorAll("input").forEach((input) => {
    if (!["checkbox", "radio"].includes(input.type)) input.value = "";
  });
  modal.querySelectorAll("textarea").forEach((ta) => (ta.value = ""));
  modal.querySelectorAll("select").forEach((sel) => (sel.selectedIndex = 0));
}

function populateReactiveTablesFromObj(me34Obj) {
  if (!me34Obj) return;

  // =====================
  // PSICOLOGÍA
  // =====================
  (me34Obj.psicologia || []).forEach((item) => {
    if (!reactiveTables["me34-psicologia-table"]) {
      reactiveTables["me34-psicologia-table"] = {};
    }
    reactiveTables["me34-psicologia-table"][item.testid] = {
      checked: true,
      date: normalizeDateForInput(item.date),
      text: ""
    };
  });

  // =====================
  // NEUROCOGNITIVA
  // =====================
  (me34Obj.neuro || []).forEach((item) => {
    if (!reactiveTables["neuro-table"]) {
      reactiveTables["neuro-table"] = {};
    }
    reactiveTables["neuro-table"][item.testid] = {
      checked: true,
      date: normalizeDateForInput(item.date),
      text: ""
    };
  });

  // =====================
  // PSICOMETRÍA
  // =====================
  (me34Obj.psicometria || []).forEach((item) => {
    if (!reactiveTables["psicometria-table"]) {
      reactiveTables["psicometria-table"] = {};
    }
    reactiveTables["psicometria-table"][item.testid] = {
      checked: true,
      date: normalizeDateForInput(item.date),
      text: ""
    };
  });

  // =====================
  // PSICOPEDAGOGÍA
  // =====================
  (me34Obj.psicopedagogia || []).forEach((item) => {
    if (!reactiveTables["psicopedagogia-table"]) {
      reactiveTables["psicopedagogia-table"] = {};
    }
    reactiveTables["psicopedagogia-table"][item.testid] = {
      checked: true,
      date: normalizeDateForInput(item.date),
      text: ""
    };
  });

  // =====================
  // LOGOPEDIA
  // =====================
  (me34Obj.logopedia || []).forEach((item) => {
    if (!reactiveTables["logopedia-table"]) {
      reactiveTables["logopedia-table"] = {};
    }
    reactiveTables["logopedia-table"][item.testid] = {
      checked: true,
      date: normalizeDateForInput(item.date),
      text: item.explanation || ""
    };
  });

  // =====================
  // PEDAGOGÍA
  // =====================
  if (edulevel === "Primera Infancia (PI)") {
    (me34Obj.pedagogia || []).forEach((item) => {
      if (!reactiveTables["ped-general-table"]) {
        reactiveTables["ped-general-table"] = {};
      }
      reactiveTables["ped-general-table"][item.testid] = {
        checked: true,
        date: normalizeDateForInput(item.date),
        text: item.explanation || ""
      };
    });
  } else {
    (me34Obj.language || []).forEach((item) => {
      if (!reactiveTables["ped-lengua-table"]) {
        reactiveTables["ped-lengua-table"] = {};
      }
      reactiveTables["ped-lengua-table"][item.testid] = {
        checked: true,
        date: normalizeDateForInput(item.date),
        text: item.explanation || ""
      };
    });

    (me34Obj.math || []).forEach((item) => {
      if (!reactiveTables["ped-mate-table"]) {
        reactiveTables["ped-mate-table"] = {};
      }
      reactiveTables["ped-mate-table"][item.testid] = {
        checked: true,
        date: normalizeDateForInput(item.date),
        text: item.explanation || ""
      };
    });

    (me34Obj.history || []).forEach((item) => {
      if (!reactiveTables["ped-hist-table"]) {
        reactiveTables["ped-hist-table"] = {};
      }
      reactiveTables["ped-hist-table"][item.testid] = {
        checked: true,
        date: normalizeDateForInput(item.date),
        text: item.explanation || ""
      };
    });
  }
}

// ==========================
// POPULAR CONTROLES DESDE OBJETO
// ==========================
function populateME34Controls(me34Obj) {
  const canalInput = document.getElementById("otros-canal");
  if (canalInput) canalInput.value = me34Obj.channel || "";

  const ritmoInput = document.getElementById("otros-ritmo");
  if (ritmoInput) ritmoInput.value = me34Obj.rhythm || "";
}

function clearReactiveTables() {
  Object.keys(reactiveTables).forEach((tableId) => {
    reactiveTables[tableId] = {};
  });
}

// ==========================
// OPEN MODAL
// ==========================
export async function openME34Modal(id) {
  edulevel = findObjectByKeyAndId(childrenData.data, "2.1", id)?.edulevel || "";

  // 1️⃣ Fetch
  psico_pruebas = await fetchAuxTests("psicologia", "system");
  neuro_pruebas = await fetchAuxTests("neurocognitiva", "system");
  psicometria_pruebas = await fetchAuxTests("psicometria", "system");
  psicopedagogia_pruebas = await fetchAuxTests("psicopedagogia", "system");

  ped_lengua_areas = await fetchAuxTests("lengua", "system");
  ped_matematica_areas = await fetchAuxTests("math", "system");
  ped_historia_areas = await fetchAuxTests("historia", "system");
  ped_logopedia_areas = await fetchAuxTests("logopedia", "system");
  ped_pedagogia_areas = await fetchAuxTests("pedagogia", "system");

  // 2️⃣ Si cambia el niño → limpiar TODO ANTES
  if (validme34id !== id) {
    clearReactiveTables();
  }
  validme34id = id;

  clearME34Controls("me34-formModal");

  // 3️⃣ Cargar objeto existente
  const me34Obj = findObjectByKeyAndId(childrenData.data, "3.4", id);
  if (me34Obj) {
    populateME34Controls(me34Obj);
    populateReactiveTablesFromObj(me34Obj);
    updateme34 = true;
  } else {
    updateme34 = false;
  }

  // 4️⃣ Renderizar UNA SOLA VEZ (ya con reactiveTables cargado)
  renderCheckDateTable({
    data: psico_pruebas,
    tbodySelector: "#me34-psicologia-table tbody",
    tableId: "me34-psicologia-table"
  });
  renderCheckDateTable({
    data: neuro_pruebas,
    tbodySelector: "#neuro-table tbody",
    tableId: "neuro-table"
  });
  renderCheckDateTable({
    data: psicometria_pruebas,
    tbodySelector: "#psicometria-table tbody",
    tableId: "psicometria-table"
  });
  renderCheckDateTable({
    data: psicopedagogia_pruebas,
    tbodySelector: "#psicopedagogia-table tbody",
    tableId: "psicopedagogia-table"
  });

  renderAreaTable({ data: ped_logopedia_areas, tableId: "logopedia-table" });
  initPedagogia();

  $("#me34-formModal").modal("show");
}

function hasTextareaWithoutDate(reactiveTables) {
  for (const [tableId, rows] of Object.entries(reactiveTables)) {
    for (const [testid, state] of Object.entries(rows)) {
      const hasText =
        typeof state.text === "string" && state.text.trim() !== "";
      const hasDate =
        typeof state.date === "string" && state.date.trim() !== "";

      if (hasText && !hasDate) {
        return {
          error: true,
          tableId,
          testid,
          message: "Hay texto introducido sin fecha asociada."
        };
      }
    }
  }
  return { error: false };
}

function validateOtrosCampos() {
  const canal = document.getElementById("otros-canal")?.value.trim();
  const ritmo = document.getElementById("otros-ritmo")?.value.trim();

  if (!canal || !ritmo) {
    alert(
      'Debe completar los campos "Canal preferencial para la selección de información" y "Ritmo de trabajo".'
    );
    return false;
  }
  return true;
}

const updateMe34 = async (nuevoObj) => {
  if (!nuevoObj?.id) {
    alert("No se proporcionó el ID del registro a actualizar.");
    return;
  }

  try {
    const response = await fetch(
      `${window.config.apiUrl}/updateme34/${nuevoObj.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoObj)
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log(`Registro actualizado correctamente: ${result.updatedId}`);
    } else {
      console.error("Error al actualizar:", result.message);
    }
  } catch (err) {
    console.error("Error en fetch PUT /updateme34:", err);
  }
};

// ==========================
// BOTÓN GUARDAR
// ==========================
saveBtn.addEventListener("click", async () => {
  const validation = hasTextareaWithoutDate(reactiveTables);
  if (validation.error) {
    const tabName = getTabNameFromTableId(validation.tableId);
    alert(`Error en la pestaña "${tabName}". 
  Debe indicar una fecha cuando hay texto.`);
    return;
  }

  // 1️⃣ Validar canal y ritmo
  if (!validateOtrosCampos()) return;

  const nuevoObj = {
    psychology: 0,
    neurocognitive: 0,
    psychometry: 0,
    psychopedagogy: 0,
    pedagogygeneral: 0,
    pedagogylang: 0,
    pedagogymath: 0,
    pedagogyhistory: 0,
    speechtherapy: 0,
    psicologia: [],
    neuro: [],
    psicometria: [],
    psicopedagogia: [],
    logopedia: [],
    pedagogia: [],
    language: [],
    math: [],
    history: [],
    channel: document.getElementById("otros-canal")?.value || "",
    rhythm: document.getElementById("otros-ritmo")?.value || "",
    savedate: hoyISO(),
    username: window.currentUser.userid,
    key: "3.4",
    id: validme34id,
    dni: childrenData.dni
  };

  // PSICOLOGÍA
  Object.entries(reactiveTables["me34-psicologia-table"] || {}).forEach(
    ([testid, state]) => {
      if (state.checked) {
        nuevoObj.psychology = 1;
        nuevoObj.psicologia.push({
          testid: Number(testid),
          date: state.date || ""
        });
      }
    }
  );
  Object.entries(reactiveTables["neuro-table"] || {}).forEach(
    ([testid, state]) => {
      if (state.checked) {
        nuevoObj.neurocognitive = 1;
        nuevoObj.neuro.push({ testid: Number(testid), date: state.date || "" });
      }
    }
  );
  Object.entries(reactiveTables["psicometria-table"] || {}).forEach(
    ([testid, state]) => {
      if (state.checked) {
        nuevoObj.psychometry = 1;
        nuevoObj.psicometria.push({
          testid: Number(testid),
          date: state.date || ""
        });
      }
    }
  );
  Object.entries(reactiveTables["psicopedagogia-table"] || {}).forEach(
    ([testid, state]) => {
      if (state.checked) {
        nuevoObj.psychopedagogy = 1;
        nuevoObj.psicopedagogia.push({
          testid: Number(testid),
          date: state.date || ""
        });
      }
    }
  );
  Object.entries(reactiveTables["logopedia-table"] || {}).forEach(
    ([testid, state]) => {
      nuevoObj.speechtherapy = 1;
      nuevoObj.logopedia.push({
        testid: Number(testid),
        date: state.date || "",
        explanation: state.text || ""
      });
    }
  );

  if (edulevel === "Primera Infancia (PI)") {
    Object.entries(reactiveTables["ped-general-table"] || {}).forEach(
      ([testid, state]) => {
        nuevoObj.pedagogygeneral = 1;
        nuevoObj.pedagogia.push({
          testid: Number(testid),
          date: state.date || "",
          explanation: state.text || ""
        });
      }
    );
  } else {
    Object.entries(reactiveTables["ped-lengua-table"] || {}).forEach(
      ([testid, state]) => {
        nuevoObj.pedagogylang = 1;
        nuevoObj.language.push({
          testid: Number(testid),
          date: state.date || "",
          explanation: state.text || ""
        });
      }
    );
    Object.entries(reactiveTables["ped-mate-table"] || {}).forEach(
      ([testid, state]) => {
        nuevoObj.pedagogymath = 1;
        nuevoObj.math.push({
          testid: Number(testid),
          date: state.date || "",
          explanation: state.text || ""
        });
      }
    );
    Object.entries(reactiveTables["ped-hist-table"] || {}).forEach(
      ([testid, state]) => {
        nuevoObj.pedagogyhistory = 1;
        nuevoObj.history.push({
          testid: Number(testid),
          date: state.date || "",
          explanation: state.text || ""
        });
      }
    );
  }

  if (updateme34) {
    const existingObj = findObjectByKeyAndId(
      childrenData.data,
      "3.4",
      validme34id
    );
    console.log("existingObj: ", existingObj);
    if (existingObj) {
      Object.assign(existingObj, nuevoObj);
      await updateMe34(nuevoObj);
    } else console.warn("⚠️ No se encontró objeto me34 con id:", validme34id);
  } else {
    insertarNuevoObjEnChildrenData(nuevoObj, "3.3.3");
    console.log("nuevoObj: ", nuevoObj);
    await fetch(`${window.config.apiUrl}/saveme34`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoObj)
    });
    $(document).trigger("updatetreeevent");
  }
  $("#me34-formModal").modal("hide");
});

exportToPDF.addEventListener("click", async () => {
  const obj = findObjectByKeyAndId(childrenData.data, "3.4", validme34id);
  if (!obj) {
    alert("No hay datos para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "letter");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let y = 20;

  /* =========================
     UTILIDADES
     ========================= */

  const checkPage = (extra = 10) => {
    if (y + extra > pageHeight - 15) {
      pdf.addPage();
      y = 20;
    }
  };

  const title = (text) => {
    // 👉 espacio vertical antes del título
    y += 6;

    checkPage(12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(text, 15, y);
    y += 8;
  };

  const line = (text) => {
    checkPage(8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(text, pageWidth - 30);
    pdf.text(lines, 15, y);
    y += lines.length * 6;
  };

  const formatDateOnly = (value) => {
    if (!value) return "";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================
     TÍTULO PRINCIPAL
     ========================= */
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  const mainTitle = "Profundización Diagnóstica";
  const textWidth = pdf.getTextWidth(mainTitle);
  pdf.text(mainTitle, (pageWidth - textWidth) / 2, y);
  y += 15;

  /* =========================
     SECCIONES SIMPLES
     ========================= */
  async function renderSimpleSection(arr, sectionTitle) {
    if (!Array.isArray(arr) || arr.length === 0) return;
    title(sectionTitle);

    for (const item of arr) {
      const name = await getTestName(item.testid);
      const dateOnly = formatDateOnly(item.date);
      line(`${name} — ${dateOnly}`);
    }
  }

  /* =========================
     SECCIONES CON TEXTO
     ========================= */
  async function renderTextSection(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return;

    for (const item of arr) {
      if (!item.date) continue;
      const name = await getTestName(item.testid);
      const dateOnly = formatDateOnly(item.date);
      const explanation = item.explanation || "";
      line(`${name} (${dateOnly}): ${explanation}`);
    }
  }

  /* =========================
     BLOQUES
     ========================= */
  await renderSimpleSection(obj.psicologia, "Psicología");
  await renderSimpleSection(obj.neuro, "Evaluación neurocognitiva");
  await renderSimpleSection(obj.psicometria, "Psicometría");
  await renderSimpleSection(obj.psicopedagogia, "Psicopedagogía");

  if (
    (obj.pedagogia && obj.pedagogia.length) ||
    (obj.language && obj.language.length) ||
    (obj.math && obj.math.length) ||
    (obj.history && obj.history.length)
  ) {
    title("Pedagogía");

    await renderTextSection(obj.pedagogia);
    title("Lengua Española");
    await renderTextSection(obj.language);
    title("Matemática");
    await renderTextSection(obj.math);
    title("Historia");
    await renderTextSection(obj.history);
  }

  title("Logopedia");
  await renderTextSection(obj.logopedia);

  /* =========================
     OTROS CAMPOS
     ========================= */
  title("Canal preferencial para la selección de información");
  line(obj.channel || "");

  title("Ritmo de trabajo");
  line(obj.rhythm || "");

  /* =========================
     GUARDAR PDF
     ========================= */
  pdf.save("Profundizacion_Diagnostica_ME34.pdf");
});
