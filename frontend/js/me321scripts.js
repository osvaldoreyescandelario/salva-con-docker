import {
  childrenData,
  findObjectByKeyAndId,
  insertarNuevoObjEnChildrenData,
  exportFormToPDF
} from "./definitions.js";

let validme321id;
let updateme321 = false;

// referencias
const form = document.getElementById("me321-form");

// HABITOS
const habNo = document.getElementById("me321-habitosNo");
const habSi = document.getElementById("me321-habitosSi");
const habitosCualesBtnId = "me321-habitosCualesBtn";

// ABORTOS
const abortosNo = document.getElementById("me321-abortosNo");
const abortosSi = document.getElementById("me321-abortosSi");
const abortosCant = document.getElementById("me321-abortosCant");
const abortosTiposBtnId = "me321-abortosTiposBtn";

// ENFERMEDADES DURANTE EL EMBARAZO
const enfNo = document.getElementById("me321-enfNo");
const enfSi = document.getElementById("me321-enfSi");
const enfBtnId = "me321-enfermedadesBtn";

// TIPO DE PARTO multiselect btn id
const tipoPartoBtnId = "me321-tipoPartoBtn";

// Inicializar estados
abortosCant.disabled = true;
setDropdownCheckboxesEnabled(abortosTiposBtnId, false);

document.getElementById(habitosCualesBtnId).disabled = true;
document.getElementById(enfBtnId).disabled = true;

// Función para habilitar/deshabilitar checkboxes dentro de un dropdown
function setDropdownCheckboxesEnabled(buttonId, enabled) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  const container = btn.closest(".me321-dropdown");
  if (!container) return;
  const cbs = container.querySelectorAll('input[type="checkbox"]');
  cbs.forEach((cb) => (cb.disabled = !enabled));
  if (!enabled) cbs.forEach((cb) => (cb.checked = false));
}

// Toggle Habitos
function toggleHabitos() {
  const btn = document.getElementById(habitosCualesBtnId);
  if (habSi.checked) {
    btn.disabled = false;
    setDropdownCheckboxesEnabled(habitosCualesBtnId, true);
  } else {
    btn.disabled = true;
    btn.textContent = "Seleccione...";
    setDropdownCheckboxesEnabled(habitosCualesBtnId, false);
  }
}
habNo.addEventListener("change", toggleHabitos);
habSi.addEventListener("change", toggleHabitos);

// Toggle Abortos
function toggleAbortos() {
  if (abortosSi.checked) {
    abortosCant.disabled = false;
    abortosCant.setAttribute("required", "required");
    setDropdownCheckboxesEnabled(abortosTiposBtnId, true);
  } else {
    abortosCant.disabled = true;
    abortosCant.value = "";
    abortosCant.removeAttribute("required");
    setDropdownCheckboxesEnabled(abortosTiposBtnId, false);
  }
}
abortosNo.addEventListener("change", toggleAbortos);
abortosSi.addEventListener("change", toggleAbortos);

// Toggle Enfermedades
function toggleEnfermedades() {
  const btn = document.getElementById(enfBtnId);
  if (enfSi.checked) {
    btn.disabled = false;
    setDropdownCheckboxesEnabled(enfBtnId, true);
  } else {
    btn.disabled = true;
    btn.textContent = "Seleccione...";
    setDropdownCheckboxesEnabled(enfBtnId, false);
  }
}
enfNo.addEventListener("change", toggleEnfermedades);
enfSi.addEventListener("change", toggleEnfermedades);

// Inicializar textos de dropdowns
actualizarTextoDropdown(abortosTiposBtnId);
actualizarTextoDropdown(tipoPartoBtnId);
actualizarTextoDropdown(habitosCualesBtnId);
actualizarTextoDropdown(enfBtnId);

// 🔹 Función principal: inicializa formulario ME321
function inicializarME321Form(id) {
  const me321Obj = findObjectByKeyAndId(childrenData.data, "3.2.1", id);

  validme321id = id;

  // ==== Caso no existe: limpiar todo ====
  if (!me321Obj) {
    const form = document.getElementById("me321-form");
    if (!form) return;
    updateme321 = false;

    // quitar clases de validación si las hubiera
    form.classList.remove("was-validated");

    // reset nativo (estables los valores por defecto declarados en el HTML)
    form.reset();

    // limpiar explícito de inputs de texto/number/date/hidden/password y textarea
    form
      .querySelectorAll(
        'input[type="text"], input[type="number"], input[type="hidden"], input[type="password"], input[type="date"], textarea'
      )
      .forEach((i) => {
        i.value = "";
      });

    // radios y checkboxes: restaurar a su estado por defecto (defaultChecked)
    form
      .querySelectorAll('input[type="radio"], input[type="checkbox"]')
      .forEach((i) => {
        i.checked = !!i.defaultChecked; // usa defaultChecked, no hasAttribute('checked')
        i.disabled = false; // quitamos posibles disabled dejados por uso anterior
      });

    // campo dependiente: cantidad de abortos -> vacío, deshabilitado y sin 'required'
    const abortosCant = document.getElementById("me321-abortosCant");
    if (abortosCant) {
      abortosCant.value = "";
      abortosCant.disabled = true;
      abortosCant.removeAttribute("required");
    }

    // selects normales -> primer índice y habilitados
    form.querySelectorAll("select").forEach((s) => {
      s.selectedIndex = 0;
      s.disabled = false;
    });

    // Configuración de botones dropdown y sus checkboxes (estado por defecto)
    const dropdownConfigs = [
      {
        btnId: "me321-abortosTiposBtn",
        btnDisabled: false,
        checkboxesDisabled: true
      }, // tipos abortos: checks deshabilitados por defecto
      {
        btnId: "me321-habitosCualesBtn",
        btnDisabled: true,
        checkboxesDisabled: true
      }, // hábitos: botón y checks deshabilitados
      {
        btnId: "me321-enfermedadesBtn",
        btnDisabled: true,
        checkboxesDisabled: true
      }, // enfermedades: botón y checks deshabilitados
      {
        btnId: "me321-tipoPartoBtn",
        btnDisabled: false,
        checkboxesDisabled: false
      } // tipo parto: disponible
    ];

    dropdownConfigs.forEach((cfg) => {
      const btn = document.getElementById(cfg.btnId);
      if (!btn) return;
      btn.textContent = "Seleccione...";
      btn.disabled = !!cfg.btnDisabled;
      const menu = btn.nextElementSibling; // en tu HTML es el div.dropdown-menu
      if (menu) {
        menu.querySelectorAll("input[type='checkbox']").forEach((cb) => {
          cb.checked = false;
          cb.disabled = !!cfg.checkboxesDisabled;
        });
      }
    });

    // Forzar radios "No" por defecto (sobre-escribe defaultChecked si es necesario)
    [
      "me321-abortosNo",
      "me321-habitosNo",
      "me321-compatNo",
      "me321-consangNo",
      "me321-sangraNo",
      "me321-enfNo"
    ].forEach((rid) => {
      const r = document.getElementById(rid);
      if (r) r.checked = true;
    });
  } else {
    // ==== Caso existe cargar datos ====
    updateme321 = true;
    // embarazo
    document.getElementById("me321-embarazo").value = me321Obj.pregnancy || "";

    // orden gestación
    document.getElementById("me321-ordenGestacion").value =
      me321Obj.gesnumber || "";

    // abortos
    if (me321Obj.abortions === 1) {
      document.getElementById("me321-abortosSi").checked = true;
      setDropdownCheckboxesEnabled(abortosTiposBtnId, true);
      document.getElementById("me321-abortosCant").disabled = false;
      document.getElementById("me321-abortosCant").value =
        me321Obj.abortionsquantity || "";

      // tipos de abortos (usa separador "/")
      const tipos = (me321Obj.abortionstypes || "").split("/");
      document
        .querySelectorAll(
          '#me321-abortosTiposBtn ~ .dropdown-menu input[type="checkbox"]'
        )
        .forEach((chk) => {
          chk.checked = tipos.includes(chk.value);
        });
    } else {
      document.getElementById("me321-abortosNo").checked = true;
    }

    // hábitos
    if (me321Obj.toxichabits === 1) {
      document.getElementById("me321-habitosSi").checked = true;
      const habBtn = document.getElementById("me321-habitosCualesBtn");
      habBtn.disabled = false;
      setDropdownCheckboxesEnabled("me321-habitosCualesBtn", true);
      const habs = (me321Obj.toxichabitstypes || "").split("/");
      document
        .querySelectorAll(
          '#me321-habitosCualesBtn ~ .dropdown-menu input[type="checkbox"]'
        )
        .forEach((chk) => {
          chk.checked = habs.includes(chk.value);
        });
    } else {
      document.getElementById("me321-habitosNo").checked = true;
    }

    // compatibilidad madre-feto
    document.getElementById(
      me321Obj.motherfetusbloodcomp === 1 ? "me321-compatSi" : "me321-compatNo"
    ).checked = true;

    // consanguinidad
    document.getElementById(
      me321Obj.motherfatherconsanguinity === 1
        ? "me321-consangSi"
        : "me321-consangNo"
    ).checked = true;

    // sangramiento
    document.getElementById(
      me321Obj.bleeding === 1 ? "me321-sangraSi" : "me321-sangraNo"
    ).checked = true;

    // enfermedades embarazo
    if (me321Obj.illnessespregnancy === 1) {
      document.getElementById("me321-enfSi").checked = true;
      const enfBtn = document.getElementById("me321-enfermedadesBtn");
      enfBtn.disabled = false;
      setDropdownCheckboxesEnabled("me321-enfermedadesBtn", true);
      const enfs = (me321Obj.illnesses || "").split("/");
      document
        .querySelectorAll(
          '#me321-enfermedadesBtn ~ .dropdown-menu input[type="checkbox"]'
        )
        .forEach((chk) => {
          chk.checked = enfs.includes(chk.value);
        });
    } else {
      document.getElementById("me321-enfNo").checked = true;
    }

    // tipo parto
    const partos = (me321Obj.childbirthtypes || "").split("/");
    document
      .querySelectorAll(
        '#me321-tipoPartoBtn ~ .dropdown-menu input[type="checkbox"]'
      )
      .forEach((chk) => {
        chk.checked = partos.includes(chk.value);
      });

    // complicaciones
    if (me321Obj.complications) {
      const radio = document.querySelector(
        `input[name="me321-complicaciones"][value="${me321Obj.complications}"]`
      );
      if (radio) radio.checked = true;
    }

    // lactancia
    document.getElementById("me321-lactancia").value =
      me321Obj.breastfeedinguntil || "";
  }
}

// Actualizar texto de botones dropdown multiselección
function actualizarTextoDropdown(btnId) {
  const $btn = $("#" + btnId);
  if (!$btn.length) return;
  const $container = $btn.closest(".me321-dropdown");

  // evento al cerrar
  $container.on("hidden.bs.dropdown", function () {
    const seleccionados = $(this)
      .find("input[type='checkbox']:checked")
      .map((_, i) => i.value)
      .get();
    $btn.text(
      seleccionados.length ? seleccionados.join(", ") : "Seleccione..."
    );
  });

  // evento al cambiar
  $container.find("input[type='checkbox']").on("change", function () {
    const seleccionados = $container
      .find("input[type='checkbox']:checked")
      .map((_, i) => i.value)
      .get();
    $btn.text(
      seleccionados.length ? seleccionados.join(", ") : "Seleccione..."
    );
  });
}

export function openME321Modal(id) {
  inicializarME321Form(id);

  $("#me321-formModal").modal("show");
}

// ==============================
// JS del modal me321
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  async function guardarME321TochildrenData(data) {
    const nuevoObj = {
      id: validme321id,
      key: "3.2.1",
      dni: childrenData.dni,
      pregnancy: data.embarazo || "",
      gesnumber: Number.parseInt(data.ordenGestacion, 10) || null,

      abortions: data["me321-abortosRadio"] === "Sí" ? 1 : 0,
      abortionstypes: Array.isArray(data.abortosTipos)
        ? data.abortosTipos.join("/")
        : "",
      abortionsquantity: data.abortosCantidad
        ? Number.parseInt(data.abortosCantidad, 10)
        : null,

      toxichabits: data["me321-habitosRadio"] === "Sí" ? 1 : 0,
      toxichabitstypes: Array.isArray(data.habitosCuales)
        ? data.habitosCuales.join("/")
        : "",

      motherfetusbloodcomp: data["me321-compatibilidad"] === "Sí" ? 1 : 0,
      motherfatherconsanguinity: data["me321-consanguinidad"] === "Sí" ? 1 : 0,
      bleeding: data["me321-sangramiento"] === "Sí" ? 1 : 0,

      illnessespregnancy: data["me321-enfEmbRadio"] === "Sí" ? 1 : 0,
      illnesses: Array.isArray(data.enfermedades)
        ? data.enfermedades.join("/")
        : "",

      childbirthtypes: Array.isArray(data.tipoParto)
        ? data.tipoParto.join("/")
        : "",
      complications: data["me321-complicaciones"] || "",
      breastfeedinguntil: data.lactancia || "",

      savedate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      username: window.currentUser.userid
    };

    if (updateme321) {
      // Actualizar entrada existente
      const existingObj = findObjectByKeyAndId(
        childrenData.data,
        "3.1.1",
        validme321id
      );

      if (existingObj) {
        Object.assign(existingObj, nuevoObj); //aqui
      } else {
        console.warn("⚠️ No se encontró objeto me321 con id:", validme321id);
      }
    } else {
      // Insertar nueva entrada
      insertarNuevoObjEnChildrenData(nuevoObj, "3.1.1");
    }
  }

  // Ruta # 17: Salva los datos del formulario me321.
  async function saveChildme321() {
    // Buscar el objeto en childrenData.me321
    const registro = findObjectByKeyAndId(
      childrenData.data,
      "3.2.1",
      validme321id
    );
    // const registro = childrenData.me321.find(obj => obj.id === validme321id);
    if (!registro) {
      console.error("No se encontró un registro con id =", validme321id);
      return;
    }

    try {
      const response = await fetch(`${window.config.apiUrl}/saveme321`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registro)
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Datos guardados correctamente en la BD:", result);
      } else {
        console.error("⚠️ Error al guardar:", result.message);
      }
    } catch (error) {
      console.error("❌ Error en salvarME321:", error);
    }
  }

  async function updateChild321() {
    try {
      // 1. Buscar el objeto me321 cuyo id = validme321id
      const me321Obj = findObjectByKeyAndId(
        childrenData.data,
        "3.2.1",
        validme321id
      );
      // const me321Obj = childrenData.me321.find(obj => obj.id === validme321id);
      if (!me321Obj) {
        console.error("❌ No se encontró objeto me321 con id:", validme321id);
        return;
      }

      // 2. Preparar payload para la API
      const payload = {
        id: me321Obj.id,
        dni: childrenData.dni,
        pregnancy: me321Obj.pregnancy,
        gesnumber: me321Obj.gesnumber,
        abortions: me321Obj.abortions,
        abortionstypes: Array.isArray(me321Obj.abortionstypes)
          ? me321Obj.abortionstypes.join("/")
          : me321Obj.abortionstypes,
        abortionsquantity: me321Obj.abortionsquantity,
        toxichabits: me321Obj.toxichabits,
        toxichabitstypes: Array.isArray(me321Obj.toxichabitstypes)
          ? me321Obj.toxichabitstypes.join("/")
          : me321Obj.toxichabitstypes,
        motherfetusbloodcomp: me321Obj.motherfetusbloodcomp,
        motherfatherconsanguinity: me321Obj.motherfatherconsanguinity,
        bleeding: me321Obj.bleeding,
        illnessespregnancy: me321Obj.illnessespregnancy,
        illnesses: Array.isArray(me321Obj.illnesses)
          ? me321Obj.illnesses.join("/")
          : me321Obj.illnesses,
        childbirthtypes: Array.isArray(me321Obj.childbirthtypes)
          ? me321Obj.childbirthtypes.join("/")
          : me321Obj.childbirthtypes,
        complications: me321Obj.complications,
        breastfeedinguntil: me321Obj.breastfeedinguntil,
        savedate: me321Obj.savedate, // ya debería estar en formato YYYY-MM-DD
        username: me321Obj.username
      };

      // 3. Hacer fetch
      const resp = await fetch(
        `${window.config.apiUrl}/updateme321/${me321Obj.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await resp.json();

      if (!result.success) {
        alert("Error al actualizar me321: " + result.message);
      } else {
        alert("Registro me321 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChild321:", err);
      alert("Error inesperado al actualizar me321");
    }
  }

  // Guardar / submit
  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const data = {};
    const fm = new FormData(form);
    fm.forEach((v, k) => {
      data[k] = v;
    });

    // Recolectar selecciones de dropdowns
    data["abortosTipos"] = Array.from(
      document.querySelectorAll(
        `#${abortosTiposBtnId} ~ .dropdown-menu input[type="checkbox"]:checked`
      )
    ).map((i) => i.value);

    data["tipoParto"] = Array.from(
      document.querySelectorAll(
        `#${tipoPartoBtnId} ~ .dropdown-menu input[type="checkbox"]:checked`
      )
    ).map((i) => i.value);

    data["habitosCuales"] = Array.from(
      document.querySelectorAll(
        `#${habitosCualesBtnId} ~ .dropdown-menu input[type="checkbox"]:checked`
      )
    ).map((i) => i.value);

    data["enfermedades"] = Array.from(
      document.querySelectorAll(
        `#${enfBtnId} ~ .dropdown-menu input[type="checkbox"]:checked`
      )
    ).map((i) => i.value);

    await guardarME321TochildrenData(data);
    if (updateme321) {
      await updateChild321();
    } else {
      await saveChildme321();
      $(document).trigger("updatetreeevent");
    }

    $("#me321-formModal").modal("hide");
    form.reset();

    // reset estados
    toggleHabitos();
    toggleAbortos();
    toggleEnfermedades();

    // reset textos
    $("#" + abortosTiposBtnId).text("Seleccione...");
    $("#" + tipoPartoBtnId).text("Seleccione...");
    $("#" + habitosCualesBtnId).text("Seleccione...");
    $("#" + enfBtnId).text("Seleccione...");

    setDropdownCheckboxesEnabled(abortosTiposBtnId, false);
    setDropdownCheckboxesEnabled(habitosCualesBtnId, false);
    setDropdownCheckboxesEnabled(enfBtnId, false);

    form.classList.remove("was-validated");
  });

  // run initial toggles
  toggleHabitos();
  toggleAbortos();
  toggleEnfermedades();

  exportFormToPDF("me321-form", "me321-exportPDFBtn", "formulario_me321.pdf");
});
