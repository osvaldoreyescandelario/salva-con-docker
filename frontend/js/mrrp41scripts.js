import {
  childrenData,
  findObjectByKeyAndId,
  insertarNuevoObjEnChildrenData,
  exportFormToPDF,
  normalizeDateForInput
} from "./definitions.js";

let validmrrp41id;
let updatemrrp41 = false;

function clearMRRP41Controls() {
  const modal = document.getElementById("mrrp-formModal");
  const guardarBtn = document.getElementById("mrrp-guardarBtn");

  /* ===============================
     LIMPIAR INPUTS Y TEXTAREAS
  =============================== */
  modal.querySelectorAll("textarea, input").forEach((el) => {
    el.value = "";
    el.classList.remove("is-invalid");
  });

  /* ===============================
     RESETEAR ESTADO DE CAMBIOS
  =============================== */
  if (typeof hasChanges !== "undefined") {
    hasChanges = false;
  }

  guardarBtn.disabled = true;

  /* ===============================
     VOLVER A LA PÁGINA 1
  =============================== */
  document.querySelectorAll(".mrrp-page").forEach((p) => {
    p.classList.add("d-none");
  });

  const firstPage = modal.querySelector('.mrrp-page[data-page="1"]');
  if (firstPage) firstPage.classList.remove("d-none");

  /* ===============================
     RESETEAR PAGINACIÓN
  =============================== */
  document
    .querySelectorAll(".mrrp-pagination .page-item")
    .forEach((li) => li.classList.remove("active"));

  const page1Item = modal.querySelector(
    '.mrrp-pagination .page-item[data-page="1"]'
  );
  if (page1Item) page1Item.classList.add("active");

  document.getElementById("mrrp-prev").classList.add("disabled");
  document.getElementById("mrrp-next").classList.remove("disabled");
}

function populateMRRP41Controls(mrrp41Obj) {
  /* ===============================
     PAGE 1 – PSICO / PSICOPED / PSICOM
  =============================== */
  document.getElementById("mrrp-psico-pot").value =
    mrrp41Obj.psicopotential || "";
  document.getElementById("mrrp-psico-nee").value = mrrp41Obj.psiconeeds || "";
  document.getElementById("mrrp-psico-imp").value =
    mrrp41Obj.psicodiagimpression || "";

  document.getElementById("mrrp-ped-pot").value =
    mrrp41Obj.psicopedpotential || "";
  document.getElementById("mrrp-ped-nee").value = mrrp41Obj.psicopedneeds || "";
  document.getElementById("mrrp-ped-imp").value =
    mrrp41Obj.psicopeddiagimpression || "";

  document.getElementById("mrrp-ci").value =
    mrrp41Obj.intelligencequotient || "";
  document.getElementById("mrrp-cd").value = mrrp41Obj.devquotient || "";
  document.getElementById("mrrp-psico-imp2").value =
    mrrp41Obj.psicomediagimpression || "";

  /* ===============================
     PAGE 3 – LOGOPEDIA
  =============================== */
  document.getElementById("mrrp-logo-diagnostico").value =
    mrrp41Obj.speechtherapydiagnosis || "";
  document.getElementById("mrrp-logo-potencialidades").value =
    mrrp41Obj.potential || "";
  document.getElementById("mrrp-logo-necesidades").value =
    mrrp41Obj.needs || "";
  document.getElementById("mrrp-logo-resultados").value =
    mrrp41Obj.diagnosticresults || "";

  /* ===============================
     PAGE 2 – TABLA PEDAGOGÍA
  =============================== */
  const table = document.querySelector(".mrrp-pedagogia-table tbody");
  if (!table || !Array.isArray(mrrp41Obj.pedagogy)) return;

  const rows = table.querySelectorAll("tr");

  rows.forEach((row) => {
    const gradeCell = row.cells[0];
    const grade = Number.parseInt(gradeCell.textContent, 10);

    const pedagogyRow = mrrp41Obj.pedagogy.find((p) => p.schoolgrade === grade);
    if (!pedagogyRow) return;

    const textareas = row.querySelectorAll("textarea");

    textareas[0].value = pedagogyRow.communication || "";
    textareas[1].value = pedagogyRow.relationship || "";
    textareas[2].value = pedagogyRow.motorskills || "";
    textareas[3].value = pedagogyRow.spanishlanguage || "";
    textareas[4].value = pedagogyRow.math || "";
    textareas[5].value = pedagogyRow.history || "";
  });
}

export async function openMRRP41Modal(id) {
  // 2️⃣ Si cambia el niño → limpiar TODO ANTES
  if (validmrrp41id !== id) {
    clearMRRP41Controls();
  }

  validmrrp41id = id;
  clearMRRP41Controls();

  // 3️⃣ Cargar objeto existente
  const mrrp41Obj = findObjectByKeyAndId(childrenData.data, "4.1", id);
  if (mrrp41Obj) {
    populateMRRP41Controls(mrrp41Obj);
    updatemrrp41 = true;
  } else {
    updatemrrp41 = false;
  }

  $("#mrrp-formModal").modal("show");
}

document.addEventListener("DOMContentLoaded", function () {
  let currentPage = 1;
  const totalPages = 3;
  let hasChanges = false;

  const guardarBtn = document.getElementById("mrrp-guardarBtn");
  const exportPdfBtn = document.getElementById("mrrp-pdfBtn");
  const modal = document.getElementById("mrrp-formModal");

  // Guardar inicia deshabilitado
  guardarBtn.disabled = true;

  /* ===============================
     PAGINACIÓN
  =============================== */
  function showPage(page) {
    document.querySelectorAll(".mrrp-page").forEach((p) => {
      p.classList.add("d-none");
    });

    const pageEl = document.querySelector(`.mrrp-page[data-page="${page}"]`);
    if (pageEl) pageEl.classList.remove("d-none");

    document
      .querySelectorAll(".mrrp-pagination .page-item")
      .forEach((li) => li.classList.remove("active"));

    const activeItem = document.querySelector(
      `.mrrp-pagination .page-item[data-page="${page}"]`
    );
    if (activeItem) activeItem.classList.add("active");

    document
      .getElementById("mrrp-prev")
      .classList.toggle("disabled", page === 1);

    document
      .getElementById("mrrp-next")
      .classList.toggle("disabled", page === totalPages);

    currentPage = page;
  }

  document
    .querySelectorAll(".mrrp-pagination .page-item[data-page]")
    .forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        showPage(Number.parseInt(item.dataset.page));
      });
    });

  document.getElementById("mrrp-prev").addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) showPage(currentPage - 1);
  });

  document.getElementById("mrrp-next").addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) showPage(currentPage + 1);
  });

  /* ===============================
     DETECCIÓN DE CAMBIOS
  =============================== */
  const changeSelectors = `
  #mrrp-form textarea,
  #mrrp-form input,
  #mrrp-form-page3 textarea,
  .mrrp-pedagogia-table textarea
`;

  document.querySelectorAll(changeSelectors).forEach((el) => {
    el.addEventListener("input", () => {
      hasChanges = true;
      guardarBtn.disabled = false;
    });
  });

  function buildMRRP41ObjectFromControls() {
    const today = new Date().toISOString().split("T")[0];

    const nuevoObj = {
      psicopotential: document.getElementById("mrrp-psico-pot").value || "",
      psiconeeds: document.getElementById("mrrp-psico-nee").value || "",
      psicodiagimpression:
        document.getElementById("mrrp-psico-imp").value || "",

      psicopedpotential: document.getElementById("mrrp-ped-pot").value || "",
      psicopedneeds: document.getElementById("mrrp-ped-nee").value || "",
      psicopeddiagimpression:
        document.getElementById("mrrp-ped-imp").value || "",

      intelligencequotient: document.getElementById("mrrp-ci").value || "",
      devquotient: document.getElementById("mrrp-cd").value || "",
      psicomediagimpression:
        document.getElementById("mrrp-psico-imp2").value || "",

      speechtherapydiagnosis:
        document.getElementById("mrrp-logo-diagnostico").value || "",
      potential:
        document.getElementById("mrrp-logo-potencialidades").value || "",
      needs: document.getElementById("mrrp-logo-necesidades").value || "",
      diagnosticresults:
        document.getElementById("mrrp-logo-resultados").value || "",

      pedagogy: [],

      savedate: today,
      username: window.currentUser.userid,
      key: "4.1",
      id: validmrrp41id,
      dni: childrenData.dni
    };

    /* ===============================
      TABLA PEDAGOGÍA (PAGE 2)
    =============================== */
    const rows = document.querySelectorAll(".mrrp-pedagogia-table tbody tr");

    rows.forEach((row) => {
      const schoolgrade = Number.parseInt(row.cells[0].textContent, 10);
      const textareas = row.querySelectorAll("textarea");

      const pedagogyRow = {
        auxmrrp: 0,
        schoolgrade: schoolgrade,
        communication: textareas[0]?.value || "",
        relationship: textareas[1]?.value || "",
        motorskills: textareas[2]?.value || "",
        spanishlanguage: textareas[3]?.value || "",
        math: textareas[4]?.value || "",
        history: textareas[5]?.value || "",
        savedate: today,
        username: window.currentUser.userid
      };

      nuevoObj.pedagogy.push(pedagogyRow);
    });

    return nuevoObj;
  }

  async function updateChildMrrp41(mrrp41Obj) {
    try {
      // 1. Buscar objeto mrrp41
      const mrrp41Obj = findObjectByKeyAndId(
        childrenData.data,
        "4.1",
        validmrrp41id
      );
      if (!mrrp41Obj) {
        console.error("❌ No se encontró objeto mrrp41 con id:", validmrrp41id);
        return;
      }

      // 2. Preparar payload
      const payload = {
        id: mrrp41Obj.id,
        dni: childrenData.dni,

        psicopotential: mrrp41Obj.psicopotential || "",
        psiconeeds: mrrp41Obj.psiconeeds || "",
        psicodiagimpression: mrrp41Obj.psicodiagimpression || "",

        psicopedpotential: mrrp41Obj.psicopedpotential || "",
        psicopedneeds: mrrp41Obj.psicopedneeds || "",
        psicopeddiagimpression: mrrp41Obj.psicopeddiagimpression || "",

        intelligencequotient: mrrp41Obj.intelligencequotient || "",
        devquotient: mrrp41Obj.devquotient || "",
        psicomediagimpression: mrrp41Obj.psicomediagimpression || "",

        speechtherapydiagnosis: mrrp41Obj.speechtherapydiagnosis || "",
        potential: mrrp41Obj.potential || "",
        needs: mrrp41Obj.needs || "",
        diagnosticresults: mrrp41Obj.diagnosticresults || "",

        savedate: mrrp41Obj.savedate,
        username: mrrp41Obj.username,

        // 👇 se envía el arreglo completo
        pedagogy: Array.isArray(mrrp41Obj.pedagogy) ? mrrp41Obj.pedagogy : []
      };

      // 3. Fetch
      const resp = await fetch(
        `${window.config.apiUrl}/updatemrrp41/${mrrp41Obj.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await resp.json();
      console.log("✅ Respuesta API:", result);

      if (!result.success) {
        alert("⚠️ Error al actualizar mrrp4.1: " + result.message);
      } else {
        alert("✅ Registro mrrp4.1 actualizado correctamente");
      }
    } catch (err) {
      console.error("❌ Error en updateChildMrrp41:", err);
      alert("Error inesperado al actualizar mrrp4.1");
    }
  }

  /* ===============================
     GUARDAR (SIN VALIDACIÓN)
  =============================== */
  guardarBtn.addEventListener("click", async function () {
    const nuevoObj = buildMRRP41ObjectFromControls();

    if (updatemrrp41) {
      const existingObj = findObjectByKeyAndId(
        childrenData.data,
        "4.1",
        validmrrp41id
      );

      if (existingObj) {
        Object.assign(existingObj, nuevoObj);
        await updateChildMrrp41(nuevoObj);
      } else
        console.warn("⚠️ No se encontró objeto mrrp41 con id:", validmrrp41id);
    } else {
      insertarNuevoObjEnChildrenData(nuevoObj, "3.3.3");

      await fetch(`${window.config.apiUrl}/savemrrp41`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoObj)
      });

      $(document).trigger("updatetreeevent");
    }

    alert("✅ Datos guardados correctamente.");

    hasChanges = false;
    guardarBtn.disabled = true;

    $("#mrrp-formModal").modal("hide");
  });

  /* ===============================
     CONFIRMAR AL CERRAR
  =============================== */
  $("#mrrp-formModal").on("hide.bs.modal", function (e) {
    if (!hasChanges) return;

    const confirmClose = confirm(
      "Hay cambios sin guardar.\n\n¿Desea cerrar sin guardar?"
    );

    if (!confirmClose) {
      e.preventDefault();
    }
  });

  exportPdfBtn.addEventListener("click", async () => {
    const obj = findObjectByKeyAndId(childrenData.data, "4.1", validmrrp41id);
    if (!obj) {
      alert("No hay datos para exportar.");
      return;
    }

    try {
      const { PDFDocument } = PDFLib;

      /* ======================================================
        1️⃣ Cargar plantilla 411m (PRIMERA HOJA)
      ====================================================== */
      const pdf411Bytes = await fetch("/pdf/411m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const pdf411 = await PDFDocument.load(pdf411Bytes);
      const form411 = pdf411.getForm();

      form411.getTextField("psicopotential").setText(obj.psicopotential || "");
      form411.getTextField("psiconeeds").setText(obj.psiconeeds || "");
      form411
        .getTextField("psicodiagimpression")
        .setText(obj.psicodiagimpression || "");

      form411
        .getTextField("psicopedpotential")
        .setText(obj.psicopedpotential || "");
      form411.getTextField("psicopedneeds").setText(obj.psicopedneeds || "");
      form411
        .getTextField("psicopeddiagimpression")
        .setText(obj.psicopeddiagimpression || "");

      form411
        .getTextField("intelligencequotient")
        .setText(obj.intelligencequotient?.toString() || "");
      form411
        .getTextField("devquotient")
        .setText(obj.devquotient?.toString() || "");
      form411
        .getTextField("psicomediagimpression")
        .setText(obj.psicomediagimpression || "");

      form411.flatten();

      /* ======================================================
        2️⃣ Documento final (LETTER)
      ====================================================== */
      const finalPdf = await PDFDocument.create();

      const [firstPage] = await finalPdf.copyPages(pdf411, [0]);
      finalPdf.addPage(firstPage);

      /* ======================================================
        3️⃣ PÁGINAS INTERMEDIAS – PEDAGOGÍA (412m)
      ====================================================== */
      if (Array.isArray(obj.pedagogy)) {
        for (const ped of obj.pedagogy) {
          const pdf412Bytes = await fetch("/pdf/412m.pdf").then((r) =>
            r.arrayBuffer()
          );
          const pdf412 = await PDFDocument.load(pdf412Bytes);
          const form412 = pdf412.getForm();

          form412
            .getTextField("schoolgrade")
            .setText(ped.schoolgrade?.toString() || "");
          form412
            .getTextField("communication")
            .setText(ped.communication || "");
          form412.getTextField("relationship").setText(ped.relationship || "");
          form412.getTextField("motorskills").setText(ped.motorskills || "");
          form412
            .getTextField("spanishlanguage")
            .setText(ped.spanishlanguage || "");
          form412.getTextField("math").setText(ped.math || "");
          form412.getTextField("history").setText(ped.history || "");

          form412.flatten();

          const [page] = await finalPdf.copyPages(pdf412, [0]);
          finalPdf.addPage(page);
        }
      }

      /* ======================================================
        4️⃣ ÚLTIMA PÁGINA – LOGOPEDIA (413m)
      ====================================================== */
      const pdf413Bytes = await fetch("/pdf/413m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const pdf413 = await PDFDocument.load(pdf413Bytes);
      const form413 = pdf413.getForm();

      form413
        .getTextField("speechtherapydiagnosis")
        .setText(obj.speechtherapydiagnosis || "");
      form413.getTextField("potential").setText(obj.potential || "");
      form413.getTextField("needs").setText(obj.needs || "");
      form413
        .getTextField("diagnosticresults")
        .setText(obj.diagnosticresults || "");

      form413.flatten();

      const [lastPage] = await finalPdf.copyPages(pdf413, [0]);
      finalPdf.addPage(lastPage);

      /* ======================================================
        5️⃣ DESCARGA
      ====================================================== */
      const pdfBytes = await finalPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MRRP_4_1_${obj.dni || obj.id}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Error al exportar MRRP 4.1 a PDF:", err);
      alert("Error al generar el PDF");
    }
  });
});
