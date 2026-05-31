const { pool } = require("../config/db");
const {
  auditAction,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES
} = require("../middlewares/audit");

// ******************************************************************************************
// *       RUTAS PARA SALVAR CADA UNO DE LOS FORMULARIOS
// ******************************************************************************************
async function handleSaveGeneric({
  req,
  res,
  query,
  paramsBuilder,
  entity,
  action,
  buildAudit,
  pre = null,
  post = null
}) {
  const data = req.body;
  const conn = await pool.getConnection();
  const auditUsername = data.username || req.user?.username || "desconocido";
  try {
    await conn.beginTransaction();
    if (pre) await pre(data, conn);
    const params = paramsBuilder(data);
    const [result] = await conn.execute(query, params);
    let extraResult = null;
    if (post) extraResult = await post({ data, conn, result });
    const auditData = buildAudit({ data, result, extraResult });
    await auditAction({
      req,
      actor: { username: auditUsername },
      action,
      entity,
      entityId: auditData.entityId,
      description: auditData.description,
      oldState: null,
      newState: auditData.newState
    });
    await conn.commit();
    res.json({
      success: true,
      insertedId: result.insertId || auditData.entityId
    });
  } catch (err) {
    await conn.rollback();
    console.error(`❌ Error en ${entity}:`, err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

exports.saveme311 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME31,
    action: AUDIT_ACTIONS.CREATE,
    query: `INSERT INTO me3_1_1 (id, dni, reason, anotherrreason, carepathway, concept, preschooldiagresults, articulationstageresults, startdate, directtreatment, canceldate, reasoncancel, transfer, transferwhere, teachertraining, experience, savedate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    paramsBuilder: (d) => [
      d.id,
      d.dni,
      d.reason,
      d.anotherrreason,
      d.carepathway,
      d.concept,
      d.preschooldiagresults,
      d.articulationstageresults,
      d.startdate,
      d.directtreatment,
      d.canceldate,
      d.reasoncancel,
      d.transfer,
      d.transferwhere,
      d.teachertraining,
      d.experience,
      d.savedate
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro insertado para DNI: ${data.dni}`,
      newState: {
        dni: data.dni,
        reason: data.reason,
        carepathway: data.carepathway
      }
    })
  });

exports.saveme321 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME32,
    action: AUDIT_ACTIONS.UPDATE,
    query: `INSERT INTO me3_2_1 (id, dni, pregnancy, gesnumber, abortions, abortionstypes, abortionsquantity, toxichabits, toxichabitstypes, motherfetusbloodcomp, motherfatherconsanguinity, bleeding, illnessespregnancy, illnesses, childbirthtypes, complications, breastfeedinguntil, savedate, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE pregnancy=VALUES(pregnancy), gesnumber=VALUES(gesnumber), abortions=VALUES(abortions), abortionstypes=VALUES(abortionstypes), abortionsquantity=VALUES(abortionsquantity), toxichabits=VALUES(toxichabits), toxichabitstypes=VALUES(toxichabitstypes), motherfetusbloodcomp=VALUES(motherfetusbloodcomp), motherfatherconsanguinity=VALUES(motherfatherconsanguinity), bleeding=VALUES(bleeding), illnessespregnancy=VALUES(illnessespregnancy), illnesses=VALUES(illnesses), childbirthtypes=VALUES(childbirthtypes), complications=VALUES(complications), breastfeedinguntil=VALUES(breastfeedinguntil), savedate=VALUES(savedate), username=VALUES(username)`,
    paramsBuilder: (d) => [
      d.id,
      d.dni,
      d.pregnancy,
      d.gesnumber,
      d.abortions,
      d.abortionstypes,
      d.abortionsquantity,
      d.toxichabits,
      d.toxichabitstypes,
      d.motherfetusbloodcomp,
      d.motherfatherconsanguinity,
      d.bleeding,
      d.illnessespregnancy,
      d.illnesses,
      d.childbirthtypes,
      d.complications,
      d.breastfeedinguntil,
      d.savedate,
      d.username
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro insertado o actualizado para DNI: ${data.dni}`,
      newState: {
        dni: data.dni,
        pregnancy: data.pregnancy,
        gesnumber: data.gesnumber
      }
    })
  });

exports.saveme322 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME32,
    action: AUDIT_ACTIONS.UPDATE,
    query: `INSERT INTO me3_2_2 (id, dni, validism, analsphinctercontrol, bladdersphinctercontrol, diseasessuffered, traumasaccidents, medications, communication, selfcare, homelife, socialskills, communityuse, selfdirection, health, leisure, savedate, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE validism=VALUES(validism), analsphinctercontrol=VALUES(analsphinctercontrol), bladdersphinctercontrol=VALUES(bladdersphinctercontrol), diseasessuffered=VALUES(diseasessuffered), traumasaccidents=VALUES(traumasaccidents), medications=VALUES(medications), communication=VALUES(communication), selfcare=VALUES(selfcare), homelife=VALUES(homelife), socialskills=VALUES(socialskills), communityuse=VALUES(communityuse), selfdirection=VALUES(selfdirection), health=VALUES(health), leisure=VALUES(leisure), savedate=VALUES(savedate), username=VALUES(username)`,
    paramsBuilder: (d) => [
      d.id,
      d.dni,
      d.validism,
      d.analsphinctercontrol,
      d.bladdersphinctercontrol,
      d.diseasessuffered,
      d.traumasaccidents,
      d.medications,
      d.communication,
      d.selfcare,
      d.homelife,
      d.socialskills,
      d.communityuse,
      d.selfdirection,
      d.health,
      d.leisure,
      d.savedate,
      d.username
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro insertado o actualizado para DNI: ${data.dni}`,
      newState: {
        dni: data.dni,
        validism: data.validism,
        selfcare: data.selfcare
      }
    })
  });

exports.saveme323 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME32,
    action: AUDIT_ACTIONS.UPDATE,
    query: `INSERT INTO me3_2_3 (id, dni, maternalfamilypathhistory, paternalfamilypathhistory, savedate, username) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE maternalfamilypathhistory=VALUES(maternalfamilypathhistory), paternalfamilypathhistory=VALUES(paternalfamilypathhistory), savedate=VALUES(savedate), username=VALUES(username)`,
    paramsBuilder: (d) => [
      d.id,
      d.dni,
      d.maternalfamilypathhistory,
      d.paternalfamilypathhistory,
      d.savedate,
      d.username
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro insertado o actualizado para DNI: ${data.dni}`,
      newState: {
        maternal: data.maternalfamilypathhistory,
        paternal: data.paternalfamilypathhistory
      }
    })
  });

exports.saveme331 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME33,
    action: AUDIT_ACTIONS.UPDATE,
    query: `INSERT INTO me3_3_1 (id, dni, mother, father, maternalgrandmother, maternalgrandfather, paternalgrandmother, paternalgrandfather, brothers, maternaluncles, paternaluncles, parentsrelationships, whichother, savedate, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE mother=VALUES(mother), father=VALUES(father), maternalgrandmother=VALUES(maternalgrandmother), maternalgrandfather=VALUES(maternalgrandfather), paternalgrandmother=VALUES(paternalgrandmother), paternalgrandfather=VALUES(paternalgrandfather), brothers=VALUES(brothers), maternaluncles=VALUES(maternaluncles), paternaluncles=VALUES(paternaluncles), parentsrelationships=VALUES(parentsrelationships), whichother=VALUES(whichother), savedate=VALUES(savedate), username=VALUES(username)`,
    paramsBuilder: (d) => [
      d.id,
      d.dni,
      d.mother,
      d.father,
      d.maternalgrandmother,
      d.maternalgrandfather,
      d.paternalgrandmother,
      d.paternalgrandfather,
      d.brothers,
      d.maternaluncles,
      d.paternaluncles,
      d.parentsrelationships,
      d.whichother,
      d.savedate,
      d.username
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro insertado o actualizado`,
      newState: {
        mother: data.mother,
        father: data.father,
        brothers: data.brothers
      }
    })
  });

exports.saveme332 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME33,
    action: AUDIT_ACTIONS.UPDATE,
    query: `INSERT INTO me3_3_2 (id, dni, livingrooms, bedrooms, kitchen, bathrooms, constconditions, economicsituation, savedate, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE livingrooms=VALUES(livingrooms), bedrooms=VALUES(bedrooms), kitchen=VALUES(kitchen), bathrooms=VALUES(bathrooms), constconditions=VALUES(constconditions), economicsituation=VALUES(economicsituation), savedate=VALUES(savedate), username=VALUES(username)`,
    paramsBuilder: (d) => [
      d.id,
      d.dni,
      Number(d.livingrooms ?? 0),
      Number(d.bedrooms ?? 0),
      Number(d.kitchen ?? 0),
      Number(d.bathrooms ?? 0),
      d.constconditions || "",
      d.economicsituation || "",
      d.savedate,
      d.username
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro actualizado`,
      newState: {
        livingrooms: data.livingrooms,
        bedrooms: data.bedrooms,
        economicsituation: data.economicsituation
      }
    })
  });

exports.saveme333 = (req, res) =>
  handleSaveGeneric({
    req,
    res,
    entity: AUDIT_ENTITIES.ME33,
    action: AUDIT_ACTIONS.UPDATE,
    query: `INSERT INTO me3_3_3 (id, dni, f11, f12, f21, f22, f31, f32, f41, f42, f51, f52, savedate, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE f11=VALUES(f11), f12=VALUES(f12), f21=VALUES(f21), f22=VALUES(f22), f31=VALUES(f31), f32=VALUES(f32), f41=VALUES(f41), f42=VALUES(f42), f51=VALUES(f51), f52=VALUES(f52), savedate=VALUES(savedate), username=VALUES(username)`,
    paramsBuilder: (d) => [
      d.id ?? null,
      d.dni ?? "",
      d.f11 ?? "",
      d.f12 ?? "",
      d.f21 ?? "",
      d.f22 ?? "",
      d.f31 ?? "",
      d.f32 ?? "",
      d.f41 ?? "",
      d.f42 ?? "",
      d.f51 ?? "",
      d.f52 ?? "",
      d.savedate ?? null,
      d.username
    ],
    buildAudit: ({ data }) => ({
      entityId: data.id,
      description: `Registro actualizado`,
      newState: { f11: data.f11, f12: data.f12 }
    })
  });

const SIMPLE_TEST_MAP = [
  { flag: "psychology", array: "psicologia" },
  { flag: "neurocognitive", array: "neuro" },
  { flag: "psychometry", array: "psicometria" },
  { flag: "psychopedagogy", array: "psicopedagogia" }
];

const EXPLANATION_TEST_MAP = [
  { flag: "pedagogygeneral", array: "pedagogia" },
  { flag: "pedagogyhistory", array: "history" },
  { flag: "pedagogylang", array: "language" },
  { flag: "pedagogymath", array: "math" },
  { flag: "speechtherapy", array: "logopedia" }
];

function createPostHandler(config) {
  return async (req, res) => {
    const data = req.body;
    const conn = await pool.getConnection();
    const auditUsername = data.username || req.user?.username || "desconocido";

    try {
      await conn.beginTransaction();

      // 🔹 Ejecutar lógica principal
      const result = await config.main(conn, data, auditUsername);

      // 🔹 Lógica adicional opcional
      if (config.after) {
        await config.after(conn, data, result, auditUsername);
      }

      // 🔹 Auditoría
      await auditAction({
        req,
        actor: { username: auditUsername },
        action: config.audit.action,
        entity: config.audit.entity,
        entityId: config.audit.getId(data, result),
        description: config.audit.getDescription(data),
        oldState: null,
        newState: config.audit.getNewState(data)
      });

      await conn.commit();

      res.json({
        success: true,
        insertedId: result?.insertId || config.audit.getId(data, result)
      });
    } catch (err) {
      await conn.rollback();
      console.error(`❌ Error en ${config.path}:`, err);
      res.status(500).json({ success: false, message: err.message });
    } finally {
      conn.release();
    }
  };
}

exports.saveme34 = createPostHandler({
  path: "/api/saveme34",

  main: async (conn, data, auditUsername) => {
    const sql = `
      INSERT INTO me3_4 (
        id, dni, psychology, neurocognitive, psychometry, psychopedagogy,
        pedagogygeneral, pedagogylang, pedagogymath, speechtherapy, pedagogyhistory,
        channel, rhythm, savedate, username
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        psychology=VALUES(psychology),
        neurocognitive=VALUES(neurocognitive),
        psychometry=VALUES(psychometry),
        psychopedagogy=VALUES(psychopedagogy),
        pedagogygeneral=VALUES(pedagogygeneral),
        pedagogylang=VALUES(pedagogylang),
        pedagogymath=VALUES(pedagogymath),
        speechtherapy=VALUES(speechtherapy),
        pedagogyhistory=VALUES(pedagogyhistory),
        channel=VALUES(channel),
        rhythm=VALUES(rhythm),
        savedate=VALUES(savedate),
        username=VALUES(username)
    `;

    const [result] = await conn.execute(sql, [
      data.id,
      data.dni,
      data.psychology,
      data.neurocognitive,
      data.psychometry,
      data.psychopedagogy,
      data.pedagogygeneral,
      data.pedagogylang,
      data.pedagogymath,
      data.speechtherapy,
      data.pedagogyhistory,
      data.channel || null,
      data.rhythm || null,
      data.savedate || null,
      auditUsername
    ]);

    return { id: result.insertId || data.id };
  },

  after: async (conn, data, result) => {
    const idme34 = result.id;

    await conn.execute("DELETE FROM auxselectedtests WHERE idme34 = ?", [
      idme34
    ]);

    // simples
    for (const cfg of SIMPLE_TEST_MAP) {
      if (!data[cfg.flag]) continue;
      for (const item of data[cfg.array] || []) {
        if (!item?.date) continue;
        await conn.execute(
          `INSERT INTO auxselectedtests (idme34, testid, date) VALUES (?, ?, ?)`,
          [idme34, item.testid, item.date]
        );
      }
    }

    // con explicación
    for (const cfg of EXPLANATION_TEST_MAP) {
      if (!data[cfg.flag]) continue;
      for (const item of data[cfg.array] || []) {
        if (!item?.date) continue;
        await conn.execute(
          `INSERT INTO auxselectedtests (idme34, testid, date, explanation) VALUES (?, ?, ?, ?)`,
          [idme34, item.testid, item.date, item.explanation || null]
        );
      }
    }
  },

  audit: {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.ME34,
    getId: (data, result) => result.id,
    getDescription: (data) =>
      `Registro insertado/actualizado en me3_4 para DNI ${data.dni}`,
    getNewState: (data) => data
  }
});

exports.savemrrp41 = createPostHandler({
  path: "/api/savemrrp41",

  main: async (conn, data, auditUsername) => {
    const sql = `
      INSERT INTO mrrp41 (
        id, dni, psicopotential, psiconeeds, psicodiagimpression,
        psicopedpotential, psicopedneeds, psicopeddiagimpression,
        intelligencequotient, devquotient, psicomediagimpression,
        speechtherapydiagnosis, potential, needs, diagnosticresults,
        savedate, username
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        psicopotential=VALUES(psicopotential),
        psiconeeds=VALUES(psiconeeds),
        psicodiagimpression=VALUES(psicodiagimpression),
        psicopedpotential=VALUES(psicopedpotential),
        psicopedneeds=VALUES(psicopedneeds),
        psicopeddiagimpression=VALUES(psicopeddiagimpression),
        intelligencequotient=VALUES(intelligencequotient),
        devquotient=VALUES(devquotient),
        psicomediagimpression=VALUES(psicomediagimpression),
        speechtherapydiagnosis=VALUES(speechtherapydiagnosis),
        potential=VALUES(potential),
        needs=VALUES(needs),
        diagnosticresults=VALUES(diagnosticresults),
        savedate=VALUES(savedate),
        username=VALUES(username)
    `;

    await conn.execute(sql, [
      data.id,
      data.dni,
      data.psicopotential,
      data.psiconeeds,
      data.psicodiagimpression,
      data.psicopedpotential,
      data.psicopedneeds,
      data.psicopeddiagimpression,
      data.intelligencequotient,
      data.devquotient,
      data.psicomediagimpression,
      data.speechtherapydiagnosis,
      data.potential,
      data.needs,
      data.diagnosticresults,
      data.savedate,
      auditUsername
    ]);

    return { id: data.id };
  },

  after: async (conn, data, result, auditUsername) => {
    if (!Array.isArray(data.pedagogy)) return;

    const sql = `
      INSERT INTO auxmrrppedagogy (
        id, schoolgrade, communication, relationship, motorskills,
        spanishlanguage, math, history, savedate, username
      ) VALUES (?,?,?,?,?,?,?,?,?,?)
    `;

    for (const row of data.pedagogy) {
      await conn.execute(sql, [
        data.id,
        row.schoolgrade,
        row.communication,
        row.relationship,
        row.motorskills,
        row.spanishlanguage,
        row.math,
        row.history,
        data.savedate,
        auditUsername
      ]);
    }
  },

  audit: {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.MRRP41,
    getId: (data) => data.id,
    getDescription: (data) =>
      `Registro actualizado en mrrp41 para DNI ${data.dni}`,
    getNewState: (data) => data
  }
});

exports.savemrrp42 = createPostHandler({
  path: "/api/savemrrp42",

  main: async (conn, data, auditUsername) => {
    const sql = `
      INSERT INTO mrrp42 (
        id, dni, filenumber, caremodality, educationalinstitution,
        transit, egress, bond, employercenter, savedate, username
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        filenumber=VALUES(filenumber),
        caremodality=VALUES(caremodality),
        educationalinstitution=VALUES(educationalinstitution),
        transit=VALUES(transit),
        egress=VALUES(egress),
        bond=VALUES(bond),
        employercenter=VALUES(employercenter),
        savedate=VALUES(savedate),
        username=VALUES(username)
    `;

    await conn.execute(sql, [
      data.id,
      data.dni,
      data.filenumber,
      data.caremodality,
      data.educationalinstitution,
      data.transit,
      data.egress,
      data.bond,
      data.employercenter,
      data.savedate,
      auditUsername
    ]);

    return { id: data.id };
  },

  audit: {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.MRRP42,
    getId: (data) => data.id,
    getDescription: (data) =>
      `Registro actualizado en mrrp42 para DNI ${data.dni}`,
    getNewState: (data) => data
  }
});

// ******************************************************************************************
// *       RUTAS PARA LEER CADA UNO DE LOS FORMULARIOS
// ******************************************************************************************
async function handleGetGeneric({
  req,
  res,
  table,
  select,
  entity,
  key,
  transform = null
}) {
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.query.userid || req.user?.username || "desconocido";

  try {
    const [rows] = await conn.execute(
      `SELECT ${select} FROM ${table} WHERE id = ?`,
      [targetId]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }

    let result = rows[0];

    if (transform) {
      result = await transform(result, conn);
    }

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.SELECT,
      entity,
      entityId: targetId.toString(),
      description: `Consulta ${table} con id=${targetId}`,
      oldState: null,
      newState: result
    });

    res.json({
      success: true,
      data: { ...result, key }
    });
  } catch (err) {
    console.error(`❌ Error en ${table}:`, err);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
}

exports.getme311 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_1_1",
    select: `
      id, reason, anotherrreason, carepathway, concept, 
      preschooldiagresults, articulationstageresults, startdate,
      directtreatment, canceldate, reasoncancel, transfer,
      transferwhere, teachertraining, experience, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME31,
    key: "3.1.1"
  });

exports.getme321 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_2_1",
    select: `
      id, dni, pregnancy, gesnumber, abortions, abortionstypes, abortionsquantity,
      toxichabits, toxichabitstypes, motherfetusbloodcomp, motherfatherconsanguinity,
      bleeding, illnessespregnancy, illnesses, childbirthtypes, complications,
      breastfeedinguntil, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME32,
    key: "3.2.1"
  });

exports.getme322 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_2_2",
    select: `
      id, dni, validism, analsphinctercontrol, bladdersphinctercontrol,
      diseasessuffered, traumasaccidents, medications, communication, selfcare,
      homelife, socialskills, communityuse, selfdirection,
      health, leisure, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME32,
    key: "3.2.2"
  });

exports.getme323 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_2_3",
    select: `
      id, dni, maternalfamilypathhistory, paternalfamilypathhistory, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME32,
    key: "3.2.3"
  });

exports.getme331 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_3_1",
    select: `
      id, dni, mother, father, maternalgrandmother, maternalgrandfather,
      paternalgrandmother, paternalgrandfather, brothers, maternaluncles,
      paternaluncles, parentsrelationships, whichother, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME33,
    key: "3.3.1"
  });

exports.getme332 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_3_2",
    select: `
      id, dni, livingrooms, bedrooms, kitchen, bathrooms,
      constconditions, economicsituation, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME33,
    key: "3.3.2"
  });

exports.getme333 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_3_3",
    select: `
      id, dni, f11, f12, f21, f22, f31, f32, 
      f41, f42, f51, f52, savedate, username
    `,
    entity: AUDIT_ENTITIES.ME33,
    key: "3.3.3"
  });

exports.getmrrp42 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "mrrp42",
    select: "*",
    entity: AUDIT_ENTITIES.MRRP42,
    key: "4.2"
  });

exports.getme34 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "me3_4",
    select: `
      id, idme34, dni,
      neurocognitive, pedagogygeneral, pedagogyhistory, pedagogylang, pedagogymath,
      psychology, psychometry, psychopedagogy, speechtherapy, channel, rhythm,
      savedate, username
    `,
    entity: AUDIT_ENTITIES.ME34,
    key: "3.4",
    transform: async (row, conn) => {
      const resultObj = {
        id: row.id,
        dni: row.dni,
        psychology: row.psychology,
        neurocognitive: row.neurocognitive,
        psychometry: row.psychometry,
        psychopedagogy: row.psychopedagogy,
        pedagogygeneral: row.pedagogygeneral,
        pedagogylang: row.pedagogylang,
        pedagogymath: row.pedagogymath,
        pedagogyhistory: row.pedagogyhistory,
        speechtherapy: row.speechtherapy,
        channel: row.channel,
        rhythm: row.rhythm,
        savedate: row.savedate,
        username: row.username,
        psicologia: [],
        neuro: [],
        psicometria: [],
        psicopedagogia: [],
        language: [],
        math: [],
        history: [],
        logopedia: [],
        pedagogia: []
      };

      const flagsActive = [
        row.psychology,
        row.neurocognitive,
        row.psychometry,
        row.psychopedagogy,
        row.pedagogygeneral,
        row.pedagogylang,
        row.pedagogymath,
        row.pedagogyhistory,
        row.speechtherapy
      ].some((v) => v === 1);

      if (flagsActive && row.idme34) {
        const [tests] = await conn.execute(
          `
          SELECT ast.testid, ast.date, ast.explanation, at.testarea
          FROM auxselectedtests ast
          JOIN auxtests at ON at.testid = ast.testid
          WHERE ast.idme34 = ?
        `,
          [row.idme34]
        );

        tests.forEach((t) => {
          const map = {
            psicologia: "psicologia",
            neurocognitiva: "neuro",
            psicometria: "psicometria",
            psicopedagogia: "psicopedagogia",
            lengua: "language",
            math: "math",
            historia: "history",
            logopedia: "logopedia",
            pedagogia: "pedagogia"
          };

          const key = map[t.testarea];
          if (!key) return;

          resultObj[key].push({
            testid: t.testid,
            date: t.date,
            explanation: t.explanation
          });
        });
      }

      return resultObj;
    }
  });

exports.getmrrp41 = (req, res) =>
  handleGetGeneric({
    req,
    res,
    table: "mrrp41",
    select: "*",
    entity: AUDIT_ENTITIES.MRRP41,
    key: "4.1",
    transform: async (row, conn) => {
      const [pedRows] = await conn.execute(
        `SELECT * FROM auxmrrppedagogy WHERE id = ? ORDER BY schoolgrade`,
        [row.id]
      );

      return { ...row, pedagogy: pedRows };
    }
  });

// ******************************************************************************************
// *       RUTAS PARA ACTUALIZAR CADA UNO DE LOS FORMULARIOS
// ******************************************************************************************
exports.updateme311 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_1_1
      SET dni=?, reason=?, anotherrreason=?, carepathway=?, concept=?,
          preschooldiagresults=?, articulationstageresults=?, startdate=?,
          directtreatment=?, canceldate=?, reasoncancel=?, transfer=?,
          transferwhere=?, teachertraining=?, experience=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      data.reason,
      data.anotherrreason,
      data.carepathway,
      data.concept,
      data.preschooldiagresults,
      data.articulationstageresults,
      data.startdate,
      data.directtreatment,
      data.canceldate,
      data.reasoncancel,
      data.transfer,
      data.transferwhere,
      data.teachertraining,
      data.experience,
      data.savedate,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_1_1, // Asegúrate de que esta entidad esté definida
      entityId: targetId,
      description: `Actualización de registro me3_1_1 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updatem311/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme321 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_2_1
      SET dni=?, pregnancy=?, gesnumber=?, abortions=?, abortionstypes=?, abortionsquantity=?,
          toxichabits=?, toxichabitstypes=?, motherfetusbloodcomp=?, motherfatherconsanguinity=?,
          bleeding=?, illnessespregnancy=?, illnesses=?, childbirthtypes=?, complications=?,
          breastfeedinguntil=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      data.pregnancy,
      data.gesnumber,
      data.abortions,
      data.abortionstypes,
      data.abortionsquantity,
      data.toxichabits,
      data.toxichabitstypes,
      data.motherfetusbloodcomp,
      data.motherfatherconsanguinity,
      data.bleeding,
      data.illnessespregnancy,
      data.illnesses,
      data.childbirthtypes,
      data.complications,
      data.breastfeedinguntil,
      data.savedate,
      targetId
    ]);

    // Auditoría
    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_2_1,
      entityId: targetId,
      description: `Actualización de registro me3_2_1 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme321/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme322 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_2_2
      SET dni=?, validism=?, analsphinctercontrol=?, bladdersphinctercontrol=?,
          diseasessuffered=?, traumasaccidents=?, medications=?, communication=?,
          selfcare=?, homelife=?, socialskills=?, communityuse=?, selfdirection=?,
          health=?, leisure=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      data.validism,
      data.analsphinctercontrol,
      data.bladdersphinctercontrol,
      data.diseasessuffered,
      data.traumasaccidents,
      data.medications,
      data.communication,
      data.selfcare,
      data.homelife,
      data.socialskills,
      data.communityuse,
      data.selfdirection,
      data.health,
      data.leisure,
      data.savedate,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_2_2,
      entityId: targetId,
      description: `Actualización de registro me3_2_2 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme322/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme323 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_2_3
      SET dni=?, maternalfamilypathhistory=?, paternalfamilypathhistory=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      data.maternalfamilypathhistory,
      data.paternalfamilypathhistory,
      data.savedate,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_2_3,
      entityId: targetId,
      description: `Actualización de registro me3_2_3 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme323/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme331 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_3_1
      SET dni=?, mother=?, father=?, maternalgrandmother=?, maternalgrandfather=?,
          paternalgrandmother=?, paternalgrandfather=?, brothers=?, maternaluncles=?,
          paternaluncles=?, parentsrelationships=?, whichother=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      data.mother,
      data.father,
      data.maternalgrandmother,
      data.maternalgrandfather,
      data.paternalgrandmother,
      data.paternalgrandfather,
      data.brothers,
      data.maternaluncles,
      data.paternaluncles,
      data.parentsrelationships,
      data.whichother,
      data.savedate,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_3_1,
      entityId: targetId,
      description: `Actualización de registro me3_3_1 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme331/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme332 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_3_2
      SET dni=?, livingrooms=?, bedrooms=?, kitchen=?, bathrooms=?,
          constconditions=?, economicsituation=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      Number(data.livingrooms ?? 0),
      Number(data.bedrooms ?? 0),
      Number(data.kitchen ?? 0),
      Number(data.bathrooms ?? 0),
      data.constconditions || "",
      data.economicsituation || "",
      data.savedate,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_3_2,
      entityId: targetId,
      description: `Actualización de registro me3_3_2 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme332/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme333 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sql = `
      UPDATE me3_3_3
      SET dni=?, f11=?, f12=?, f21=?, f22=?, f31=?, f32=?, f41=?, f42=?, f51=?, f52=?, savedate=?
      WHERE id=?
    `;

    const [result] = await conn.execute(sql, [
      data.dni,
      data.f11,
      data.f12,
      data.f21,
      data.f22,
      data.f31,
      data.f32,
      data.f41,
      data.f42,
      data.f51,
      data.f52,
      data.savedate,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_3_3,
      entityId: targetId,
      description: `Actualización de registro me3_3_3 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (result.affectedRows === 0) {
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });
    }
    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme333/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updateme34 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id; // id lógico (niño)
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const [[row]] = await conn.execute(
      `SELECT idme34 FROM me3_4 WHERE id = ?`,
      [targetId]
    );

    if (!row)
      throw new Error(`No existe registro en me3_4 para id=${targetId}`);
    const idme34 = row.idme34;

    const sqlUpdateMe34 = `
      UPDATE me3_4
      SET
        dni=?, psychology=?, neurocognitive=?, psychometry=?, psychopedagogy=?,
        pedagogygeneral=?, pedagogylang=?, pedagogymath=?, speechtherapy=?,
        pedagogyhistory=?, channel=?, rhythm=?, savedate=?, username=?
      WHERE idme34=?
    `;

    const [result] = await conn.execute(sqlUpdateMe34, [
      data.dni,
      data.psychology,
      data.neurocognitive,
      data.psicometria,
      data.psicopedagogia,
      data.pedagogia,
      data.language,
      data.math,
      data.logopedia,
      data.history,
      data.channel || null,
      data.rhythm || null,
      data.savedate || null,
      data.username || null,
      idme34
    ]);

    if (result.affectedRows === 0)
      throw new Error(`No se pudo actualizar me3_4 (idme34=${idme34})`);

    // Recolectar todos los testid recibidos
    const receivedTests = [];
    const collectTests = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) if (item?.testid) receivedTests.push(item.testid);
    };
    [
      data.psicologia,
      data.neuro,
      data.psicometria,
      data.psicopedagogia,
      data.pedagogia,
      data.language,
      data.math,
      data.history,
      data.logopedia
    ].forEach(collectTests);

    // Eliminar tests que ya no están
    if (receivedTests.length > 0) {
      await conn.execute(
        `DELETE FROM auxselectedtests WHERE idme34 = ? AND testid NOT IN (${receivedTests.map(
          () => "?"
        )})`,
        [idme34, ...receivedTests]
      );
    } else {
      await conn.execute(`DELETE FROM auxselectedtests WHERE idme34 = ?`, [
        idme34
      ]);
    }

    // Upsert de tests
    const upsertTest = async (item) => {
      if (!item?.testid || !item?.date) return;
      await conn.execute(
        `INSERT INTO auxselectedtests (idme34, testid, date, explanation)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE date=VALUES(date), explanation=VALUES(explanation)`,
        [idme34, item.testid, item.date, item.explanation || null]
      );
    };

    const processArray = async (arr) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) await upsertTest(item);
    };
    [
      data.psicologia,
      data.neuro,
      data.psicometria,
      data.psicopedagogia,
      data.pedagogia,
      data.language,
      data.math,
      data.history,
      data.logopedia
    ].forEach(async (arr) => await processArray(arr));

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.ME3_4,
      entityId: idme34,
      description: `Actualización de me3_4 + auxselectedtests`,
      oldState: null,
      newState: data
    });

    await conn.commit();
    res.json({ success: true, updatedId: idme34 });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updateme34:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updatemrrp41 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    // Tabla principal
    const sqlMain = `
      UPDATE mrrp41
      SET dni=?, psicopotential=?, psiconeeds=?, psicodiagimpression=?,
          psicopedpotential=?, psicopedneeds=?, psicopeddiagimpression=?,
          intelligencequotient=?, devquotient=?, psicomediagimpression=?,
          speechtherapydiagnosis=?, potential=?, needs=?, diagnosticresults=?,
          savedate=?, username=?
      WHERE id=?
    `;
    const [mainResult] = await conn.execute(sqlMain, [
      data.dni,
      data.psicopotential,
      data.psiconeeds,
      data.psicodiagimpression,
      data.psicopedpotential,
      data.psicopedneeds,
      data.psicopeddiagimpression,
      data.intelligencequotient,
      data.devquotient,
      data.psicomediagimpression,
      data.speechtherapydiagnosis,
      data.potential,
      data.needs,
      data.diagnosticresults,
      data.savedate,
      data.username,
      targetId
    ]);

    // Tabla pedagógica (opcional)
    if (Array.isArray(data.pedagogy) && data.pedagogy.length > 0) {
      const sqlPedagogy = `
        UPDATE auxmrrppedagogy
        SET communication=?, relationship=?, motorskills=?,
            spanishlanguage=?, math=?, history=?, savedate=?, username=?
        WHERE id=? AND schoolgrade=?
      `;
      for (const row of data.pedagogy) {
        await conn.execute(sqlPedagogy, [
          row.communication,
          row.relationship,
          row.motorskills,
          row.spanishlanguage,
          row.math,
          row.history,
          row.savedate,
          row.username,
          targetId,
          row.schoolgrade
        ]);
      }
    }

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.MRRP41,
      entityId: targetId,
      description: `Actualización de mrrp41 + auxmrrppedagogy`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (mainResult.affectedRows === 0)
      return res.json({
        success: false,
        message: `No se encontró registro con id=${targetId}`
      });

    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updatemrrp41/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.updatemrrp42 = async (req, res) => {
  const data = req.body;
  const targetId = req.params.id;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    await conn.beginTransaction();

    const sqlMain = `
      UPDATE mrrp42
      SET dni=?, filenumber=?, caremodality=?, educationalinstitution=?,
          transit=?, egress=?, bond=?, employercenter=?, savedate=?, username=?
      WHERE id=?
    `;
    const [mainResult] = await conn.execute(sqlMain, [
      data.dni,
      data.filenumber,
      data.caremodality,
      data.educationalinstitution,
      data.transit,
      data.egress,
      data.bond,
      data.employercenter,
      data.savedate,
      data.username,
      targetId
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.MRRP42,
      entityId: targetId,
      description: `Actualización de registro mrrp42 id=${targetId}`,
      oldState: null,
      newState: data
    });

    await conn.commit();

    if (mainResult.affectedRows === 0)
      return res.json({
        success: false,
        message: `No se encontró registro MRRP42 con id=${targetId}`
      });

    res.json({ success: true, updatedId: targetId });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en /api/updatemrrp42/:id:", err.message);
    res.json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
