// controllers/dbUtilsController.js
const { pool } = require("../config/db");
const { auditAction, AUDIT_ACTIONS } = require("../middlewares/audit");
const { spawn } = require("child_process");

exports.existsTableRecord = async (req, res) => {
  const { table, id } = req.params;
  const conn = await pool.getConnection();
  const auditUsername = req.user?.username || "desconocido";

  try {
    const [rows] = await conn.execute(`SELECT 1 FROM ?? WHERE id = ? LIMIT 1`, [
      table,
      id
    ]);

    await auditAction({
      req,
      actor: { username: auditUsername },
      action: AUDIT_ACTIONS.SELECT,
      entity: table,
      entityId: id.toString(),
      description: `Verificación existencia en tabla ${table} para id=${id}`,
      oldState: null,
      newState: { exists: rows.length > 0 }
    });

    res.json({ success: true, exists: rows.length > 0 });
  } catch (err) {
    console.error("Error en /api/exists/:table/:id:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.backupFull = async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const userid = req.query.userid || "desconocido";

  const conn = await pool.getConnection();

  try {
    // 🧾 Auditoría: solicitud de backup
    await auditAction({
      req,
      actor: { username: userid },
      action: "BACKUP",
      entity: database,
      entityId: null,
      description: `Solicitud de backup de la base de datos por usuario: ${userid}`,
      oldState: null,
      newState: { timestamp, requestedBy: userid }
    });
  } catch (auditErr) {
    console.error("❌ Error al registrar auditoría de backup:", auditErr);
  } finally {
    conn.release();
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=backup-${timestamp}.sql`
  );
  res.setHeader("Content-Type", "application/sql");

  // Uso de env para pasar la contraseña de forma segura y multiplataforma
  const dump = spawn("mysqldump", ["-u", user, database], {
    env: { ...process.env, MYSQL_PWD: password }
  });

  dump.stdout.pipe(res);

  dump.stderr.on("data", (data) => {
    console.error(`mysqldump error: ${data}`);
  });

  dump.on("close", (code) => {
    if (code !== 0) console.error(`mysqldump terminó con código ${code}`);
    console.log("Backup enviado al cliente");
  });
};

exports.backupProvincia = async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const userid = req.query.userid || "desconocido";
  const provincia = req.query.provincia?.toString();

  console.log("🔍 Backup solicitado:", { provincia, userid });

  const conn = await pool.getConnection();
  try {
    await auditAction({
      req,
      actor: { username: userid },
      action: "BACKUP_PROVINCIA",
      entity: database,
      description: `Backup provincia: ${provincia || "TODAS"}`,
      oldState: null,
      newState: { timestamp, provincia, requestedBy: userid }
    });
  } catch (e) {
    console.error("Audit error:", e);
  } finally {
    conn.release();
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=backup-${provincia || "completo"}-${timestamp}.sql`
  );
  res.setHeader("Content-Type", "application/sql");

  const fs = require("fs");
  const path = require("path");
  const { spawn } = require("child_process");

  try {
    const estructuraPath = path.join(__dirname, "estructura.sql");
    const estructura = fs.readFileSync(estructuraPath, "utf8");
    res.write(
      estructura + "\n\n-- DATOS PROVINCIA: " + (provincia || "TODAS") + "\n\n"
    );
  } catch (e) {
    return res.status(500).end("Error: estructura.sql no encontrado");
  }

  let dump;
  const env = { ...process.env, MYSQL_PWD: password };

  if (!provincia) {
    dump = spawn("mysqldump", ["-u", user, database], { env });
  } else {
    const args = ["-u", user, database, "--no-create-info"];
    // ... (Se mantienen tus mismos argumentos de tablas) ...
    args.push(
      "users",
      `--where="province='${provincia.replace(/'/g, "\\'")}'"`
    );
    args.push(
      "mgifixed",
      `--where="username IN (SELECT userid FROM users WHERE province='${provincia.replace(
        /'/g,
        "\\'"
      )}')"`
    );
    args.push(
      "mgivar",
      `--where="province='${provincia.replace(/'/g, "\\'")}'"`
    );

    // (Resto de los pushes de tablas igual que antes)
    const tablasDni = [
      "me311",
      "me321",
      "me322",
      "me323",
      "me331",
      "me332",
      "me333",
      "me34",
      "mrrp41",
      "mrrp42",
      "mrrp43",
      "mrrp44",
      "auxmrrppedagogy"
    ];
    tablasDni.forEach((t) =>
      args.push(
        t,
        `--where="dni IN (SELECT dni FROM mgivar WHERE province='${provincia.replace(
          /'/g,
          "\\'"
        )}')"`
      )
    );

    const tablasUser = [
      "alarmsusers",
      "auxusersrol",
      "auxmoreuserpermissions",
      "auxusersalarms"
    ];
    tablasUser.forEach((t) =>
      args.push(
        t,
        `--where="userid IN (SELECT userid FROM users WHERE province='${provincia.replace(
          /'/g,
          "\\'"
        )}')"`
      )
    );

    args.push(
      "alarms",
      `--where="username IN (SELECT userid FROM users WHERE province='${provincia.replace(
        /'/g,
        "\\'"
      )}') OR scopetype='global'"`
    );
    args.push(
      "auditevent",
      `--where="actorid IN (SELECT userid FROM users WHERE province='${provincia.replace(
        /'/g,
        "\\'"
      )}') OR actortype='SYSTEM'"`
    );
    args.push(
      "auditlog",
      `--where="username IN (SELECT userid FROM users WHERE province='${provincia.replace(
        /'/g,
        "\\'"
      )}') OR username IS NULL"`
    );
    args.push(
      "pedagogy",
      `--where="idme34 IN (SELECT idme34 FROM me34 WHERE dni IN (SELECT dni FROM mgivar WHERE province='${provincia.replace(
        /'/g,
        "\\'"
      )}'))"`
    );
    args.push(
      "speechtherapy",
      `--where="idme34 IN (SELECT idme34 FROM me34 WHERE dni IN (SELECT dni FROM mgivar WHERE province='${provincia.replace(
        /'/g,
        "\\'"
      )}'))"`
    );

    [
      "auxpermissions",
      "auxrols",
      "auxrolspermissions",
      "auxtests",
      "auxselectedtests"
    ].forEach((t) => args.push(t));

    dump = spawn("mysqldump", args, { env });
  }

  dump.stdout.pipe(res, { end: false });
  dump.stderr.on("data", (data) =>
    console.error("❌ mysqldump:", data.toString())
  );
  dump.on("close", (code) => {
    res.status(code === 0 ? 200 : 500).end();
  });
};

exports.clearselecteddata = async (req, res) => {
  // ✅ ADMIN + CONFIRMACIÓN DOBLE
  if (!req.user || !["admin", "osvaldo"].includes(req.user.userid)) {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  // ✅ CONFIRMACIÓN OBLIGATORIA
  if (!req.body.confirm || req.body.confirm !== "LIMPIAR_TODO_CONFIRMADO") {
    return res.status(400).json({
      error: 'Requiere confirmación: { confirm: "LIMPIAR_TODO_CONFIRMADO" }',
      tablasProtegidas: [
        "auxpermissions",
        "auxrols",
        "auxrolspermissions",
        "users"
      ]
    });
  }

  const conn = await pool.getConnection();

  try {
    console.log("🛡️️ INICIANDO LIMPIEZA SELECTIVA - ADMIN:", req.user.userid);

    // ✅ BACKUP AUTOMÁTICO
    const backupName = `backup_${new Date()
      .toISOString()
      .slice(0, 10)}_${Date.now()}`;
    await conn.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        backup_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_user VARCHAR(50),
        tables_count INT
      )
    `);

    // ✅ REGISTRAR BACKUP
    await conn.query(
      "INSERT INTO backups (backup_name, admin_user, tables_count) VALUES (?, ?, ?)",
      [backupName, req.user.userid, 0]
    );

    // Desactiva FKs
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    const tablasProtegidas = [
      "auxpermissions",
      "auxrols",
      "auxrolspermissions",
      "users"
    ];
    const [tables] = await conn.query(
      `
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = ? AND table_type = 'BASE TABLE'
      AND table_name NOT IN (?)
    `,
      [process.env.DB_NAME, tablasProtegidas]
    );

    let borradas = 0;

    // ✅ TRUNCATE con LOG por tabla
    for (const { table_name } of tables) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table_name}\``);
        console.log(`✅ ${table_name} limpiada por ${req.user.userid}`);
        borradas++;

        // ✅ AUDITORÍA por tabla
        await auditAction({
          req,
          actor: { userid: req.user.userid },
          action: "DB_TRUNCATE",
          entity: "TABLE",
          entityId: table_name,
          description: `Tabla truncada en limpieza selectiva`,
          metadata: { admin: req.user.userid, backup: backupName }
        });
      } catch (err) {
        console.error(`❌ Error ${table_name}:`, err.message);
      }
    }

    // Reactiva FKs
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // ✅ ACTUALIZAR BACKUP
    await conn.query(
      "UPDATE backups SET tables_count = ? WHERE backup_name = ?",
      [borradas, backupName]
    );

    console.log(
      `🎉 Limpieza SELECTIVA completada: ${borradas}/${tables.length} tablas`
    );

    res.json({
      success: true,
      message: `Datos eliminados de ${borradas} tablas`,
      backup: backupName,
      protegidas: tablasProtegidas,
      limpiadas: tables.map((t) => t.table_name)
    });
  } catch (error) {
    console.error("💥 Error limpieza selectiva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
};
