import { childrenData, findObjectByKeyAndId, insertarNuevoObjEnChildrenData, exportFormToPDF } from './definitions.js';

let validme323id;
let updateme323 = false;

function cargarFormularioMe323(data) {
  if (!data) {
    console.warn("⚠️ No se recibió data para inicializar formulario ME323");
    return;
  }


  // Textareas
  document.getElementById("me323-maternos").value = data.maternalfamilypathhistory || "";
  document.getElementById("me323-paternos").value = data.paternalfamilypathhistory || "";
}

function inicializarME323Form(id) {
  const form = document.getElementById("me323-form");
  if (!form) return;
  const me323Obj = findObjectByKeyAndId(childrenData.data, "3.2.3", id);

  validme323id = id;

  if (!me323Obj) {
    updateme323 = false;
    // ==== Limpiar controles ====
    form.reset(); 
  } else {
    updateme323 = true;
    cargarFormularioMe323(me323Obj);
  }
}

export function openME323Modal(id) {
  inicializarME323Form(id); 

  $('#me323-formModal').modal('show');
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("me323-form");
  const guardarBtn = document.getElementById("me323-guardarBtn");

  async function guardarME323TochildrenData(data) {
    const nuevoObj = {
      id: validme323id,
      dni: childrenData.dni,

      // controles tipo select / text
      maternalfamilypathhistory: data.maternos || "",
      paternalfamilypathhistory: data.paternos || "",
      savedate: new Date().toISOString().split("T")[0],
      username: window.currentUser.userid,
      key: "3.2.3"
    };


    if (updateme323) {
        // Actualizar entrada existente
        const existingObj = findObjectByKeyAndId(childrenData.data, "3.2.3", validme323id);
        if (existingObj) {
            Object.assign(existingObj, nuevoObj);
        } else {
            console.warn("⚠️ No se encontró objeto me323 con id:", validme323id);
        }
    } else {
        // Insertar nueva entrada
        insertarNuevoObjEnChildrenData(nuevoObj, "3.2.2");
    }
  }

  // Ruta # 28: Salva los datos del formulario me323.
  async function saveChildme323() {
    // Buscar el objeto en childrenData.me323
    const registro = findObjectByKeyAndId(childrenData.data, "3.2.3", validme323id);
    if (!registro) {
      console.error("No se encontró un registro con id =", validme323id);
      return;
    }

    try {
      const response = await fetch(`${window.config.apiUrl}/saveme323`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registro)
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Datos guardados correctamente en la BD (me323):", result);
      } else {
        console.error("⚠️ Error al guardar en me323:", result.message);
      }
    } catch (error) {
      console.error("❌ Error en salvarME323:", error);
    }
  }

  // Ruta # 29: Actualiza los datos modulo me 3.2.3.
  async function updateChild323() {
    try {
      // 1. Buscar el objeto me323 cuyo id = validme323id
      const me323Obj = findObjectByKeyAndId(childrenData.data, "3.2.3", validme323id);
      if (!me323Obj) {
        console.error("❌ No se encontró objeto me323 con id:", validme323id);
        return;
      }

      // 2. Preparar payload para la API
      const payload = {
        id: me323Obj.id,
        dni: childrenData.dni,
        maternalfamilypathhistory: me323Obj.maternalfamilypathhistory || "",
        paternalfamilypathhistory: me323Obj.paternalfamilypathhistory || "",
        savedate: me323Obj.savedate, // ya debería estar en formato YYYY-MM-DD
        username: me323Obj.username
      };

      // 3. Hacer fetch
      const resp = await fetch(`${window.config.apiUrl}/updateme323/${me323Obj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();

      if (!result.success) {
        alert("Error al actualizar me323: " + result.message);
      } else {
        alert("Registro me323 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChild323:", err);
      alert("Error inesperado al actualizar me323");
    }
  }

  
  guardarBtn.addEventListener("click", async () => {
    if (form.checkValidity()) {
      const data = {};
      const fm = new FormData(form);
      fm.forEach((v, k) => {
        data[k] = v;
      });

      await guardarME323TochildrenData(data);
      if (updateme323) {
          await updateChild323();
        } else {
        await saveChildme323();
        $(document).trigger("updatetreeevent");
      }
      // marcarCelda();

      alert("Datos guardados correctamente (me323)");
      $('#me323-formModal').modal('hide');
    } else {
      alert("Por favor, complete los campos requeridos.");
    }
  });

  exportFormToPDF("me323-form", "me323-exportPDFBtn", "formulario_me323.pdf");
});
