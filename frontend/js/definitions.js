window.currentUser = null;

// 👈 SOLO funciones globales (SIN userLogin ni manipulación DOM)
window.puede = function (permiso) {
  return window.currentUser?.permissions?.includes(permiso) || false;
};

window.tieneRol = function (rol) {
  return window.currentUser?.rols?.includes(rol) || false;
};

// 👈 Restaurar currentUser (SIN tocar DOM)
const savedUser = localStorage.getItem("currentUser");
if (savedUser) {
  window.currentUser = JSON.parse(savedUser);
}

// window.config = {
//   apiUrl: "http://localhost:4000/api"
// };

// window.config = {
//     apiUrl: 'https://190.92.115.132/saidicdo/api' // OBSOLETO
// }

window.config = {
  apiUrl: "/api" // VALIDO
};

export let childrenData = {
  dni: "",
  fullname: "",
  birthdate: "",
  sex: "",
  skincolor: "",
  photo: null,
  savedate: new Date(),
  username: "",
  data: [
    [], // data[0] para el primer grupo de objetos (ejemplo: mgivar y demás)
    [] // data[1] para otro grupo similar
  ]
};

export function initChildrenData() {
  childrenData = {
    dni: "",
    fullname: "",
    birthdate: "",
    sex: "",
    skincolor: "",
    photo: null,
    data: [
      [], // data[0] vacío
      [] // data[1] vacío
    ]

    // Data[0] contendrá los objetos mgivar, 3.1.1,3.2.1,3.2.2,3.2.3,3.3.1,3.3.2,3.3.3,
    //                                       3.4.1.1, 3.4.1.2, 3.4.1.3, 3.4.1.4, 3.4.1.5,
    //                                       3.4.1.6, 3.4.1.7, 3.4.1.8, 3.4.1.9, 3.4.1.10,
    //                                        3.4.1.11, 3.4.1.12, 3.4.1.13, 3.4.1.14, 3.4.1.15,
    //                                         3.4.1.16, 3.4.1.17, 3.4.1.18, 3.4.1.19, 3.4.1.20,
    //                                         3.4.1.21, 3.4.1.22, 3.4.1.23, 3.4.1.24, 3.4.1.25,
    //                                         3.4.1.26, 3.4.1.27, 3.4.2.1, 3.4.2.2, 3.4.2.3,
    //                                         3.4.2.4, 3.4.2.5, 3.4.2.6.1, 3.4.2.6.2, 3.4.2.6.3,
    //                                         3.4.2.6.4, 3.4.2.6.5, 3.4.3.1, 3.4.3.2, 3.4.3.3,
    //                                         3.4.3.4, 3.4.3.5, 3.4.3.6, 3.4.3.7, 3.4.3.8, 3.4.3.9,
    //                                         3.4.3.10, 3.4.3.11, 3.4.3.12, 3.4.3.13, 3.4.3.14,
    //                                         3.4.3.15, 3.4.3.16, 3.4.3.17, 3.4.3.18, 3.4.3.19,
    //                                         3.4.3.20, 3.4.4.1, 3.4.4.2, 3.4.4.3, 4.1, 4.2, 4.3, 4.4
  };
}

export function clearChildrenData() {
  if (!childrenData || !Array.isArray(childrenData.data)) return;

  childrenData.data = childrenData.data.filter((arr) => {
    // si arr NO es un arreglo, lo mantiene
    if (!Array.isArray(arr)) return true;

    // ¿Existe un objeto con key="2.1" y id == 0?
    const tieneInvalido = arr.some(
      (item) => item.key === "2.1" && item.id === 0
    );

    // si lo tiene → eliminar arr
    return !tieneInvalido;
  });
}

export const roles = [
  "tutor",
  "teacher",
  "user",
  "superv",
  "admin",
  "superadmin",
  "userextra"
];
// *************************DEFINICION DE LOS OBJETOS ******************************************
export let mgivar = {
  cage: 0,
  mage: 0,
  address: "",
  province: "",
  municipality: "",
  councill: "",
  zone: "Rural",
  personincharge: "",
  parentalrelationship: "Otro",
  anotherrelation: "",
  tel: "",
  startdate: "",
  degree: 0,
  eduinstitution: "Institucional",
  institution: "",
  repetition: 0,
  repetitioncount: "",
  objovercome: 0,
  savedate: new Date(),
  username: ""
};

export let me3_1_1 = {
  reason: "",
  anotherrreason: "",
  carepathway: "",
  concept: "",
  preschooldiagresults: "",
  articulationstageresults: "",
  startdate: new Date(),
  directtreatment: "",
  canceldate: new Date(),
  reasoncancel: "",
  transfer: "",
  transferwhere: "",
  teachertraining: "",
  experience: "",
  savedate: new Date(),
  username: ""
};

export let me3_2_1 = {
  pregnancy: "",
  gesnumber: 0,
  abortions: 0,
  abortionstypes: "",
  abortionsquantity: 0,
  toxichabits: 0,
  toxichabitstypes: "",
  motherfetusbloodcomp: 0,
  motherfatherconsanguinity: 0,
  illnessespregnancy: 0,
  illnesses: "",
  childbirthtypes: "",
  complications: "",
  breastfeedinguntil: "",
  savedate: new Date(),
  username: ""
};

export let me3_2_2 = {
  validism: "",
  analsphinctercontrol: "",
  bladdersphinctercontrol: "",
  diseasessuffered: "",
  traumasaccidents: "",
  medications: "",
  communication: 0,
  selfcare: 0,
  homelife: 0,
  socialskills: 0,
  communityuse: 0,
  selfdirection: 0,
  health: 0,
  leisure: 0,
  savedate: new Date(),
  username: ""
};

export let me3_2_3 = {
  maternalfamilypathhistory: "",
  paternalfamilypathhistory: "",
  savedate: new Date(),
  username: ""
};

export let me3_3_1 = {
  mother: 0,
  father: 0,
  maternalgrandmother: 0,
  maternalgrandfather: 0,
  paternalgrandmother: 0,
  paternalgrandfather: 0,
  brothers: 0,
  maternaluncles: 0,
  paternaluncles: 0,
  parentsrelationships: "",
  whichother: "",
  savedate: new Date(),
  username: ""
};

export let me3_3_2 = {
  livingrooms: 0,
  bedrooms: 0,
  kitchen: 0,
  bathrooms: 0,
  constconditions: "",
  economicsituation: "",
  savedate: new Date(),
  username: ""
};

export let me3_3_3 = {
  f11: "",
  f12: "",
  f21: "",
  f22: "",
  f31: "",
  f32: "",
  f41: "",
  f42: "",
  f51: "",
  f52: "",
  savedate: new Date(),
  username: ""
};

export let me3_4 = {
  psychology: false,
  neurocognitive: false,
  psychometry: false,
  psychopedagogy: false,
  pedagogygeneral: false,
  pedagogylang: false,
  pedagogymath: false,
  pedagogyhistory: false,
  psicologia: [{ testid: 0, date: "" }],
  neuro: [{ testid: 0, date: "" }],
  psicometria: [{ testid: 0, date: "" }],
  psicopedagogia: [{ testid: 0, date: "" }],
  logopedia: [{ testid: 0, date: "", explanation: "" }],
  pedagogia: [{ testid: 0, date: "", explanation: "" }],
  language: [{ testid: 0, date: "", explanation: "" }],
  math: [{ testid: 0, date: "", explanation: "" }],
  history: [{ testid: 0, date: "", explanation: "" }],
  channel: "",
  rhythm: "",
  savedate: new Date().toISOString().split("T")[0],
  username: "",
  key: "3.4",
  id: 0,
  dni: ""
};

export let mrrp41 = {
  psicopotential: "",
  psiconeeds: "",
  psicodiagimpression: "",
  psicopedpotential: "",
  psicopedneeds: "",
  psicopeddiagimpression: "",
  intelligencequotient: "",
  devquotient: "",
  psicomediagimpression: "",
  pedagogy: [
    {
      auxmrrp: 0,
      schoolgrade: 0,
      communication: "",
      relationship: "",
      motorskills: "",
      spanishlanguage: "",
      math: "",
      history: "",
      savedate: "",
      username: ""
    }
  ],
  speechtherapydiagnosis: "",
  potential: "",
  needs: "",
  diagnosticresults: "",
  savedate: new Date().toISOString().split("T")[0],
  username: "",
  key: "4.1",
  id: 0,
  dni: ""
};

export let mrrp42 = {
  filenumber: 0,
  caremodality: "",
  educationalinstitution: "",
  transit: "",
  egress: "",
  bond: "",
  employercenter: "",
  savedate: new Date().toISOString().split("T")[0],
  username: "",
  key: "4.2",
  id: 0,
  dni: ""
};

export let childCloned = false;

export const allowedKeys = [
  "2.1",
  "3.1.1",
  "3.2.1",
  "3.2.2",
  "3.2.3",
  "3.3.1",
  "3.3.2",
  "3.3.3",
  "3.4",
  "4.1",
  "4.2",
  "4.3",
  "4.4"
];

// busca en childrenData.data (array de arrays) el objeto con key e id dados
export function findObjectByKeyAndId(dataArray, keyToFind, idToFind) {
  if (!Array.isArray(dataArray)) return null;

  // normaliza id buscado a string para evitar problemas numérico/string
  const idStr = idToFind == null ? null : String(idToFind);

  for (const subArray of dataArray) {
    if (!Array.isArray(subArray)) continue;

    for (const obj of subArray) {
      if (!obj || typeof obj !== "object") continue;
      if (obj.key !== keyToFind) continue;

      // si el objeto no tiene id y buscamos null/0/etc, seguir
      if (obj.id == null && idStr == null) return obj;

      // compara en string (asegura coincidencia aunque tipo difiera)
      if (obj.id != null && String(obj.id) === idStr) return obj;
    }
  }

  return null;
}

export function insertarNuevoObjEnChildrenData(nuevoObj, prevId) {
  if (!childrenData || !Array.isArray(childrenData.data)) {
    console.error("❌ childrenData.data no es un arreglo válido");
    return;
  }

  let insertado = false;

  for (let subArray of childrenData.data) {
    if (!Array.isArray(subArray)) continue;

    // 1️⃣ Buscar el objeto con key=prevId y mismo id
    const tieneprevId = subArray.some(
      (obj) => obj.key === prevId && obj.id === nuevoObj.id
    );

    if (tieneprevId) {
      // 2️⃣ Verificar que no exista ya un objeto con el mismo key
      const yaExiste = subArray.some((obj) => obj.key === nuevoObj.key);

      if (!yaExiste) {
        subArray.push(nuevoObj);
        console.log(
          `✅ Insertado nuevo objeto con key="${nuevoObj.key}" en el subarreglo del id=${nuevoObj.id}`
        );
        insertado = true;
      } else {
        console.warn(
          `⚠️ Ya existe un objeto con key="${nuevoObj.key}" en el subarreglo del id=${nuevoObj.id}`
        );
      }

      break; // ya encontramos el subarreglo correcto
    }
  }

  if (!insertado) {
    console.warn(
      `⚠️ No se encontró subarreglo con objeto key="3.1.1" e id=${nuevoObj.id}`
    );
  }
}

export async function exportFormToPDF(formSelector, btnSelector, pdfName) {
  document.getElementById(btnSelector).addEventListener("click", async () => {
    const formElement = document.getElementById(formSelector);

    // ---------------------------
    // 1️⃣ Hacer visibles los valores seleccionados de dropdowns
    // ---------------------------
    const dropdowns = formElement.querySelectorAll(".dropdown");
    const clones = [];
    dropdowns.forEach((dd) => {
      const selected =
        Array.from(dd.querySelectorAll('input[type="checkbox"]:checked'))
          .map((cb) => cb.value)
          // .join(", ") || "Seleccione...";
          .join("\n") || "Seleccione...";
      const span = document.createElement("span");
      span.className = "pdf-visible";
      span.style.display = "block";
      span.style.padding = "0.3rem";
      span.textContent = selected;
      dd.parentNode.insertBefore(span, dd.nextSibling);
      clones.push(span);
    });

    // ---------------------------
    // 2️⃣ Ocultar botones y elementos no imprimibles
    // ---------------------------
    const botones = formElement.querySelectorAll(".no-print, button");
    botones.forEach((b) => (b.style.display = "none"));

    // ---------------------------
    // 3️⃣ Generar PDF a partir del HTML
    // ---------------------------
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "letter");
    const margin = 10;

    // ---------------------------
    // 4️⃣ Obtener y centrar el título
    // ---------------------------
    let titulo = "Formulario";
    const modalContainer = formElement.closest(".modal");
    if (modalContainer) {
      const tituloEl = modalContainer.querySelector(".modal-title");
      if (tituloEl) titulo = tituloEl.innerText.trim();
    } else if (formElement.getAttribute("data-title")) {
      titulo = formElement.getAttribute("data-title");
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const textWidth = pdf.getTextWidth(titulo);
    const xPos = (pageWidth - textWidth) / 2;
    pdf.text(titulo, xPos, 15);

    // ---------------------------
    // 5️⃣ Renderizar contenido del formulario
    // ---------------------------
    await pdf.html(formElement, {
      x: margin,
      y: 20, // debajo del título
      width: pdf.internal.pageSize.getWidth() - 2 * margin,
      autoPaging: true,
      windowWidth: formElement.scrollWidth
    });

    // ---------------------------
    // 6️⃣ Guardar PDF
    // ---------------------------
    pdf.save(pdfName);

    // ---------------------------
    // 7️⃣ Restaurar DOM
    // ---------------------------
    botones.forEach((b) => (b.style.display = ""));
    clones.forEach((c) => c.remove());
  });
}

// export async function formToPdfInMemory(formSelector) {
//   const formElement = document.getElementById(formSelector);

//   // ---------------------------
//   // 1️⃣ Hacer visibles los valores seleccionados de dropdowns
//   // ---------------------------
//   const dropdowns = formElement.querySelectorAll(".dropdown");
//   const clones = [];
//   dropdowns.forEach(dd => {
//     const selected = Array.from(dd.querySelectorAll('input[type="checkbox"]:checked'))
//       .map(cb => cb.value)
//       .join("\n") || "Seleccione...";
//     const span = document.createElement("span");
//     span.className = "pdf-visible";
//     span.style.whiteSpace = "pre-wrap";
//     span.style.display = "block";
//     span.style.padding = "0.3rem";
//     span.textContent = selected;
//     dd.parentNode.insertBefore(span, dd.nextSibling);
//     clones.push(span);
//   });

//   // ---------------------------
//   // 2️⃣ Ocultar botones y elementos no imprimibles
//   // ---------------------------
//   const botones = formElement.querySelectorAll(".no-print, button");
//   botones.forEach(b => b.style.display = "none");

//   // ---------------------------
//   // 3️⃣ Generar PDF
//   // ---------------------------
//   const { jsPDF } = window.jspdf;
//   const pdf = new jsPDF("p", "mm", "letter");
//   const margin = 10;

//   // ---------------------------
//   // 4️⃣ Obtener y centrar el título
//   // ---------------------------
//   let titulo = "Formulario";
//   const modalContainer = formElement.closest(".modal");
//   if (modalContainer) {
//     const tituloEl = modalContainer.querySelector(".modal-title");
//     if (tituloEl) titulo = tituloEl.innerText.trim();
//   } else if (formElement.getAttribute("data-title")) {
//     titulo = formElement.getAttribute("data-title");
//   }

//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(14);
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const textWidth = pdf.getTextWidth(titulo);
//   const xPos = (pageWidth - textWidth) / 2;
//   pdf.text(titulo, xPos, 15);

//   // ---------------------------
//   // 5️⃣ Renderizar contenido del formulario
//   // ---------------------------
//   await pdf.html(formElement, {
//     x: margin,
//     y: 20,
//     width: pdf.internal.pageSize.getWidth() - 2 * margin,
//     autoPaging: true,
//     windowWidth: formElement.scrollWidth
//   });

//   // ---------------------------
//   // 6️⃣ OBTENER PDF EN MEMORIA (CORRECTO)
//   // ---------------------------
//   const pdfArrayBuffer = pdf.output("arraybuffer");
//   const pdfUint8 = new Uint8Array(pdfArrayBuffer); // ← ESTO ES LO QUE SE DEBE GUARDAR EN MYSQL

//   // ---------------------------
//   // 7️⃣ Restaurar DOM
//   // ---------------------------
//   botones.forEach(b => b.style.display = "");
//   clones.forEach(c => c.remove());

//   return pdfUint8;  // ← PDF válido listo para guardar
// }

export async function formToPdfInMemory(formSelector) {
  return null; // antes se guardaba el pdf en las tablas
  const formElement = document.getElementById(formSelector);

  // ---------------------------
  // 1️⃣ Hacer visibles los valores seleccionados de dropdowns
  // ---------------------------
  const dropdowns = formElement.querySelectorAll(".dropdown");
  const clones = [];
  dropdowns.forEach((dd) => {
    const selected =
      Array.from(dd.querySelectorAll('input[type="checkbox"]:checked'))
        .map((cb) => cb.value)
        .join("\n") || "Seleccione...";
    const span = document.createElement("span");
    span.className = "pdf-visible";
    span.style.whiteSpace = "pre-wrap";
    span.style.display = "block";
    span.style.padding = "0.3rem";
    span.textContent = selected;
    dd.parentNode.insertBefore(span, dd.nextSibling);
    clones.push(span);
  });

  // ---------------------------
  // 2️⃣ Ocultar botones y elementos no imprimibles
  // ---------------------------
  const botones = formElement.querySelectorAll(".no-print, button");
  botones.forEach((b) => (b.style.display = "none"));

  // ---------------------------
  // 3️⃣ Inyectar estilo CSS para limitar tamaño de letra
  // ---------------------------
  const style = document.createElement("style");
  style.innerHTML = `
    #${formSelector} {
      font-size: 12px !important;
    }
    #${formSelector} * {
      font-size: 12px !important;
    }
  `;
  document.head.appendChild(style);

  // ---------------------------
  // 4️⃣ Crear PDF tamaño A4 usando jsPDF
  // ---------------------------
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "letter");
  const margin = 10;

  // ---------------------------
  // 5️⃣ Obtener y centrar el título
  // ---------------------------
  let titulo = "Formulario";
  const modalContainer = formElement.closest(".modal");
  if (modalContainer) {
    const tituloEl = modalContainer.querySelector(".modal-title");
    if (tituloEl) titulo = tituloEl.innerText.trim();
  } else if (formElement.getAttribute("data-title")) {
    titulo = formElement.getAttribute("data-title");
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const textWidth = pdf.getTextWidth(titulo);
  const xPos = (pageWidth - textWidth) / 2;
  pdf.text(titulo, xPos, 15);

  // ---------------------------
  // 6️⃣ Renderizar contenido del formulario al PDF con márgenes
  // ---------------------------
  await pdf.html(formElement, {
    x: margin,
    y: 20,
    width: pdf.internal.pageSize.getWidth() - 2 * margin,
    autoPaging: true,
    windowWidth: formElement.scrollWidth
  });

  // ---------------------------
  // 7️⃣ Obtener PDF en memoria en formato Uint8Array
  // ---------------------------
  const pdfArrayBuffer = pdf.output("arraybuffer");
  const pdfUint8 = new Uint8Array(pdfArrayBuffer); // ← ESTO ES LO QUE SE DEBE GUARDAR EN MYSQL

  // ---------------------------
  // 8️⃣ Restaurar DOM y remover estilo inyectado
  // ---------------------------
  botones.forEach((b) => (b.style.display = ""));
  clones.forEach((c) => c.remove());
  document.head.removeChild(style);

  return pdfUint8; // ← PDF válido listo para guardar
}

export function normalizeDateForInput(value) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getTestName(testid) {
  try {
    const response = await fetch(
      `${window.config.apiUrl}/auxtests/name/${testid}`
    );

    const result = await response.json();

    if (!result.success) {
      console.warn("⚠️ No se pudo obtener el nombre del test:", result.message);
      return null;
    }

    return result.data.testname;
  } catch (err) {
    console.error("❌ Error en fetchTestNameById:", err);
    return null;
  }
}

export function formatearFechaHora(fechaHora) {
  if (!fechaHora) return "—";

  const d = new Date(fechaHora);

  // Fecha en formato YYYY-MM-DD
  const fecha =
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0");

  // Hora en formato 12h
  let horas = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "p. m." : "a. m.";
  horas = horas % 12;
  horas = horas === 0 ? 12 : horas;

  return `${fecha} ${horas}:${minutos} ${ampm}`;
}
