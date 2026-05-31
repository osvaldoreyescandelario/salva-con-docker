// ===============================
// TOOLTIP ENCABEZADOS (sin cambios funcionales)
// ===============================
const tooltipsText = {
  1: `<strong>3 puntos ➡️</strong> Si el cuadrado conserva todos los ángulos rectos,<br>
      si el rombo presenta ángulos bien observados y la tercera figura es reconocible.<br><br>
      <strong>2 puntos ➡️</strong> si el cuadrado es reconocible y tiene solo dos ángulos rectos<br>
      y las otras dos figuras son reconocibles.<br><br>
      <strong>1 punto ➡️</strong> Si las tres figuras son imperfectas, pero semejantes entre sí.`,
  2: `<strong>3 puntos ➡️</strong> Siete respuestas positivas.<br><br>
      <strong>2 puntos ➡️</strong> de cuatro a seis respuestas positivas.<br><br>
      <strong>1 punto ➡️</strong> De dos a tres respuestas positivas.`,
  3: `<strong>3 puntos ➡️</strong> Buena o muy aproximada reproducción de las tres figuras.<br><br>
      <strong>2 puntos ➡️</strong> Buena reproducción de dos y aproximada la otra.<br><br>
      <strong>1 punto ➡️</strong> Mala reproducción de las tres.`,
  4: `<strong>3 puntos ➡️</strong> Repetición de las 7 palabras.<br><br>
      <strong>2 puntos ➡️</strong> Repetición de 4 a 6 palabras.<br><br>
      <strong>1 punto ➡️</strong> Repetición de 2 a 3 palabras.`,
  5: `<strong>3 puntos ➡️</strong> Para las tres acciones capitales (compró, partió y lloró) y así mismo por los tres detalles (de loza, ojos azules y vestido amarillo).<br><br>
      <strong>2 puntos ➡️</strong> Por tres acciones y un detalle.<br><br>
      <strong>1 punto ➡️</strong> Por tres acciones, dos acciones y un detalle.`,
  6: `<strong>3 puntos ➡️</strong> ¡De nueve a diez positivas.<br><br>
      <strong>2 puntos ➡️</strong> De cinco a ocho positivas.<br><br>
      <strong>1 punto ➡️</strong> De dos a cuatro positivas.`,
  7: `<strong>3 puntos ➡️</strong> Si corta más de la mitad de cada una en el tiempo marcado sin salirse del trazado.<br><br>
      <strong>2 puntos ➡️</strong> Si corta más de la mitad, pero saliendo del trazado, o respetando el trazado menos de la mitad.<br><br>
      <strong>1 punto ➡️</strong> Si corta con regularidad relativa en uno de los diseños y parte del otro.`,
  8: `<strong>3 puntos ➡️</strong> Por más de 50 punticos.<br><br>
      <strong>2 puntos ➡️</strong> De 26 a 50 punticos.<br><br>
      <strong>1 punto ➡️</strong> De 10 a 25 punticos.`,
};

const modal = document.getElementById('fullscreen-modal');
const modalContent = document.getElementById('modal-content');
const openModalBtn = document.getElementById('open-modal-btn');

// ===============================
// INICIALIZAR RESULTADOS
// ===============================
const resultados = Array.from({ length: 8 }, (_, i) => ({
  test: i + 1,
  eval: null
}));

// ===============================
// TABLA DE EVALUACIÓN
// ===============================
const modaleval = document.getElementById("tabc-modal");
const acceptBtn = document.getElementById("tabc-accept-btn");
const table = document.getElementById("tabc-table");
const openBtn = document.getElementById("tabc-open-modal");



openBtn.addEventListener("click", async () => {
  await mostrarTablaEvaluacion();
});

// ===============================
// ACTIVAR TOOLTIP EN ENCABEZADOS
// ===============================
// ===============================
// ACTIVAR TOOLTIP EN ENCABEZADOS (compatible con tu CSS)
// ===============================
const headerCells = table.rows[0].cells;

for (let col = 1; col < headerCells.length; col++) {
  const th = headerCells[col];
  th.style.position = "relative";
  th.style.cursor = "help";

  // Crear tooltip flotante
  const tooltip = document.createElement("div");
  tooltip.className = "tabc-tooltip";
  tooltip.innerHTML = tooltipsText[col];

  // Por defecto está invisible (opacity: 0 en tu CSS)
  tooltip.style.top = "100%";
  tooltip.style.left = "50%";

  th.appendChild(tooltip);

  th.addEventListener("mouseenter", () => {
    tooltip.style.opacity = "1";
  });

  th.addEventListener("mouseleave", () => {
    tooltip.style.opacity = "0";
  });
}

function actualizarTablaResultados() {
    let suma = 0;

    // Recorre TODAS las celdas de la tabla real
    table.querySelectorAll("td").forEach(celda => {

        // Si está seleccionada (verde)
        if (celda.classList.contains("tabc-selected")) {

            const col = celda.cellIndex;   // columna = test
            const row = celda.parentNode.rowIndex; // fila = puntaje

            // convertir fila → valor (3,2,1,0)
            const val = 4 - row;

            // sumamos
            suma += val;
        }
    });

    // Mostramos el total
    document.getElementById("res-total").textContent = suma;

    // Interpretación
    let interpretacion = "";
    let cuartil = "";

    if (suma >= 17) {
        interpretacion = "El sujeto aprenderá a leer y escribir en un semestre lectivo sin dificultad o cansancio";
        cuartil = "Superior: el sujeto aprenderá a leer y escribir inmediatamente";
    }
    else if (suma >= 12 && suma <= 16) {
        interpretacion = "El aprendizaje se realizará normal en un año lectivo (reforzamiento escolar)";
        cuartil = "Medio: escolar con nivel adecuado para enfrentar el aprendizaje";
    }
    else if (suma >= 8 && suma <= 11) {
        interpretacion = "El sujeto aprenderá a leer y escribir con dificultad exigiendo en la mayoría de los casos una enseñanza especial (diferenciada)";
        cuartil = "Inferior: sin nivel de madurez para enfrentar el aprendizaje necesario";
    }
    else if (suma >= 0 && suma <= 7) {
        interpretacion = "Estos niños son tan retardados que la enseñanza escolar común les sería totalmente improductiva";
        cuartil = "";
    }

    document.getElementById("res-interp").textContent = interpretacion;
    document.getElementById("res-cuartil").textContent = cuartil;
}



function mostrarResultadosEnTabla() {
  // Primero, limpiar todas las selecciones
  for (let i = 1; i < table.rows.length; i++) {
    for (let j = 1; j < table.rows[i].cells.length; j++) {
      table.rows[i].cells[j].classList.remove("tabc-selected");
    }
  }

  // Luego, recorrer los resultados y marcar la celda correspondiente
  resultados.forEach(({ test, eval: valor }) => {
    if (valor !== null) {
      // fila = 4 - valor (fila 1 → 3, fila 2 → 2, fila 3 → 1, fila 4 → 0)
      const fila = 4 - valor;
      if (table.rows[fila] && table.rows[fila].cells[test]) {
        table.rows[fila].cells[test].classList.add("tabc-selected");
      }
    }
  });
}



table.addEventListener("click", (e) => {
  const cell = e.target;
  if (cell.tagName !== "TD") return;
  const colIndex = cell.cellIndex;
  if (colIndex === 0) return; // Ignora la primera columna si es encabezado

  // Limpiar selección de la columna
  for (let i = 1; i < table.rows.length; i++) {
    table.rows[i].cells[colIndex].classList.remove("tabc-selected");
  }

  // Marcar la celda clickeada
  cell.classList.add("tabc-selected");
  actualizarTablaResultados();
});


function mostrarTablaEvaluacion() {
  return new Promise(resolve => {
    // Mostrar la tabla
    modaleval.style.display = "flex";

    const handler = () => {
      let suma = 0;

      for (let col = 1; col < table.rows[0].cells.length; col++) { // recorrer columnas
        let evalValue = null;
        for (let row = 1; row < table.rows.length; row++) { // recorrer filas
          const cell = table.rows[row].cells[col];
          if (cell.classList.contains("tabc-selected")) { // verificar si está en verde
            evalValue = 4 - row; // fila 1 → 3, fila 2 → 2, fila 3 → 1, fila 4 → 0
            break; // solo una celda verde por columna
          }
        }
        resultados[col - 1].eval = evalValue;

        if (evalValue !== null) {
          suma += evalValue;
        }
      }

      console.log("Suma de todos los eval:", suma);

      // Ocultar la tabla
      modaleval.style.display = "none";

      // Limpiar listener
      acceptBtn.removeEventListener("click", handler);

      // Resolver promesa
      resolve(true);
    };

    // Asociar listener al botón Aceptar
    acceptBtn.addEventListener("click", handler);
  });
}






// ===============================
// FUNCIÓN GENERAL DE IMAGEN
// ===============================
function mostrarImagenTemporal(imgSrc, duracionSeg, callbackFin) {
  modalContent.innerHTML = '';
  const img = document.createElement('img');
  img.src = '../images/tests/' + imgSrc;
  img.style.maxWidth = '85%';
  img.style.maxHeight = '85%';
  img.style.objectFit = 'contain';
  modalContent.appendChild(img);

  const timer = document.createElement('div');
  timer.id = 'countdown';
  timer.style.position = 'absolute';
  timer.style.bottom = '10px';
  timer.style.right = '10px';
  timer.style.background = 'rgba(0,0,0,0.5)';
  timer.style.color = 'white';
  timer.style.padding = '5px 10px';
  timer.style.borderRadius = '5px';
  timer.style.fontSize = '1.2rem';
  modal.appendChild(timer);

  let tiempo = duracionSeg;
  timer.textContent = `⏱️ ${tiempo}s`;

  const interval = setInterval(() => {
    tiempo--;
    timer.textContent = `⏱️ ${tiempo}s`;
    if (tiempo <= 0) finalizar();
  }, 1000);

  function manejarEsc(e) {
    if (e.key === 'Escape') finalizar();
  }

  function finalizar() {
    clearInterval(interval);
    document.removeEventListener('keydown', manejarEsc);
    timer.remove();
    callbackFin();
  }

  document.addEventListener('keydown', manejarEsc);
}

// ===============================
// TESTS INDEPENDIENTES (devuelven Promise)
// ===============================
function iniciarTest1() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 1. DIBUJO DE FIGURAS</h1>
      <p>👉 El niño debe reproducir 3 figuras geométricas. Cada una se muestra 1 minuto.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      const imgs = ['tabcf1.jpg', 'tabcf2.jpg', 'tabcf3.jpg'];
      let i = 0;
      function siguiente() {
        if (i < imgs.length) {
          mostrarImagenTemporal(imgs[i++], 60, siguiente);
        } else {
          modal.style.display = 'none';
          resolve(true);
        }
      }
      siguiente();
    };
  });
}

function iniciarTest2() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 2. EVOCACIÓN DE OBJETOS</h1>
      <p>👉 Observa la imagen durante 30 segundos.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      mostrarImagenTemporal('tabcf21.jpg', 30, () => {
        modal.style.display = 'none';
        resolve(true);
      });
    };
  });
}

function iniciarTest3() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 3. REPRODUCCIÓN DE MOVIMIENTOS</h1>
      <p>👉 Observa las figuras del examinador.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      mostrarImagenTemporal('tabcf31.jpg', 60, () => {
        modal.style.display = 'none';
        resolve(true);
      });
    };
  });
}

function iniciarTest4() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 4. EVOCACIÓN DE PALABRAS</h1>
      <p>👉 Repite las palabras que escucharás.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      mostrarImagenTemporal('tabcf4.jpg', 60, () => {
        modal.style.display = 'none';
        resolve(true);
      });
    };
  });
}

function iniciarTest5() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 5. EVOCACIÓN DE UN RELATO</h1>
      <p>👉 Escucha y repite el cuento.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      mostrarImagenTemporal('tabcf5.jpg', 60, () => {
        modal.style.display = 'none';
        resolve(true);
      });
    };
  });
}

function iniciarTest6() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 6. REPETICIÓN DE PALABRAS</h1>
      <p>👉 Repite las palabras que escucharás.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      mostrarImagenTemporal('tabcf6.jpg', 60, () => {
        modal.style.display = 'none';
        resolve(true);
      });
    };
  });
}

function iniciarTest7() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 7. CORTE DE UN DISEÑO</h1>
      <p>👉 Corta siguiendo las líneas indicadas.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      const imgs = ['tabcf71.jpg', 'tabcf72.jpg'];
      let i = 0;
      function siguiente() {
        if (i < imgs.length) {
          mostrarImagenTemporal(imgs[i++], 60, siguiente);
        } else {
          modal.style.display = 'none';
          resolve(true);
        }
      }
      siguiente();
    };
  });
}

function iniciarTest8() {
  return new Promise(resolve => {
    modal.style.display = 'flex';
    modalContent.innerHTML = `
      <h1>TEST # 8. PUNTEADO</h1>
      <p>👉 Haz puntitos en cada cuadradito. Duración: 30 segundos.</p>
      <button id="iniciar">Iniciar</button>
    `;
    document.getElementById('iniciar').onclick = function () {
      mostrarImagenTemporal('tabcf8.jpg', 30, () => {
        modal.style.display = 'none';
        resolve(true);
      });
    };
  });
}

// ===============================
// REINICIAR APP AL FINAL
// ===============================
function resetAplicacion() {
  modal.style.display = 'none';
  modaleval.style.display = 'none';
  modalContent.innerHTML = '';
  resultados.forEach(r => r.eval = null);
}

// ===============================
// BOTÓN PRINCIPAL
// ===============================
if (openModalBtn) {
  openModalBtn.addEventListener('click', async () => {
    await iniciarTest1();
    await mostrarTablaEvaluacion();
    console.log('resultados 1: ', resultados);
    await iniciarTest2();
    await mostrarTablaEvaluacion();
    console.log('resultados 2: ', resultados);
    await iniciarTest3();
    await mostrarTablaEvaluacion();
    console.log('resultados 3: ', resultados);
    await iniciarTest4();
    await mostrarTablaEvaluacion();
    console.log('resultados 4: ', resultados);
    await iniciarTest5();
    await mostrarTablaEvaluacion();
    console.log('resultados 5: ', resultados);
    await iniciarTest6();
    await mostrarTablaEvaluacion();
    console.log('resultados 6: ', resultados);
    await iniciarTest7();
    await mostrarTablaEvaluacion();
    console.log('resultados 7: ', resultados);
    await iniciarTest8();
    console.log('resultados 8-1: ', resultados);
    await mostrarTablaEvaluacion();
    console.log('resultados 8-2: ', resultados);
    resetAplicacion();
  });
}

