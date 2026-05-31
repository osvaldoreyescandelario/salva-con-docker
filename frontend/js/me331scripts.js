import { childrenData, findObjectByKeyAndId, insertarNuevoObjEnChildrenData, exportFormToPDF } from './definitions.js';

let validme331id;
let updateme331 = false;

// === FUNCIÓN GLOBAL para actualizar display ===
function actualizarDisplayMultiselect() {
  const checkboxesRelaciones = document.querySelectorAll('.me331-options-list input[type="checkbox"]');
  const display = document.querySelector('.me331-select-display');
  const seleccionados = Array.from(checkboxesRelaciones).filter(chk => chk.checked);
  
  if (seleccionados.length === 0) {
    display.textContent = 'Seleccione...';
  } else if (seleccionados.length === 1) {
    display.textContent = seleccionados[0].value;
  } else {
    display.textContent = `${seleccionados.length} seleccionados`;
  }
}

function cargarFormularioMe331(data) {
  if (!data) {
    console.warn("⚠️ No se recibió data para inicializar formulario ME331");
    return;
  }

  // === Checkboxes miembros de la familia ===
  document.getElementById("me331-mama").checked = !!data.mother;
  document.getElementById("me331-papa").checked = !!data.father;
  document.getElementById("me331-abuelaMaterna").checked = !!data.maternalgrandmother;
  document.getElementById("me331-abueloMaterno").checked = !!data.maternalgrandfather;
  document.getElementById("me331-abuelaPaterna").checked = !!data.paternalgrandmother;
  document.getElementById("me331-abueloPaterno").checked = !!data.paternalgrandfather;

  // === Inputs numéricos ===
  document.getElementById("me331-hermanos").value = data.brothers ?? 0;
  document.getElementById("me331-tiosMaternos").value = data.maternaluncles ?? 0;
  document.getElementById("me331-tiosPaternos").value = data.paternaluncles ?? 0;

  // === MultiSelect relaciones padres ===
  const relaciones = (data.parentsrelationships || "").split(" / ").map(s => s.trim());
  const checkboxesRelaciones = document.querySelectorAll('.me331-options-list input[type="checkbox"]');
  checkboxesRelaciones.forEach(chk => {
    chk.checked = relaciones.includes(chk.value);
  });

  // ✅ AHORA SÍ funciona: función global
  actualizarDisplayMultiselect();

  // === Input "¿Cuál?" ===
  const cualInput = document.getElementById("me331-cual");
  const otraSeleccionada = relaciones.includes("Otra");
  cualInput.disabled = !otraSeleccionada;
  cualInput.value = otraSeleccionada ? (data.whichother || "") : "";
}

function inicializarME331Form(id) {
  const form = document.getElementById("me331-form");
  if (!form) return;
  const me331Obj = findObjectByKeyAndId(childrenData.data, "3.3.1", id);

  validme331id = id;

  if (!me331Obj) {
    updateme331 = false;
    form.reset(); 
    document.getElementById("me331-cual").disabled = true;
    actualizarDisplayMultiselect(); // ✅ Limpia display
  } else {
    updateme331 = true;
    cargarFormularioMe331(me331Obj);
  }
}

export function openME331Modal(id) {
  inicializarME331Form(id); 
  $('#me331-formModal').modal('show');
}

// ===========================================
// Lógica del formulario 3.3.1 + MULTISELECT NATIVO
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const cualInput = document.getElementById("me331-cual");
  const multiselect = document.querySelector('.me331-multiselect-native');
  
  cualInput.disabled = true;

  // Toggle lista multiselect
  multiselect.addEventListener('click', function(e) {
    e.stopPropagation();
    multiselect.classList.toggle('open');
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', function() {
    multiselect.classList.remove('open');
  });

  // Event listeners para checkboxes relaciones
  const checkboxesRelaciones = document.querySelectorAll('.me331-options-list input[type="checkbox"]');
  checkboxesRelaciones.forEach(cb => {
    cb.addEventListener('change', function() {
      actualizarDisplayMultiselect(); // ✅ Función global
      
      // Habilitar/deshabilitar campo "cual"
      const otraSeleccionada = document.getElementById("me331-relacionesOtra").checked;
      cualInput.disabled = !otraSeleccionada;
      if (!otraSeleccionada) cualInput.value = "";
    });
  });

  async function guardarME331TochildrenData(formData) {
    const nuevoObj = {
      id: validme331id,
      dni: childrenData.dni,
      mother: formData.miembros.mama ? 1 : 0,
      father: formData.miembros.papa ? 1 : 0,
      maternalgrandmother: formData.miembros.abuelaMaterna ? 1 : 0,
      maternalgrandfather: formData.miembros.abueloMaterno ? 1 : 0,
      paternalgrandmother: formData.miembros.abuelaPaterna ? 1 : 0,
      paternalgrandfather: formData.miembros.abueloPaterno ? 1 : 0,
      brothers: Number(formData.miembros.hermanos ?? 0),
      maternaluncles: Number(formData.miembros.tiosMaternos ?? 0),
      paternaluncles: Number(formData.miembros.tiosPaternos ?? 0),
      parentsrelationships: Array.isArray(formData.relaciones) ? formData.relaciones.join(" / ") : "",
      whichother: formData.cual || "",
      savedate: new Date().toISOString().split("T")[0],
      username: window.currentUser.userid,
      key: "3.3.1"
    };

    if (updateme331) {
      const existingObj = findObjectByKeyAndId(childrenData.data, "3.3.1", validme331id);
      if (existingObj) {
        Object.assign(existingObj, nuevoObj);
      } else {
        console.warn("⚠️ No se encontró objeto me331 con id:", validme331id);
      }
    } else {
      insertarNuevoObjEnChildrenData(nuevoObj, "3.2.3");
    }
  }

  // saveChildme331 y updateChild331 (sin cambios)
  async function saveChildme331() {
    const registro = findObjectByKeyAndId(childrenData.data, "3.3.1", validme331id);
    if (!registro) {
      console.error("No se encontró un registro con id =", validme331id);
      return;
    }

    try {
      const response = await fetch(`${window.config.apiUrl}/saveme331`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro)
      });

      const result = await response.json();
      if (result.success) {
        console.log("✅ Datos guardados correctamente en la BD (me331):", result);
      } else {
        console.error("⚠️ Error al guardar en me331:", result.message);
      }
    } catch (error) {
      console.error("❌ Error en saveChildme331:", error);
    }
  }

  async function updateChild331() {
    try {
      const me331Obj = findObjectByKeyAndId(childrenData.data, "3.3.1", validme331id);
      if (!me331Obj) {
        console.error("❌ No se encontró objeto me331 con id:", validme331id);
        return;
      }

      const payload = {
        id: me331Obj.id,
        dni: childrenData.dni,
        mother: Number(me331Obj.mother ?? 0),
        father: Number(me331Obj.father ?? 0),
        maternalgrandmother: Number(me331Obj.maternalgrandmother ?? 0),
        maternalgrandfather: Number(me331Obj.maternalgrandfather ?? 0),
        paternalgrandmother: Number(me331Obj.paternalgrandmother ?? 0),
        paternalgrandfather: Number(me331Obj.paternalgrandfather ?? 0),
        brothers: Number(me331Obj.brothers ?? 0),
        maternaluncles: Number(me331Obj.maternaluncles ?? 0),
        paternaluncles: Number(me331Obj.paternaluncles ?? 0),
        parentsrelationships: me331Obj.parentsrelationships || "",
        whichother: me331Obj.whichother || "",
        savedate: me331Obj.savedate,
        username: me331Obj.username
      };

      const resp = await fetch(`${window.config.apiUrl}/updateme331/${me331Obj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();

      if (!result.success) {
        alert("⚠️ Error al actualizar me331: " + result.message);
      } else {
        alert("✅ Registro me331 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChild331:", err);
      alert("Error inesperado al actualizar me331");
    }
  }

  // Guardar (adaptado para multiselect nativo)
  document.getElementById("me331-guardarBtn").addEventListener("click", async () => {
    const form = document.getElementById("me331-form");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const relacionesSeleccionadas = Array.from(checkboxesRelaciones)
      .filter(chk => chk.checked)
      .map(chk => chk.value);

    const formData = {
      miembros: {
        mama: document.getElementById("me331-mama").checked,
        papa: document.getElementById("me331-papa").checked,
        abuelaMaterna: document.getElementById("me331-abuelaMaterna").checked,
        abueloMaterno: document.getElementById("me331-abueloMaterno").checked,
        abuelaPaterna: document.getElementById("me331-abuelaPaterna").checked,
        abueloPaterno: document.getElementById("me331-abueloPaterno").checked,
        hermanos: document.getElementById("me331-hermanos").value,
        tiosMaternos: document.getElementById("me331-tiosMaternos").value,
        tiosPaternos: document.getElementById("me331-tiosPaternos").value,
      },
      relaciones: relacionesSeleccionadas,
      cual: cualInput.disabled ? "" : cualInput.value,
    };

    await guardarME331TochildrenData(formData);
    if (updateme331) {
      await updateChild331();
    } else {
      await saveChildme331();
      $(document).trigger("updatetreeevent");
    }
    
    alert("Formulario Familia guardado correctamente.");
    $("#me331-formModal").modal("hide");
    form.classList.remove("was-validated");
  });

  exportFormToPDF("me331-form", "me331-exportPDFBtn", "formulario_me331.pdf");
});
