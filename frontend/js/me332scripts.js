import { childrenData, findObjectByKeyAndId, insertarNuevoObjEnChildrenData, exportFormToPDF } from './definitions.js';


let validme332id;
let updateme332 = false;

function cargarFormularioMe332(data) {
  if (!data) {
    console.warn("⚠️ No se recibió data para inicializar formulario ME332");
    return;
  }


  // === Inputs numéricos ===
  document.getElementById("me332-sala").value = data.livingrooms ?? 0;
  document.getElementById("me332-cuartos").value = data.bedrooms ?? 0;
  document.getElementById("me332-cocina").value = data.kitchen ?? 0;
  document.getElementById("me332-bano").value = data.bathrooms ?? 0;

  // === Selects ===
  document.getElementById("me332-condiciones").value = data.constconditions || "";
  document.getElementById("me332-economica").value = data.economicsituation || "";
}

function inicializarME332Form(id) {
  const form = document.getElementById("me332-form");
  if (!form) return;
  const me332Obj = findObjectByKeyAndId(childrenData.data, "3.3.2", id);

  validme332id = id;

  if (!me332Obj) {
    updateme332 = false;
    // ==== Limpiar controles ====
    form.reset(); 
  } else {
    updateme332 = true;
    cargarFormularioMe332(me332Obj);
  }
}

export function openME332Modal(id) {
  inicializarME332Form(id); 

  $('#me332-formModal').modal('show');
}
// ===========================================
// Lógica del formulario 3.3.2
// Prefijo: me332-
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("me332-form");

  async function guardarME332TochildrenData(formData) {
    const nuevoObj = {
      id: validme332id,               
      dni: childrenData.dni,          
      livingrooms: Number(formData.sala ?? 0),
      bedrooms: Number(formData.cuartos ?? 0),
      kitchen: Number(formData.cocina ?? 0),
      bathrooms: Number(formData.bano ?? 0),
      constconditions: formData.condiciones || "",
      economicsituation: formData.economica || "",
      savedate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD (fecha actual)
      username: window.currentUser.userid,
      key: "3.3.2"
    };


    if (updateme332) {
        // Actualizar entrada existente
      const existingObj = findObjectByKeyAndId(childrenData.data, "3.3.2", validme332id);
        if (existingObj) {
            Object.assign(existingObj, nuevoObj);
        } else {
            console.warn("⚠️ No se encontró objeto me332 con id:", validme332id);
        }
    } else {
        // Insertar nueva entrada
        insertarNuevoObjEnChildrenData(nuevoObj, "3.3.1");
    }
  }

  
  // Ruta # 32: Salva los datos del formulario me332.
  async function saveChildme332() {
    const registro = findObjectByKeyAndId(childrenData.data, "3.3.2", validme332id);
    
    if (!registro) {
      console.error("❌ No se encontró un registro en childrenData.me332");
      return;
    }

    try {
      const response = await fetch(`${window.config.apiUrl}/saveme332`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registro)
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Datos guardados correctamente en la BD (me332):", result);
      } else {
        console.error("⚠️ Error al guardar en me332:", result.message);
      }
    } catch (error) {
      console.error("❌ Error en saveChildme332:", error);
    }
  }

  // Ruta # 33: Actualiza los datos modulo me 3.3.2.
  async function updateChild332() {
    try {
      // 1. Buscar el objeto me332 cuyo id = validme332id
      const me332Obj = findObjectByKeyAndId(childrenData.data, "3.3.2", validme332id);
      if (!me332Obj) {
        console.error("❌ No se encontró objeto me332 con id:", validme332id);
        return;
      }

      // 2. Preparar payload para la API
      const payload = {
        id: me332Obj.id,
        dni: childrenData.dni,
        livingrooms: Number(me332Obj.livingrooms ?? 0),
        bedrooms: Number(me332Obj.bedrooms ?? 0),
        kitchen: Number(me332Obj.kitchen ?? 0),
        bathrooms: Number(me332Obj.bathrooms ?? 0),
        constconditions: me332Obj.constconditions || "",
        economicsituation: me332Obj.economicsituation || "",
        savedate: me332Obj.savedate, // ya debería estar en formato YYYY-MM-DD
        username: me332Obj.username
      };

      // 3. Hacer fetch
      const resp = await fetch(`${window.config.apiUrl}/updateme332/${me332Obj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();

      if (!result.success) {
        alert("⚠️ Error al actualizar me332: " + result.message);
      } else {
        alert("✅ Registro me332 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChild332:", err);
      alert("Error inesperado al actualizar me332");
    }
  }

  
  document.getElementById("me332-guardarBtn").addEventListener("click", async () => {
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    const formData = {
      sala: document.getElementById("me332-sala").value,
      cuartos: document.getElementById("me332-cuartos").value,
      cocina: document.getElementById("me332-cocina").value,
      bano: document.getElementById("me332-bano").value,
      condiciones: document.getElementById("me332-condiciones").value,
      economica: document.getElementById("me332-economica").value,
    };

    await guardarME332TochildrenData(formData);
    if (updateme332) {
        await updateChild332();
    } else {
      await saveChildme332();
      $(document).trigger("updatetreeevent");
    }

    $("#me332-formModal").modal("hide");
    form.classList.remove("was-validated");
  });

  exportFormToPDF("me332-form", "me332-exportPDFBtn", "formulario_me332.pdf");
});
