import { childrenData, findObjectByKeyAndId, insertarNuevoObjEnChildrenData, exportFormToPDF } from './definitions.js';

let validme333id;
let updateme333 = false;

function cargarFormularioMe333(data) {
  if (!data) {
    console.warn("⚠️ No se recibió data para inicializar formulario ME333");
    return;
  }

  document.getElementById("me333-nivelDesarrollo").value = data.f11 || "";
  document.getElementById("me333-nivelParticularidades").value = data.f12 || "";
  document.getElementById("me333-voluntad").value = data.f21 || "";
  document.getElementById("me333-roles").value = data.f22 || "";
  document.getElementById("me333-comunicacionFamilia").value = data.f31 || "";
  document.getElementById("me333-comunicacionHijos").value = data.f32 || "";
  document.getElementById("me333-limites").value = data.f41 || "";
  document.getElementById("me333-metodos").value = data.f42 || "";
  document.getElementById("me333-orientaciones").value = data.f51 || "";
  document.getElementById("me333-habilidades").value = data.f52 || "";
}

function inicializarME333Form(id) {
  const form = document.getElementById("me333-form");
  if (!form) return;
  const me333Obj = findObjectByKeyAndId(childrenData.data, "3.3.3", id);

  validme333id = id;

  if (!me333Obj) {
    updateme333 = false;
    // ==== Limpiar controles ====
    form.reset(); 
  } else {
    updateme333 = true;
    cargarFormularioMe333(me333Obj);
  }
}

export function openME333Modal(id) {
  inicializarME333Form(id); 

  $('#me333-formModal').modal('show');
}
// ===========================================
// Lógica del formulario me333
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("me333-form");
  const guardarBtn = document.getElementById("me333-guardarBtn");

  async function guardarME333TochildrenData(formData) {
    const nuevoObj = {
      id: validme333id,               
      dni: childrenData.dni,      
      f11: formData.nivelDesarrollo || "",
      f12: formData.nivelParticularidades || "",
      f21: formData.voluntad || "",
      f22: formData.roles || "",
      f31: formData.comunicacionFamilia || "",
      f32: formData.comunicacionHijos || "",
      f41: formData.limites || "",
      f42: formData.metodos || "",
      f51: formData.orientaciones || "",
      f52: formData.habilidades || "",
      savedate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD (fecha actual)
      username: window.currentUser.userid,
      key: "3.3.3"
    };

    if (updateme333) {
        // Actualizar entrada existente
      const existingObj = findObjectByKeyAndId(childrenData.data, "3.3.3", validme333id);
        if (existingObj) {
            Object.assign(existingObj, nuevoObj);
        } else {
            console.warn("⚠️ No se encontró objeto me333 con id:", validme333id);
        }
    } else {
        // Insertar nueva entrada
        insertarNuevoObjEnChildrenData(nuevoObj, "3.3.2");
    }
  }

  // Ruta # 34: Salva los datos del formulario me333.
  async function saveChildme333() {
    // Buscar el objeto en childrenData.me333
    // const registro = childrenData.me333;
    const registro = findObjectByKeyAndId(childrenData.data, "3.3.3", validme333id);

    if (!registro) {
      console.error("❌ No se encontró un registro en childrenData.me333");
      return;
    }

    try {
      const response = await fetch(`${window.config.apiUrl}/saveme333`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        // si childrenData.me333 es array, mandamos el primer objeto
        body: JSON.stringify(Array.isArray(registro) ? registro : registro)
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Datos guardados correctamente en la BD (me333):", result);
      } else {
        console.error("⚠️ Error al guardar en me333:", result.message);
      }
    } catch (error) {
      console.error("❌ Error en saveChildme333:", error);
    }
  }

  // Ruta # 35: Actualiza los datos modulo me 3.3.3.
  async function updateChild333() {
    try {
        // 1. Buscar el objeto me333 cuyo id = validme333id
        const me333Obj = findObjectByKeyAndId(childrenData.data, "3.3.3", validme333id);
        if (!me333Obj) {
          console.error("❌ No se encontró objeto me333 con id:", validme333id);
          return;
      }

      // 2. Preparar payload para la API
      const payload = {
        id: me333Obj.id,
        dni: childrenData.dni,
        f11: me333Obj.f11 || "",
        f12: me333Obj.f12 || "",
        f21: me333Obj.f21 || "",
        f22: me333Obj.f22 || "",
        f31: me333Obj.f31 || "",
        f32: me333Obj.f32 || "",
        f41: me333Obj.f41 || "",
        f42: me333Obj.f42 || "",
        f51: me333Obj.f51 || "",
        f52: me333Obj.f52 || "",
        savedate: me333Obj.savedate, // ya debería estar en formato YYYY-MM-DD
        username: me333Obj.username
      };

      // 3. Hacer fetch
      const resp = await fetch(`${window.config.apiUrl}/updateme333/${me333Obj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();
      console.log("✅ Respuesta API:", result);

      if (!result.success) {
        alert("⚠️ Error al actualizar me333: " + result.message);
      } else {
        alert("✅ Registro me333 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChild333:", err);
      alert("Error inesperado al actualizar me333");
    }
  }

  guardarBtn.addEventListener("click", async () => {
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const formData = {
      nivelDesarrollo: document.getElementById("me333-nivelDesarrollo").value,
      nivelParticularidades: document.getElementById("me333-nivelParticularidades").value,
      voluntad: document.getElementById("me333-voluntad").value,
      roles: document.getElementById("me333-roles").value,
      comunicacionFamilia: document.getElementById("me333-comunicacionFamilia").value,
      comunicacionHijos: document.getElementById("me333-comunicacionHijos").value,
      limites: document.getElementById("me333-limites").value,
      metodos: document.getElementById("me333-metodos").value,
      orientaciones: document.getElementById("me333-orientaciones").value,
      habilidades: document.getElementById("me333-habilidades").value,
    };

    await guardarME333TochildrenData(formData);
    if (updateme333) {
        await updateChild333();
      } else {
      await saveChildme333();
      $(document).trigger("updatetreeevent");
    }

    $("#me333-formModal").modal("hide");
    form.classList.remove("was-validated");
  });

  exportFormToPDF("me333-form", "me333-exportPDFBtn", "formulario_me333.pdf");
});
