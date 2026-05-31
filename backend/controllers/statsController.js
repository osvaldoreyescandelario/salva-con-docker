const { pool } = require("../config/db");

exports.mgivarmrrp44 = async (req, res) => {
  const conn = await pool.getConnection();
  const { filtroActivo } = req.body; // ✅ Recibir filtroActivo
  try {
    let mgivarCount = 0;
    let mrrp44Count = 0;

    // CASO 1 & 2: Filtrar por scope CDO o Provincia
    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      // Contar mgivar por municipality
      const [mgivarRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgivar WHERE municipality = ?",
        [filtroActivo.value]
      );
      mgivarCount = mgivarRows[0]?.total || 0;

      // Contar mrrp44 donde mgivar.municipality = value
      const [mrrp44Rows] = await conn.execute(
        `
        SELECT COUNT(*) AS total 
        FROM mrrp44 m 
        JOIN mgivar g ON m.id = g.id 
        WHERE g.municipality = ?
      `,
        [filtroActivo.value]
      );
      mrrp44Count = mrrp44Rows[0]?.total || 0;
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      // Contar mgivar por province
      const [mgivarRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgivar WHERE province = ?",
        [filtroActivo.value]
      );
      mgivarCount = mgivarRows[0]?.total || 0;

      // Contar mrrp44 donde mgivar.province = value
      const [mrrp44Rows] = await conn.execute(
        `
        SELECT COUNT(*) AS total 
        FROM mrrp44 m 
        JOIN mgivar g ON m.id = g.id 
        WHERE g.province = ?
      `,
        [filtroActivo.value]
      );
      mrrp44Count = mrrp44Rows[0]?.total || 0;
    } else {
      // CASO 3: Todos (sin filtro)
      const [mgivarRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgivar"
      );
      mgivarCount = mgivarRows[0]?.total || 0;

      // Verificar si existe tabla mrrp44
      const [tableRows] = await conn.execute(`
        SELECT COUNT(*) AS existe
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'mrrp44'
      `);

      if (tableRows[0].existe > 0) {
        const [mrrp44Rows] = await conn.execute(
          "SELECT COUNT(*) AS total FROM mrrp44"
        );
        mrrp44Count = mrrp44Rows[0]?.total || 0;
      }
    }

    return res.json({
      success: true,
      mgivarCount,
      mrrp44Count,
      filtroUsado: filtroActivo // Para debug
    });
  } catch (err) {
    console.error("❌ Error en /api/stats/mgivar-mrrp44:", err.message);
    return res.status(500).json({
      success: false,
      mgivarCount: 0,
      mrrp44Count: 0,
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.mgivarcageaverage = async (req, res) => {
  const conn = await pool.getConnection();
  const { filtroActivo } = req.body; // ✅ Recibir filtroActivo

  try {
    let query = `
      SELECT AVG(cage) as cage_promedio
      FROM (
        SELECT DISTINCT dni, cage
        FROM mgivar
    `;

    let params = [];

    // Aplicar filtro si existe
    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      query += ` WHERE municipality = ?`;
      params = [filtroActivo.value];
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      query += ` WHERE province = ?`;
      params = [filtroActivo.value];
    }
    // Si scope = 'Todos' o no hay filtro → sin WHERE

    query += `
      ) AS dnies_unicos
    `;

    const [rows] = await conn.execute(query, params);

    const cagePromedio = Math.round(rows[0]?.cage_promedio * 100) / 100 || 0;

    return res.json({
      success: true,
      cagePromedio,
      filtroUsado: filtroActivo // Para debug
    });
  } catch (err) {
    console.error("❌ Error en /api/stats/mgivar-cage-average:", err.message);
    return res.status(500).json({
      success: false,
      cagePromedio: 0,
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.estudiosporsujeto = async (req, res) => {
  const conn = await pool.getConnection();
  const { filtroActivo } = req.body; // ✅ Recibir filtroActivo

  try {
    let mgivarCount = 0;
    let mgifixedCount = 0;

    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      // Contar mgivar filtrado por municipality
      const [mgivarRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgivar WHERE municipality = ?",
        [filtroActivo.value]
      );
      mgivarCount = mgivarRows[0]?.total || 0;

      // Contar mgifixed con DNI que existen en mgivar filtrado
      const [mgifixedRows] = await conn.execute(
        `
        SELECT COUNT(*) AS total 
        FROM mgifixed f
        WHERE f.dni IN (
          SELECT DISTINCT dni 
          FROM mgivar 
          WHERE municipality = ?
        )
      `,
        [filtroActivo.value]
      );
      mgifixedCount = mgifixedRows[0]?.total || 0;
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      // Contar mgivar filtrado por province
      const [mgivarRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgivar WHERE province = ?",
        [filtroActivo.value]
      );
      mgivarCount = mgivarRows[0]?.total || 0;

      // Contar mgifixed con DNI que existen en mgivar filtrado
      const [mgifixedRows] = await conn.execute(
        `
        SELECT COUNT(*) AS total 
        FROM mgifixed f
        WHERE f.dni IN (
          SELECT DISTINCT dni 
          FROM mgivar 
          WHERE province = ?
        )
      `,
        [filtroActivo.value]
      );
      mgifixedCount = mgifixedRows[0]?.total || 0;
    } else {
      // Sin filtro: contar todos
      const [mgivarRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgivar"
      );
      const [mgifixedRows] = await conn.execute(
        "SELECT COUNT(*) AS total FROM mgifixed"
      );

      mgivarCount = mgivarRows[0]?.total || 0;
      mgifixedCount = mgifixedRows[0]?.total || 0;
    }

    // Calcular promedio: mgivar / mgifixed (manejar división por 0)
    const promedioEstudios =
      mgifixedCount > 0
        ? Math.round((mgivarCount / mgifixedCount) * 10) / 10
        : 0;

    return res.json({
      success: true,
      mgivarCount,
      mgifixedCount,
      promedioEstudios,
      filtroUsado: filtroActivo // Para debug
    });
  } catch (err) {
    console.error("❌ Error en /api/stats/estudios-por-sujeto:", err.message);
    return res.status(500).json({
      success: false,
      promedioEstudios: 0,
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.edulevelcounts = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { filtroActivo } = req.body || {};
    let where = "";
    const params = [];

    // filtroActivo = {scope: 'CDO' | 'Provincia' | 'Todos', value: ...}

    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      // municipality
      let municipio = filtroActivo.value;
      // si viene "Provincia::Municipio", quédate solo con lo de después de ::
      if (municipio.includes("::")) {
        municipio = municipio.split("::")[1];
      }
      where = "WHERE municipality = ?";
      params.push(municipio);
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      where = "WHERE province = ?";
      params.push(filtroActivo.value);
    }
    // scope 'Todos' → sin WHERE

    const [rows] = await conn.execute(
      `
      SELECT
        SUM(CASE WHEN edulevel = 'Primera Infancia (PI)' THEN 1 ELSE 0 END) AS PI,
        SUM(CASE WHEN edulevel = 'Educación Primaria (EP)' THEN 1 ELSE 0 END) AS EP,
        SUM(CASE WHEN edulevel = 'Secundaria Básica (SB)' THEN 1 ELSE 0 END) AS SB,
        SUM(CASE WHEN edulevel = 'Preuniversitario (IPU)' THEN 1 ELSE 0 END) AS IPU,
        SUM(CASE WHEN edulevel = 'Educación Técnica (ETP)' THEN 1 ELSE 0 END) AS ETP,
        SUM(CASE WHEN edulevel = 'Escuela de Oficio (EO)' THEN 1 ELSE 0 END) AS EO
      FROM mgivar
      ${where}
    `,
      params
    );

    const counts = [
      rows[0]?.PI || 0,
      rows[0]?.EP || 0,
      rows[0]?.SB || 0,
      rows[0]?.IPU || 0,
      rows[0]?.ETP || 0,
      rows[0]?.EO || 0
    ];

    return res.json({
      success: true,
      counts,
      filtroUsado: filtroActivo
    });
  } catch (err) {
    console.error("❌ Error /stats/edulevel-counts:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0, 0, 0, 0],
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.sexcounts = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { filtroActivo } = req.body || {};
    let where = "";
    let params = [];
    let joinClause = "";

    // filtroActivo = {scope: 'CDO' | 'Provincia' | 'Todos', value: ...}
    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      // Solo municipality de mgivar
      let municipio = filtroActivo.value;
      if (municipio.includes("::")) {
        municipio = municipio.split("::")[1];
      }
      where = "WHERE v.municipality = ?";
      params.push(municipio);
      joinClause = "INNER JOIN mgivar v ON f.dni = v.dni";
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      where = "WHERE v.province = ?";
      params.push(filtroActivo.value);
      joinClause = "INNER JOIN mgivar v ON f.dni = v.dni";
    }
    // scope 'Todos' → sin JOIN ni WHERE, directo de mgifixed

    const [rows] = await conn.execute(
      `
      SELECT
        SUM(CASE WHEN ${
          joinClause ? "f.sex" : "sex"
        } = 'F' THEN 1 ELSE 0 END) AS Femenino,
        SUM(CASE WHEN ${
          joinClause ? "f.sex" : "sex"
        } = 'M' THEN 1 ELSE 0 END) AS Masculino
      FROM mgifixed f
      ${joinClause}
      ${where}
    `,
      params
    );

    const counts = [rows[0]?.Femenino || 0, rows[0]?.Masculino || 0];

    return res.json({
      success: true,
      counts,
      filtroUsado: filtroActivo
    });
  } catch (err) {
    console.error("❌ Error /stats/sex-counts:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0],
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.skincolorcounts = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { filtroActivo } = req.body || {};
    let where = "";
    let params = [];
    let joinClause = "";

    // filtroActivo = {scope: 'CDO' | 'Provincia' | 'Todos', value: ...}
    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      let municipio = filtroActivo.value;
      if (municipio.includes("::")) {
        municipio = municipio.split("::")[1];
      }
      where = "WHERE v.municipality = ?";
      params.push(municipio);
      joinClause = "INNER JOIN mgivar v ON f.dni = v.dni";
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      where = "WHERE v.province = ?";
      params.push(filtroActivo.value);
      joinClause = "INNER JOIN mgivar v ON f.dni = v.dni";
    }

    const [rows] = await conn.execute(
      `
      SELECT
        SUM(CASE WHEN ${
          joinClause ? "f.skincolor" : "skincolor"
        } = 'Blanca' THEN 1 ELSE 0 END) AS Blanca,
        SUM(CASE WHEN ${
          joinClause ? "f.skincolor" : "skincolor"
        } = 'Mestiza' THEN 1 ELSE 0 END) AS Mestiza,
        SUM(CASE WHEN ${
          joinClause ? "f.skincolor" : "skincolor"
        } = 'Negra' THEN 1 ELSE 0 END) AS Negra
      FROM mgifixed f
      ${joinClause}
      ${where}
    `,
      params
    );

    const counts = [
      rows[0]?.Blanca || 0,
      rows[0]?.Mestiza || 0,
      rows[0]?.Negra || 0
    ];

    return res.json({
      success: true,
      counts,
      filtroUsado: filtroActivo
    });
  } catch (err) {
    console.error("❌ Error /stats/skincolor-counts:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0],
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.edulevelcountsprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};
    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    const [rows] = await conn.execute(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN edulevel = 'Primera Infancia (PI)' THEN dni END) AS PI,
        COUNT(DISTINCT CASE WHEN edulevel = 'Educación Primaria (EP)' THEN dni END) AS EP,
        COUNT(DISTINCT CASE WHEN edulevel = 'Secundaria Básica (SB)' THEN dni END) AS SB,
        COUNT(DISTINCT CASE WHEN edulevel = 'Preuniversitario (IPU)' THEN dni END) AS IPU,
        COUNT(DISTINCT CASE WHEN edulevel = 'Educación Técnica (ETP)' THEN dni END) AS ETP,
        COUNT(DISTINCT CASE WHEN edulevel = 'Escuela de Oficio (EO)' THEN dni END) AS EO
      FROM mgivar
      WHERE province = ?
        AND municipality = ?
    `,
      [province, municipality]
    );

    const counts = [
      rows[0]?.PI || 0,
      rows[0]?.EP || 0,
      rows[0]?.SB || 0,
      rows[0]?.IPU || 0,
      rows[0]?.ETP || 0,
      rows[0]?.EO || 0
    ];

    return res.json({
      success: true,
      province,
      municipality,
      counts
    });
  } catch (err) {
    console.error("❌ Error /stats/edulevel-counts-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0, 0, 0, 0],
      error: err.message
    });
  } finally {
    conn.release();
  }
};

exports.edulevelbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(`
      SELECT
        province,

        COUNT(DISTINCT CASE WHEN edulevel = 'Primera Infancia (PI)' THEN dni END) AS PI,
        COUNT(DISTINCT CASE WHEN edulevel = 'Educación Primaria (EP)' THEN dni END) AS EP,
        COUNT(DISTINCT CASE WHEN edulevel = 'Secundaria Básica (SB)' THEN dni END) AS SB,
        COUNT(DISTINCT CASE WHEN edulevel = 'Preuniversitario (IPU)' THEN dni END) AS IPU,
        COUNT(DISTINCT CASE WHEN edulevel = 'Educación Técnica (ETP)' THEN dni END) AS ETP,
        COUNT(DISTINCT CASE WHEN edulevel = 'Escuela de Oficio (EO)' THEN dni END) AS EO

      FROM mgivar
      GROUP BY province
      ORDER BY province
    `);

    // Provincias en orden
    const provinces = rows.map((r) => r.province);

    // Matriz 2D EXACTA que necesitas
    const data2D = rows.map((r) => [
      r.PI || 0,
      r.EP || 0,
      r.SB || 0,
      r.IPU || 0,
      r.ETP || 0,
      r.EO || 0
    ]);

    return res.json({
      success: true,
      provinces,
      data2D
    });
  } catch (err) {
    console.error("❌ /stats/edulevel-by-province:", err.message);
    return res.status(500).json({
      success: false,
      provinces: [],
      data2D: []
    });
  } finally {
    conn.release();
  }
};

exports.edulevelbymunicipality = async (req, res) => {
  const { province } = req.body;

  if (!province) {
    return res.status(400).json({
      success: false,
      data2D: []
    });
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      `
      SELECT
        municipality,

        COUNT(DISTINCT CASE WHEN edulevel = 'Primera Infancia (PI)' THEN dni END) AS PI,
        COUNT(DISTINCT CASE WHEN edulevel = 'Educación Primaria (EP)' THEN dni END) AS EP,
        COUNT(DISTINCT CASE WHEN edulevel = 'Secundaria Básica (SB)' THEN dni END) AS SB,
        COUNT(DISTINCT CASE WHEN edulevel = 'Preuniversitario (IPU)' THEN dni END) AS IPU,
        COUNT(DISTINCT CASE WHEN edulevel = 'Educación Técnica (ETP)' THEN dni END) AS ETP,
        COUNT(DISTINCT CASE WHEN edulevel = 'Escuela de Oficio (EO)' THEN dni END) AS EO

      FROM mgivar
      WHERE province = ?
      GROUP BY municipality
      ORDER BY municipality
    `,
      [province]
    );

    const data2D = rows.map((r) => [
      r.PI || 0,
      r.EP || 0,
      r.SB || 0,
      r.IPU || 0,
      r.ETP || 0,
      r.EO || 0
    ]);

    return res.json({
      success: true,
      municipalities: rows.map((r) => r.municipality),
      data2D
    });
  } catch (err) {
    console.error("❌ /api/stats/edulevel-by-municipality:", err.message);
    return res.status(500).json({
      success: false,
      data2D: []
    });
  } finally {
    conn.release();
  }
};

exports.edulevelageprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};

    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    const levels = [
      "Primera Infancia (PI)",
      "Educación Primaria (EP)",
      "Secundaria Básica (SB)",
      "Preuniversitario (IPU)",
      "Educación Técnica (ETP)",
      "Escuela de Oficio (EO)"
    ];

    const ages = [];

    for (const level of levels) {
      const [[row]] = await conn.execute(
        `
        SELECT cage
        FROM mgivar
        WHERE province = ?
          AND municipality = ?
          AND edulevel = ?
        GROUP BY cage
        ORDER BY COUNT(*) DESC, cage ASC
        LIMIT 1
      `,
        [province, municipality, level]
      );

      ages.push(row?.cage ?? 0);
    }

    return res.json({
      success: true,
      province,
      municipality,
      ages
    });
  } catch (err) {
    console.error("❌ /stats/edulevel-age-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      ages: [0, 0, 0, 0, 0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.edulevelagebymunicipality = async (req, res) => {
  const { province } = req.body;

  if (!province) {
    return res.status(400).json({ success: false });
  }

  const conn = await pool.getConnection();
  try {
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality
      FROM mgivar
      WHERE province = ?
      ORDER BY municipality
    `,
      [province]
    );

    const niveles = [
      "Primera Infancia (PI)",
      "Educación Primaria (EP)",
      "Secundaria Básica (SB)",
      "Preuniversitario (IPU)",
      "Educación Técnica (ETP)",
      "Escuela de Oficio (EO)"
    ];

    const data2D = [];

    for (const m of municipios) {
      const fila = [];

      for (const n of niveles) {
        const [[row]] = await conn.execute(
          `
          SELECT cage
          FROM mgivar
          WHERE province = ?
            AND municipality = ?
            AND edulevel = ?
          GROUP BY cage
          ORDER BY COUNT(*) DESC, cage ASC
          LIMIT 1
        `,
          [province, m.municipality, n]
        );

        fila.push(row?.cage ?? 0);
      }

      data2D.push(fila);
    }

    return res.json({
      success: true,
      municipalities: municipios.map((m) => m.municipality),
      data2D
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.edulevelagebyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province
      FROM mgivar
      ORDER BY province
    `);

    const niveles = [
      "Primera Infancia (PI)",
      "Educación Primaria (EP)",
      "Secundaria Básica (SB)",
      "Preuniversitario (IPU)",
      "Educación Técnica (ETP)",
      "Escuela de Oficio (EO)"
    ];

    const data2D = [];

    for (const p of provinces) {
      const fila = [];

      for (const n of niveles) {
        const [[row]] = await conn.execute(
          `
          SELECT cage
          FROM mgivar
          WHERE province = ?
            AND edulevel = ?
          GROUP BY cage
          ORDER BY COUNT(*) DESC, cage ASC
          LIMIT 1
        `,
          [p.province, n]
        );

        fila.push(row?.cage ?? 0);
      }

      data2D.push(fila);
    }

    return res.json({
      success: true,
      provinces: provinces.map((p) => p.province),
      data2D
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.totalsexprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};

    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    // Conteo mujeres (sex='F') por nivel educativo
    const [[rowF]] = await conn.execute(
      `
        SELECT COUNT(*) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ? 
            AND v.municipality = ?
            AND f.sex = 'F'
        `,
      [province, municipality]
    );

    // Conteo hombres (sex='M') por nivel educativo
    const [[rowM]] = await conn.execute(
      `
        SELECT COUNT(*) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ? 
            AND v.municipality = ?
            AND f.sex = 'M'
        `,
      [province, municipality]
    );

    return res.json({
      success: true,
      province,
      municipality,
      counts: [rowF?.count ?? 0, rowM?.count ?? 0] // Array simple [F, M]
    });
  } catch (err) {
    console.error("❌ /stats/total-sex-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.totalsexbymunicipality = async (req, res) => {
  const { province } = req.body;

  if (!province) {
    return res.status(400).json({ success: false });
  }

  const conn = await pool.getConnection();
  try {
    // Obtener municipios únicos de esa provincia
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality
      FROM mgivar
      WHERE province = ?
      ORDER BY municipality
    `,
      [province]
    );

    const data2D = [];

    for (const m of municipios) {
      // Conteo sex='F' para este municipio
      const [[rowF]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT f.dni) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ? 
          AND v.municipality = ?
          AND f.sex = 'F'
      `,
        [province, m.municipality]
      );

      // Conteo sex='M' para este municipio
      const [[rowM]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT f.dni) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ? 
          AND v.municipality = ?
          AND f.sex = 'M'
      `,
        [province, m.municipality]
      );

      data2D.push([rowF?.count ?? 0, rowM?.count ?? 0]);
    }

    return res.json({
      success: true,
      municipalities: municipios.map((m) => m.municipality),
      data2D // [[sexF, sexM], [sexF, sexM], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.totalsexbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // Obtener provincias únicas ordenadas alfabéticamente
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province
      FROM mgivar
      ORDER BY province
    `);

    const data2D = [];

    for (const p of provinces) {
      // Conteo sex='F' para esta provincia
      const [[rowF]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT f.dni) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ?
          AND f.sex = 'F'
      `,
        [p.province]
      );

      // Conteo sex='M' para esta provincia
      const [[rowM]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT f.dni) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ?
          AND f.sex = 'M'
      `,
        [p.province]
      );

      data2D.push([rowF?.count ?? 0, rowM?.count ?? 0]);
    }

    return res.json({
      success: true,
      provinces: provinces.map((p) => p.province),
      data2D // [[sexF, sexM], [sexF, sexM], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.totalskincolorprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};

    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    const skinColors = ["blanca", "mestiza", "negra"]; // ← Solo 3 valores

    const skinCounts = [];

    for (const color of skinColors) {
      const [[row]] = await conn.execute(
        `
        SELECT COUNT(*) as count
        FROM mgifixed f
        INNER JOIN mgivar v ON f.dni = v.dni
        WHERE v.province = ? 
          AND v.municipality = ?
          AND LOWER(f.skincolor) = LOWER(?)
      `,
        [province, municipality, color]
      );

      skinCounts.push(row?.count ?? 0);
    }

    return res.json({
      success: true,
      province,
      municipality,
      counts: skinCounts // [blanca, mestiza, negra]
    });
  } catch (err) {
    console.error("❌ /stats/total-skincolor-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.totalskincolorbymunicipality = async (req, res) => {
  const { province } = req.body;
  if (!province) return res.status(400).json({ success: false });

  const conn = await pool.getConnection();
  try {
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality FROM mgivar 
      WHERE province = ? ORDER BY municipality
    `,
      [province]
    );

    const skinColors = ["blanca", "mestiza", "negra"]; // ← Solo 3 valores
    const data2D = [];

    for (const m of municipios) {
      const skinCountsRow = [];
      for (const color of skinColors) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT f.dni) as count
          FROM mgifixed f
          INNER JOIN mgivar v ON f.dni = v.dni
          WHERE v.province = ? AND v.municipality = ? AND LOWER(f.skincolor) = LOWER(?)
        `,
          [province, m.municipality, color]
        );
        skinCountsRow.push(row?.count ?? 0);
      }
      data2D.push(skinCountsRow);
    }

    return res.json({
      success: true,
      municipalities: municipios.map((m) => m.municipality),
      data2D // [[blanca,mestiza,negra], [blanca,mestiza,negra], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.totalskincolorbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province FROM mgivar ORDER BY province
    `);

    const skinColors = ["blanca", "mestiza", "negra"]; // ← Solo 3 valores
    const data2D = [];

    for (const p of provinces) {
      const skinCountsRow = [];
      for (const color of skinColors) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT f.dni) as count
          FROM mgifixed f
          INNER JOIN mgivar v ON f.dni = v.dni
          WHERE v.province = ? AND LOWER(f.skincolor) = LOWER(?)
        `,
          [p.province, color]
        );
        skinCountsRow.push(row?.count ?? 0);
      }
      data2D.push(skinCountsRow);
    }

    return res.json({
      success: true,
      provinces: provinces.map((p) => p.province),
      data2D // [[blanca,mestiza,negra], [blanca,mestiza,negra], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.zonecountsprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};

    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    // Conteo zona='Urbana'
    const [[rowU]] = await conn.execute(
      `
      SELECT COUNT(DISTINCT dni) as count
      FROM mgivar
      WHERE province = ? 
        AND municipality = ?
        AND zone = 'Urbana'
    `,
      [province, municipality]
    );

    // Conteo zona='Rural'
    const [[rowR]] = await conn.execute(
      `
      SELECT COUNT(DISTINCT dni) as count
      FROM mgivar
      WHERE province = ? 
        AND municipality = ?
        AND zone = 'Rural'
    `,
      [province, municipality]
    );

    return res.json({
      success: true,
      province,
      municipality,
      counts: [rowU?.count ?? 0, rowR?.count ?? 0] // [Urbana, Rural]
    });
  } catch (err) {
    console.error("❌ /stats/zone-counts-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.zonebymunicipality = async (req, res) => {
  const { province } = req.body;
  if (!province) return res.status(400).json({ success: false });

  const conn = await pool.getConnection();
  try {
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality FROM mgivar 
      WHERE province = ? ORDER BY municipality
    `,
      [province]
    );

    const zones = ["Urbana", "Rural"]; // ← Solo 2 valores
    const data2D = [];

    for (const m of municipios) {
      const zoneCountsRow = [];
      for (const zone of zones) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT dni) as count
          FROM mgivar
          WHERE province = ? 
            AND municipality = ? 
            AND zone = ?
        `,
          [province, m.municipality, zone]
        );
        zoneCountsRow.push(row?.count ?? 0);
      }
      data2D.push(zoneCountsRow);
    }

    return res.json({
      success: true,
      municipalities: municipios.map((m) => m.municipality),
      data2D // [[urbana,rural], [urbana,rural], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.zonebyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province FROM mgivar ORDER BY province
    `);

    const zones = ["Urbana", "Rural"]; // ← Solo 2 valores
    const data2D = [];

    for (const p of provinces) {
      const zoneCountsRow = [];
      for (const zone of zones) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT dni) as count
          FROM mgivar
          WHERE province = ? AND zone = ?
        `,
          [p.province, zone]
        );
        zoneCountsRow.push(row?.count ?? 0);
      }
      data2D.push(zoneCountsRow);
    }

    return res.json({
      success: true,
      provinces: provinces.map((p) => p.province),
      data2D // [[urbana,rural], [urbana,rural], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.economicsituationprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};

    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    const situations = ["Muy buena", "Buena", "Regular", "Mala", "Muy mala"];
    const counts = [];

    for (const sit of situations) {
      const [[row]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT e.id) as count
        FROM me3_3_2 e
        INNER JOIN mgivar v ON e.id = v.id
        WHERE v.province = ? 
          AND v.municipality = ?
          AND e.economicsituation = ?
      `,
        [province, municipality, sit]
      );

      counts.push(row?.count ?? 0);
    }

    return res.json({
      success: true,
      province,
      municipality,
      counts // [muy_buena, buena, regular, mala, muy_mala]
    });
  } catch (err) {
    console.error("❌ /stats/economic-situation-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0, 0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.economicsituationbymunicipality = async (req, res) => {
  const { province } = req.body;
  if (!province) return res.status(400).json({ success: false });

  const conn = await pool.getConnection();
  try {
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality FROM mgivar 
      WHERE province = ? ORDER BY municipality
    `,
      [province]
    );

    const situations = ["Muy buena", "Buena", "Regular", "Mala", "Muy mala"];
    const data2D = [];

    for (const m of municipios) {
      const situationCountsRow = [];
      for (const sit of situations) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT e.id) as count
          FROM me3_3_2 e
          INNER JOIN mgivar v ON e.id = v.id
          WHERE v.province = ? 
            AND v.municipality = ?
            AND e.economicsituation = ?
        `,
          [province, m.municipality, sit]
        );
        situationCountsRow.push(row?.count ?? 0);
      }
      data2D.push(situationCountsRow);
    }

    return res.json({
      success: true,
      municipalities: municipios.map((m) => m.municipality),
      data2D // [[muy_buena,buena,regular,mala,muy_mala], ...]
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.economicsituationbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // Obtiene TODAS las provincias ordenadas alfabéticamente
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province 
      FROM mgivar 
      ORDER BY province
    `);

    const situations = ["Muy buena", "Buena", "Regular", "Mala", "Muy mala"];
    const filteredProvinces = [];
    const data2D = [];

    // Para CADA provincia
    for (const p of provinces) {
      const provinceCounts = [];

      // Para CADA situación económica
      for (const sit of situations) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT e.id) as count
          FROM me3_3_2 e
          INNER JOIN mgivar v ON e.id = v.id
          WHERE v.province = ?
            AND e.economicsituation = ?
        `,
          [p.province, sit]
        );

        provinceCounts.push(row?.count ?? 0);
      }

      // ✅ SOLO agregar si hay AL MENOS UN valor > 0
      const hasData = provinceCounts.some((count) => count > 0);
      if (hasData) {
        filteredProvinces.push(p.province);
        data2D.push(provinceCounts);
      }
    }

    return res.json({
      success: true,
      provinces: filteredProvinces, // Solo provincias CON datos
      data2D // Solo filas CON datos
    });
  } catch (err) {
    console.error("❌ /stats/economic-situation-by-province:", err.message);
    return res.status(500).json({ success: false });
  } finally {
    conn.release();
  }
};

exports.fieldlevelprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality, field } = req.body || {};

    if (!province || !municipality || !field) {
      return res.status(400).json({
        success: false,
        message: "province, municipality y field son obligatorios"
      });
    }

    // Validar campo permitido
    const validFields = [
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
    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Campo inválido. Use: ${validFields.join(", ")}`
      });
    }

    const levels = ["Alto", "Medio", "Bajo"];
    const counts = [];

    for (const level of levels) {
      const [[row]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT e.id) as count
        FROM me3_3_3 e
        INNER JOIN mgivar v ON e.id = v.id
        WHERE v.province = ? 
          AND v.municipality = ?
          AND e.${field} = ?
      `,
        [province, municipality, level]
      );

      counts.push(row?.count ?? 0);
    }

    return res.json({
      success: true,
      province,
      municipality,
      field,
      counts // [alto, medio, bajo]
    });
  } catch (err) {
    console.error("❌ /stats/field-level-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.fieldlevelbymunicipality = async (req, res) => {
  const { province, field } = req.body;

  if (!province || !field) {
    return res.status(400).json({
      success: false,
      message: "province y field son obligatorios"
    });
  }

  // Validar campo permitido
  const validFields = [
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
  if (!validFields.includes(field)) {
    return res.status(400).json({
      success: false,
      message: `Campo inválido. Use: ${validFields.join(", ")}`
    });
  }

  const conn = await pool.getConnection();
  try {
    // ✅ CORREGIDO: Usar [municipios] directo como en economic-situation
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality FROM mgivar 
      WHERE province = ? ORDER BY municipality ASC
    `,
      [province]
    );

    const levels = ["Alto", "Medio", "Bajo"];
    const data2D = [];

    // Para cada municipio
    for (const m of municipios) {
      const levelCountsRow = [];

      for (const level of levels) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT e.id) as count
          FROM me3_3_3 e
          INNER JOIN mgivar v ON e.id = v.id
          WHERE v.province = ? 
            AND v.municipality = ?
            AND e.${field} = ?
        `,
          [province, m.municipality, level]
        );

        levelCountsRow.push(row?.count ?? 0);
      }

      data2D.push(levelCountsRow);
    }

    return res.json({
      success: true,
      province,
      field,
      municipalities: municipios.map((m) => m.municipality), // ✅ Array de nombres
      data2D // [[alto,medio,bajo], [alto,medio,bajo], ...]
    });
  } catch (err) {
    console.error("❌ /stats/field-level-by-municipality:", err.message);
    return res.status(500).json({
      success: false,
      municipalities: [],
      data2D: []
    });
  } finally {
    conn.release();
  }
};

exports.fieldlevelbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { field } = req.body;

    if (!field) {
      return res.status(400).json({
        success: false,
        message: "field es obligatorio"
      });
    }

    // Validar campo permitido
    const validFields = [
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
    if (!validFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Campo inválido. Use: ${validFields.join(", ")}`
      });
    }

    // Obtiene TODAS las provincias ordenadas alfabéticamente
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province 
      FROM mgivar 
      ORDER BY province ASC
    `);

    const levels = ["Alto", "Medio", "Bajo"];
    const filteredProvinces = [];
    const data2D = [];

    // Para CADA provincia
    for (const p of provinces) {
      const provinceCounts = [];

      // Para CADA nivel del campo especificado
      for (const level of levels) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT e.id) as count
          FROM me3_3_3 e
          INNER JOIN mgivar v ON e.id = v.id
          WHERE v.province = ?
            AND e.${field} = ?
        `,
          [p.province, level]
        );

        provinceCounts.push(row?.count ?? 0);
      }

      // ✅ SOLO agregar si hay AL MENOS UN valor > 0
      const hasData = provinceCounts.some((count) => count > 0);
      if (hasData) {
        filteredProvinces.push(p.province);
        data2D.push(provinceCounts);
      }
    }

    return res.json({
      success: true,
      field,
      provinces: filteredProvinces, // Solo provincias CON datos (ordenadas alfabéticamente)
      data2D // Solo filas CON datos [[alto,medio,bajo], ...]
    });
  } catch (err) {
    console.error("❌ /stats/field-level-by-province:", err.message);
    return res.status(500).json({
      success: false,
      provinces: [],
      data2D: []
    });
  } finally {
    conn.release();
  }
};

exports.teachertrainingprovmun = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { province, municipality } = req.body || {};

    if (!province || !municipality) {
      return res.status(400).json({
        success: false,
        message: "province y municipality son obligatorios"
      });
    }

    const trainings = [
      "Habilitado",
      "Nivel medio",
      "Estudiando la Licenciatura",
      "Licenciado",
      "Máster",
      "Doctor"
    ];
    const counts = [];

    for (const training of trainings) {
      const [[row]] = await conn.execute(
        `
        SELECT COUNT(DISTINCT e.id) as count
        FROM me3_1_1 e
        INNER JOIN mgivar v ON e.id = v.id
        WHERE v.province = ? 
          AND v.municipality = ?
          AND e.teachertraining = ?
      `,
        [province, municipality, training]
      );

      counts.push(row?.count ?? 0);
    }

    return res.json({
      success: true,
      province,
      municipality,
      counts // [licenciado, master, doctor]
    });
  } catch (err) {
    console.error("❌ /stats/teacher-training-prov-mun:", err.message);
    return res.status(500).json({
      success: false,
      counts: [0, 0, 0]
    });
  } finally {
    conn.release();
  }
};

exports.teachertrainingbymunicipality = async (req, res) => {
  const { province } = req.body;
  if (!province) return res.status(400).json({ success: false });

  const conn = await pool.getConnection();
  try {
    const [municipios] = await conn.execute(
      `
      SELECT DISTINCT municipality FROM mgivar 
      WHERE province = ? ORDER BY municipality ASC
    `,
      [province]
    );

    const trainings = [
      "Habilitado",
      "Nivel medio",
      "Estudiando la Licenciatura",
      "Licenciado",
      "Máster",
      "Doctor"
    ];
    const data2D = [];

    for (const m of municipios) {
      const trainingCountsRow = [];
      for (const training of trainings) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT e.id) as count
          FROM me3_1_1 e
          INNER JOIN mgivar v ON e.id = v.id
          WHERE v.province = ? 
            AND v.municipality = ?
            AND e.teachertraining = ?
        `,
          [province, m.municipality, training]
        );
        trainingCountsRow.push(row?.count ?? 0);
      }
      data2D.push(trainingCountsRow);
    }

    return res.json({
      success: true,
      municipalities: municipios.map((m) => m.municipality),
      data2D // [[licenciado,master,doctor], [licenciado,master,doctor], ...]
    });
  } catch (err) {
    console.error("❌ /stats/teacher-training-by-municipality:", err.message);
    return res.status(500).json({
      success: false,
      municipalities: [],
      data2D: []
    });
  } finally {
    conn.release();
  }
};

exports.teachertrainingbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // Obtiene TODAS las provincias ordenadas alfabéticamente
    const [provinces] = await conn.execute(`
      SELECT DISTINCT province 
      FROM mgivar 
      ORDER BY province ASC
    `);

    const trainings = [
      "Habilitado",
      "Nivel medio",
      "Estudiando la Licenciatura",
      "Licenciado",
      "Máster",
      "Doctor"
    ];
    const filteredProvinces = [];
    const data2D = [];

    // Para CADA provincia
    for (const p of provinces) {
      const provinceCounts = [];

      // Para CADA nivel de formación docente
      for (const training of trainings) {
        const [[row]] = await conn.execute(
          `
          SELECT COUNT(DISTINCT e.id) as count
          FROM me3_1_1 e
          INNER JOIN mgivar v ON e.id = v.id
          WHERE v.province = ?
            AND e.teachertraining = ?
        `,
          [p.province, training]
        );

        provinceCounts.push(row?.count ?? 0);
      }

      // ✅ SOLO agregar si hay AL MENOS UN valor > 0
      const hasData = provinceCounts.some((count) => count > 0);
      if (hasData) {
        filteredProvinces.push(p.province);
        data2D.push(provinceCounts);
      }
    }

    return res.json({
      success: true,
      provinces: filteredProvinces, // Solo provincias CON datos (ordenadas alfabéticamente)
      data2D // Solo filas CON datos [[licenciado,master,doctor], ...]
    });
  } catch (err) {
    console.error("❌ /stats/teacher-training-by-province:", err.message);
    return res.status(500).json({
      success: false,
      provinces: [],
      data2D: []
    });
  } finally {
    conn.release();
  }
};

exports.specialistsbyprovincemunicipality = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.params;

  try {
    let query = `
      SELECT COUNT(DISTINCT userid) as total_especialistas
      FROM users 
      WHERE userspec IN ('Psicología', 'Psicopedagogía', 'Logopedia', 'Psicometría', 'Pedagogía')
    `;
    let params = [];

    // ✅ SI provincia = "all" → NO filtrar por provincia
    if (province !== "all") {
      query += " AND province = ?";
      params.push(province);
    }

    // ✅ SI municipio = "all" → NO filtrar por municipio
    if (municipality !== "all") {
      query += " AND municipality = ?";
      params.push(municipality);
    }

    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      province: province === "all" ? "Todas las provincias" : province,
      municipality:
        municipality === "all" ? "Todos los municipios" : municipality,
      total_especialistas: rows[0].total_especialistas || 0
    });
  } catch (err) {
    console.error(
      "❌ Error en /api/specialists-by-province-municipality:",
      err.message
    );
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.specialistsbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  const { province } = req.params;

  try {
    const [rows] = await conn.execute(
      `
      SELECT COUNT(DISTINCT userid) as total_especialistas
      FROM users 
      WHERE province = ?
      AND userspec IN ('Psicología', 'Psicopedagogía', 'Logopedia', 'Psicometría', 'Pedagogía')
    `,
      [province]
    );

    return res.json({
      success: true,
      province,
      total_especialistas: rows[0].total_especialistas || 0
    });
  } catch (err) {
    console.error("❌ Error en /api/specialists-by-province:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.casosmgivarbyprovincemunicipality = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.params;

  try {
    let query = `
      SELECT COUNT(DISTINCT dni) as total_casos
      FROM mgivar
      WHERE 1=1
    `;
    let params = [];

    // ✅ SI provincia = "all" → NO filtrar por provincia
    if (province !== "all") {
      query += " AND province = ?";
      params.push(province);
    }

    // ✅ SI municipio = "all" → NO filtrar por municipio
    if (municipality !== "all") {
      query += " AND municipality = ?";
      params.push(municipality);
    }
    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      province: province === "all" ? "Todas las provincias" : province,
      municipality:
        municipality === "all" ? "Todos los municipios" : municipality,
      total_casos: rows[0].total_casos || 0
    });
  } catch (err) {
    console.error(
      "❌ Error en /api/casos-mgivar-by-province-municipality:",
      err.message
    );
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.casosmgivarbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.params;

  try {
    let query = `
      SELECT COUNT(DISTINCT dni) as total_casos
      FROM mgivar
      WHERE 1=1
    `;
    let params = [];

    // ✅ SI provincia = "all" → NO filtrar por provincia
    if (province !== "all") {
      query += " AND province = ?";
      params.push(province);
    }

    // ✅ SI municipio = "all" → NO filtrar por municipio
    if (municipality !== "all") {
      query += " AND municipality = ?";
      params.push(municipality);
    }
    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      province: province === "all" ? "Todas las provincias" : province,
      municipality:
        municipality === "all" ? "Todos los municipios" : municipality,
      total_casos: rows[0].total_casos || 0
    });
  } catch (err) {
    console.error(
      "❌ Error en /api/casos-mgivar-by-province-municipality:",
      err.message
    );
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.mgivartopniveleducativo = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.params;

  try {
    let query = `
      SELECT 
        edulevel,
        COUNT(DISTINCT dni) AS total_casos
      FROM mgivar
      WHERE 1=1
    `;
    const params = [];

    // No filtrar por provincia si es "all"
    if (province !== "all") {
      query += " AND province = ?";
      params.push(province);
    }

    // No filtrar por municipio si es "all"
    if (municipality !== "all") {
      query += " AND municipality = ?";
      params.push(municipality);
    }

    // Agrupar por nivel y ordenar por cantidad DESC, quedándonos con el primero
    query += `
      GROUP BY edulevel
      ORDER BY total_casos DESC
      LIMIT 1
    `;
    const [rows] = await conn.execute(query, params);

    if (!rows.length) {
      return res.json({
        success: true,
        top_nivel: null // No hay casos
      });
    }

    const fila = rows[0];

    // ✅ EXTRAER SIGLAS entre paréntesis de edulevel
    const match = fila.edulevel.match(/\((\w+)\)/);
    const sigla = match ? match[1] : fila.edulevel;
    const topNivel = `${sigla}(${fila.total_casos})`; // Ej: "PI(10)"

    return res.json({
      success: true,
      top_nivel: topNivel
    });
  } catch (err) {
    console.error("❌ Error en /api/mgivar-top-nivel-educativo:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.mgivartopniveleducativoprovincia = async (req, res) => {
  const conn = await pool.getConnection();
  const { province } = req.params;

  try {
    let query = `
      SELECT 
        edulevel,
        COUNT(DISTINCT dni) AS total_casos
      FROM mgivar
      WHERE 1=1
    `;
    const params = [];

    // No filtrar por provincia si es "all"
    if (province !== "all") {
      query += " AND province = ?";
      params.push(province);
    }

    // Agrupar por nivel y ordenar por cantidad DESC, quedándonos con el primero
    query += `
      GROUP BY edulevel
      ORDER BY total_casos DESC
      LIMIT 1
    `;

    const [rows] = await conn.execute(query, params);

    if (!rows.length) {
      return res.json({
        success: true,
        top_nivel: null // No hay casos
      });
    }

    const fila = rows[0];

    // ✅ EXTRAER SIGLAS entre paréntesis de edulevel
    const match = fila.edulevel.match(/\((\w+)\)/);
    const sigla = match ? match[1] : fila.edulevel;
    const topNivel = `${sigla}(${fila.total_casos})`; // Ej: "PI(10)"

    return res.json({
      success: true,
      province: province === "all" ? "Todas las provincias" : province,
      top_nivel: topNivel
    });
  } catch (err) {
    console.error(
      "❌ Error en /api/mgivar-top-nivel-educativo-provincia:",
      err.message
    );
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.casosmrrp44mgivarbyprovincemunicipality = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.params;

  try {
    let query = `
      SELECT COUNT(DISTINCT m.dni) as total_casos
      FROM mrrp44 m
      INNER JOIN mgivar g ON m.dni = g.dni
      WHERE 1=1
    `;
    let params = [];

    // ✅ SI provincia = "all" → NO filtrar por provincia
    if (province !== "all") {
      query += " AND g.province = ?";
      params.push(province);
    }

    // ✅ SI municipio = "all" → NO filtrar por municipio
    if (municipality !== "all") {
      query += " AND g.municipality = ?";
      params.push(municipality);
    }
    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      province: province === "all" ? "Todas las provincias" : province,
      municipality:
        municipality === "all" ? "Todos los municipios" : municipality,
      total_casos: rows[0].total_casos || 0
    });
  } catch (err) {
    console.error(
      "❌ Error en /api/casos-mrrp44-mgivar-by-province-municipality:",
      err.message
    );
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.casosmrrp44mgivarbyprovince = async (req, res) => {
  const conn = await pool.getConnection();
  const { province } = req.params;

  try {
    let query = `
      SELECT COUNT(DISTINCT m.dni) as total_casos
      FROM mrrp44 m
      INNER JOIN mgivar g ON m.dni = g.dni
      WHERE 1=1
    `;
    let params = [];

    // ✅ SI provincia = "all" → NO filtrar por provincia
    if (province !== "all") {
      query += " AND g.province = ?";
      params.push(province);
    }

    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      province: province === "all" ? "Todas las provincias" : province,
      total_casos: rows[0].total_casos || 0
    });
  } catch (err) {
    console.error(
      "❌ Error en /api/casos-mrrp44-mgivar-by-province:",
      err.message
    );
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.statsfunnelme31sinme34 = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.body;

  if (!province) {
    conn.release();
    return res
      .status(400)
      .json({ success: false, message: "province es obligatorio" });
  }

  try {
    let query = `
      SELECT COUNT(DISTINCT m1.dni) AS total
      FROM me3_1_1 AS m1
      JOIN mgivar AS v ON v.dni = m1.dni
      WHERE 1=1
    `;
    let params = [];

    if (province !== "all") {
      query += " AND v.province = ?";
      params.push(province);
    }
    if (municipality && municipality !== "all") {
      query += " AND v.municipality = ?";
      params.push(municipality);
    }
    query +=
      " AND NOT EXISTS (SELECT 1 FROM me3_4 AS m4 WHERE m4.dni = m1.dni)";

    const [rows] = await conn.execute(query, params);
    const total = rows[0]?.total || 0;

    res.json({
      success: true,
      province: province || "all",
      municipality: municipality || "all",
      total
    });
  } catch (err) {
    console.error("Error en /api/stats-funnel-me31-sin-me34:", err.message);
    res.status(500).json({ success: false, message: "Error servidor" });
  } finally {
    conn.release();
  }
};

exports.statsme34sinmrrp41 = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.body;

  if (!province) {
    conn.release();
    return res
      .status(400)
      .json({ success: false, message: "province es obligatorio" });
  }

  try {
    let query = `
      SELECT COUNT(DISTINCT m4.dni) AS total
      FROM me3_4 AS m4
      JOIN mgivar AS v ON v.dni = m4.dni
      WHERE 1=1
    `;
    let params = [];

    if (province !== "all") {
      query += " AND v.province = ?";
      params.push(province);
    }
    if (municipality && municipality !== "all") {
      query += " AND v.municipality = ?";
      params.push(municipality);
    }
    query += " AND NOT EXISTS (SELECT 1 FROM mrrp41 AS r WHERE r.dni = m4.dni)";

    const [rows] = await conn.execute(query, params);
    const total = rows[0]?.total || 0;

    res.json({
      success: true,
      province: province || "all",
      municipality: municipality || "all",
      total
    });
  } catch (err) {
    console.error("Error en /api/stats-me34-sin-mrrp41:", err.message);
    res.status(500).json({ success: false, message: "Error servidor" });
  } finally {
    conn.release();
  }
};

exports.statsmrrp41sinmrrp44 = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.body;

  if (!province) {
    conn.release();
    return res
      .status(400)
      .json({ success: false, message: "province es obligatorio" });
  }

  try {
    let query = `
      SELECT COUNT(DISTINCT r41.dni) AS total
      FROM mrrp41 AS r41
      JOIN mgivar AS v ON v.dni = r41.dni
      WHERE 1=1
    `;
    let params = [];

    if (province !== "all") {
      query += " AND v.province = ?";
      params.push(province);
    }
    if (municipality && municipality !== "all") {
      query += " AND v.municipality = ?";
      params.push(municipality);
    }
    query +=
      " AND NOT EXISTS (SELECT 1 FROM mrrp44 AS r44 WHERE r44.dni = r41.dni)";

    const [rows] = await conn.execute(query, params);
    const total = rows[0]?.total || 0;

    res.json({
      success: true,
      province: province || "all",
      municipality: municipality || "all",
      total
    });
  } catch (err) {
    console.error("Error en /api/stats-mrrp41-sin-mrrp44:", err.message);
    res.status(500).json({ success: false, message: "Error servidor" });
  } finally {
    conn.release();
  }
};

exports.statsmrrp44 = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.body;

  if (!province) {
    conn.release();
    return res
      .status(400)
      .json({ success: false, message: "province es obligatorio" });
  }

  try {
    let query = `
      SELECT COUNT(DISTINCT r44.dni) AS total
      FROM mrrp44 AS r44
      JOIN mgivar AS v ON v.dni = r44.dni
      WHERE 1=1
    `;
    let params = [];

    if (province !== "all") {
      query += " AND v.province = ?";
      params.push(province);
    }
    if (municipality && municipality !== "all") {
      query += " AND v.municipality = ?";
      params.push(municipality);
    }

    const [rows] = await conn.execute(query, params);
    const total = rows[0]?.total || 0;

    res.json({
      success: true,
      province: province || "all",
      municipality: municipality || "all",
      total
    });
  } catch (err) {
    console.error("Error en /api/stats-mrrp44:", err.message);
    res.status(500).json({ success: false, message: "Error servidor" });
  } finally {
    conn.release();
  }
};

exports.statsduracionme34mgivar = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.body;

  try {
    let query = `
      SELECT 
        ROUND(AVG(DATEDIFF(m4.savedate, v.savedate)), 1) AS dias_promedio,
        COUNT(DISTINCT m4.id) AS total_ids
      FROM me3_4 m4
      INNER JOIN mgivar v ON m4.id = v.id
    `;
    let params = [];

    // Filtros opcionales (solo si no son 'all')
    if (province && province !== "all") {
      query += " AND v.province = ?";
      params.push(province);
    }
    if (municipality && municipality !== "all") {
      query += " AND v.municipality = ?";
      params.push(municipality);
    }

    const [rows] = await conn.execute(query, params);

    res.json({
      success: true,
      province: province || "all",
      municipality: municipality || "all",
      dias_promedio: rows[0]?.dias_promedio || 0,
      total_ids: rows[0]?.total_ids || 0
    });
  } catch (err) {
    console.error("Error duración ME3.4:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.statsduracionmrrp44mrrp41 = async (req, res) => {
  const conn = await pool.getConnection();
  const { province, municipality } = req.body;

  try {
    let query = `
      SELECT 
        ROUND(AVG(DATEDIFF(m44.savedate, m41.savedate)), 1) AS dias_promedio,
        COUNT(DISTINCT m44.id) AS total_ids
      FROM mrrp44 m44
      INNER JOIN mrrp41 m41 ON m44.id = m41.id
    `;
    let params = [];

    // Filtros opcionales (solo si no son 'all')
    if (province && province !== "all") {
      query += " INNER JOIN mgivar v ON m44.dni = v.dni AND v.province = ?";
      params.push(province);
    } else {
      query += " INNER JOIN mgivar v ON m44.dni = v.dni";
    }

    if (municipality && municipality !== "all") {
      query += " AND v.municipality = ?";
      params.push(municipality);
    }

    const [rows] = await conn.execute(query, params);

    res.json({
      success: true,
      province: province || "all",
      municipality: municipality || "all",
      dias_promedio: rows[0]?.dias_promedio || 0,
      total_ids: rows[0]?.total_ids || 0
    });
  } catch (err) {
    console.error("Error duración MRRP44:", err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.mgivarusernamestats = async (req, res) => {
  const conn = await pool.getConnection();
  const { filtroActivo } = req.body; // ✅ Recibir filtroActivo

  try {
    let query = `
      SELECT 
        m.username,
        COUNT(DISTINCT m.dni) as totalDnisDistintos
      FROM mgivar m
      INNER JOIN users u ON m.username = u.userid
      WHERE m.username IS NOT NULL 
        AND m.username != ''
    `;
    let params = [];

    // ✅ FILTROS por ubicación del USUARIO en tabla `users`
    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      query += ` AND u.municipality = ?`;
      params = [filtroActivo.value];
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      query += ` AND u.province = ?`;
      params = [filtroActivo.value];
    }
    // Si scope = 'Todos' → sin filtro adicional

    query += `
      GROUP BY m.username
      ORDER BY totalDnisDistintos DESC, m.username
    `;

    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      stats: rows // [{username: "osvaldo", totalDnisDistintos: 7}, ...]
    });
  } catch (err) {
    console.error("❌ Error en /api/mgivar/username-stats:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};

exports.mrrp44usernamestats = async (req, res) => {
  const conn = await pool.getConnection();
  const { filtroActivo } = req.body; // ✅ Recibir filtroActivo

  try {
    let query = `
      SELECT DISTINCT
        m.username,
        COUNT(DISTINCT m.dni) as totalDnisDistintos
      FROM mrrp44 m
      INNER JOIN users u ON m.username = u.userid  -- ✅ JOIN con users
      WHERE m.username IS NOT NULL 
        AND m.username != ''
    `;
    let params = [];

    // ✅ FILTRO por ubicación del USUARIO en tabla `users`
    if (filtroActivo?.scope === "CDO" && filtroActivo.value) {
      query += ` AND u.municipality = ?`;
      params.push(filtroActivo.value);
    } else if (filtroActivo?.scope === "PROVINCIA" && filtroActivo.value) {
      query += ` AND u.province = ?`;
      params.push(filtroActivo.value);
    }
    // Si scope = 'Todos' → sin filtro adicional

    query += `
      GROUP BY m.username
      HAVING totalDnisDistintos > 0  -- Solo usuarios con evaluaciones completas
      ORDER BY totalDnisDistintos DESC, m.username
    `;

    const [rows] = await conn.execute(query, params);

    return res.json({
      success: true,
      stats: rows // [{username: "maria", totalDnisDistintos: 2}, ...]
    });
  } catch (err) {
    console.error("❌ Error en /api/mrrp44/username-stats:", err.message);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  } finally {
    conn.release();
  }
};
