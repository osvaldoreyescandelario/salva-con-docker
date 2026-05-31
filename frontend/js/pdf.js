import {
  childrenData,
  getTestName,
  normalizeDateForInput
} from "./definitions.js";

async function insertarFotoExacta(pdfDoc, offsetY = 0) {
  const page = pdfDoc.getPages()[0];

  if (!childrenData.photo || !childrenData.photo.data) return;

  const photoBytes = new Uint8Array(childrenData.photo.data);

  let image;
  try {
    image = await pdfDoc.embedJpg(photoBytes);
  } catch {
    image = await pdfDoc.embedPng(photoBytes);
  }

  // Dimensiones del campo
  const fieldX = 19;
  const fieldTop = 736;
  const fieldWidth = 80;
  const fieldHeight = 80;

  // Escalado proporcional
  const imgDims = image.scale(1);
  const scale = Math.min(
    fieldWidth / imgDims.width,
    fieldHeight / imgDims.height
  );

  const drawWidth = imgDims.width * scale;
  const drawHeight = imgDims.height * scale;

  // Base Y del campo
  const baseY = fieldTop - fieldHeight;

  // Centrado vertical + desplazamiento manual
  const y = baseY + (fieldHeight - drawHeight) / 2 - offsetY; // <-- AQUÍ se baja la imagen

  // Centrado horizontal
  const x = fieldX + (fieldWidth - drawWidth) / 2;

  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight
  });
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "";

  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
  ];

  const fecha = new Date(fechaISO);
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();

  return `${dia} de ${mes} de ${anio}`;
}

/**
 * Escribe texto en un campo del PDF solo si el campo existe
 */
function safeSetText(form, fieldName, value) {
  try {
    const field = form.getTextField(fieldName);
    if (!field) return;

    field.setText(value ? String(value) : "");
  } catch (err) {
    // El campo no existe en la plantilla → se ignora silenciosamente
    console.warn(`Campo PDF no encontrado: ${fieldName}`);
  }
}

async function renderPagedPedagogySection({
  pdfDoc,
  dataArray,
  templatePath,
  maxRowsPerPage = 3,
  username,
  savedate
}) {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return;

  for (let start = 0; start < dataArray.length; start += maxRowsPerPage) {
    const chunk = dataArray.slice(start, start + maxRowsPerPage);

    const pdfBytes = await fetch(templatePath).then((r) => r.arrayBuffer());
    const doc = await PDFLib.PDFDocument.load(pdfBytes);
    const form = doc.getForm();

    for (let idx = 0; idx < chunk.length; idx++) {
      const item = chunk[idx];
      const row = idx + 1;

      const nombre = await getTestName(item.testid);
      const fecha = normalizeDateForInput(item.date);
      const expl = item.explanation || "";

      safeSetText(form, `t${row}`, nombre);
      safeSetText(form, `d${row}`, fecha);
      safeSetText(form, `e${row}`, expl);
    }

    form.flatten();

    const [copiedPage] = await pdfDoc.copyPages(doc, [0]);
    pdfDoc.addPage(copiedPage);

    await addHeaderToPage(copiedPage, pdfDoc, childrenData);
    await addFooterToPage(copiedPage, pdfDoc, username, savedate);
  }
}

async function addFooterToPage(page, pdfDoc, username, savedate) {
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  const fontSize = 9;
  const margin = 40;
  const textY = 20;
  const lineY = 32; // la línea va encima del texto

  const dateText = normalizeDateForInput(savedate);
  const userText = "Usuario: " + String(username || "");

  const { width } = page.getSize();

  /* =========================
     LÍNEA SEPARADORA
     ========================= */
  page.drawLine({
    start: { x: margin, y: lineY },
    end: { x: width - margin, y: lineY },
    thickness: 1,
    color: PDFLib.rgb(0.6, 0.6, 0.6) // gris profesional
  });

  /* =========================
     IZQUIERDA – USUARIO
     ========================= */
  page.drawText(userText, {
    x: margin,
    y: textY,
    size: fontSize,
    font
  });

  /* =========================
     DERECHA – FECHA
     ========================= */
  const dateLabel = "Fecha: " + dateText;
  const dateWidth = font.widthOfTextAtSize(dateLabel, fontSize);

  page.drawText(dateLabel, {
    x: width - margin - dateWidth,
    y: textY,
    size: fontSize,
    font
  });
}

function uint8ArrayFromPhoto(photo) {
  if (!photo || !photo.data || !Array.isArray(photo.data)) return null;
  return new Uint8Array(photo.data);
}

async function addHeaderToPage(page, pdfDoc, childrenData) {
  const fontBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  const { width, height } = page.getSize();

  const margin = 40;
  const headerTop = height - 40;
  const photoSize = 32;

  let textX = margin;

  /* =========================
     FOTO (si existe)
     ========================= */
  try {
    const photoBytes = uint8ArrayFromPhoto(childrenData.photo);

    if (photoBytes) {
      const image = await pdfDoc.embedJpg(photoBytes);

      page.drawImage(image, {
        x: margin,
        y: headerTop - photoSize,
        width: photoSize,
        height: photoSize
      });

      textX = margin + photoSize + 10;
    }
  } catch (e) {
    console.warn("⚠️ No se pudo insertar la foto en el header:", e);
  }

  /* =========================
     NOMBRE (izquierda)
     ========================= */
  page.drawText(String(childrenData.fullname || ""), {
    x: textX,
    y: headerTop - 22,
    size: 10,
    font: fontBold
  });

  /* =========================
     DNI (derecha)
     ========================= */
  const dniText = String(childrenData.dni || "");
  const dniWidth = font.widthOfTextAtSize(dniText, 11);

  page.drawText(dniText, {
    x: width - margin - dniWidth,
    y: headerTop - 22,
    size: 10,
    font
  });

  /* =========================
     LÍNEA DIVISORIA
     ========================= */
  page.drawLine({
    start: { x: margin, y: headerTop - photoSize - 8 },
    end: { x: width - margin, y: headerTop - photoSize - 8 },
    thickness: 1,
    color: PDFLib.rgb(0.6, 0.6, 0.6)
  });
}

export async function createMGIpdf() {
  /** Establece de forma segura el valor de un campo de texto en un PDFForm. */
  function safeSetText(form, fieldName, value) {
    try {
      const field = form.getField(fieldName);
      if (!field) return;
      if (typeof field.setText === "function") {
        let text = "";
        if (value === null || value === undefined) text = "";
        else if (typeof value === "number" && Number.isNaN(value)) text = "";
        else if (value instanceof Date)
          text = value.toISOString().split("T")[0];
        else text = String(value);
        field.setText(text);
      } else {
        console.warn(`Campo ${fieldName} no soporta setText`);
      }
    } catch (e) {
      console.warn(`Error al intentar setText en ${fieldName}:`, e);
    }
  }

  function safeText(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "number" && Number.isNaN(value)) return "";
    if (value instanceof Date) return value.toISOString().split("T")[0];
    return String(value);
  }

  function safeSelect(form, name, option) {
    try {
      const field = form.getField(name);
      if (field && typeof field.select === "function") {
        field.select(option);
      }
    } catch (e) {
      console.warn(`No se pudo seleccionar radio ${name}:`, e);
    }
  }

  // ========== BUCLE EXTERNO: un PDF por cada estudio ==========
  const grupos = childrenData?.data || [];

  for (let i = 0; i < grupos.length; i++) {
    const estudio = grupos[i];
    if (!Array.isArray(estudio)) continue;

    // ---------- 1) Cargar plantilla 21.pdf ----------
    const pdfBytes1 = await fetch("/pdf/21m.pdf").then((r) => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes1);
    const form = pdfDoc.getForm();

    // Insertar foto
    await insertarFotoExacta(pdfDoc, 40);

    const firstData = estudio[0] || {}; // ← CAMBIO: estudio[0]

    // Rellenar campos 21.pdf
    form.getField("pdf-dni")?.setText(safeText(childrenData?.dni));
    form.getField("pdf-fullname")?.setText(safeText(childrenData?.fullname));
    form.getField("pdf-sex")?.setText(safeText(childrenData?.sex));
    form.getField("pdf-skincolor")?.setText(safeText(childrenData?.skincolor));
    const birthFormatted =
      typeof formatearFecha === "function"
        ? formatearFecha(childrenData?.birthdate)
        : safeText(childrenData?.birthdate);
    form.getField("pdf-birthdate")?.setText(safeText(birthFormatted));
    form.getField("pdf-cage")?.setText(safeText(firstData?.cage));
    form.getField("pdf-mage")?.setText(safeText(firstData?.mage));
    form.getField("pdf-address")?.setText(safeText(firstData?.address));
    form.getField("pdf-council")?.setText(safeText(firstData?.councill));
    form
      .getField("pdf-municipality")
      ?.setText(safeText(firstData?.municipality));
    form.getField("pdf-province")?.setText(safeText(firstData?.province));
    form.getField("pdf-zone")?.setText(safeText(firstData?.zone));
    form
      .getField("pdf-personincharge")
      ?.setText(safeText(firstData?.personincharge));
    form
      .getField("pdf-parentalrelationship")
      ?.setText(safeText(firstData?.parentalrelationship));
    form
      .getField("pdf-anotherrelation")
      ?.setText(safeText(firstData?.anotherrelation));
    form.getField("pdf-tel")?.setText(safeText(firstData?.tel));
    form.getField("pdf-startdate")?.setText(safeText(firstData?.startdate));
    form.getField("pdf-edulevel")?.setText(safeText(firstData?.edulevel));
    form.getField("pdf-degree")?.setText(safeText(firstData?.degree));
    form
      .getField("pdf-eduinstitution")
      ?.setText(safeText(firstData?.eduinstitution));
    form.getField("pdf-institution")?.setText(safeText(firstData?.institution));

    // Radios de 21.pdf
    const isRepetitionYes = Number(firstData?.repetition) === 1;
    safeSelect(form, "pdf-repetition", isRepetitionYes ? "Choice1" : "Choice2");
    if (isRepetitionYes) {
      form
        .getField("pdf-repetitioncount")
        ?.setText(safeText(firstData?.repetitioncount));
      safeSelect(
        form,
        "pdf-objovercome",
        Number(firstData?.objovercome) === 1 ? "Choice1" : "Choice2"
      );
    }

    // ---------- 2) Agregar segunda página si existe ----------
    const secondData = estudio[1]; // ← CAMBIO: estudio[1]
    if (secondData) {
      const pdfBytes2 = await fetch("/pdf/311m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const extraDoc = await PDFLib.PDFDocument.load(pdfBytes2);
      const extraForm = extraDoc.getForm();

      extraForm.getField("pdf-reason")?.setText(safeText(secondData.reason));
      extraForm
        .getField("pdf-anotherreason")
        ?.setText(safeText(secondData.anotherrreason));
      extraForm
        .getField("pdf-carepathway")
        ?.setText(safeText(secondData.carepathway));
      extraForm.getField("pdf-concept")?.setText(safeText(secondData.concept));
      extraForm
        .getField("pdf-preschooldiagresults")
        ?.setText(safeText(secondData.preschooldiagresults));
      extraForm
        .getField("pdf-articulationstageresults")
        ?.setText(safeText(secondData.articulationstageresults));
      extraForm
        .getField("pdf-startdate")
        ?.setText(safeText(formatearFecha(secondData.startdate)));
      extraForm
        .getField("pdf-directtreatment")
        ?.setText(safeText(secondData.directtreatment));
      extraForm
        .getField("pdf-canceldate")
        ?.setText(safeText(formatearFecha(secondData.canceldate)));
      extraForm
        .getField("pdf-reasoncancel")
        ?.setText(safeText(secondData.reasoncancel));
      extraForm
        .getField("pdf-teachertraining")
        ?.setText(safeText(secondData.teachertraining));
      extraForm
        .getField("pdf-experience")
        ?.setText(safeText(secondData.experience));

      if (secondData.reasoncancel === "Traslado") {
        const transferwhere = safeText(secondData.transferwhere || "").trim();
        if (transferwhere.includes("(")) {
          extraForm.getField("pdf-transfer")?.setText("Otro municipio");
        } else if (!transferwhere) {
          extraForm.getField("pdf-transfer")?.setText("Emigración");
        } else {
          extraForm.getField("pdf-transfer")?.setText("Otra provincia");
        }
        extraForm
          .getField("pdf-transferwhere")
          ?.setText(safeText(secondData.transferwhere));
      }

      extraForm.flatten();
      const [copiedPage2] = await pdfDoc.copyPages(extraDoc, [0]);
      pdfDoc.addPage(copiedPage2);

      await addHeaderToPage(copiedPage2, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage2,
        pdfDoc,
        secondData.username,
        secondData.savedate
      );
    }

    // ---------- 3) Agregar tercera página si existe ----------
    const thirdData = estudio[2]; // ← CAMBIO: estudio[2]
    if (thirdData) {
      const pdfBytes3 = await fetch("/pdf/321m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const thirdDoc = await PDFLib.PDFDocument.load(pdfBytes3);
      const thirdForm = thirdDoc.getForm();

      thirdForm
        .getField("pdf-pregnancy")
        ?.setText(safeText(thirdData.pregnancy));
      thirdForm
        .getField("pdf-gesnumber")
        ?.setText(safeText(thirdData.gesnumber));
      thirdForm
        .getField("pdf-abortionstypes")
        ?.setText(
          safeText(thirdData.abortions === 1 ? thirdData.abortionstypes : "")
        );
      thirdForm
        .getField("pdf-abortionsquantity")
        ?.setText(
          safeText(thirdData.abortions === 1 ? thirdData.abortionsquantity : "")
        );
      thirdForm
        .getField("pdf-toxichabitstypes")
        ?.setText(
          safeText(
            thirdData.toxichabits === 1 ? thirdData.toxichabitstypes : ""
          )
        );
      thirdForm
        .getField("pdf-illnesses")
        ?.setText(
          safeText(
            thirdData.illnessespregnancy === 1 ? thirdData.illnesses : ""
          )
        );
      thirdForm
        .getField("pdf-childbirthtypes")
        ?.setText(safeText(thirdData.childbirthtypes));
      thirdForm
        .getField("pdf-breastfeedinguntil")
        ?.setText(safeText(thirdData.breastfeedinguntil));

      if (thirdData.abortions === 1) {
        safeSelect(thirdForm, "pdf-abortions", "Choice1");
      } else {
        thirdForm.getField("pdf-abortionstypes")?.setText("");
        thirdForm.getField("pdf-abortionsquantity")?.setText("");
      }
      safeSelect(
        thirdForm,
        "pdf-toxichabits",
        thirdData.toxichabits === 1 ? "Choice1" : "Choice2"
      );
      safeSelect(
        thirdForm,
        "pdf-motherfetusbloodcomp",
        thirdData.motherfetusbloodcomp === 0 ? "Choice3" : "Choice4"
      );
      safeSelect(
        thirdForm,
        "pdf-motherfatherconsanguinity",
        thirdData.motherfatherconsanguinity === 0 ? "Choice5" : "Choice6"
      );
      safeSelect(
        thirdForm,
        "pdf-bleeding",
        thirdData.bleeding === 0 ? "Choice7" : "Choice8"
      );
      safeSelect(
        thirdForm,
        "pdf-illnessespregnancy",
        thirdData.illnessespregnancy === 0 ? "Choice2" : "Choice3"
      );
      safeSelect(
        thirdForm,
        "pdf-complications",
        thirdData.complications === 0 ? "Choice4" : "Choice5"
      );

      thirdForm.flatten();
      const [copiedPage3] = await pdfDoc.copyPages(thirdDoc, [0]);
      pdfDoc.addPage(copiedPage3);

      await addHeaderToPage(copiedPage3, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage3,
        pdfDoc,
        thirdData.username,
        thirdData.savedate
      );
    }

    // ========= 4. Si existe fourthData, añadir página de 322.pdf =========
    const fourthData = estudio[3]; // ← CAMBIO: estudio[3]
    if (fourthData) {
      const pdfBytes4 = await fetch("/pdf/322m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const fourthDoc = await PDFLib.PDFDocument.load(pdfBytes4);
      const fourthForm = fourthDoc.getForm();

      const textFields = [
        "validism",
        "analsphinctercontrol",
        "bladdersphinctercontrol",
        "diseasessuffered",
        "traumasaccidents",
        "medications",
        "communication",
        "selfcare",
        "homelife",
        "socialskills",
        "communityuse",
        "selfdirection",
        "health",
        "leisure"
      ];
      textFields.forEach((field) => {
        const pdfFieldName = `pdf-${field}`;
        const value = fourthData[field];
        try {
          fourthForm.getField(pdfFieldName)?.setText(safeText(value));
        } catch (e) {
          console.warn(`⚠️ Campo no encontrado en 322.pdf: ${pdfFieldName}`);
        }
      });

      const scoreFields = [
        "communication",
        "selfcare",
        "homelife",
        "socialskills",
        "communityuse",
        "selfdirection",
        "health",
        "leisure"
      ];
      let totalScore = 0;
      scoreFields.forEach((f) => {
        const raw = fourthData[f];
        const num = Number(raw);
        if (!Number.isNaN(num)) totalScore += num;
      });
      try {
        fourthForm.getField("pdf-total")?.setText(String(totalScore));
      } catch (e) {
        console.warn("⚠️ Campo pdf-total no encontrado en 322m.pdf");
      }

      fourthForm.flatten();
      const [copiedPage4] = await pdfDoc.copyPages(fourthDoc, [0]);
      pdfDoc.addPage(copiedPage4);

      await addHeaderToPage(copiedPage4, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage4,
        pdfDoc,
        fourthData.username,
        fourthData.savedate
      );
    }

    // ========= 5. Si existe fifthData, añadir página de 323.pdf =========
    const fifthData = estudio[4]; // ← CAMBIO: estudio[4]
    if (fifthData) {
      const pdfBytes5 = await fetch("/pdf/323m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const fifthDoc = await PDFLib.PDFDocument.load(pdfBytes5);
      const fifthForm = fifthDoc.getForm();

      const fifthTextFields = [
        "maternalfamilypathhistory",
        "paternalfamilypathhistory"
      ];
      fifthTextFields.forEach((field) => {
        const pdfFieldName = `pdf-${field}`;
        const value = fifthData[field];
        try {
          fifthForm.getField(pdfFieldName)?.setText(safeText(value));
        } catch (e) {
          console.warn(`⚠️ Campo no encontrado en 323.pdf: ${pdfFieldName}`);
        }
      });

      fifthForm.flatten();
      const [copiedPage5] = await pdfDoc.copyPages(fifthDoc, [0]);
      pdfDoc.addPage(copiedPage5);

      await addHeaderToPage(copiedPage5, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage5,
        pdfDoc,
        fifthData.username,
        fifthData.savedate
      );
    }

    // ========= 6. Si existe sixthData, añadir página de 331.pdf =========
    const sixthData = estudio[5]; // ← CAMBIO: estudio[5]
    if (sixthData) {
      const pdfBytes6 = await fetch("/pdf/331m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const sixthDoc = await PDFLib.PDFDocument.load(pdfBytes6);
      const sixthForm = sixthDoc.getForm();

      const checkboxFields = [
        "mother",
        "father",
        "maternalgrandmother",
        "maternalgrandfather",
        "paternalgrandmother",
        "paternalgrandfather"
      ];
      checkboxFields.forEach((field) => {
        const pdfFieldName = `pdf-${field}`;
        try {
          const pdfField = sixthForm.getField(pdfFieldName);
          if (sixthData[field] === 1) {
            pdfField.check();
          } else {
            pdfField.uncheck();
          }
        } catch (e) {
          console.warn(`⚠️ Checkbox no encontrado en 331.pdf: ${pdfFieldName}`);
        }
      });

      const normalTextFields = [
        "brothers",
        "maternaluncles",
        "paternaluncles",
        "parentsrelationships"
      ];
      normalTextFields.forEach((field) => {
        const pdfFieldName = `pdf-${field}`;
        const value = sixthData[field];
        try {
          sixthForm.getField(pdfFieldName)?.setText(safeText(value));
        } catch (e) {
          console.warn(
            `⚠️ Campo texto no encontrado en 331.pdf: ${pdfFieldName}`
          );
        }
      });

      let whichOtherValue = "";
      const parentsRelRaw = sixthData?.parentsrelationships;
      if (parentsRelRaw !== null && parentsRelRaw !== undefined) {
        const parentsRelStr = String(parentsRelRaw).trim().toLowerCase();
        if (/\botra\b/i.test(parentsRelStr)) {
          whichOtherValue = safeText(sixthData?.whichother);
        }
      }
      try {
        sixthForm.getField("pdf-whichother")?.setText(whichOtherValue);
      } catch (e) {
        console.warn(`⚠️ Campo pdf-whichother no encontrado en 331.pdf`);
      }

      sixthForm.flatten();
      const [copiedPage6] = await pdfDoc.copyPages(sixthDoc, [0]);
      pdfDoc.addPage(copiedPage6);

      await addHeaderToPage(copiedPage6, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage6,
        pdfDoc,
        sixthData.username,
        sixthData.savedate
      );
    }

    // ---------- 7) Si existe seventhData, añadir página desde 332.pdf ----------
    const seventhData = estudio[6]; // ← CAMBIO: estudio[6]
    if (seventhData) {
      const pdfBytes7 = await fetch("/pdf/332m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const seventhDoc = await PDFLib.PDFDocument.load(pdfBytes7);
      const seventhForm = seventhDoc.getForm();

      const seventhFields = [
        "livingrooms",
        "bedrooms",
        "kitchen",
        "bathrooms",
        "constconditions",
        "economicsituation"
      ];
      seventhFields.forEach((field) => {
        safeSetText(seventhForm, `pdf-${field}`, seventhData[field]);
      });

      seventhForm.flatten();
      const [copiedPage7] = await pdfDoc.copyPages(seventhDoc, [0]);
      pdfDoc.addPage(copiedPage7);

      await addHeaderToPage(copiedPage7, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage7,
        pdfDoc,
        seventhData.username,
        seventhData.savedate
      );
    }

    // ---------- 8) Si existe eighthData, añadir página desde 333.pdf ----------
    const eighthData = estudio[7]; // ← CAMBIO: estudio[7]
    if (eighthData) {
      const pdfBytes8 = await fetch("/pdf/333m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const eighthDoc = await PDFLib.PDFDocument.load(pdfBytes8);
      const eighthForm = eighthDoc.getForm();

      const eighthFields = [
        "f11",
        "f12",
        "f21",
        "f22",
        "f31",
        "f32",
        "f41",
        "f42",
        "f51",
        "f52"
      ];
      eighthFields.forEach((field) => {
        safeSetText(eighthForm, `pdf-${field}`, eighthData[field]);
      });

      eighthForm.flatten();
      const [copiedPage8] = await pdfDoc.copyPages(eighthDoc, [0]);
      pdfDoc.addPage(copiedPage8);

      await addHeaderToPage(copiedPage8, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage8,
        pdfDoc,
        eighthData.username,
        eighthData.savedate
      );
    }

    const nineData = estudio[8];
    if (
      nineData &&
      Array.isArray(nineData.psicologia) &&
      nineData.psicologia.length > 0
    ) {
      const pdfBytes9 = await fetch("/pdf/34psicom.pdf").then((r) =>
        r.arrayBuffer()
      );
      const nineDoc = await PDFLib.PDFDocument.load(pdfBytes9);
      const nineForm = nineDoc.getForm();

      const psicArr = nineData.psicologia; // [{testid, date}, ...]
      const maxRows = 26; // por ejemplo, número de filas (t1..t20, d1..d20) que tenga tu plantilla

      for (let idx = 0; idx < psicArr.length && idx < maxRows; idx++) {
        const item = psicArr[idx];
        const row = idx + 1; // 1,2,3...
        const nombre = await getTestName(item.testid);
        const fecha = normalizeDateForInput(item.date);

        const tFieldName = `t${row}`;
        const dFieldName = `d${row}`;

        safeSetText(nineForm, tFieldName, nombre);
        safeSetText(nineForm, dFieldName, fecha);
      }

      nineForm.flatten();
      const [copiedPage9] = await pdfDoc.copyPages(nineDoc, [0]);
      pdfDoc.addPage(copiedPage9);

      await addHeaderToPage(copiedPage9, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage9,
        pdfDoc,
        nineData.username,
        nineData.savedate
      );
    }

    /* =========================
      DÉCIMA PÁGINA – NEURO
      ========================= */

    const tenthData = estudio[8];

    if (
      tenthData &&
      Array.isArray(tenthData.neuro) &&
      tenthData.neuro.length > 0
    ) {
      const pdfBytes10 = await fetch("/pdf/34neurom.pdf").then((r) =>
        r.arrayBuffer()
      );
      const tenthDoc = await PDFLib.PDFDocument.load(pdfBytes10);
      const tenthForm = tenthDoc.getForm();

      const neuroArr = tenthData.neuro; // [{ testid, date }, ...]
      const maxRows = 26; // mismo criterio que la página anterior

      for (let idx = 0; idx < neuroArr.length && idx < maxRows; idx++) {
        const item = neuroArr[idx];
        const row = idx + 1;

        const nombre = await getTestName(item.testid);
        const fecha = normalizeDateForInput(item.date);

        const tFieldName = `t${row}`;
        const dFieldName = `d${row}`;

        safeSetText(tenthForm, tFieldName, nombre);
        safeSetText(tenthForm, dFieldName, fecha);
      }

      tenthForm.flatten();

      const [copiedPage10] = await pdfDoc.copyPages(tenthDoc, [0]);
      pdfDoc.addPage(copiedPage10);

      await addHeaderToPage(copiedPage10, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage10,
        pdfDoc,
        tenthData.username,
        tenthData.savedate
      );
    }

    /* =========================
      ONCENA PÁGINA – PSICOMETRÍA
      ========================= */

    const eleventhData = estudio[8];

    if (
      eleventhData &&
      Array.isArray(eleventhData.psicometria) &&
      eleventhData.psicometria.length > 0
    ) {
      const pdfBytes11 = await fetch("/pdf/34psicomem.pdf").then((r) =>
        r.arrayBuffer()
      );
      const eleventhDoc = await PDFLib.PDFDocument.load(pdfBytes11);
      const eleventhForm = eleventhDoc.getForm();

      const psicomArr = eleventhData.psicometria; // [{ testid, date }, ...]
      const maxRows = 26; // mismo criterio que las páginas previas

      for (let idx = 0; idx < psicomArr.length && idx < maxRows; idx++) {
        const item = psicomArr[idx];
        const row = idx + 1;

        const nombre = await getTestName(item.testid);
        const fecha = normalizeDateForInput(item.date);

        const tFieldName = `t${row}`;
        const dFieldName = `d${row}`;

        safeSetText(eleventhForm, tFieldName, nombre);
        safeSetText(eleventhForm, dFieldName, fecha);
      }

      eleventhForm.flatten();

      const [copiedPage11] = await pdfDoc.copyPages(eleventhDoc, [0]);
      pdfDoc.addPage(copiedPage11);

      await addHeaderToPage(copiedPage11, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage11,
        pdfDoc,
        eleventhData.username,
        eleventhData.savedate
      );
    }

    /* =========================
      DUODÉCIMA PÁGINA – PSICOPEDAGOGÍA
      ========================= */

    const twelfthData = estudio[8];

    if (
      twelfthData &&
      Array.isArray(twelfthData.psicopedagogia) &&
      twelfthData.psicopedagogia.length > 0
    ) {
      const pdfBytes12 = await fetch("/pdf/34psicopedm.pdf").then((r) =>
        r.arrayBuffer()
      );
      const twelfthDoc = await PDFLib.PDFDocument.load(pdfBytes12);
      const twelfthForm = twelfthDoc.getForm();

      const psicopedArr = twelfthData.psicopedagogia; // [{ testid, date }, ...]
      const maxRows = 26; // mismo criterio que las páginas previas

      for (let idx = 0; idx < psicopedArr.length && idx < maxRows; idx++) {
        const item = psicopedArr[idx];
        const row = idx + 1;

        const nombre = await getTestName(item.testid);
        const fecha = normalizeDateForInput(item.date);

        const tFieldName = `t${row}`;
        const dFieldName = `d${row}`;

        safeSetText(twelfthForm, tFieldName, nombre);
        safeSetText(twelfthForm, dFieldName, fecha);
      }

      twelfthForm.flatten();

      const [copiedPage12] = await pdfDoc.copyPages(twelfthDoc, [0]);
      pdfDoc.addPage(copiedPage12);

      await addHeaderToPage(copiedPage12, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage12,
        pdfDoc,
        twelfthData.username,
        twelfthData.savedate
      );
    }

    /* =========================
   DECIMOTERCERA PÁGINA – PEDAGOGÍA GENERAL
   ========================= */

    const thirteenthData = estudio[8];

    if (
      thirteenthData &&
      Array.isArray(thirteenthData.pedagogia) &&
      thirteenthData.pedagogia.length > 0
    ) {
      const pdfBytes13 = await fetch("/pdf/34pedgeneralm.pdf").then((r) =>
        r.arrayBuffer()
      );
      const thirteenthDoc = await PDFLib.PDFDocument.load(pdfBytes13);
      const thirteenthForm = thirteenthDoc.getForm();

      const pedagArr = thirteenthData.pedagogia; // [{ testid, date, explanation }, ...]
      const maxRows = 26; // mismo criterio que las páginas previas

      for (let idx = 0; idx < pedagArr.length && idx < maxRows; idx++) {
        const item = pedagArr[idx];
        const row = idx + 1;

        const nombre = await getTestName(item.testid);
        const fecha = normalizeDateForInput(item.date);
        const expl = item.explanation || "";

        const tFieldName = `t${row}`;
        const dFieldName = `d${row}`;
        const eFieldName = `e${row}`;

        safeSetText(thirteenthForm, tFieldName, nombre);
        safeSetText(thirteenthForm, dFieldName, fecha);
        safeSetText(thirteenthForm, eFieldName, expl);
      }

      thirteenthForm.flatten();

      const [copiedPage13] = await pdfDoc.copyPages(thirteenthDoc, [0]);
      pdfDoc.addPage(copiedPage13);

      await addHeaderToPage(copiedPage13, pdfDoc, childrenData);
      await addFooterToPage(
        copiedPage13,
        pdfDoc,
        thirteenthData.username,
        thirteenthData.savedate
      );
    }

    const baseData = estudio[8];

    /* =========================
   LENGUA ESPAÑOLA
   ========================= */
    if (baseData?.language?.length > 0) {
      await renderPagedPedagogySection({
        pdfDoc,
        dataArray: baseData.language,
        templatePath: "/pdf/34pedlangm.pdf",
        maxRowsPerPage: 3,
        username: baseData.username,
        savedate: baseData.savedate
      });
    }

    /* =========================
   MATEMÁTICA
   ========================= */
    if (baseData?.math?.length > 0) {
      await renderPagedPedagogySection({
        pdfDoc,
        dataArray: baseData.math,
        templatePath: "/pdf/34pedmathm.pdf",
        maxRowsPerPage: 3,
        username: baseData.username,
        savedate: baseData.savedate
      });
    }

    /* =========================
   HISTORIA
   ========================= */
    if (baseData?.history?.length > 0) {
      await renderPagedPedagogySection({
        pdfDoc,
        dataArray: baseData.history,
        templatePath: "/pdf/34pedhistoriam.pdf",
        maxRowsPerPage: 3,
        username: baseData.username,
        savedate: baseData.savedate
      });
    }

    /* =========================
   LOGOPEDIA
   ========================= */

    const baselogo = estudio[8];

    if (baselogo?.logopedia?.length > 0) {
      await renderPagedPedagogySection({
        pdfDoc,
        dataArray: baselogo.logopedia,
        templatePath: "/pdf/34logopediam.pdf",
        maxRowsPerPage: 3,
        username: baselogo.username,
        savedate: baselogo.savedate
      });
    }

    /* =========================
   ÚLTIMA PÁGINA – OTROS
   ========================= */

    const lastData = estudio[8];

    if (lastData) {
      const pdfBytesLast = await fetch("/pdf/34otrosm.pdf").then((r) =>
        r.arrayBuffer()
      );
      const lastDoc = await PDFLib.PDFDocument.load(pdfBytesLast);
      const lastForm = lastDoc.getForm();

      // Asignar valores
      safeSetText(lastForm, "canal", lastData.channel || "");
      safeSetText(lastForm, "ritmo", lastData.rhythm || "");

      // Aplanar formulario
      lastForm.flatten();

      // Copiar página al PDF final
      const [copiedLastPage] = await pdfDoc.copyPages(lastDoc, [0]);
      pdfDoc.addPage(copiedLastPage);

      await addHeaderToPage(copiedLastPage, pdfDoc, childrenData);
      await addFooterToPage(
        copiedLastPage,
        pdfDoc,
        lastData.username,
        lastData.savedate
      );
    }

    const firstResultData = estudio[9];

    if (firstResultData) {
      /* =========================
     PRIMERA HOJA – 411m.pdf
     ========================= */

      const pdfBytes411 = await fetch("/pdf/411m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const doc411 = await PDFLib.PDFDocument.load(pdfBytes411);
      const form411 = doc411.getForm();

      const fields411 = [
        "psicopotential",
        "psiconeeds",
        "psicodiagimpression",
        "psicopedpotential",
        "psicopedneeds",
        "psicopeddiagimpression",
        "intelligencequotient",
        "devquotient",
        "psicomediagimpression"
      ];

      fields411.forEach((f) => safeSetText(form411, f, firstResultData[f]));

      form411.flatten();

      const [page411] = await pdfDoc.copyPages(doc411, [0]);
      pdfDoc.addPage(page411);

      await addHeaderToPage(page411, pdfDoc, childrenData);
      await addFooterToPage(
        page411,
        pdfDoc,
        firstResultData.username,
        firstResultData.savedate
      );

      /* =========================
     PÁGINAS INTERMEDIAS – 412m.pdf
     (una por cada pedagogy)
     ========================= */

      if (Array.isArray(firstResultData.pedagogy)) {
        for (const ped of firstResultData.pedagogy) {
          const pdfBytes412 = await fetch("/pdf/412m.pdf").then((r) =>
            r.arrayBuffer()
          );
          const doc412 = await PDFLib.PDFDocument.load(pdfBytes412);
          const form412 = doc412.getForm();

          const fields412 = [
            "schoolgrade",
            "communication",
            "relationship",
            "motorskills",
            "spanishlanguage",
            "math",
            "history"
          ];

          fields412.forEach((f) => safeSetText(form412, f, ped[f]));

          form412.flatten();

          const [page412] = await pdfDoc.copyPages(doc412, [0]);
          pdfDoc.addPage(page412);

          await addHeaderToPage(page412, pdfDoc, childrenData);
          await addFooterToPage(
            page412,
            pdfDoc,
            ped.username || firstResultData.username,
            ped.savedate || firstResultData.savedate
          );
        }
      }

      /* =========================
     ÚLTIMA HOJA – 413m.pdf
     ========================= */

      const pdfBytes413 = await fetch("/pdf/413m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const doc413 = await PDFLib.PDFDocument.load(pdfBytes413);
      const form413 = doc413.getForm();

      const fields413 = [
        "speechtherapydiagnosis",
        "potential",
        "needs",
        "diagnosticresults"
      ];

      fields413.forEach((f) => safeSetText(form413, f, firstResultData[f]));

      form413.flatten();

      const [page413] = await pdfDoc.copyPages(doc413, [0]);
      pdfDoc.addPage(page413);

      await addHeaderToPage(page413, pdfDoc, childrenData);
      await addFooterToPage(
        page413,
        pdfDoc,
        firstResultData.username,
        firstResultData.savedate
      );
    }

    /* =========================
   RESULTADO 42m.pdf
   ========================= */

    const secondResultData = estudio[10];

    if (secondResultData) {
      const pdfBytes42 = await fetch("/pdf/42m.pdf").then((r) =>
        r.arrayBuffer()
      );
      const doc42 = await PDFLib.PDFDocument.load(pdfBytes42);
      const form42 = doc42.getForm();

      // Campos de texto normales
      const fields42 = [
        "bond",
        "institution",
        "diagnosis",
        "potential",
        "needs",
        "recommendations"
      ];

      fields42.forEach((field) => {
        // 👇 Institución SOLO si bond === "Sociolaboral"
        if (field === "institution") {
          if (secondResultData.bond === "Sociolaboral") {
            safeSetText(form42, field, secondResultData[field]);
          } else {
            // Dejar completamente vacío (equivale a "no visible")
            safeSetText(form42, field, "");
          }
        } else {
          safeSetText(form42, field, secondResultData[field]);
        }
      });

      // Si hubiera radios / selects en 42m (ejemplo)
      if (secondResultData.bond) {
        safeSetText(form42, "bond", secondResultData.bond);
      }

      // Aplanar
      form42.flatten();

      // Copiar página al PDF final
      const [page42] = await pdfDoc.copyPages(doc42, [0]);
      pdfDoc.addPage(page42);

      // Header / Footer
      await addHeaderToPage(page42, pdfDoc, childrenData);
      await addFooterToPage(
        page42,
        pdfDoc,
        secondResultData.username,
        secondResultData.savedate
      );
    }

    // ---------- Guardar y descargar este estudio ----------
    const finalBytes = await pdfDoc.save();
    const blob = new Blob([finalBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mgi_estudio_${i + 1}.pdf`;
    link.click();
  } // fin bucle for i
}
