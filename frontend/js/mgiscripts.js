import { childrenData, childCloned, exportFormToPDF } from "./definitions.js";
import { dataFromFUC, resetTable } from "./main.js";

export const municipiosPorProvincia = {
  "Pinar del Río": [
    "Consolación del Sur",
    "Guane",
    "La Palma",
    "Los Palacios",
    "Mantua",
    "Minas de Matahambre",
    "Pinar del Río",
    "San Juan y Martínez",
    "San Luis",
    "Sandino",
    "Viñales"
  ],
  Artemisa: [
    "Alquízar",
    "Artemisa",
    "Bauta",
    "Caimito",
    "Guanajay",
    "Güira de Melena",
    "Mariel",
    "San Antonio de los Baños",
    "Bahía Honda",
    "San Cristóbal",
    "Candelaria"
  ],
  Mayabeque: [
    "Batabanó",
    "Bejucal",
    "Güines",
    "Jaruco",
    "Madruga",
    "Melena del Sur",
    "Nueva Paz",
    "Quivicán",
    "San José de las Lajas",
    "San Nicolás de Bari",
    "Santa Cruz del Norte"
  ],
  "La Habana": [
    "Arroyo Naranjo",
    "Boyeros",
    "Centro Habana",
    "Cerro",
    "Cotorro",
    "Diez de Octubre",
    "Guanabacoa",
    "Habana del Este",
    "Habana Vieja",
    "La Lisa",
    "Marianao",
    "Playa",
    "Plaza de la Revolución",
    "Regla",
    "San Miguel del Padrón"
  ],
  Matanzas: [
    "Calimete",
    "Cárdenas",
    "Ciénaga de Zapata",
    "Colón",
    "Jagüey Grande",
    "Jovellanos",
    "Limonar",
    "Los Arabos",
    "Martí",
    "Matanzas",
    "Pedro Betancourt",
    "Perico",
    "Unión de Reyes"
  ],
  "Villa Clara": [
    "Caibarién",
    "Camajuaní",
    "Cifuentes",
    "Corralillo",
    "Encrucijada",
    "Manicaragua",
    "Placetas",
    "Quemado de Güines",
    "Ranchuelo",
    "Remedios",
    "Sagua la Grande",
    "Santa Clara",
    "Santo Domingo"
  ],
  Cienfuegos: [
    "Abreus",
    "Aguada de Pasajeros",
    "Cienfuegos",
    "Cruces",
    "Cumanayagua",
    "Palmira",
    "Rodas",
    "Lajas"
  ],
  "Sancti Spíritus": [
    "Cabaiguán",
    "Fomento",
    "Jatibonico",
    "La Sierpe",
    "Sancti Spíritus",
    "Taguasco",
    "Trinidad",
    "Yaguajay"
  ],
  "Ciego de Ávila": [
    "Ciro Redondo",
    "Baraguá",
    "Bolivia",
    "Chambas",
    "Ciego de Ávila",
    "Florencia",
    "Majagua",
    "Morón",
    "Primero de Enero",
    "Venezuela"
  ],
  Camagüey: [
    "Camagüey",
    "Carlos Manuel de Céspedes",
    "Esmeralda",
    "Florida",
    "Guáimaro",
    "Jimaguayú",
    "Minas",
    "Najasa",
    "Nuevitas",
    "Santa Cruz del Sur",
    "Sibanicú",
    "Sierra de Cubitas",
    "Vertientes"
  ],
  "Las Tunas": [
    "Amancio",
    "Colombia",
    "Jesús Menéndez",
    "Jobabo",
    "Las Tunas",
    "Majibacoa",
    "Manatí",
    "Puerto Padre"
  ],
  Holguín: [
    "Antilla",
    "Báguanos",
    "Banes",
    "Cacocum",
    "Calixto García",
    "Cueto",
    "Frank País",
    "Gibara",
    "Holguín",
    "Mayarí",
    "Moa",
    "Rafael Freyre",
    "Sagua de Tánamo",
    "Urbano Noris"
  ],
  Granma: [
    "Bartolomé Masó",
    "Bayamo",
    "Buey Arriba",
    "Campechuela",
    "Cauto Cristo",
    "Guisa",
    "Jiguaní",
    "Manzanillo",
    "Media Luna",
    "Niquero",
    "Pilón",
    "Río Cauto",
    "Yara"
  ],
  "Santiago de Cuba": [
    "Contramaestre",
    "Guamá",
    "Julio Antonio Mella",
    "Palma Soriano",
    "San Luis",
    "Santiago de Cuba",
    "Segundo Frente",
    "Songo la Maya",
    "Tercer Frente"
  ],
  Guantánamo: [
    "Baracoa",
    "Caimanera",
    "El Salvador",
    "Guantánamo",
    "Imías",
    "Maisí",
    "Manuel Tames",
    "Niceto Pérez",
    "San Antonio del Sur",
    "Yateras"
  ],
  "Isla de la Juventud": ["Municipio especial Isla de la Juventud"]
};

const Curse = {
  "Primera Infancia (PI)": ["1", "2", "3", "4", "5", "6"],
  "Educación Primaria (EP)": ["1", "2", "3", "4", "5", "6"],
  "Secundaria Básica (SB)": ["7", "8", "9"],
  "Preuniversitario (IPU)": ["10", "11", "12"],
  "Educación Técnica (ETP)": ["1", "2", "3", "4"],
  "Escuela de Oficio (EO)": ["1", "2"]
};

function resetAndCloneFormularie() {
  const form = document.getElementById("mgi-formMenor");
  if (!form) return;

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    const type = input.type.toLowerCase();

    switch (input.id) {
      case "mgi-carnet":
        input.value = childrenData.dni || "";
        break;
      case "mgi-nombre":
        input.value = childrenData.fullname || "";
        break;
      case "mgi-sexoF":
        input.checked = childrenData.sex === "F";
        break;
      case "mgi-sexoM":
        input.checked = childrenData.sex === "M";
        break;
      case "mgi-colorPiel":
        input.value = childrenData.skincolor || "";
        break;
      default:
        if (type === "checkbox" || type === "radio") {
          input.checked = false;
        } else if (input.tagName.toLowerCase() === "select") {
          input.selectedIndex = 0; // selecciona la opción por defecto
        } else {
          input.value = "";
        }
    }
  });

  // Opcionales: deshabilitar campos que originalmente estaban deshabilitados
  const disabledFields = [
    "mgi-relacionCual",
    "mgi-institucionCual",
    "mgi-objSi",
    "mgi-objNo",
    "mgi-objNo"
  ];
  disabledFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
}

let currentId = 0;
function findObjectByKeyAndId(data, keyToFind, idToFind) {
  if (!Array.isArray(data)) return null;

  for (const subArray of data) {
    if (!Array.isArray(subArray)) continue;

    const found = subArray.find((item) => {
      if (!item || typeof item !== "object") return false;

      // Convertimos id a string para evitar problemas de tipo (num vs string)
      const sameId = String(item.id) === String(idToFind);
      const sameKey = item.key === keyToFind;

      return sameKey && sameId;
    });

    if (found) return found;
  }

  return null; // si no se encontró nada
}

function createOrGetMgiObj(childrenData, existingId = 0) {
  if (!childrenData.data) childrenData.data = [];

  let mgiObj = null;

  // 1️⃣ Buscar objeto existente
  for (const group of childrenData.data) {
    if (!Array.isArray(group)) continue;
    const found = group.find(
      (obj) => obj.key === "2.1" && String(obj.id) === String(existingId)
    );
    if (found) {
      mgiObj = found;
      break;
    }
  }

  // 2️⃣ Si no existe, crear uno nuevo
  if (!mgiObj) {
    // Buscar subarreglo donde no haya otro "2.1"
    let targetGroup = childrenData.data.find(
      (group) => Array.isArray(group) && !group.some((obj) => obj.key === "2.1")
    );

    if (!targetGroup) {
      targetGroup = [];
      childrenData.data.push(targetGroup);
    }

    // Crear objeto con todos los campos y key="2.1"
    mgiObj = {
      key: "2.1",
      id: existingId,
      cage: "",
      mage: "",
      address: "",
      province: "",
      municipality: "",
      councill: "",
      zone: "",
      personincharge: "",
      parentalrelationship: "",
      anotherrelation: "",
      tel: "",
      startdate: "",
      edulevel: "",
      degree: "",
      eduinstitution: "",
      institution: "",
      repetition: 0,
      repetitioncount: "",
      objovercome: 0,
      savedate: "",
      username: currentUser.userid
    };

    targetGroup.push(mgiObj);
    console.log(`🆕 Se creó nuevo objeto MGI con id=${existingId}`);
  } else {
    console.log(`✏️ Objeto existente encontrado con id=${existingId}`);
  }

  return mgiObj;
}

export function openMgiModal(Id) {
  const modalEl = $("#mgi-formModal");
  const form = document.getElementById("mgi-formMenor");

  currentId = Id;
  // Id=0 nuevo -> salvar
  // Id !=0 -> actualizar

  // === FOTO DEL NIÑO ===
  const fotoCuadro = document.getElementById("mgi-fotoCuadro");

  // Si existe la foto (desde MySQL como base64 o buffer)
  if (childrenData.photo) {
    // Si viene como buffer (por ejemplo desde Node.js)
    let fotoSrc;

    if (typeof childrenData.photo === "object" && childrenData.photo.data) {
      // Si viene como objeto tipo Buffer
      const base64String = btoa(
        new Uint8Array(childrenData.photo.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      fotoSrc = `data:image/jpeg;base64,${base64String}`;
    } else if (typeof childrenData.photo === "string") {
      // Ya viene como data:image/...
      fotoSrc = childrenData.photo;
    }
    // } else if (typeof childrenData.photo === "string") {

    //   fotoSrc = `data:image/jpeg;base64,${childrenData.photo}`;
    // }

    // Insertar imagen en el cuadro
    fotoCuadro.innerHTML = `<img src="${fotoSrc}" alt="Foto del niño" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    // Si no hay foto, mostrar texto "Foto"
    fotoCuadro.innerHTML = `<span style="font-size: 0.8rem; color: #888;">Foto</span>`;
  }

  form.querySelector("#mgi-carnet").value = childrenData.dni || "";

  // Limpiar validaciones y formulario
  form.classList.remove("was-validated");
  form.reset();

  form.querySelector("#mgi-carnet").value = childrenData.dni || "";

  // --- 2. Tomar los campos globales de childrenData
  form.querySelector("#mgi-carnet").value = childrenData.dni || "";
  form.querySelector("#mgi-nombre").value = childrenData.fullname || "";
  form.querySelector("#mgi-fechaNacimiento").value = childrenData.birthdate
    ? childrenData.birthdate.split("T")[0]
    : "";

  // Sexo
  if (childrenData.sex === "F") {
    form.querySelector("#mgi-sexoF").checked = true;
  } else if (childrenData.sex === "M") {
    form.querySelector("#mgi-sexoM").checked = true;
  }

  // Color de piel
  // form.querySelector("#mgi-colorPiel").value = childrenData.skincolor || "";
  const colorInput = form.querySelector("#mgi-colorPiel");
  const colorValue = childrenData.skincolor || "";
  // Buscar opción que coincida (ignorando mayúsculas/minúsculas)
  const match = Array.from(colorInput.options).find(
    (opt) => opt.value.toLowerCase() === colorValue.toLowerCase()
  );
  if (match) {
    colorInput.value = match.value; // asigna el valor exacto del option
  } else {
    colorInput.value = ""; // o valor por defecto
  }

  // --- 3. Buscar el objeto correspondiente a mgi en childrenData.data
  if (currentId === 0) {
    createOrGetMgiObj(childrenData, currentId);
  } else {
    // --- Buscar objeto dentro de childrenData.data
    const mgiObj = findObjectByKeyAndId(childrenData.data, "2.1", currentId);

    if (!mgiObj) {
      throw new Error(`No se encontró objeto con key='2.1' y id=${currentId}`);
    }

    //console.log("✅ Objeto encontrado:", mgiObj);
    // --- 4. Inicializar campos dependientes del objeto mgi[id]
    form.querySelector("#mgi-edad").value = mgiObj.cage ?? "";
    form.querySelector("#mgi-edadMeses").value = mgiObj.mage ?? "";
    form.querySelector("#mgi-direccion").value = mgiObj.address || "";

    // Provincia
    const selProv = form.querySelector("#mgi-provincia");
    selProv.value = mgiObj.province || "";

    // Municipio: llenar opciones en base a la provincia
    const selMuni = form.querySelector("#mgi-municipio");
    selMuni.innerHTML = '<option value="">--Seleccione--</option>'; // limpiar
    if (mgiObj.province && municipiosPorProvincia[mgiObj.province]) {
      municipiosPorProvincia[mgiObj.province].forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        selMuni.appendChild(opt);
      });
    }
    selMuni.value = mgiObj.municipality || "";

    form.querySelector("#mgi-consejo").value = mgiObj.councill || "";

    // Zona
    if (mgiObj.zone === "Rural") {
      form.querySelector("#mgi-zonaRural").checked = true;
    } else {
      form.querySelector("#mgi-zonaUrbana").checked = true;
    }

    form.querySelector("#mgi-responsable").value = mgiObj.personincharge || "";
    form.querySelector("#mgi-relacion").value =
      mgiObj.parentalrelationship || "";
    form.querySelector("#mgi-relacionCual").value =
      mgiObj.anotherrelation || "";
    form.querySelector("#mgi-telefono").value = mgiObj.tel || "";
    form.querySelector("#mgi-fechaInicio").value = mgiObj.startdate || "";
    form.querySelector("#mgi-nivelEducativo").value = mgiObj.edulevel || "";
    form.querySelector("#mgi-grado").value = mgiObj.degree || "";
    form.querySelector("#mgi-institucion").value = mgiObj.eduinstitution || "";
    form.querySelector("#mgi-institucionCual").value = mgiObj.institution || "";

    // Repetición
    const repSiRadio = form.querySelector("#mgi-repSi");
    const repNoRadio = form.querySelector("#mgi-repNo");
    if (mgiObj.repetition === 1) {
      repSiRadio.checked = true;
    } else {
      repNoRadio.checked = true;
    }
    form.querySelector("#mgi-repitePor").value = mgiObj.repetitioncount || "";

    // --- Objetivos vencidos
    const objSi = form.querySelector("#mgi-objSi");
    const objNo = form.querySelector("#mgi-objNo");

    // Habilitar solo si repSi está marcado
    const repSiChecked = repSiRadio.checked;
    objSi.disabled = !repSiChecked;
    objNo.disabled = !repSiChecked;

    if (repSiChecked) {
      if (mgiObj.objovercome === 0) {
        objNo.checked = true;
      } else {
        objSi.checked = true;
      }
    } else {
      objSi.checked = false;
      objNo.checked = false;
    }
  }

  // --- 5. Mostrar modal
  modalEl.modal("show");

  // Enfocar el primer input
  setTimeout(() => {
    const first = form.querySelector("input, select, textarea");
    if (first) first.focus();
  }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("mgi-formMenor");
  const guardarBtn = document.getElementById("mgi-guardarBtn");
  const modalEl = $("#mgi-formModal");

  const dni = document.getElementById("mgi-carnet");
  const fechaNacimientoEl = document.getElementById("mgi-fechaNacimiento");
  const edadEl = document.getElementById("mgi-edad");
  const edadMesesEl = document.getElementById("mgi-edadMeses");

  const nivelSelect = document.getElementById("mgi-nivelEducativo");
  const gradoSelect = document.getElementById("mgi-grado");
  // const repitenciaRadios = document.getElementsByName('repitencia');
  const repitenciaRadios = document.querySelectorAll(
    'input[name="repitencia"]'
  );
  const repitePorSelect = document.getElementById("mgi-repitePor");

  const provinciaSelect = document.getElementById("mgi-provincia");
  const municipioSelect = document.getElementById("mgi-municipio");

  const relacionSelect = document.getElementById("mgi-relacion");
  const relacionCualInput = document.getElementById("mgi-relacionCual");

  const institucionSelect = document.getElementById("mgi-institucion");
  const institucionCualInput = document.getElementById("mgi-institucionCual");

  const dniError = document.getElementById("dni-error"); // ⬅️ Aquí defines la variable

  dni.addEventListener("blur", function () {
    const valor = dni.value.trim();

    if (!/^\d{11}$/.test(valor)) {
      alert("⚠️ El carnet debe tener 11 dígitos.");
      return;
    }

    const yy = Number.parseInt(valor.substring(0, 2), 10),
      mm = Number.parseInt(valor.substring(2, 4), 10),
      dd = Number.parseInt(valor.substring(4, 6), 10);

    const yyyy = 2000 + yy;
    const fecha = new Date(yyyy, mm - 1, dd);

    if (
      fecha.getFullYear() !== yyyy ||
      fecha.getMonth() + 1 !== mm ||
      fecha.getDate() !== dd
    ) {
      alert("⚠️ Fecha en el carnet inválida.");
      return;
    }

    // Rellenar fecha y edades
    fechaNacimientoEl.value = fecha.toISOString().split("T")[0];
    const hoy = new Date();

    let edadAnios = hoy.getFullYear() - fecha.getFullYear();
    if (
      hoy.getMonth() < fecha.getMonth() ||
      (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())
    ) {
      edadAnios--;
    }

    let edadMeses =
      (hoy.getFullYear() - fecha.getFullYear()) * 12 +
      (hoy.getMonth() - fecha.getMonth());
    if (hoy.getDate() < fecha.getDate()) edadMeses--;

    edadEl.value = edadAnios;
    edadMesesEl.value = edadMeses;
  });

  relacionSelect.addEventListener("change", function () {
    if (this.value === "Otro") {
      relacionCualInput.disabled = false; // Habilitar
    } else {
      relacionCualInput.disabled = true; // Deshabilitar
      relacionCualInput.value = ""; // Limpiar campo
    }
  });

  institucionSelect.addEventListener("change", function () {
    if (this.value === "Institucional") {
      institucionCualInput.disabled = false; // Habilitar
    } else {
      institucionCualInput.disabled = true; // Deshabilitar
      institucionCualInput.value = ""; // Limpiar campo
    }
  });

  function calcularEdad(fechaStr) {
    if (!fechaStr) return null;
    const hoy = new Date();
    const fn = new Date(fechaStr);
    if (Number.isNaN(fn.getTime())) return null;
    let meses =
      (hoy.getFullYear() - fn.getFullYear()) * 12 +
      (hoy.getMonth() - fn.getMonth());
    if (hoy.getDate() < fn.getDate()) meses -= 1;
    if (meses < 0) meses = 0;
    const anosFloor = Math.floor(meses / 12);
    const mesesResto = meses % 12;
    return { anos: anosFloor, meses: mesesResto, totalMeses: meses };
  }

  // Asigna un único listener a cada radio
  repitenciaRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      // Encontrar cuál está seleccionado
      const seleccionado = document.querySelector(
        'input[name="repitencia"]:checked'
      );
      console.log(
        "Seleccionado:",
        seleccionado ? seleccionado.value : "ninguno"
      );

      if (seleccionado.value === "Si") {
        seleccionado.value = "Sí";
      }
      // Aquí pones tu lógica (ej: habilitar/deshabilitar select Repite por)
      actualizarRepitePor();
    });
  });

  function actualizarGrados() {
    let inhabilitar = false;
    repitenciaRadios.forEach((radio) => {
      radio.disabled = inhabilitar ? true : false;
      if (inhabilitar) radio.checked = false;
    });
    const nivel = nivelSelect.value;
    gradoSelect.innerHTML = '<option value="">Seleccione grado...</option>';
    if (nivel && Curse[nivel]) {
      Curse[nivel].forEach((grado) => {
        const option = document.createElement("option");
        option.value = grado;
        option.textContent = grado;
        gradoSelect.appendChild(option);
      });
    }
    actualizarRepitencia();
    actualizarRepitePor();
  }

  function actualizarRepitencia() {
    const nivel = nivelSelect.value;
    const grado = gradoSelect.value;
    let inhabilitar = false;

    // NUEVA LÓGICA: inhabilitar si PI o EP con grado 1 o 3
    if (nivel === "Primera Infancia (PI)") {
      inhabilitar = true;
    } else if (
      nivel === "Educación Primaria (EP)" &&
      (grado === "" || grado === "1" || grado === "3")
    ) {
      inhabilitar = true;
    }

    repitenciaRadios.forEach((radio) => {
      radio.disabled = inhabilitar ? true : false;
      if (inhabilitar) radio.checked = false;
    });

    actualizarRepitePor();
  }

  function actualizarRepitePor() {
    const nivel = nivelSelect.value;
    const grado = gradoSelect.value;
    const radioSi = Array.from(repitenciaRadios).find((r) => r.value === "Sí");
    const objetivosInputs = document.querySelectorAll(
      '#objetivosDiv input[type="radio"]'
    );

    if (
      radioSi &&
      !radioSi.disabled &&
      radioSi.checked &&
      nivel === "Educación Primaria (EP)" &&
      (grado === "2" || grado === "4")
    ) {
      repitePorSelect.disabled = false;
      objetivosInputs.forEach((input) => (input.disabled = false));
    } else {
      repitePorSelect.disabled = true;
      repitePorSelect.value = "";
      objetivosInputs.forEach((input) => {
        input.disabled = true;
        input.checked = false; // opción: desmarcar al deshabilitar
      });
    }
  }

  // ============================
  // Event Listeners
  // ============================

  if (fechaNacimientoEl) {
    fechaNacimientoEl.addEventListener("change", function () {
      const e = calcularEdad(fechaNacimientoEl.value);
      if (e) {
        if (edadEl) edadEl.value = e.anos;
        if (edadMesesEl) edadMesesEl.value = e.totalMeses;
      }
    });
  }

  if (nivelSelect) nivelSelect.addEventListener("change", actualizarGrados);
  if (gradoSelect) gradoSelect.addEventListener("change", actualizarRepitencia);

  // Provincias y municipios
  if (provinciaSelect && municipioSelect) {
    provinciaSelect.innerHTML =
      "<option value='' disabled selected>Seleccione una provincia</option>";
    Object.keys(municipiosPorProvincia).forEach((prov) => {
      const opt = document.createElement("option");
      opt.value = prov;
      opt.textContent = prov;
      provinciaSelect.appendChild(opt);
    });

    provinciaSelect.addEventListener("change", function () {
      municipioSelect.innerHTML =
        "<option value='' disabled selected>Seleccione un municipio</option>";
      if (municipiosPorProvincia[this.value]) {
        municipiosPorProvincia[this.value].forEach((mun) => {
          const opt = document.createElement("option");
          opt.value = mun;
          opt.textContent = mun;
          municipioSelect.appendChild(opt);
        });
      }
    });
  }

  // Validación del formulario
  function validarFormulario() {
    if (!form) return false;
    if (form.checkValidity() === false) {
      form.classList.add("was-validated");
      return false;
    }
    return true;
  }

  //Mapea o hace corresppnder los nombre de los controles en el formulario con los de la variable childrenData
  function mapDatosToChildrenData(datos, existingId = 0, childrenData = null) {
    // Asegurar estructura base
    if (!childrenData || !Array.isArray(childrenData.data)) {
      childrenData = { data: [] };
    }

    // 🧩 Normaliza una fecha a formato YYYY-MM-DD
    const toDateOnly = (value) => {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d)) return "";
      return d.toISOString().split("T")[0];
    };

    let mgiObj = null;

    // 🔍 1️⃣ Buscar el objeto con key="2.1" e id=existingId
    for (const group of childrenData.data) {
      if (Array.isArray(group)) {
        const found = group.find(
          (obj) => obj.key === "2.1" && String(obj.id) === String(existingId)
        );

        if (found) {
          mgiObj = found;
          break;
        }
      }
    }

    // 🆕 2️⃣ Si no existe, crear uno nuevo y añadirlo en un grupo sin otro "2.1"
    if (!mgiObj) {
      // Buscar un subarreglo donde no haya ningún objeto con key="2.1"
      let targetGroup = childrenData.data.find(
        (group) =>
          Array.isArray(group) && !group.some((obj) => obj.key === "2.1")
      );

      // Si no hay grupo adecuado, se crea uno nuevo
      if (!targetGroup) {
        targetGroup = [];
        childrenData.data.push(targetGroup);
      }

      // Crear el nuevo objeto asegurando id=existingId
      mgiObj = { key: "2.1", id: existingId };
      targetGroup.push(mgiObj);

      console.log(
        `🆕 Se creó nuevo objeto MGI con key='2.1' e id=${existingId}`
      );
    } else {
      console.log(
        `✏️ Se actualizó objeto existente con key='2.1' e id=${existingId}`
      );
    }

    // ✨ 3️⃣ Actualizar/llenar los campos del objeto MGI
    Object.assign(mgiObj, {
      dni: datos.carnet || "",
      cage: datos.edad || "",
      mage: datos.edadMeses || "",
      address: datos.direccion || "",
      province: datos.provincia || "",
      municipality: datos.municipio || "",
      councill: datos.consejo || "",
      zone: datos.zona || "",
      personincharge: datos.responsable || "",
      parentalrelationship: datos.relacion || "",
      anotherrelation: datos.relacionCual || "",
      tel: datos.telefono || "",
      startdate: datos.fechaInicio || "",
      edulevel: datos.nivelEducativo || "",
      degree: datos.grado || "",
      eduinstitution: datos.institucion || "",
      institution: datos.institucionCual || "",
      repetition: datos.repitencia === "Sí" ? 1 : 0,
      repetitioncount: datos.repitePor || "",
      objovercome: datos.objetivos === "Sí" ? 1 : 0,
      savedate: toDateOnly(datos.savedate),
      username: currentUser.userid
    });

    // 🧩 4️⃣ Actualizar los datos generales del niño
    Object.assign(childrenData, {
      dni: datos.carnet || "",
      fullname: datos.nombre || "",
      birthdate: toDateOnly(datos.fechaNacimiento),
      sex: datos.sexo || "",
      skincolor: datos.colorPiel || "",
      savedate: toDateOnly(datos.savedate),
      usernane: currentUser.userid
    });

    return childrenData;
  }

  function uint8ToBase64(uint8Arr) {
    let binary = "";
    const len = uint8Arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Arr[i]);
    }
    return btoa(binary);
  }

  // Ruta # 9: salvar los datos mgi. Se utiliza en mgiscripts.js
  async function saveChildren() {
    // childrenData.data.forEach(group => {
    //   if (Array.isArray(group)) {
    //     group.forEach(obj => {
    //       if (obj.pdf && obj.pdf.data && obj.pdf.data instanceof Uint8Array) {
    //         obj.pdf.data = uint8ToBase64(obj.pdf.data);
    //       }
    //     });
    //   }
    // });

    try {
      const response = await fetch(`${window.config.apiUrl}/savechild`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(childrenData) // 👈 Solo enviamos childrenData
      });

      const result = await response.json();
      console.log("result:", result);

      if (result.success) {
        console.log("✅ Guardado exitoso");

        // Actualizar el id en memoria si el insert fue correcto
        for (const group of childrenData.data) {
          if (!Array.isArray(group)) continue;
          const obj = group.find((o) => o.key === "2.1" && o.id === 0);
          if (obj) {
            obj.id = result.insertedId;
            console.log("🔄 ID actualizado:", obj);
            break;
          }
        }
      } else {
        console.error("❌ Error en el guardado:", result.message);
      }
    } catch (err) {
      console.error("⚠️ Error en fetch saveChildren:", err);
    }
  }

  //Ruta 11: actualiza losa datos en las tablas childrenfixed y childrenvar
  async function updateChildren(childrenData, currentId) {
    // childrenData.data.forEach(group => {
    //     if (Array.isArray(group)) {
    //       group.forEach(obj => {
    //         if (obj.pdf && obj.pdf.data && obj.pdf.data instanceof Uint8Array) {
    //           obj.pdf.data = uint8ToBase64(obj.pdf.data);
    //         }
    //       });
    //     }
    // });
    try {
      const response = await fetch(`${window.config.apiUrl}/updatechild`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentId: currentId,
          childrenData: childrenData
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Actualización exitosa");
      } else {
        console.error("❌ Error en la actualización:", result.message);
      }
    } catch (err) {
      console.error("⚠️ Error en fetch updateChildren:", err);
    }
  }

  //Captura el click en el boton de guradar. En dependencia del valor de currentId
  // realiza una actualizacion de datos ya existentes o inserta un nuevo menor
  guardarBtn.addEventListener("click", async function () {
    if (!validarFormulario()) {
      const invalid = form.querySelector(
        ".form-control:invalid, .form-check-input:invalid"
      );
      if (invalid) invalid.focus();
      return;
    }

    const datos = {};
    const formData = new FormData(form);

    form.querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.type === "radio") {
        if (el.checked) datos[el.name] = el.value;
        else if (!(el.name in datos)) datos[el.name] = "";
      } else {
        datos[el.name] = formData.get(el.name) || "";
      }
    });

    datos.savedate = new Date().toISOString().split("T")[0];
    // datos.pdf = await formToPdfInMemory('mgi-formMenor');
    // ********************************************
    // const primerosBytes = Array.from(datos.pdf.slice(0, 10));
    // console.log('Primeros bytes del PDF:', primerosBytes);
    // Deben contener los valores [37, 80, 68, 70, ...] que corresponden a '%PDF'
    // **********************************************
    mapDatosToChildrenData(datos, currentId, childrenData);
    if (currentId === 0) {
      await saveChildren();
      $(document).trigger("updatetreeevent");
    } else {
      console.log("en updateChildren childrenData: ", childrenData);
      await updateChildren(childrenData, currentId);
    }

    modalEl.modal("hide");
  });

  modalEl.on("show.bs.modal", function () {
    form.classList.remove("was-validated");
    setTimeout(() => {
      const first = form.querySelector("input, select, textarea");
      if (first) first.focus();
    }, 300);
  });

  async function exportAllFormsToSinglePDF(formIds, pdfName) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "letter"); // 📄 Tamaño carta
    const margin = 10;

    for (let i = 0; i < formIds.length; i++) {
      const formId = formIds[i];
      const form = document.getElementById(formId);

      if (!form) {
        console.warn(`Formulario con ID "${formId}" no encontrado.`);
        continue;
      }

      // Obtener el título del formulario (usa <h2>, <legend>, o data-title si existe)
      let formTitle =
        form.querySelector("h2, legend")?.innerText ||
        form.getAttribute("data-title") ||
        `Formulario ${i + 1}`;

      // Clonar el formulario para capturarlo sin afectar la UI
      const clone = form.cloneNode(true);
      clone.style.display = "block";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      document.body.appendChild(clone);

      // Copiar estado de checkboxes
      const originalChecks = form.querySelectorAll('input[type="checkbox"]');
      const cloneChecks = clone.querySelectorAll('input[type="checkbox"]');
      cloneChecks.forEach((chk, idx) => {
        chk.checked = originalChecks[idx].checked;
      });

      // Copiar selects (incluyendo multiselect)
      const originalSelects = form.querySelectorAll("select");
      const cloneSelects = clone.querySelectorAll("select");
      cloneSelects.forEach((sel, idx) => {
        for (let j = 0; j < sel.options.length; j++) {
          sel.options[j].selected = originalSelects[idx].options[j].selected;
        }
      });

      try {
        // Renderizar el formulario
        const canvas = await html2canvas(clone, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          windowWidth: document.body.scrollWidth,
          windowHeight: document.body.scrollHeight,
          logging: false
        });

        const imgData = canvas.toDataURL("image/png");

        const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
        const pdfHeight = pdf.internal.pageSize.getHeight() - 2 * margin;

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Agregar título centrado
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        const textWidth = pdf.getTextWidth(formTitle);
        pdf.text(formTitle, (pageWidth - textWidth) / 2, 15); // 📍 centrado

        // Agregar el formulario debajo del título
        const yOffset = 20; // espacio bajo el título
        pdf.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);

        // Si hay más formularios, agregar nueva página
        if (i < formIds.length - 1) pdf.addPage();
      } catch (err) {
        console.error("Error capturando el formulario:", formId, err);
      }

      // Limpiar el clon
      document.body.removeChild(clone);
    }

    pdf.save(pdfName);
  }

  function convertImageToBase64(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = url;
    });
  }

  document
    .getElementById("mgi-exportPDFBtn")
    .addEventListener("click", async () => {
      // Seleccionar la imagen del formulario
      const img = document.querySelector("#mgi-formMenor img");

      if (img) {
        // convertir a base64 para que jsPDF/html la incluya
        img.src = await convertImageToBase64(img.src);
      }
      exportFormToPDF(
        "mgi-formMenor",
        "mgi-exportPDFBtn",
        "formulario_me21.pdf"
      );
    });

  modalEl.on("hide.bs.modal", function (e) {
    console.log("El modal se está cerrando");
    if (dataFromFUC) {
      resetTable();
    }
  });
});
