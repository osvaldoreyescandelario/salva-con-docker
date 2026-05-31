import {
  childrenData,
  findObjectByKeyAndId,
  insertarNuevoObjEnChildrenData,
  exportFormToPDF
} from "./definitions.js";

let validme322id;
let updateme322 = false;

function cargarFormularioMe322(data) {
  if (!data) {
    console.warn("⚠️ No se recibió data para inicializar formulario ME322");
    return;
  }

  // --- Selects ---
  document.getElementById("me322-validismo").value = data.validism || "";
  document.getElementById("me322-anal").value = data.analsphinctercontrol || "";
  document.getElementById("me322-vesical").value =
    data.bladdersphinctercontrol || "";

  // --- Textareas ---
  document.getElementById("me322-enfermedades").value =
    data.diseasessuffered || "";
  document.getElementById("me322-traumas").value = data.traumasaccidents || "";
  document.getElementById("me322-medicamentos").value = data.medications || "";

  // --- Inputs numéricos ---
  document.getElementById("me322-comunicacion").value = Number(
    data.communication ?? 0
  );
  document.getElementById("me322-autocuidado").value = Number(
    data.selfcare ?? 0
  );
  document.getElementById("me322-hogar").value = Number(data.homelife ?? 0);
  document.getElementById("me322-sociales").value = Number(
    data.socialskills ?? 0
  );

  document.getElementById("me322-comunidad").value = Number(
    data.communityuse ?? 0
  );
  document.getElementById("me322-autodireccion").value = Number(
    data.selfdirection ?? 0
  );
  document.getElementById("me322-salud").value = Number(data.health ?? 0);
  document.getElementById("me322-tiempo").value = Number(data.leisure ?? 0);

  // --- Puntuación total ---
  const total =
    Number(data.communication ?? 0) +
    Number(data.selfcare ?? 0) +
    Number(data.homelife ?? 0) +
    Number(data.socialskills ?? 0) +
    Number(data.communityuse ?? 0) +
    Number(data.selfdirection ?? 0) +
    Number(data.health ?? 0) +
    Number(data.leisure ?? 0);

  const totalInput = document.getElementById("me322-puntuacionTotal");
  if (totalInput) {
    totalInput.value = total;
    totalInput.disabled = true;
  }
}

function inicializarME322Form(id) {
  const form = document.getElementById("me322-form");
  if (!form) return;
  const me322Obj = findObjectByKeyAndId(childrenData.data, "3.2.2", id);

  validme322id = id;

  if (!me322Obj) {
    updateme322 = false;
    // ==== Limpiar selects ====
    form.querySelectorAll("select").forEach((select) => {
      select.selectedIndex = 0; // "Seleccione..."
      select.disabled = false;
    });

    // ==== Limpiar textareas ====
    form.querySelectorAll("textarea").forEach((textarea) => {
      textarea.value = "";
      textarea.disabled = false;
    });

    // ==== Limpiar inputs numéricos ====
    form.querySelectorAll('input[type="number"]').forEach((input) => {
      if (input.id === "me322-puntuacionTotal") {
        input.value = 0; // puntuación total
        input.disabled = true; // siempre deshabilitado
      } else {
        input.value = 0;
        input.disabled = false;
      }
    });
  } else {
    updateme322 = true;
    cargarFormularioMe322(me322Obj);
  }
}

export function openME322Modal(id) {
  inicializarME322Form(id);

  $("#me322-formModal").modal("show");
}
// ===========================================
// Lógica del formulario 3.2.2
// Prefijo: me322-
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("me322-form");
  const totalInput = document.getElementById("me322-puntuacionTotal");
  const numericInputs = document.querySelectorAll(".me322-input");

  // Calcular puntuación total
  function calcularTotal() {
    let total = 0;
    numericInputs.forEach((input) => {
      total += Number.parseInt(input.value) || 0;
    });
    totalInput.value = total;
  }

  numericInputs.forEach((input) => {
    input.addEventListener("input", calcularTotal);
  });

  async function guardarME322TochildrenData(data) {
    const nuevoObj = {
      id: validme322id,
      dni: childrenData.dni,

      // controles tipo select / text
      validism: data.validismo || "",
      analsphinctercontrol: data.anal || "",
      bladdersphinctercontrol: data.vesical || "",

      // textos
      diseasessuffered: data.enfermedades || "",
      traumasaccidents: data.traumas || "",
      medications: data.medicamentos || "",

      // números — cuidado con nombres; usamos Number(...) y fallback 0
      communication: Number(data.comunicacion ?? 0),
      selfcare: Number(data.autocuidado ?? 0),
      homelife: Number(data.hogar ?? 0),
      socialskills: Number(data.sociales ?? 0),
      communityuse: Number(data.comunidad ?? 0),
      selfdirection: Number(data.autodireccion ?? 0),
      health: Number(data.salud ?? 0),
      leisure: Number(data.tiempo ?? 0),

      savedate: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      username: window.currentUser.userid,
      key: "3.2.2"
    };

    if (updateme322) {
      // Actualizar entrada existente
      const existingObj = findObjectByKeyAndId(
        childrenData.data,
        "3.2.2",
        validme322id
      );
      if (existingObj) {
        Object.assign(existingObj, nuevoObj);
      } else {
        console.warn("⚠️ No se encontró objeto me322 con id:", validme322id);
      }
    } else {
      // Insertar nueva entrada
      insertarNuevoObjEnChildrenData(nuevoObj, "3.2.1");
    }
  }

  // Ruta # 26: Salva los datos del formulario me322.
  async function saveChildme322() {
    // Buscar el objeto en childrenData.me322
    const registro = findObjectByKeyAndId(
      childrenData.data,
      "3.2.2",
      validme322id
    );
    if (!registro) {
      console.error("No se encontró un registro con id =", validme322id);
      return;
    }

    try {
      const response = await fetch(`${window.config.apiUrl}/saveme322`, {
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
      console.error("❌ Error en salvarME322:", error);
    }
  }

  // Ruta # 27: Actualiza los datos modulo me 3.2.2.
  async function updateChild322() {
    try {
      // 1. Buscar el objeto me322 cuyo id = validme322id
      const me322Obj = findObjectByKeyAndId(
        childrenData.data,
        "3.2.2",
        validme322id
      );
      if (!me322Obj) {
        console.error("❌ No se encontró objeto me322 con id:", validme322id);
        return;
      }

      // 2. Preparar payload para la API
      const payload = {
        id: me322Obj.id,
        dni: childrenData.dni,
        validism: me322Obj.validism,
        analsphinctercontrol: me322Obj.analsphinctercontrol,
        bladdersphinctercontrol: me322Obj.bladdersphinctercontrol,
        diseasessuffered: me322Obj.diseasessuffered,
        traumasaccidents: me322Obj.traumasaccidents,
        medications: me322Obj.medications,
        communication: Number(me322Obj.communication ?? 0),
        selfcare: Number(me322Obj.selfcare ?? 0),
        homelife: Number(me322Obj.homelife ?? 0),
        socialskills: Number(me322Obj.socialskills ?? 0),
        communityuse: Number(me322Obj.communityuse ?? 0),
        selfdirection: Number(me322Obj.selfdirection ?? 0),
        health: Number(me322Obj.health ?? 0),
        leisure: Number(me322Obj.leisure ?? 0),
        savedate: me322Obj.savedate, // ya debería estar en formato YYYY-MM-DD
        username: me322Obj.username
      };

      // 3. Hacer fetch
      const resp = await fetch(
        `${window.config.apiUrl}/updateme322/${me322Obj.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await resp.json();

      if (!result.success) {
        alert("Error al actualizar me322: " + result.message);
      } else {
        alert("Registro me322 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChild322:", err);
      alert("Error inesperado al actualizar me322");
    }
  }

  // Guardar
  document
    .getElementById("me322-guardarBtn")
    .addEventListener("click", async () => {
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        return;
      }

      const data = {};
      const fm = new FormData(form);
      fm.forEach((v, k) => {
        data[k] = v;
      });

      // const data = {
      //   validismo: document.getElementById("me322-validismo").value,
      //   anal: document.getElementById("me322-anal").value,
      //   vesical: document.getElementById("me322-vesical").value,
      //   enfermedades: document.getElementById("me322-enfermedades").value,
      //   traumas: document.getElementById("me322-traumas").value,
      //   medicamentos: document.getElementById("me322-medicamentos").value,
      //   comunicacion: document.getElementById("me322-comunicacion").value,
      //   autocuidado: document.getElementById("me322-autocuidado").value,
      //   hogar: document.getElementById("me322-hogar").value,
      //   sociales: document.getElementById("me322-sociales").value,
      //   comunidad: document.getElementById("me322-comunidad").value,
      //   autodireccion: document.getElementById("me322-autodireccion").value,
      //   salud: document.getElementById("me322-salud").value,
      //   tiempo: document.getElementById("me322-tiempo").value,
      //   puntuacionTotal: totalInput.value
      // };

      await guardarME322TochildrenData(data);
      if (updateme322) {
        await updateChild322();
      } else {
        await saveChildme322();
        $(document).trigger("updatetreeevent");
      }

      $("#me322-formModal").modal("hide");
      form.classList.remove("was-validated");
    });

  // Inicializar total en 0
  calcularTotal();

  exportFormToPDF("me322-form", "me322-exportPDFBtn", "formulario_me322.pdf");
});
