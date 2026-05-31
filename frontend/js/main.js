import {
  allowedKeys,
  childrenData,
  initChildrenData,
  clearChildrenData,
  mgivar,
  me3_1_1,
  me3_2_1,
  me3_2_2,
  me3_2_3,
  me3_3_1,
  me3_3_2,
  me3_3_3
} from "./definitions.js";
import { openMgiModal } from "./mgiscripts.js";
import { openME31Modal } from "./me31scripts.js";
import { openME321Modal } from "./me321scripts.js";
import { openME322Modal } from "./me322scripts.js";
import { openME323Modal } from "./me323scripts.js";
import { openME331Modal } from "./me331scripts.js";
import { openME332Modal } from "./me332scripts.js";
import { openME333Modal } from "./me333scripts.js";
import { openME34Modal } from "./me34scripts.js";
import { openMRRP41Modal } from "./mrrp41scripts.js";
import { openMRRP42Modal } from "./mrrp42.js";

const keyMap = {
  2.1: { row: 2, colBase: 2 }, // mgivar
  "3.1.1": { row: 3, colBase: 3 }, // me3_1_1
  "3.2.1": { row: 4, colBase: 2 }, // me3_2_1
  "3.2.2": { row: 5, colBase: 1 }, // me3_2_2
  "3.2.3": { row: 6, colBase: 1 }, // me3_2_3
  "3.3.1": { row: 7, colBase: 2 }, // me3_3_1
  "3.3.2": { row: 8, colBase: 1 }, // me3_3_2
  "3.3.3": { row: 9, colBase: 1 }, // me3_3_3
  3.4: { row: 10, colBase: 1 }, // me3_4
  4.1: { row: 11, colBase: 2 }, // mrrp4_1
  4.2: { row: 12, colBase: 1 }, // mrrp4_2
  4.3: { row: 13, colBase: 1 }, // mrrp4_3
  4.4: { row: 14, colBase: 1 } // mrrp4_4
};

export function resetTable() {
  const img = document.getElementById("photoimg");
  img.src = "./images/emptyphoto1.jpg";

  const subjName = document.getElementById("subjName");
  const subjDni = document.getElementById("subjDni");

  subjName.textContent = "Nombre y apellidos";
  subjDni.textContent = "Tarjeta del menor";

  const headerSub = document.getElementById("test-header-sub");
  const estudiosGroup = document.getElementById("test-estudios-group");
  const rows = document.querySelectorAll("#test-tbody tr");

  // 1. Eliminar todos los TH agregados
  while (headerSub.children.length > 0) {
    headerSub.removeChild(headerSub.lastChild);
  }

  // 2. Restaurar colSpan original (1)
  estudiosGroup.colSpan = 1;

  // 3. Eliminar todas las celdas TD agregadas por createCells()
  rows.forEach((row) => {
    // selecciona SOLO las celdas agregadas
    const cells = row.querySelectorAll("td.non-editable");

    cells.forEach((td) => td.remove());
  });
}

export function uint8ToBase64(uint8Arr) {
  let binary = "";
  const len = uint8Arr.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Arr[i]);
  }
  return btoa(binary);
}

export let dataFromFUC = false;

// MENU CONTEXTUAL *****************
const contextMenu = document.getElementById("context-menu");
const addEstudioBtn = document.getElementById("add-estudio");

// Mostrar el menú contextual
function showContextMenu(x, y) {
  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
  contextMenu.style.display = "block";
}

// Ocultar menú contextual al hacer clic afuera
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

// Acción al seleccionar "Nuevo estudio…"
addEstudioBtn.addEventListener("click", () => {
  contextMenu.style.display = "none";
  agregarNuevaColumnaEstudio();
});

function agregarNuevaColumnaEstudio() {
  const headerSub = document.getElementById("test-header-sub");

  // Obtener el último número del encabezado (último "Estudio")
  let lastNumber = 0;
  const ths = headerSub.querySelectorAll("th");

  if (ths.length > 0) {
    lastNumber = Number(ths[ths.length - 1].textContent);
  }

  const numEstudios = lastNumber + 1; // Nuevo número de estudio

  // Crear nuevo encabezado
  const th = document.createElement("th");
  th.className = "test-th";
  th.textContent = `${numEstudios}`;

  // HABILITAR CLICK DERECHO SOLO EN EL ÚLTIMO
  th.addEventListener("contextmenu", function (e) {
    const numeroColumna = Number(th.textContent);
    clearChildrenData();

    if (numeroColumna === childrenData.data.length) {
      // if (numeroColumna === numEstudios) {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY);
    }
  });

  headerSub.appendChild(th);

  // Actualizar colspan
  document.getElementById("test-estudios-group").colSpan = numEstudios;

  // Añadir celda vacía a cada fila del tbody
  const rows = document.querySelectorAll("#test-tbody tr");
  rows.forEach((row) => {
    const td = document.createElement("td");
    td.className = "test-cell non-editable";
    td.style.backgroundColor = "#f9f9f9";
    td.style.border = "1px solid black";
    td.textContent = "";
    td.addEventListener("click", function (e) {
      const fila = e.target.parentElement;
      const indiceFila = fila.rowIndex;
      const indiceColumna = e.target.cellIndex;

      if (e.target.style.backgroundColor === "chocolate") {
        const key = getKeyByRow(indiceFila);
        const index = indiceColumna - getColBaseByRow(indiceFila);
        const id = getIdFromData(index);
        switch (key) {
          case "2.1":
            openMgiModal(id);
            break;
          case "3.1.1":
            openME31Modal(id);
            break;
          case "3.2.1":
            openME321Modal(id);
            break;
          case "3.2.2":
            openME322Modal(id);
            break;
          case "3.2.3":
            openME323Modal(id);
            break;
          case "3.3.1":
            openME331Modal(id);
            break;
          case "3.3.2":
            openME332Modal(id);
            break;
          case "3.3.3":
            openME333Modal(id);
            break;
          case "3.4":
            openME34Modal(id);
            break;
          case "4.1":
            openMRRP41Modal(id);
            break;
          case "4.2":
            openMRRP42Modal(id);
            break;
          case "4.3":
            console.log(key);
            break;
          case "4.4":
            console.log(key);
            break;
          default:
            console.log("no existe el cuestionario");
            break;
        }
      } else {
        if (indiceFila > 2) {
          const dif = indiceColumna - getColBaseByRow(indiceFila);
          const previuosRow = indiceFila - 1;
          const previuosCol = getColBaseByRow(previuosRow) + dif;
          const color = getCellBackgroundColor(previuosRow, previuosCol);

          if (color === "rgb(210, 105, 30)") {
            const id = getIdFromData(dif);
            const key = getKeyByRow(previuosRow);

            switch (key) {
              case "2.1":
                openME31Modal(id);
                break;
              case "3.1.1":
                openME321Modal(id);
                break;
              case "3.2.1":
                openME322Modal(id);
                break;
              case "3.2.2":
                openME323Modal(id);
                break;
              case "3.2.3":
                openME331Modal(id);
                break;
              case "3.3.1":
                openME332Modal(id);
                break;
              case "3.3.2":
                openME333Modal(id);
                break;
              case "3.3.3":
                openME34Modal(id);
                break;
              case "3.4":
                openMRRP41Modal(id);
                break;
              case "4.1":
                openMRRP42Modal(id);
                break;
              default:
                console.log("falta mas");
                break;
            }
          } else {
            alert("⚠️ Debe rellenar el formulario anterior primero.");
          }
        } else {
          openMgiModal(0);
        }
      }
    });
    row.appendChild(td);
  });
}

// FIN MENU CONTEXTUAL **************

function marcarCelda(rowIndex, cellIndex, color) {
  const table = document.getElementById("test-table");
  if (!table) return;

  const row = table.rows[rowIndex];
  if (!row) return;

  const cell = row.cells[cellIndex];
  if (!cell) return;

  cell.style.backgroundColor = color;
}

function getKeyByRow(rowValue) {
  for (const key in keyMap) {
    if (keyMap[key].row === rowValue) {
      return key;
    }
  }
  return null; // si no se encuentra
}

function getColBaseByRow(rowValue) {
  const key = getKeyByRow(rowValue);
  if (!key) return null;

  return keyMap[key].colBase;
}

function getIdFromData(index) {
  if (!childrenData || !childrenData.data || !childrenData.data[index]) {
    return null;
  }

  const rowArray = childrenData.data[index];

  const obj = rowArray.find((item) => item.key === "2.1");

  return obj ? obj.id : null;
}

function getCellBackgroundColor(rowIndex, cellIndex) {
  const table = document.getElementById("test-table");
  if (!table) return null;

  const row = table.rows[rowIndex];
  if (!row) return null;

  const cell = row.cells[cellIndex];
  if (!cell) return null;

  // obtiene el color computado final
  return window.getComputedStyle(cell).backgroundColor;
}

function createCells() {
  const numEstudios = childrenData.data.length; // número de columnas dinámicas
  const headerSub = document.getElementById("test-header-sub");
  const estudiosGroup = document.getElementById("test-estudios-group");
  const rows = document.querySelectorAll("#test-tbody tr");

  estudiosGroup.colSpan = numEstudios;

  // Crear encabezamientos Est.1, Est.2...
  for (let i = 1; i <= numEstudios; i++) {
    const th = document.createElement("th");
    th.className = "test-th";
    th.textContent = `${i}`;

    // === NUEVO: MENU CONTEXTUAL SOLO EN EL ÚLTIMO ===
    th.addEventListener("contextmenu", function (e) {
      clearChildrenData();

      const numeroColumna = Number(th.textContent);

      // Solo abrir menú si este encabezado ES el último actual
      if (numeroColumna === childrenData.data.length) {
        e.preventDefault();
        showContextMenu(e.pageX, e.pageY);
      }
    });

    headerSub.appendChild(th);
  }

  // Seguimiento de los rowspan activos
  const rowspanTrack = [];

  rows.forEach((row, rowIndex) => {
    let colIndex = 0;

    for (let i = 0; i < rowspanTrack.length; i++) {
      if (rowspanTrack[i] > 0) {
        colIndex++;
        rowspanTrack[i]--;
      }
    }

    // Insertar celdas vacías debajo de las columnas "Estudios"
    for (let i = 0; i < numEstudios; i++) {
      const td = document.createElement("td");
      td.className = "test-cell non-editable"; // <- nueva clase
      td.addEventListener("click", function (e) {
        const fila = e.target.parentElement;
        const indiceFila = fila.rowIndex;
        const indiceColumna = e.target.cellIndex;

        if (e.target.style.backgroundColor === "chocolate") {
          const key = getKeyByRow(indiceFila);
          const index = indiceColumna - getColBaseByRow(indiceFila);
          const id = getIdFromData(index);
          switch (key) {
            case "2.1":
              openMgiModal(id);
              break;
            case "3.1.1":
              openME31Modal(id);
              break;
            case "3.2.1":
              openME321Modal(id);
              break;
            case "3.2.2":
              openME322Modal(id);
              break;
            case "3.2.3":
              openME323Modal(id);
              break;
            case "3.3.1":
              openME331Modal(id);
              break;
            case "3.3.2":
              openME332Modal(id);
              break;
            case "3.3.3":
              openME333Modal(id);
              break;
            case "3.4":
              openME34Modal(id);
              break;
            case "4.1":
              openMRRP41Modal(id);
              break;
            case "4.2":
              openMRRP42Modal(id);
              break;
            case "4.3":
              console.log(key);
              break;
            case "4.4":
              console.log(key);
              break;
            default:
              console.log("no existe el cuestionario");
              break;
          }
        } else {
          if (indiceFila > 2) {
            const dif = indiceColumna - getColBaseByRow(indiceFila);
            const previuosRow = indiceFila - 1;
            const previuosCol = getColBaseByRow(previuosRow) + dif;
            const color = getCellBackgroundColor(previuosRow, previuosCol);

            if (color === "rgb(210, 105, 30)") {
              const id = getIdFromData(dif);
              const key = getKeyByRow(previuosRow);

              switch (key) {
                case "2.1":
                  openME31Modal(id);
                  break;
                case "3.1.1":
                  openME321Modal(id);
                  break;
                case "3.2.1":
                  openME322Modal(id);
                  break;
                case "3.2.2":
                  openME323Modal(id);
                  break;
                case "3.2.3":
                  openME331Modal(id);
                  break;
                case "3.3.1":
                  openME332Modal(id);
                  break;
                case "3.3.2":
                  openME333Modal(id);
                  break;
                case "3.3.3":
                  openME34Modal(id);
                  break;
                case "3.4":
                  openMRRP41Modal(id);
                  break;
                case "4.1":
                  openMRRP42Modal(id);
                  break;
                default:
                  console.log("falta mas");
                  break;
              }
            } else {
              alert("⚠️ Debe rellenar el formulario anterior primero.");
            }
          }
        }
      });
      td.textContent = "";
      td.style.backgroundColor = "#f9f9f9";
      td.style.border = "1px solid black";
      row.appendChild(td);
      colIndex++;
    }

    // Registrar nuevos rowspans de esta fila
    const tds = Array.from(row.children);
    tds.forEach((cell, idx) => {
      const span = Number.parseInt(cell.getAttribute("rowspan") || "1", 10);
      rowspanTrack[idx] = span - 1;
    });
  });
}

export function actualizarTabla() {
  createCells();
  for (let i = 0; i < childrenData.data.length; i++) {
    const colArray = childrenData.data[i];
    // asegúrate de que la columna sea un arreglo
    if (!Array.isArray(colArray)) continue;

    // para cada key en el mapa, comprueba si existe dentro de colArra
    for (const k in keyMap) {
      const { row, colBase } = keyMap[k];

      // existe algún objeto en colArray cuya propiedad key === k ?
      const existe = colArray.some((obj) => obj && obj.key === k);
      // pinta chocolate si existe, blanco si no
      marcarCelda(row, colBase + i, existe ? "chocolate" : "white");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const dropdowns = document.querySelectorAll(".dropdown");

  // Abrir/Cerrar menú móvil
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("show"); // usamos 'show' en lugar de 'active'
  });

  // Abrir/Cerrar dropdowns en móvil
  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    toggle.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        dropdown.classList.toggle("show");
      }
    });
  });

  // ************** CONTROL CUESTIONARIOS Y SELECCIONAR SUJETO**********************
  // Ruta 12: Verifica si un menor existe
  async function checkChild(cnumber) {
    try {
      const response = await fetch(`${window.config.apiUrl}/checkchild`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cnumber })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.exists === true;
    } catch (err) {
      console.error("Error en checkChild:", err);
      return false;
    }
  }

  const photofileInput = document.getElementById("photofileInput");

  document
    .getElementById("photoimg")
    .addEventListener("click", async function () {
      if (!window.currentUser) {
        alert("⚠️ Debe iniciar sesión primero.");
        return;
      }

      if (childrenData.dni === "") {
        alert("⚠️ Debe selecionar un sujeto primero.");
        return;
      }
      const existsChild = await checkChild(childrenData.dni);

      if (!existsChild) {
        console.log("⚠️ Debe sleccionar un sujeto primero.");
        return;
      }
      photofileInput.click();
    });

  // Ruta 41: actualiza foto del niño
  photofileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    const photoimg = document.getElementById("photoimg");

    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async function (e) {
      const img = new Image();
      img.src = e.target.result;

      img.onload = async function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Tamaño final deseado
        const width = 200;
        const height = 200;
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir canvas a Blob (binario)
        canvas.toBlob(
          async (blob) => {
            // Mostrar la imagen en la etiqueta <img>
            photoimg.src = URL.createObjectURL(blob);

            // Preparar FormData con BLOB y dni
            const cnumber = childrenData.dni;
            const formData = new FormData();
            formData.append("cnumber", cnumber);
            formData.append("photo", blob, "photo.jpg");

            // Enviar al servidor
            const response = await fetch(
              `${window.config.apiUrl}/updatechildphoto`,
              {
                method: "POST",
                body: formData
              }
            );

            const result = await response.json();
            if (result.success) {
              console.log("✔ Foto actualizada en el servidor");
            } else {
              console.log("❌ Error al actualizar foto");
            }
          },
          "image/jpeg",
          0.9
        );
      };
    };
  });

  // function actualizarRootContentConFoto(dni, name, photo) {
  //   const img = document.getElementById("photoimg");
  //   const subjName = document.getElementById("subjName");
  //   const subjDni = document.getElementById("subjDni");

  //   subjName.textContent = name;
  //   subjDni.textContent = dni;

  //   if (photo && photo.data && Array.isArray(photo.data)) {

  //     const uint8Photo = new Uint8Array(photo.data);

  //     const base64String = uint8ToBase64(uint8Photo);
  //     img.src = `data:image/jpeg;base64,${base64String}`;
  //   }
  // }

  function actualizarRootContentConFoto(dni, name, photo) {
    const img = document.getElementById("photoimg");
    const subjName = document.getElementById("subjName");
    const subjDni = document.getElementById("subjDni");

    subjName.textContent = name;
    subjDni.textContent = dni;

    // Caso 1: ya viene como base64 (string)
    if (typeof photo === "string" && photo.startsWith("data:image")) {
      img.src = photo;
      return;
    }

    // Caso 2: viene como bytes (photo.data)
    if (photo && photo.data && Array.isArray(photo.data)) {
      const uint8Photo = new Uint8Array(photo.data);
      const base64String = uint8ToBase64(uint8Photo);
      img.src = `data:image/jpeg;base64,${base64String}`;
      return;
    }

    // Caso 3: no hay foto → imagen por defecto
    img.src = "./images/emptyphoto1.jpg";
  }

  document
    .getElementById("subj-btn-seleccionar")
    .addEventListener("click", async function () {
      subjCloseModal();
      document.getElementById("subj-photo-box").innerHTML = "";

      const id = document.getElementById("subj-tarjeta-input").value;
      if (id) {
        // const existsChild = await verificarMenor(id);
        const existsChild = childData.some((child) => child.dni === id);

        initChildrenData();
        dataFromFUC = false;
        if (existsChild) {
          // Carga los datos de mgivar y completa mgi

          Object.assign(childrenData, await loadChildByCode(id));

          for (let i = 0; i < childrenData.data.length; i++) {
            const subArray = childrenData.data[i];
            // Buscar el objeto que tenga key = '2.1'
            const mgivarObj = subArray.find((obj) => obj.key === "2.1");

            if (mgivarObj) {
              const targetId = mgivarObj.id;

              await cargarDatos(targetId);
            }
          }

          resetTable();
          actualizarRootContentConFoto(
            childrenData.dni,
            childrenData.fullname,
            childrenData.photo
          );
          actualizarTabla();
        } else {
          // Obteniendo datos de la FUC
          resetTable();
          initChildrenData();

          // ********************************
          // let persona = [{}];
          // persona[0].identidad_numero = '62091104788';
          // persona[0].foto = null;
          // persona[0].primer_nombre = 'Osvaldo';
          // persona[0].segundo_nombre = '';
          // persona[0].primer_apellido = 'Reyes';
          // persona[0].segundo_apellido = 'Candelario';
          // persona[0].nacimiento_fecha = '1962-09-11';
          // persona[0].sexo = 'M';

          const persona = await cargarPersona(id); //aqui
          if (persona.length === 0) {
            alert("🛑 Sujeto no encontrado en la Ficha Unica del Ciudadano.");
            return;
          }
          console.log("persona: ", persona);
          console.log("foto: ", persona[0].foto);

          childrenData.dni = persona[0].identidad_numero;
          childrenData.fullname = [
            persona[0].primer_nombre,
            persona[0].segundo_nombre,
            persona[0].primer_apellido,
            persona[0].segundo_apellido
          ]
            .filter(Boolean)
            .join(" ");
          childrenData.birthdate = persona[0].nacimiento_fecha;
          childrenData.sex = persona[0].sexo;
          childrenData.photo = persona[0].foto;

          actualizarRootContentConFoto(
            childrenData.dni,
            childrenData.fullname,
            childrenData.photo
          );
          // ********************************
          dataFromFUC = true;
          openMgiModal(0);
        }
      } else {
        alert("✋ Escribe o selecciona un número de tarjeta");
        return;
      }
      document.getElementById("subj-modal-overlay").style.display = "none";
      document.getElementById("subj-tarjeta-input").value = "";
    });

  document.getElementById("subj-btn-cerrar").addEventListener("click", () => {
    document.getElementById("subj-modal-overlay").style.display = "none";
  });

  let childData = [];
  const tableBody = document.getElementById("selchild-tbody");
  const subjTbody = document.querySelector("#subj-tabla tbody");

  // Ruta # 37: Obtiene la photo del nino si existe.
  async function obtenerFotoChild(dni) {
    try {
      const userId = window.currentUser?.userid || "system";

      const response = await fetch(
        `${
          window.config.apiUrl
        }/children/${dni}/photo?userid=${encodeURIComponent(userId)}`
      );
      if (!response.ok) throw new Error("Error al obtener la foto");

      const data = await response.json();
      // data.photo puede ser null o un string base64
      return data.photo || null;
    } catch (error) {
      console.error("Error en obtenerFotoChild:", error);
      return null;
    }
  }

  async function subjLlenarTabla() {
    subjTbody.innerHTML = "";

    // Pasar el usuario actual al backend
    const userId = window.currentUser?.userid || "system";

    try {
      const response = await fetch(
        `${window.config.apiUrl}/children?userid=${encodeURIComponent(userId)}`
      );
      if (!response.ok)
        throw new Error("Error al obtener los datos de los niños");
      childData = await response.json();
    } catch (error) {
      console.error(error);
      return;
    }

    childData.forEach((child) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${child.dni}</td><td>${child.fullname}</td>`;

      // 📸 Capturar el clic en la fila para mostrar la foto
      tr.addEventListener("click", async (e) => {
        const fila = e.currentTarget;
        const valorPrimeraColumna =
          fila.querySelector("td:first-child").textContent;

        try {
          const fotoBase64 = await obtenerFotoChild(valorPrimeraColumna);
          const photoBox = document.getElementById("subj-photo-box");

          if (fotoBase64) {
            photoBox.innerHTML = `
              <img src="${fotoBase64}" 
                  alt="Foto del sujeto" 
                  style="width:100px;height:100px;border-radius:10px;object-fit:cover;">
            `;
          } else {
            photoBox.innerHTML = `
              <div style="
                width:100px;
                height:100px;
                border:1px solid #ccc;
                border-radius:10px;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#777;
                font-size:12px;
              ">
                Sin foto
              </div>`;
          }
        } catch (err) {
          console.error("Error al obtener o mostrar la imagen:", err);
          const photoBox = document.getElementById("subj-photo-box");
          photoBox.innerHTML = `
            <div style="
              width:100px;
              height:100px;
              border:1px solid #f00;
              border-radius:10px;
              display:flex;
              align-items:center;
              justify-content:center;
              color:red;
              font-size:12px;
            ">
              Error
            </div>`;
        }
      });

      // 📋 Doble clic para copiar el ID al input
      tr.addEventListener("dblclick", () => {
        document.getElementById("subj-tarjeta-input").value = child.dni;
      });

      subjTbody.appendChild(tr);
    });
  }

  function llenarSubjTabla(datos) {
    // Seleccionamos el tbody de la tabla
    const tbody = document.querySelector("#subj-tabla tbody");
    // Limpiamos cualquier fila existente
    tbody.innerHTML = "";

    // Recorremos los datos y creamos las filas
    datos.forEach((item) => {
      const tr = document.createElement("tr");

      // Columna de DNI
      const tdDni = document.createElement("td");
      tdDni.textContent = item.dni;
      tr.appendChild(tdDni);

      // Columna de Nombre completo
      const tdNombre = document.createElement("td");
      tdNombre.textContent = item.fullname;
      tr.appendChild(tdNombre);

      // Agregamos la fila al tbody
      tbody.appendChild(tr);
    });
  }
  // Filtrar tabla
  window.subjFiltrarTabla = function () {
    const filtro = document.getElementById("subj-tarjeta-input").value.trim();

    if (!childData || childData.length === 0) return;

    const filtrados =
      filtro === ""
        ? childData
        : childData.filter((s) => s.dni.includes(filtro));

    llenarSubjTabla(filtrados);
  };

  // Abrir y cerrar modal
  function subjOpenModal() {
    document.getElementById("subj-modal-overlay").style.display = "flex";
  }

  function subjCloseModal() {
    document.getElementById("subj-modal-overlay").style.display = "none";
  }

  // Ruta # 10: cargar todos los datos mgi de un niño
  async function loadChildByCode(code) {
    try {
      const userId = window.currentUser?.userid || "system";

      const response = await fetch(
        `${window.config.apiUrl}/getchild/${code}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (result.success) {
        Object.assign(childrenData, result.childrenData);
      } else {
        console.warn("⚠️ No encontrado:", result.message);
      }
    } catch (err) {
      console.error("❌ Error en fetch:", err);
    }
  }

  // Ruta # 15> Obtener un registro de m31 por id
  async function fetchME311(targetId) {
    try {
      const userId = window.currentUser?.userid || "system";
      const resp = await fetch(
        `${
          window.config.apiUrl
        }/getme311/${targetId}?userid=${encodeURIComponent(userId)}`
      );
      const result = await resp.json();

      if (!result.success) {
        console.error("❌ Error al obtener m31:", result.message);
        return;
      }

      const data = result.data;

      // Convertir Reason y Directtreatment de string a array
      const reasonArray = data.reason ? data.reason.split(" / ") : [];
      const directTreatmentArray = data.directtreatment
        ? data.directtreatment.split(" / ")
        : [];

      const me311Obj = {
        id: data.id,
        key: data.key,
        reason: reasonArray,
        anotherrreason: data.anotherrreason,
        carepathway: data.carepathway,
        concept: data.concept,
        preschooldiagresults: data.preschooldiagresults,
        articulationstageresults: data.articulationstageresults,
        startdate: data.startdate,
        directtreatment: directTreatmentArray,
        canceldate: data.canceldate,
        reasoncancel: data.reasoncancel,
        transfer: data.transfer,
        transferwhere: data.transferwhere,
        teachertraining: data.teachertraining,
        experience: data.experience,
        savedate: new Date(data.savedate),
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me311Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me311Obj.id)) {
          cdata[i].push(me311Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
    } catch (err) {
      console.error("❌ Error en fetchme311:", err);
    }
  }

  // Ruta # 18: Obtener un registro de me321 por id.
  async function fetchME321(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme321/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return;
      }

      const data = result.data;

      // 🔹 Normalizar datos según lo que devuelve la API
      const me321Obj = {
        id: data.id,
        key: data.key,
        dni: data.dni,
        pregnancy: data.pregnancy,
        gesnumber: data.gesnumber,
        abortions: data.abortions,
        abortionstypes: data.abortionstypes,
        abortionsquantity: data.abortionsquantity,
        toxichabits: data.toxichabits,
        toxichabitstypes: data.toxichabitstypes,
        motherfetusbloodcomp: data.motherfetusbloodcomp,
        motherfatherconsanguinity: data.motherfatherconsanguinity,
        bleeding: data.bleeding,
        illnessespregnancy: data.illnessespregnancy,
        illnesses: data.illnesses,
        childbirthtypes: data.childbirthtypes,
        complications: data.complications,
        breastfeedinguntil: data.breastfeedinguntil,
        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me321Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me321Obj.id)) {
          cdata[i].push(me321Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de me321:", err);
    }
  }

  // Ruta # 19: Obtener un registro de me322 por id.
  async function fetchME322(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme322/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return null;
      }

      const data = result.data;

      // 🔹 Normalizar el objeto con los mismos nombres que vienen del backend
      const me322Obj = {
        id: data.id,
        key: data.key,
        dni: data.dni,
        validism: data.validism,
        analsphinctercontrol: data.analsphinctercontrol,
        bladdersphinctercontrol: data.bladdersphinctercontrol,
        diseasessuffered: data.diseasessuffered,
        traumasaccidents: data.traumasaccidents,
        medications: data.medications,
        communication: data.communication,
        selfcare: data.selfcare,
        homelife: data.homelife,
        socialskills: data.socialskills,
        communityuse: data.communityuse,
        selfdirection: data.selfdirection,
        health: data.health,
        leisure: data.leisure,
        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me322Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me322Obj.id)) {
          cdata[i].push(me322Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
      return me322Obj;
    } catch (err) {
      console.error("❌ Error al hacer fetch de me322:", err);
      return null;
    }
  }

  // Ruta # 20: Obtener un registro de me323 por id.
  async function fetchME323(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme323/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return null;
      }

      const data = result.data;

      // 🔹 Construir objeto normalizado con los campos de la tabla
      const me323Obj = {
        id: data.id,
        key: data.key,
        dni: data.dni,
        maternalfamilypathhistory: data.maternalfamilypathhistory,
        paternalfamilypathhistory: data.paternalfamilypathhistory,
        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me323Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me323Obj.id)) {
          cdata[i].push(me323Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
      return me323Obj;
    } catch (err) {
      console.error("❌ Error al hacer fetch de me323:", err);
      return null;
    }
  }

  // Ruta # 21: Obtener un registro de me331 por id.
  async function fetchME331(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme331/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return;
      }

      const data = result.data;

      // 🔹 Construir objeto normalizado con los campos reales de la tabla
      const me331Obj = {
        id: data.id,
        key: data.key,
        dni: data.dni,
        mother: data.mother,
        father: data.father,
        maternalgrandmother: data.maternalgrandmother,
        maternalgrandfather: data.maternalgrandfather,
        paternalgrandmother: data.paternalgrandmother,
        paternalgrandfather: data.paternalgrandfather,
        brothers: data.brothers,
        maternaluncles: data.maternaluncles,
        paternaluncles: data.paternaluncles,
        parentsrelationships: data.parentsrelationships,
        whichother: data.whichother,
        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me331Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me331Obj.id)) {
          cdata[i].push(me331Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de me331:", err);
    }
  }

  // Ruta # 22: Obtener un registro de me332 por id.
  async function fetchME332(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme332/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return;
      }

      const data = result.data;

      // 🔹 Construir objeto normalizado con los campos reales de la tabla
      const me332Obj = {
        id: data.id,
        key: data.key,
        dni: data.dni,
        livingrooms: data.livingrooms,
        bedrooms: data.bedrooms,
        kitchen: data.kitchen,
        bathrooms: data.bathrooms,
        constconditions: data.constconditions,
        economicsituation: data.economicsituation,
        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me332Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me332Obj.id)) {
          cdata[i].push(me332Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de me332:", err);
    }
  }

  // Ruta # 23: Obtener un registro de me333 por id.
  async function fetchME333(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme333/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return;
      }

      const data = result.data;

      // 🔹 Construir objeto normalizado con los campos reales de la tabla
      const me333Obj = {
        id: data.id,
        key: data.key,
        dni: data.dni,
        f11: data.f11,
        f12: data.f12,
        f21: data.f21,
        f22: data.f22,
        f31: data.f31,
        f32: data.f32,
        f41: data.f41,
        f42: data.f42,
        f51: data.f51,
        f52: data.f52,
        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username
      };

      // Guardar en childrenData
      // childrenData.data.push(me333Obj);
      const cdata = childrenData.data;
      let added = false;
      for (let i = 0; i < cdata.length; i++) {
        // Chequear si hay un objeto con el mismo id en data[i]
        if (cdata[i].some((obj) => obj.id === me333Obj.id)) {
          cdata[i].push(me333Obj);
          added = true;
          break; // Termina búsqueda si ya se añadió
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de me333:", err);
    }
  }

  async function fetchME34(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getme34/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener el registro:", result.message);
        return;
      }

      const me34Obj = result.data;

      // Guardar en childrenData
      const cdata = childrenData.data;
      let added = false;

      for (let i = 0; i < cdata.length; i++) {
        if (cdata[i].some((obj) => obj.id === me34Obj.id)) {
          cdata[i].push(me34Obj);
          added = true;
          break;
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de me3_4:", err);
    }
  }

  async function fetchMRRP41(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getmrrp41/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener MRRP41:", result.message);
        return;
      }

      const data = result.data;

      // 🔹 Normalizar objeto MRRP41
      const mrrp41Obj = {
        id: data.id,
        dni: data.dni,

        psicopotential: data.psicopotential,
        psiconeeds: data.psiconeeds,
        psicodiagimpression: data.psicodiagimpression,

        psicopedpotential: data.psicopedpotential,
        psicopedneeds: data.psicopedneeds,
        psicopeddiagimpression: data.psicopeddiagimpression,

        intelligencequotient: data.intelligencequotient,
        devquotient: data.devquotient,
        psicomediagimpression: data.psicomediagimpression,

        speechtherapydiagnosis: data.speechtherapydiagnosis,
        potential: data.potential,
        needs: data.needs,
        diagnosticresults: data.diagnosticresults,

        savedate: data.savedate ? new Date(data.savedate) : null,
        username: data.username,
        key: "4.1",
        pedagogy: Array.isArray(data.pedagogy) ? data.pedagogy : []
      };

      // 🔹 Insertar en childrenData.data (misma lógica que usas)
      const cdata = childrenData.data;
      let added = false;

      for (let i = 0; i < cdata.length; i++) {
        if (cdata[i].some((obj) => obj.id === mrrp41Obj.id)) {
          cdata[i].push(mrrp41Obj);
          added = true;
          break;
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de MRRP41:", err);
    }
  }

  async function fetchMRRP42(id) {
    try {
      const userId = window.currentUser?.userid || "system";
      const response = await fetch(
        `${window.config.apiUrl}/getmrrp42/${id}?userid=${encodeURIComponent(
          userId
        )}`
      );
      const result = await response.json();

      if (!result.success) {
        // console.warn("⚠️ No se pudo obtener MRRP42:", result.message);
        return;
      }

      const data = result.data;

      // 🔹 Normalizar objeto MRRP42
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

      // 🔹 Insertar en childrenData.data (misma lógica que MRRP41)
      const cdata = childrenData.data;
      let added = false;

      for (let i = 0; i < cdata.length; i++) {
        // ¿Este array corresponde al niño?
        if (cdata[i].some((obj) => obj.id === mrrp42Obj.id)) {
          // ¿Ya existe un 4.2?
          const idx = cdata[i].findIndex((obj) => obj.key === "4.2");

          if (idx !== -1) {
            // Reemplazar
            cdata[i][idx] = mrrp42Obj;
          } else {
            // Insertar
            cdata[i].push(mrrp42Obj);
          }

          added = true;
          break;
        }
      }
    } catch (err) {
      console.error("❌ Error al hacer fetch de MRRP42:", err);
    }
  }

  //Ruta # 16: Verifica si en la tabla dada por tableNme esiste algun registro con id=targetId
  async function existsInTable(tableName, targetId) {
    try {
      const resp = await fetch(
        `${window.config.apiUrl}/exists/${tableName}/${targetId}`
      );
      const result = await resp.json();

      if (result.success) {
        return result.exists; // true o false
      } else {
        console.error("❌ Error en existsInTable:", result.message);
        return false;
      }
    } catch (err) {
      console.error("❌ Error en fetch existsInTable:", err);
      return false;
    }
  }

  async function cargarDatos(targetId) {
    // Todas las funciones a ejecutar
    const tareas = [
      fetchME311,
      fetchME321,
      fetchME322,
      fetchME323,
      fetchME331,
      fetchME332,
      fetchME333,
      fetchME34,
      fetchMRRP41,
      fetchMRRP42
    ];

    const total = tareas.length;
    let completadas = 0;

    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    // Mostrar barra
    progressContainer.style.display = "block";
    progressText.style.display = "inline";
    progressText.textContent = "0%";

    // Ejecutar tareas secuencialmente (una tras otra)
    for (const tarea of tareas) {
      try {
        await tarea(targetId); // Ejecuta cada función
      } catch (err) {
        console.error(`❌ Error en ${tarea.name}:`, err);
      }

      // Actualizar progreso
      completadas++;
      const porcentaje = Math.round((completadas / total) * 100);
      progressBar.style.width = `${porcentaje}%`;
      progressText.textContent = `${porcentaje}%`;

      // Pequeña pausa visual opcional (100–200 ms)
      await new Promise((r) => setTimeout(r, 100));
    }

    // Al terminar
    progressText.textContent = "✅ Completado";
    progressBar.style.background = "linear-gradient(90deg, #2196f3, #64b5f6)";

    // Ocultar tras un momento (opcional)
    setTimeout(() => {
      progressContainer.style.display = "none";
      progressText.style.display = "none";
    }, 1500);
  }

  async function cargarPersona(identidadNumero) {
    try {
      if (!/^\d{11}$/.test(identidadNumero)) {
        throw new Error("El número de identidad debe tener 11 dígitos");
      }

      // URL simplificada para el endpoint del backend que maneja token
      const url = `${window.config.apiUrl}/personas/${identidadNumero}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener los datos: ${response.status}`);
      }

      const persona = await response.json();
      console.log("Datos recibidos:", persona);
      return persona;
    } catch (error) {
      console.error("Error en fetch:", error);
      return null;
    }
  }

  // ************************************************************
  function base64ToUint8Array(base64) {
    const raw = atob(base64);
    const uint8Arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      uint8Arr[i] = raw.charCodeAt(i);
    }
    return uint8Arr;
  }

  document.addEventListener("selectsubjectsevent", async () => {
    subjLlenarTabla();
    subjOpenModal();
  });

  // Click simple para mostrar foto
  subjTbody.addEventListener("click", async (e) => {
    const tr = e.target.closest("tr");
    if (!tr) return;

    const dni = tr.querySelector("td:first-child").textContent;
    const fotoBase64 = await obtenerFotoChild(dni); // tu función que devuelve la foto
    const photoBox = document.getElementById("subj-photo-box");

    if (fotoBase64) {
      photoBox.innerHTML = `<img src="${fotoBase64}" 
                              alt="Foto del sujeto" 
                              style="width:100px;height:100px;border-radius:10px;object-fit:cover;">`;
    } else {
      photoBox.innerHTML = `<div style="width:100px;height:100px;border:1px solid #ccc;">Sin foto</div>`;
    }
  });

  // Doble clic para copiar DNI
  subjTbody.addEventListener("dblclick", (e) => {
    const tr = e.target.closest("tr");
    if (!tr) return;
    document.getElementById("subj-tarjeta-input").value =
      tr.querySelector("td:first-child").textContent;
  });

  // Mouseover para miniatura (opcional)
  subjTbody.addEventListener("mouseover", (e) => {
    const tr = e.target.closest("tr");
    if (!tr) return;
    const dni = tr.querySelector("td:first-child").textContent;
    const child = childData.find((c) => c.dni === dni); // childData: tu array de niños
    const photoBox = document.getElementById("subj-photo-box");

    if (child && child.photo) {
      photoBox.innerHTML = `<img src="${child.photo}" style="width:50px;height:50px;">`;
    } else {
      photoBox.innerHTML = "";
    }
  });

  $(document).on("updatetreeevent", function (e) {
    resetTable();
    actualizarRootContentConFoto(
      childrenData.dni,
      childrenData.fullname,
      childrenData.photo
    );
    actualizarTabla();
  });

  window.addEventListener("beforeunload", function (e) {
    // e.preventDefault();
    localStorage.removeItem("currentUser");
  });
});
