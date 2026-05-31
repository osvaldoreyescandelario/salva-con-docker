import { childrenData, findObjectByKeyAndId, exportFormToPDF } from './definitions.js';
import { municipiosPorProvincia } from './mgiscripts.js';


let validme31id;
let updateme31 = false;
let edulevel = '';

// LOGICA COMUN PARA TODOS***********************************************
// 🔹 Funciones auxiliares para dropdowns
function setDropdownBtn(btnId, selectId, valores) {
    const select = document.getElementById(selectId);
    let seleccionados = [];
    
    Array.from(select.options).forEach(option => {
        option.selected = valores.includes(option.value);
        if (option.selected) seleccionados.push(option.value);
    });
    
    const btn = document.getElementById(btnId);
    if (seleccionados.length === 0) {
        btn.textContent = "Seleccione...";
    } else if (seleccionados.length === 1) {
        btn.textContent = seleccionados[0];
    } else {
        btn.textContent = `${seleccionados.length} seleccionados`;
    }
}

function resetDropdownBtn(btnId, selectId) {
    const select = document.getElementById(selectId);
    Array.from(select.options).forEach(option => option.selected = false);
    document.getElementById(btnId).textContent = "Seleccione...";
}



function attachDropdownEvents(btnId, selector) {
    document.querySelectorAll(selector).forEach(chk => {
        chk.addEventListener("change", () => {
            let seleccionados = [];
            document.querySelectorAll(selector).forEach(c => {
                if (c.checked) seleccionados.push(c.value);
            });

            const btn = document.getElementById(btnId);
            if (seleccionados.length === 0) {
                btn.textContent = "Seleccione...";
            } else if (seleccionados.length === 1) {
                btn.textContent = seleccionados[0];
            } else {
                btn.textContent = `${seleccionados.length} seleccionados`;
            }
        });
    });
}

// 🔹 Función para formatear fechas para <input type="date">
function formatDateForInput(date) {
    if (!date) return "";
    const d = new Date(date);
    // Usamos métodos UTC para evitar desfases por zona horaria
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// 🔹 Función principal: inicializa formulario ME31
function inicializarME31Form(id) {
    const me31Obj = findObjectByKeyAndId(childrenData.data, "3.1.1", id);

    const trasladoRadios = document.querySelectorAll('input[name="trasladoRadio"]');
    const trasladoSelect = document.getElementById("me31-traslado");

    // ==== Caso id === 0: limpiar todo ====
    if (id === 0 || !me31Obj) {
        populateConceptoDropdown("", "");

        // Limpiar inputs
        [
            "me31-cual", "me31-viaAtencion", "me31-concepto", "me31-resultadosDiag",
            "me31-etapas", "me31-fechaInicio", "me31-fechaBaja", "me31-motivoBaja",
            "me31-traslado", "me31-formacion", "me31-experiencia"
        ].forEach(idControl => {
            const ctrl = document.getElementById(idControl);
            if (ctrl.tagName === "SELECT") ctrl.selectedIndex = 0;
            else ctrl.value = "";
            if (ctrl.tagName === "SELECT" && ctrl.id === "me31-traslado") ctrl.disabled = true;
        });

        // Limpiar y deshabilitar radios de traslado
        trasladoRadios.forEach(r => {
            r.checked = false;
            r.disabled = true;
        });

        // Limpiar dropdowns múltiples
        resetDropdownBtn("me31-motivoAtencionBtn", "me31-motivoAtencionSelect");
        resetDropdownBtn("me31-tratamientoBtn", "me31-tratamientoSelect");
        return;
    }

    // ==== Caso id != 0: inicializar con datos ====

    // Reason
    setDropdownBtn("me31-motivoAtencionBtn", "me31-motivoAtencionSelect", me31Obj.reason);
    const cualInput = document.getElementById("me31-cual");
    const otraSeleccionada = (me31Obj.reason || []).includes("Otra");
    cualInput.disabled = !otraSeleccionada;
    cualInput.value = otraSeleccionada ? me31Obj.anotherrreason : "";

    // Otros inputs
    document.getElementById("me31-viaAtencion").value = me31Obj.carepathway || "";
    populateConceptoDropdown(me31Obj.carepathway || "", me31Obj.concept || "");
    document.getElementById("me31-resultadosDiag").value = me31Obj.preschooldiagresults || "";
    document.getElementById("me31-etapas").value = me31Obj.articulationstageresults || "";
    document.getElementById("me31-fechaInicio").value = formatDateForInput(me31Obj.startdate);
    document.getElementById("me31-fechaBaja").value = formatDateForInput(me31Obj.canceldate);

    const motivoBaja = document.getElementById("me31-motivoBaja");
    motivoBaja.value = me31Obj.reasoncancel || "";
    document.getElementById("me31-formacion").value = me31Obj.teachertraining || "";
    document.getElementById("me31-experiencia").value = me31Obj.experience || "";

    // Directtreatment
    setDropdownBtn("me31-tratamientoBtn", "me31-tratamientoSelect", me31Obj.directtreatment);

    // === Lógica de Traslado ligada a motivoBaja ===
    const esTraslado = motivoBaja.value === "Traslado";

    // Habilitar/deshabilitar radios según motivo de baja
    trasladoRadios.forEach(r => {
        r.disabled = !esTraslado;
        if (!esTraslado) r.checked = false;
    });

    // Transfer radios: solo si el motivo es Traslado
    if (esTraslado && me31Obj.transfer) {
        const radio = document.querySelector(
            `input[name="trasladoRadio"][value="${me31Obj.transfer}"]`
        );
        if (radio) radio.checked = true;
    }

    // Transferwhere (select me31-traslado)
    // agregar opción si no existe
    if (me31Obj.transferwhere) {
        let optionExists = Array.from(trasladoSelect.options)
            .some(opt => opt.value === me31Obj.transferwhere);
        if (!optionExists) {
            const opt = document.createElement("option");
            opt.value = me31Obj.transferwhere;
            opt.textContent = me31Obj.transferwhere;
            trasladoSelect.appendChild(opt);
        }
    }

    // El select solo se habilita si el motivo es Traslado
    trasladoSelect.value = esTraslado ? (me31Obj.transferwhere || "") : "";
    trasladoSelect.disabled = !esTraslado;
}


// ------------ INICIO: lógica para actualizar "Concepto por el que se atiende" ------------
function getConceptOptionsByEduAndVia(eduLevelValue, viaValue) {
  const trim = s => (s || "").trim();
  const edu = trim(eduLevelValue);
  const via = trim(viaValue);

  const PI_DIRECTA = [
    "NEE Área de Comunicación",
    "NEE Área psicomotricidad",
    "NEE Área de socialización",
    "TEA.",
    "NEE Área Intelectual",
    "Potencialidades talentosas",
    "NEE en la visión",
    "NEE en la audición",
    "Enfermedades crónicas"
  ];

  const EP_DIRECTA = [
    "Educandos de 1er grado con predominio de tareas no logradas en diagnóstico 6to A/V",
    "Educandos de 1er grado con predominio de tareas poco logradas en diagnóstico 6to A/V",
    "Educandos de 1er grado con resultados inarmónicos en diagnóstico 6to A/V.",
    "Educandos sin objetivos vencidos de 1er grado.",
    "Educandos sin objetivos vencidos de 3er grado.",
    "Repitentes de 2do grado.",
    "Repitentes de 4to grado",
    "Talento.",
    "Incumplidores del deber 4 que no evolucionan.",
    "Comportamiento agresivo o violento.",
    "Medidas de atención individualizada Mined (MAI CAM MINED)",
    "Medidas de atención individualizada Minint (MAI CAM  MININT)"
  ];

  const EP_INDIRECTA = [
    "Educandos con predominio de tareas logradas o bastante logradas en diagnóstico de 6 a/v desaprobados en etapa de articulación",
    "Educandos con predominio de tareas medianamente logradas en diagnóstico de 6 a/v desaprobados en etapa de articulación",
    "Repitentes de 5to grado.",
    "Repitentes de 6to grado.",
    "Desaprobados por primera vez.",
    "Enfermedades crónicas.",
    "Educandos con NEE asociados o no a discapacidad"
  ];

  const SB_ETP_DIRECTA = [
    "Talento",
    "Incumplidores del deber 4 que no evolucionan",
    "Comportamiento agresivo o violento",
    "Medidas de atención individualizada MINED (MAI CAM MINED)",
    "Medidas de atención individualizada Minint (MAI CAM  MININT)"
  ];

  const SB_ETP_INDIRECTA = [
    "Enfermedades crónicas",
    "Educandos con NEE asociados o no a discapacidad"
  ];

  const nivelSBGroup = ["Secundaria Básica (SB)", "Preuniversitario (IPU)", "Educación Técnica (ETP)", "Escuela de Oficio (EO)"];

  if (edu === "Primera Infancia (PI)") {
    if (via === "Directa") return PI_DIRECTA;
    if (via === "Indirecta") return [];
  }

  if (edu === "Educación Primaria (EP)") {
    if (via === "Directa") return EP_DIRECTA;
    if (via === "Indirecta") return EP_INDIRECTA;
  }

  if (nivelSBGroup.includes(edu)) {
    if (via === "Directa") return SB_ETP_DIRECTA;
    if (via === "Indirecta") return SB_ETP_INDIRECTA;
  }

  return [];
}

function populateConceptoDropdown(viaValue, preserveValue = "") {
    const select = document.getElementById("me31-concepto");
    if (!select) return;
    
    const opciones = getConceptOptionsByEduAndVia(edulevel, viaValue);
    const prev = preserveValue || select.value || "";
   
    select.innerHTML = "";

    if (!opciones || opciones.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "—";
        select.appendChild(opt);
        select.value = "";
        select.setAttribute("disabled", "disabled");
        return;
    }

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Seleccione...";
    select.appendChild(defaultOpt);

    opciones.forEach(txt => {
        const opt = document.createElement("option");
        opt.value = txt;
        opt.textContent = txt;
        select.appendChild(opt);
    });

    select.removeAttribute("disabled");

    if (prev && opciones.includes(prev)) {
        select.value = prev;
    } else {
        select.value = "";
    }
}
// ------------ FIN: lógica para actualizar "Concepto por el que se atiende" ------------

export function openME31Modal(id) {
    // Busco el formulario anterior, ya que el campo Concepto por el que se atiende depende
    // del nivel edicativo seleccionado
    const mgiObj = findObjectByKeyAndId(childrenData.data, "2.1", id);
    if (mgiObj) {
        edulevel = mgiObj.edulevel;
    }
    
    const me31Obj = findObjectByKeyAndId(childrenData.data, "3.1.1", id);
    validme31id = id;
    if (me31Obj) {
        updateme31 = true;
        inicializarME31Form(id);
        // Configurar eventos de dropdowns para actualizar el texto del botón al marcar/desmarcar
        attachDropdownEvents(
            "me31-motivoAtencionBtn",
            "#me31-motivoAtencionBtn ~ .dropdown-menu input[type='checkbox']"
        );
        attachDropdownEvents(
            "me31-tratamientoBtn",
            "#me31-tratamientoBtn ~ .dropdown-menu input[type='checkbox']"
        );
    } else {
        // Limpiar todos los inputs y selects
        updateme31 = false;
        inicializarME31Form(0);

        // Resetear los dropdowns de checkboxes
        // resetDropdownBtn(
        //     "me31-motivoAtencionBtn",
        //     "#me31-motivoAtencionBtn ~ .dropdown-menu input[type='checkbox']"
        // );
        // resetDropdownBtn(
        //     "me31-tratamientoBtn",
        //     "#me31-tratamientoBtn ~ .dropdown-menu input[type='checkbox']"
        // );
        resetDropdownBtn("me31-motivoAtencionBtn", "me31-motivoAtencionSelect");
        resetDropdownBtn("me31-tratamientoBtn", "me31-tratamientoSelect");

        // Limpiar radios de traslado
        document.querySelectorAll('input[name="trasladoRadio"]').forEach(r => r.checked = false);
    }
   
    $('#me31-formModal').modal('show');
}

// ===========================================
// Lógica del formulario 3.1
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
    const cualInput = document.getElementById("me31-cual");
    const trasladoSelect = document.getElementById("me31-traslado");
    const motivoBajaSelect = document.getElementById("me31-motivoBaja");
    const radiosTraslado = document.querySelectorAll('input[name="trasladoRadio"]');

    // Inicialmente deshabilitados
    cualInput.setAttribute("disabled", true);
    trasladoSelect.setAttribute("disabled", true);
    radiosTraslado.forEach(r => r.disabled = true);

    // **************************
    const viaSelect = document.getElementById("me31-viaAtencion");
    
    if (viaSelect) {
        viaSelect.addEventListener("change", e => {
        populateConceptoDropdown(e.target.value);
        });

        // Ejecutar una vez al cargar, por si ya tiene valor
        populateConceptoDropdown(viaSelect.value);
    }
    // **************************
    // Motivo de la atención: habilitar "¿Cuál?" si marcan "Otra"
    document.getElementById('me31-motivoAtencionSelect').addEventListener('change', () => {
        const selectMotivo = document.getElementById('me31-motivoAtencionSelect');
        const otraSeleccionada = Array.from(selectMotivo.selectedOptions).some(opt => opt.value === 'Otra');
        cualInput.disabled = !otraSeleccionada;
        if (!otraSeleccionada) {
            cualInput.value = '';
        }
    });
    

    // Tratamiento directo: actualizar texto del botón
    document
        .querySelectorAll(
        "#me31-tratamientoBtn ~ .dropdown-menu input[type='checkbox']"
        )
        .forEach((chk) => {
        chk.addEventListener("change", () => {
            // nada adicional aquí, solo actualizamos al cerrar dropdown
        });
        });


    // Guardar datos
    document
        .getElementById("me31-guardarBtn")
        .addEventListener("click", async () => {
            const form = document.getElementById("me31-form");
            
            if (!validformularie()) {
                console.log('no validado');
                return;
            }
            const motivosSeleccionados = Array.from(
            document.querySelector('#me31-motivoAtencionSelect option:checked')
            ).map(opt => opt.value);

            const tratamientosSeleccionados = Array.from(
            document.querySelector('#me31-tratamientoSelect option:checked')
            ).map(opt => opt.value);

            const formData = {
                motivoAtencion: motivosSeleccionados,
                cual: cualInput.disabled ? "" : cualInput.value,
                viaAtencion: document.getElementById("me31-viaAtencion").value,
                concepto: document.getElementById("me31-concepto").value,
                resultadosDiag: document.getElementById("me31-resultadosDiag").value,
                etapas: document.getElementById("me31-etapas").value,
                fechaInicio: document.getElementById("me31-fechaInicio").value,
                tratamiento: tratamientosSeleccionados,
                fechaBaja: document.getElementById("me31-fechaBaja").value,
                motivoBaja:
                document.querySelector("input[name='motivoBaja']:checked")?.value ||
                "",
                formacion: document.getElementById("me31-formacion").value,
                experiencia: document.getElementById("me31-experiencia").value,
                savedate: formatDateForInput(new Date()),
                username: window.currentUser.userid
            };
            
            await guardarME31TochildrenData();//aqui
           
            if (updateme31) {
                await updateChild();
            } else {
                await saveChild();
                $(document).trigger("updatetreeevent");
            }
            
            $("#me31-formModal").modal("hide");
            
            form.classList.remove("was-validated");
        });

    // Función para actualizar texto del botón con seleccionados
    function actualizarTextoDropdown(dropdownBtnId) {
        const $dropdownBtn = $("#" + dropdownBtnId);
        $dropdownBtn.closest(".me31-dropdown").on("hidden.bs.dropdown", function () {
            const seleccionados = $(this).find("input[type='checkbox']:checked").length;
            if (seleccionados === 0) {
            $dropdownBtn.text("Seleccione...");
            } else {
            $dropdownBtn.text(`${seleccionados} seleccionados`);
            }
        });
    }


    // Aplicar a ambos dropdowns
    actualizarTextoDropdown("me31-motivoAtencionBtn");
    actualizarTextoDropdown("me31-tratamientoBtn");


    // Traslado radio
    $('input[name="trasladoRadio"]').on("change", function () {
        const valor = $(this).val();
        if (valor === "Otra provincia" || valor === "Otro municipio") {
        $("#me31-traslado").prop("disabled", false);
        } else {
        $("#me31-traslado").prop("disabled", true).val("");
        }
    });

    motivoBajaSelect.addEventListener("change", () => {
        if (motivoBajaSelect.value === "Traslado") {
        radiosTraslado.forEach(r => r.disabled = false);
        } else {
        radiosTraslado.forEach(r => {
            r.disabled = true;
            r.checked = false;
        });
        trasladoSelect.disabled = true;
        trasladoSelect.innerHTML = `<option value="">Seleccione...</option>`;
        }
    
    });

    radiosTraslado.forEach(radio => {
        radio.addEventListener("change", () => {
            const valor = radio.value;
            trasladoSelect.innerHTML = `<option value="">Seleccione...</option>`; // limpiar lista
            if (valor === "Otra provincia") {
                trasladoSelect.disabled = false;
                // cargar provincias
                Object.keys(municipiosPorProvincia).forEach(provincia => {
                    const opt = document.createElement("option");
                    opt.value = provincia;
                    opt.textContent = provincia;
                    trasladoSelect.appendChild(opt);
                });
            } else if (valor === "Otro municipio") {
                trasladoSelect.disabled = false;
                trasladoSelect.innerHTML = `<option value="">Seleccione...</option>`; // limpiar lista

                // Recorremos todas las provincias y listamos sus municipios
                Object.keys(municipiosPorProvincia).forEach(provincia => {
                    municipiosPorProvincia[provincia].forEach(mun => {
                        const opt = document.createElement("option");
                            opt.value = `${mun} (${provincia})`; // opcional: mostrar también la provincia
                            opt.textContent = `${mun} (${provincia})`;
                            trasladoSelect.appendChild(opt);
                        });
                    });
            } else {
                trasladoSelect.disabled = true;
            }
        });
    });
    
    
    function validformularie() {
        // Motivos de atención
        // const motivosSeleccionados = Array.from(
        //     document.querySelectorAll("#me31-motivoAtencionBtn ~ .dropdown-menu input:checked")
        // ).map(chk => chk.value);
        // if (motivosSeleccionados.length === 0) {
        //     alert("Seleccione al menos un motivo de atención");
        //     return false;
        // }

        const selectMotivo = document.getElementById('me31-motivoAtencionSelect');
        const motivosSeleccionados = Array.from(selectMotivo.selectedOptions).map(opt => opt.value);
        if (motivosSeleccionados.length === 0) {
            alert("Seleccione al menos un motivo de atención");
            return false;
        }

        // Campo "¿Cuál?" solo si se seleccionó "Otra"
        const cualInput = document.getElementById("me31-cual");
        const otraSeleccionada = Array.from(selectMotivo.selectedOptions).some(opt => opt.value === "Otra");
        if (otraSeleccionada && !cualInput.value.trim()) {
            alert("Especifique el motivo 'Otra'");
            return false;
        }

        // Vía de atención
        const viaAtencion = document.getElementById("me31-viaAtencion").value;
        if (!viaAtencion) {
            alert("Seleccione la vía de atención");
            return false;
        }

        // Concepto
        const conceptcomtrol = document.getElementById("me31-concepto");
        const concepto = conceptcomtrol.value;
        if (!conceptcomtrol.disabled && concepto === '') {
            alert("Seleccione el concepto por el que se atiende");
            return false;
        }

        // Resultados diagnóstico preescolar (opcional según lógica)
        // const resultadosDiag = document.getElementById("me31-resultadosDiag").value;

        // Etapas
        const etapas = document.getElementById("me31-etapas").value;
        if (!etapas) {
            alert("Seleccione resultados de etapas de articulación");
            return false;
        }

        // Fecha de inicio
        const fechaInicio = document.getElementById("me31-fechaInicio").value;
        if (!fechaInicio) {
            alert("Ingrese la fecha de inicio");
            return false;
        }

        // Tratamiento directo
        // const tratamientosSeleccionados = Array.from(
        //     document.querySelectorAll("#me31-tratamientoBtn ~ .dropdown-menu input:checked")
        // ).map(chk => chk.value);
        // if (tratamientosSeleccionados.length === 0) {
        //     alert("Seleccione al menos un tratamiento directo");
        //     return false;
        // }

        // Seleccionamos los checkboxes marcados
            // const checkedNodes = document.querySelectorAll(
            // "#me31-tratamientoBtn ~ .dropdown-menu input:checked"
            // );

            // Convertimos a array de valores
            // const tratamientosSeleccionados = Array.from(checkedNodes).map(chk => chk.value);
            

            // Validamos
            // if (tratamientosSeleccionados.length === 0) {
            // alert("Seleccione al menos un tratamiento directo");
            // return false;
            // }

            const selectTratamiento = document.getElementById('me31-tratamientoSelect');
            const tratamientosSeleccionados = Array.from(selectTratamiento.selectedOptions).map(opt => opt.value);
            if (tratamientosSeleccionados.length === 0) {
                alert("Seleccione al menos un tratamiento directo");
                return false;
            }
        // Motivo de baja
        const motivoBaja = document.getElementById("me31-motivoBaja").value;
        if (!motivoBaja) {
            alert("Seleccione el motivo de baja");
            return false;
        }

        // Traslado si aplica
        let transfer = "";
        if (motivoBaja === "Traslado") {
            const radio = document.querySelector('input[name="trasladoRadio"]:checked');
            if (!radio) {
            alert("Seleccione tipo de traslado");
            return false;
            }
            transfer = radio.value;

            if ((transfer === "Otra provincia" || transfer === "Otro municipio") &&
                !document.getElementById("me31-traslado").value) {
            alert("Seleccione a dónde se realiza el traslado");
            return false;
            }
        }

        // Formación
        const formacion = document.getElementById("me31-formacion").value;
        if (!formacion) {
            alert("Seleccione la formación del maestro");
            return false;
        }

        // Experiencia
        const experiencia = document.getElementById("me31-experiencia").value;
        if (!experiencia) {
            alert("Seleccione la experiencia del maestro");
            return false;
        }

        // Si llegó hasta aquí, todo está correcto
        return true;
    }

    async function guardarME31TochildrenData() {
        const form = document.getElementById("me31-form");
        if (!form) {
            console.error("Formulario me31 no encontrado");
            return;
        }

        const cualInput = document.getElementById("me31-cual");
        const trasladoSelect = document.getElementById("me31-traslado");
        const motivoBajaSelect = document.getElementById("me31-motivoBaja");

        const selectMotivo = document.getElementById('me31-motivoAtencionSelect');
        const motivosSeleccionados = Array.from(selectMotivo.selectedOptions).map(opt => opt.value);
        
        const selectTratamiento = document.getElementById('me31-tratamientoSelect');
        const tratamientosSeleccionados = Array.from(selectTratamiento.selectedOptions).map(opt => opt.value);
        
        const transferRadio = document.querySelector('input[name="trasladoRadio"]:checked');
        const transferValue = transferRadio ? transferRadio.value : "";
        const transferWhereValue = trasladoSelect && trasladoSelect.disabled ? "" : (trasladoSelect ? trasladoSelect.value : "");

        // Construir objeto ME31 nuevo/actualizado
        const me31ObjNew = {
            id: validme31id,               // debe existir y ser consistente
            key: "3.1.1",
            reason: motivosSeleccionados,
            anotherrreason: (cualInput && cualInput.disabled) ? "" : (cualInput ? cualInput.value : ""),
            carepathway: document.getElementById("me31-viaAtencion")?.value || "",
            concept: document.getElementById("me31-concepto")?.value || "",
            preschooldiagresults: document.getElementById("me31-resultadosDiag")?.value || "",
            articulationstageresults: document.getElementById("me31-etapas")?.value || "",
            startdate: document.getElementById("me31-fechaInicio")?.value || "",
            directtreatment: tratamientosSeleccionados,
            canceldate: document.getElementById("me31-fechaBaja")?.value || "",
            reasoncancel: motivoBajaSelect ? motivoBajaSelect.value : "",
            transfer: transferValue,
            transferwhere: transferWhereValue,
            teachertraining: document.getElementById("me31-formacion")?.value || "",
            experience: document.getElementById("me31-experiencia")?.value || "",
            savedate: new Date(),
            username: window.currentUser.username
        };

        if (me31ObjNew.id === undefined || me31ObjNew.id === null || me31ObjNew.id === "") {
            console.error("❌ me31ObjNew.id no está definido. Todos los objetos deben tener id.");
            return;
        }

      

        // Normalizar id a string para comparaciones robustas
        const targetIdStr = String(me31ObjNew.id);

        // 1) Intentar actualizar si ya existe un 3.1.1 con ese id en cualquier sub-arreglo
        let updated = false;
        if (Array.isArray(childrenData?.data)) {
            for (const subArray of childrenData.data) {
            if (!Array.isArray(subArray)) continue;

            const idx = subArray.findIndex(o => o && o.key === "3.1.1" && String(o.id) === targetIdStr);
            if (idx !== -1) {
            
                // Mantener referencia y actualizar propiedades
                Object.assign(subArray[idx], me31ObjNew);
                updated = true;
                break;
            }
            }
        } else {
            console.warn("childrenData.data no es un array válido");
        }

        // 2) Si no se actualizó: buscar el sub-array que contiene el padre 2.1 con el mismo id e insertar (si no existe ya un 3.1.1)
        if (!updated) {
            for (const subArray of childrenData.data) {
            if (!Array.isArray(subArray)) continue;

            const hasParent = subArray.some(o => o && o.key === "2.1" && String(o.id) === targetIdStr);
            if (hasParent) {
                // comprobar que no exista ya un 3.1.1 en este subArray
                const already = subArray.some(o => o && o.key === "3.1.1");
                if (!already) {
                subArray.push(me31ObjNew);
                updated = true;
                console.log("➕ Insertado me31ObjNew en el sub-array que contiene al padre 2.1 (id=" + targetIdStr + ")");
                } else {
                console.warn("⚠️ Ya existe un objeto con key '3.1.1' en este sub-arreglo — no se inserta otro.");
                }
                break;
            }
            }
        }

        if (!updated) {
            console.warn("❌ No se encontró sub-arreglo con padre key='2.1' e id=" + targetIdStr + " y tampoco se encontró 3.1.1 para actualizar.");
            // Si quieres como fallback, podríamos insertar en childrenData.data[0], pero lo dejo intencionalmente fuera.
        } else {
            console.log("✅ childrenData.data actualizado correctamente.");
        }
    }


    // Ruta # 14: Salva los datos de m31.
    async function saveChild() {//aqui
        try {
            // 1. Buscar el objeto me31 cuyo id = validme31id
            const me31Obj = findObjectByKeyAndId(childrenData.data, "3.1.1", validme31id);
            if (!me31Obj) {
                console.error("❌ No se encontró objeto me31 con id:", validme31id);
                return;
            }

            // 2. Preparar payload para la API
            const payload = {
                id: me31Obj.id,
                dni: childrenData.dni,
                reason: me31Obj.reason.join(" / "), // arreglo → string
                anotherrreason: me31Obj.anotherrreason,
                carepathway: me31Obj.carepathway,
                concept: me31Obj.concept,
                preschooldiagresults: me31Obj.preschooldiagresults,
                articulationstageresults: me31Obj.articulationstageresults,
                startdate: formatDateForInput(me31Obj.startdate),
                directtreatment: me31Obj.directtreatment.join(" / "), // arreglo → string
                canceldate: formatDateForInput(me31Obj.canceldate),
                reasoncancel: me31Obj.reasoncancel,
                transfer: me31Obj.transfer,
                transferwhere: me31Obj.transferwhere,
                teachertraining: me31Obj.teachertraining,
                experience: me31Obj.experience,
                savedate: formatDateForInput(me31Obj.savedate),
                username: me31Obj.username
                // savedate: formatDateForInput(new Date(me31Obj.savedate).toISOString().split("T")[0]) // YYYY-MM-DD
            };
           
            // 3. Hacer fetch
            const resp = await fetch(`${window.config.apiUrl}/savem311`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await resp.json();
         

            if (!result.success) {
                alert("Error al guardar: " + result.message);
            } else {
                alert("Guardado correctamente");
            }
        } catch (err) {
            console.error("❌ Error en saveChild:", err);
            alert("Error inesperado al guardar");
        }
    }

    // Ruta # 24: Actualiza los datos modulo me 3.1.
    async function updateChild() {
        try {
            // 1. Buscar el objeto me31 cuyo id = validme31id
            const me31Obj = findObjectByKeyAndId(childrenData.data, "3.1.1", validme31id);
            
            if (!me31Obj) {
                console.error("❌ No se encontró objeto me31 con id:", validme31id);
                return;
            }

            // 2. Preparar payload para la API
            const payload = {
                id: me31Obj.id,
                dni: childrenData.dni,
                reason: me31Obj.reason.join(" / "),
                anotherrreason: me31Obj.anotherrreason,
                carepathway: me31Obj.carepathway,
                concept: me31Obj.concept,
                preschooldiagresults: me31Obj.preschooldiagresults,
                articulationstageresults: me31Obj.articulationstageresults,
                startdate: formatDateForInput(me31Obj.startdate),
                directtreatment: me31Obj.directtreatment.join(" / "),
                canceldate: formatDateForInput(me31Obj.canceldate),
                reasoncancel: me31Obj.reasoncancel,
                transfer: me31Obj.transfer,
                transferwhere: me31Obj.transferwhere,
                teachertraining: me31Obj.teachertraining,
                experience: me31Obj.experience,
                savedate: formatDateForInput(me31Obj.savedate),
                username: me31Obj.username
            };
           
            
            // 3. Hacer fetch
            const resp = await fetch(`${window.config.apiUrl}/updatem311/${me31Obj.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await resp.json();

            if (!result.success) {
                alert("Error al actualizar: " + result.message);
            } else {
                alert("Actualizado correctamente");
            }
        } catch (err) {
            console.error("❌ Error en updateChild:", err);
            alert("Error inesperado al actualizar");
        }
    }

    exportFormToPDF("me31-form", "me31-exportPDFBtn", "formulario_me31.pdf");
});
