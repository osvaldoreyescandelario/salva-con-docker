import { childrenData, findObjectByKeyAndId, insertarNuevoObjEnChildrenData, exportFormToPDF, normalizeDateForInput} from './definitions.js';

let validmrrp42id;
let updatemrrp42 = false;
let hasChangesMRRP42 = false; // ⚡ nueva variable para cambios

function clearMRRP42Controls() {

  const modal = document.getElementById("mrrp42-formModal");
  const guardarBtn = document.getElementById("mrrp42-guardarBtn");

  if (!modal) return;

  /* ===============================
     LIMPIAR INPUTS, SELECTS
  =============================== */
  modal.querySelectorAll("input, textarea, select").forEach(el => {

    if (el.tagName === "SELECT") {
      el.selectedIndex = 0; // vuelve a "Seleccione"
    } else {
      el.value = "";
    }

    el.classList.remove("is-invalid");
    el.classList.remove("is-valid");
  });

  /* ===============================
     OCULTAR CAMPOS CONDICIONALES
  =============================== */
  const centroWrapper = document.getElementById("mrrp42-centro-wrapper");
  if (centroWrapper) {
    centroWrapper.classList.add("d-none");
  }

  /* ===============================
     RESETEAR ESTADO DE CAMBIOS
  =============================== */
  hasChangesMRRP42 = false;

  /* ===============================
     DESHABILITAR BOTÓN GUARDAR
  =============================== */
  if (guardarBtn) {
    guardarBtn.disabled = true;
  }
}

function populateMRRP42Controls(mrrp42Obj) {

  if (!mrrp42Obj) return;

  const modal = document.getElementById("mrrp42-formModal");
  const guardarBtn = document.getElementById("mrrp42-guardarBtn");

  if (!modal) return;

  document.getElementById("mrrp42-expediente").value =
    mrrp42Obj.filenumber ?? "";

  document.getElementById("mrrp42-modalidad").value =
    mrrp42Obj.caremodality ?? "";

  document.getElementById("mrrp42-institucion").value =
    mrrp42Obj.educationalinstitution ?? "";

  document.getElementById("mrrp42-transito").value =
    mrrp42Obj.transit ?? "";

  document.getElementById("mrrp42-egreso").value =
    mrrp42Obj.egress ?? "";

  document.getElementById("mrrp42-vinculo").value =
    mrrp42Obj.bond ?? "";

  const centroWrapper = document.getElementById("mrrp42-centro-wrapper");
  const centroInput   = document.getElementById("mrrp42-centro");

  if (mrrp42Obj.employercenter && mrrp42Obj.bond === "sociolaboral") {
    centroWrapper.classList.remove("d-none");
    centroInput.value = mrrp42Obj.employercenter;
    centroInput.disabled = false;
  } else {
    centroWrapper.classList.add("d-none");
    centroInput.value = "";
    centroInput.disabled = true;
  }

  hasChangesMRRP42 = false;

  if (guardarBtn) {
    guardarBtn.disabled = true;
  }
}

async function fetchMRRP42(id) {
  try {
    const response = await fetch(`${window.config.apiUrl}/getmrrp42/${id}`);
    const result = await response.json();

    if (!result.success) {
      console.warn("⚠️ No se pudo obtener MRRP42:", result.message);
      return;
    }

    const data = result.data;

    const mrrp42Obj = {
      id: data.id,
      dni: data.dni,
      filenumber: data.filenumber,
      caremodality: data.caremodality,
      educationalinstitution: data.educationalinstitution,
      transit: data.transit,
      egress: data.egress,
      bond: data.bond,
      employercenter: data.employercenter,
      savedate: data.savedate ? new Date(data.savedate) : null,
      username: data.username,
      key: "4.2"
    };

    const cdata = childrenData.data;
    let added = false;

    for (let i = 0; i < cdata.length; i++) {
      if (cdata[i].some(obj => obj.id === mrrp42Obj.id && obj.key === "4.2")) {
        cdata[i].push(mrrp42Obj);
        added = true;
        break;
      }
    }

    if (!added && Array.isArray(cdata[0])) {
      cdata[0].push(mrrp42Obj);
    }

  } catch (err) {
    console.error("❌ Error al hacer fetch de MRRP42:", err);
  }
}

export async function openMRRP42Modal(id) {
  if (validmrrp42id !== id) {
    clearMRRP42Controls();
  }
  
  validmrrp42id = id;
  clearMRRP42Controls();

  const mrrp42Obj = findObjectByKeyAndId(childrenData.data, "4.2", id);
  if (mrrp42Obj) {
    populateMRRP42Controls(mrrp42Obj);
    updatemrrp42 = true;
  } else {
    updatemrrp42 = false;
  }

  $("#mrrp42-formModal").modal("show");
}

document.addEventListener("DOMContentLoaded", () => {

  const transitoSelect = document.getElementById("mrrp42-transito");
  const egresoSelect = document.getElementById("mrrp42-egreso");
  const vinculoSelect = document.getElementById("mrrp42-vinculo");
  const centroWrapper = document.getElementById("mrrp42-centro-wrapper");
  const centroInput = document.getElementById("mrrp42-centro");

  const guardarBtn = document.getElementById("mrrp42-guardarBtn");
  const exportPdfBtn = document.getElementById("mrrp42-exportPdfBtn");
  const modal = $("#mrrp42-formModal");

  for (let year = 2000; year <= 2021; year++) {
    const label = `${year} – ${year + 1}`;
    const opt1 = new Option(label, label);
    const opt2 = new Option(label, label);
    transitoSelect.add(opt1);
    egresoSelect.add(opt2);
  }

  vinculoSelect.addEventListener("change", () => {
    if (vinculoSelect.value === "sociolaboral") {
      centroWrapper.classList.remove("d-none");
      centroInput.disabled = false;
    } else {
      centroWrapper.classList.add("d-none");
      centroInput.value = "";
      centroInput.disabled = true;
    }
  });

  const controls = document.querySelectorAll("#mrrp42-formModal input, #mrrp42-formModal select, #mrrp42-formModal textarea");
  controls.forEach(control => {
    control.addEventListener("input", () => {
      hasChangesMRRP42 = true;
      guardarBtn.disabled = false;
    });
    control.addEventListener("change", () => {
      hasChangesMRRP42 = true;
      guardarBtn.disabled = false;
    });
  });

  function getSelectedText(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel || sel.selectedIndex < 0) return "";
    return sel.options[sel.selectedIndex].text;
  }

  function buildMRRP42ObjectFromControls() {
    const today = new Date().toISOString().split("T")[0];
    const vinculo = document.getElementById("mrrp42-vinculo").value || "";

    return {
      filenumber: document.getElementById("mrrp42-expediente").value || 0,
      caremodality: document.getElementById("mrrp42-modalidad").value || "",
      educationalinstitution: getSelectedText("mrrp42-institucion"),
      transit: document.getElementById("mrrp42-transito").value || "",
      egress: document.getElementById("mrrp42-egreso").value || "",
      bond: vinculo,
      employercenter:
        vinculo === "sociolaboral"
          ? document.getElementById("mrrp42-centro").value || ""
          : "",
      savedate: today,
      username: window.currentUser.userid,
      key: "4.2",
      id: validmrrp42id,
      dni: childrenData.dni
    };
  }

  async function updateChildMrrp42() {
    try {
      const mrrp42Obj = findObjectByKeyAndId(childrenData.data, "4.2", validmrrp42id);

      if (!mrrp42Obj) {
        console.error("❌ No se encontró objeto mrrp42 con id:", validmrrp42id);
        return;
      }

      const payload = {
        id: mrrp42Obj.id,
        dni: childrenData.dni,
        filenumber: mrrp42Obj.filenumber || 0,
        caremodality: mrrp42Obj.caremodality || "",
        educationalinstitution: mrrp42Obj.educationalinstitution || "",
        transit: mrrp42Obj.transit || "",
        egress: mrrp42Obj.egress || "",
        bond: mrrp42Obj.bond || "",
        employercenter:
          mrrp42Obj.bond === "sociolaboral"
            ? mrrp42Obj.employercenter || ""
            : "",
        savedate: mrrp42Obj.savedate,
        username: mrrp42Obj.username
      };

      const resp = await fetch(`${window.config.apiUrl}/updatemrrp42/${mrrp42Obj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();
      console.log("✅ Respuesta API:", result);

      if (!result.success) {
        alert("⚠️ Error al actualizar mrrp4.2: " + result.message);
      } else {
        alert("✅ Registro mrrp4.2 actualizado correctamente");
      }

    } catch (err) {
      console.error("❌ Error en updateChildMrrp42:", err);
      alert("Error inesperado al actualizar mrrp4.2");
    }
  }

  guardarBtn.addEventListener("click", async function () {
    const nuevoObj = buildMRRP42ObjectFromControls();

    // 🔹 Validaciones
    if (nuevoObj.filenumber.toString().length > 8) {
      alert("⚠️ El campo Expediente no puede tener más de 8 dígitos.");
      return;
    }
    const requiredFields = ["filenumber", "caremodality", "educationalinstitution", "transit", "egress", "bond"];
    for (const field of requiredFields) {
      if (!nuevoObj[field] || nuevoObj[field].toString().trim() === "") {
        alert("⚠️ Todos los campos son obligatorios excepto Centro.");
        return;
      }
    }

    if(updatemrrp42){
      const existingObj = findObjectByKeyAndId(childrenData.data, "4.2", validmrrp42id);
      if (existingObj) {
        Object.assign(existingObj, nuevoObj);
        await updateChildMrrp42(nuevoObj);
      } else console.warn("⚠️ No se encontró objeto mrrp42 con id:", validmrrp42id);
    } else {
      insertarNuevoObjEnChildrenData(nuevoObj, "4.1");
      await fetch(`${window.config.apiUrl}/savemrrp42`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoObj)
      });
      $(document).trigger("updatetreeevent");
    }

    alert("✅ Datos guardados correctamente.");
    hasChangesMRRP42 = false;
    guardarBtn.disabled = true;
    $("#mrrp42-formModal").modal("hide");
  });

  // 🔹 Confirmar cierre si hay cambios
  modal.on("hide.bs.modal", function (e) {
    if (hasChangesMRRP42) {
      const confirmClose = confirm("⚠️ Hay cambios sin guardar. Si cierra perderá los datos ingresados. ¿Desea continuar?");
      if (!confirmClose) {
        e.preventDefault();
      }
    }
  });

  exportPdfBtn.addEventListener('click', async () => {
    const obj = findObjectByKeyAndId(childrenData.data, "4.2", validmrrp42id);
    if (!obj) {
      alert("No hay datos para exportar.");
      return;
    }

    try {
      const { PDFDocument } = PDFLib;

      /* ======================================================
        1️⃣ Cargar plantilla 42m
      ====================================================== */
      const pdf42Bytes = await fetch("/pdf/42m.pdf").then(r => r.arrayBuffer());
      const pdf42 = await PDFDocument.load(pdf42Bytes);
      const form42 = pdf42.getForm();

      /* ======================================================
        2️⃣ Asignar campos
      ====================================================== */
      form42.getTextField("filenumber")
        .setText(obj.filenumber?.toString() || "");

      form42.getTextField("caremodality")
        .setText(obj.caremodality || "");

      form42.getTextField("educationalinstitution")
        .setText(obj.educationalinstitution || "");

      form42.getTextField("transit")
        .setText(obj.transit || "");

      form42.getTextField("egress")
        .setText(obj.egress || "");

      form42.getTextField("bond")
        .setText(obj.bond || "");

      form42.getTextField("employercenter")
        .setText(obj.employercenter || "");

      form42.flatten();

      /* ======================================================
        3️⃣ Documento final
      ====================================================== */
      const finalPdf = await PDFDocument.create();
      const [page] = await finalPdf.copyPages(pdf42, [0]);
      finalPdf.addPage(page);

      /* ======================================================
        4️⃣ Descarga
      ====================================================== */
      const pdfBytes = await finalPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MRRP_4_2_${obj.dni || obj.id}.pdf`;
      a.click();

      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("❌ Error al exportar MRRP 4.2 a PDF:", err);
      alert("Error al generar el PDF");
    }
  });

});
