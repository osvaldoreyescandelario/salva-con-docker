// ==================================
// Diccionario de controles
// ==================================
const sinonimosControles = {
  "tarjeta": "mgi-carnet",
  "carnet": "mgi-carnet",
  "nombre": "mgi-nombre",
  "fecha nacimiento": "mgi-fechaNacimiento",
  "edad": "mgi-edad",
  "meses": "mgi-edadMeses",
  "sexo": "mgi-sexo",
  "color piel": "mgi-colorPiel",
  "direccion": "mgi-direccion",
  "provincia": "mgi-provincia",
  "municipio": "mgi-municipio",
  "consejo": "mgi-consejo",
  "zona": "mgi-zona",
  "responsable": "mgi-responsable",
  "relacion": "mgi-relacion",
  "cual relacion": "mgi-relacionCual",
  "telefono": "mgi-telefono",
  "fecha inicio": "mgi-fechaInicio",
  "nivel educativo": "mgi-nivelEducativo",
  "grado": "mgi-grado",
  "institucion": "mgi-institucion",
  "cual institucion": "mgi-institucionCual",
  "repitencia": "mgi-repitencia",
  "repite por": "mgi-repitePor",
  "objetivos": "mgi-objetivos"
};

let controlsOrden = Object.values(sinonimosControles);
let controlActual = null;
let tarjetaAcumulada = "";

// ==================================
// Funciones de navegación
// ==================================
function enfocarControl(id) {
  const campo = document.getElementById(id);
  if (!campo) return;
  campo.focus();
  controlActual = id;
  console.log("🔹 Enfocado:", id);
}

function irAlSiguienteControl() {
  let index = controlsOrden.indexOf(controlActual);
  if (index < 0 || index === controlsOrden.length - 1) return;
  enfocarControl(controlsOrden[index + 1]);
  if (controlsOrden[index + 1] === "mgi-carnet") tarjetaAcumulada = "";
}

function irAlAnteriorControl() {
  let index = controlsOrden.indexOf(controlActual);
  if (index <= 0) return;
  enfocarControl(controlsOrden[index - 1]);
  if (controlsOrden[index - 1] === "mgi-carnet") tarjetaAcumulada = "";
}

function borrarControlActual() {
  const campo = document.getElementById(controlActual);
  if (!campo) return;

  if (campo.tagName === "INPUT" || campo.tagName === "TEXTAREA") {
    campo.value = "";
    if (controlActual === "mgi-carnet") tarjetaAcumulada = "";
  } else if (campo.tagName === "SELECT") {
    campo.selectedIndex = 0;
  } else if (campo.type === "radio") {
    let radios = document.getElementsByName(campo.name);
    radios.forEach(r => r.checked = false);
  }
}

// ==================================
// Función para llenar control por voz
// ==================================
function llenarControlActual(transcript) {
  if (!controlActual) return;
  const campo = document.getElementById(controlActual);
  if (!campo) return;

  transcript = transcript.toLowerCase();

  // Comandos especiales que terminan la edición en inputs de texto
  if ((["ok","okay","fin","siguiente"].includes(transcript) && (campo.tagName === "INPUT" || campo.tagName === "TEXTAREA"))) {
    if (controlActual === "mgi-carnet") tarjetaAcumulada = "";
    irAlSiguienteControl();
    return;
  }
  if ((transcript === "atras" || transcript === "atrás") && (campo.tagName === "INPUT" || campo.tagName === "TEXTAREA")) {
    irAlAnteriorControl();
    return;
  }
  if (transcript === "borra" && (campo.tagName === "INPUT" || campo.tagName === "TEXTAREA")) {
    borrarControlActual();
    return;
  }

  // Tarjeta/carnet (número largo por partes)
  if (controlActual === "mgi-carnet") {
    const mapNumeros = {
      "cero":"0","uno":"1","dos":"2","tres":"3","cuatro":"4","cinco":"5",
      "seis":"6","siete":"7","ocho":"8","nueve":"9"
    };
    const partes = transcript.split(" ");
    let numeros = partes.map(p => mapNumeros[p] ?? p).join("");
    tarjetaAcumulada += numeros;
    campo.value = tarjetaAcumulada;
    return;
  }

  // Campos de texto acumulativos
  if (["mgi-direccion","mgi-responsable","mgi-institucionCual"].includes(controlActual)) {
    campo.value += (campo.value ? " " : "") + transcript;
    return;
  }

  // Radios y checkboxes simples
  if (campo.type === "radio") {
    let radios = document.getElementsByName(campo.name);
    radios.forEach(r => {
      if (transcript.includes(r.value.toLowerCase())) r.checked = true;
    });
    return;
  }

  // Select especial: nivel educativo
  if (controlActual === "mgi-nivelEducativo") {
    if (transcript.includes("infancia")) campo.value = "Primera Infancia (PI)";
    else if (transcript.includes("primaria")) campo.value = "Educación Primaria (EP)";
    else if (transcript.includes("secundaria")) campo.value = "Secundaria Básica (SB)";
    else if (transcript.includes("preuniversitario")) campo.value = "Preuniversitario (IPU)";
    else if (transcript.includes("tecnica")) campo.value = "Educación Técnica (ETP)";
    else if (transcript.includes("oficio")) campo.value = "Escuela de Oficio (EO)";
    return;
  }

  // Select especial: institución
  if (controlActual === "mgi-institucion") {
    if (transcript.includes("institucional") || transcript.includes("institución")) {
      campo.value = "Institucional";
      document.getElementById("mgi-institucionCual").disabled = false;
    } else if (transcript.includes("no institucional")) campo.value = "No institucional (PETH)";
    else if (transcript.includes("ninguna")) campo.value = "No recibe atención educativa";
    return;
  }

  // Otros campos de texto simples
  campo.value = transcript;
}

// ==================================
// Configuración de reconocimiento de voz
// ==================================
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = "es-ES";

recognition.onresult = function(event) {
  let transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
  transcript = transcript.replace(/[.,;:!?]/g,"");
  if (!transcript) return;
  console.log("🎤 Reconocido:", transcript);

  // Ir a control por nombre
  if (transcript in sinonimosControles) { 
    enfocarControl(sinonimosControles[transcript]); 
    return; 
  }

  // Llenar control actual (y comandos especiales de salida se procesan dentro de llenarControlActual)
  llenarControlActual(transcript);
};

function iniciarVoz() {
  try { recognition.start(); } catch(e){ console.log(e); }
}

function detenerVoz() {
  try { recognition.stop(); } catch(e){ console.log(e); }
}

// ==================================
// Eventos del modal
// ==================================
$('#mgi-formModal').on('shown.bs.modal', function () {
  enfocarControl("mgi-carnet");
  iniciarVoz();
});

$('#mgi-formModal').on('hidden.bs.modal', function () {
  detenerVoz();
});
