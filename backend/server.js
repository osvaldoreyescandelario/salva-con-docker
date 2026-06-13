require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const axios = require("axios");

const initDatabase = require("./initDatabase");
const { pool } = require("./config/db.js");
const mainRoutes = require("./routes/index.js");
const { initAlarmCron } = require("./services/alarmCronService");

const app = express();

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:8000",
  "http://localhost:8080",
  "http://localhost:5173",
  "https://190.92.115.132",
  "https://saidicdo.cneuro.cu"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    console.error("CORS bloqueado:", origin);
    return callback(new Error("No permitido por CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo imágenes y PDFs permitidos"), false);
    }
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads/");
    },
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${
        file.originalname
      }`;
      cb(null, safeName);
    }
  })
});

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));

async function waitForMySQL(retries = 40, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      console.log("✅ MySQL listo");
      return;
    } catch (err) {
      console.log(`⏳ Esperando MySQL... intento ${i}/${retries}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("MySQL no estuvo listo a tiempo");
}

async function startServer() {
  await waitForMySQL();

  await initDatabase();

  app.use("/", mainRoutes);

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("💥 Error arrancando servidor:", err);
  process.exit(1);
});

initAlarmCron();

app.get("/api/server", (req, res) => res.status(200).send("OK"));

const { CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN, API_BASE } = process.env;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  try {
    const response = await axios.post(
      "https://apis-fuc.minjus.gob.cu/token?grant_type=client_credentials&scope=nivel10",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: "default"
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiresAt = now + (response.data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (err) {
    console.error("Error obteniendo token:", err.response?.data || err.message);
    throw new Error("No se pudo obtener token");
  }
}

async function fetchPersonaFUC(dni) {
  const token = await getToken();

  const response = await axios.get(`${process.env.API_BASE}/api/v1/nivel10`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    params: { identidad_numero: dni, similar: false }
  });

  const persona = response.data;
  const personaId = persona?.[0]?.id;

  if (personaId) {
    try {
      const fotoResponse = await axios.get(
        `${process.env.API_BASE}/api/v1/foto/${personaId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: "arraybuffer"
        }
      );

      const base64Foto = Buffer.from(fotoResponse.data, "binary").toString(
        "base64"
      );
      persona[0].foto = `data:image/jpeg;base64,${base64Foto}`;
    } catch (fotoErr) {
      console.error("Error obteniendo foto:", fotoErr);
      persona[0].foto = null;
    }
  }

  return persona;
}

async function consultarPersona(req, res) {
  const dni = req.params.dni;

  try {
    const token = await getToken();

    const response = await axios.get(`${process.env.API_BASE}/api/v1/nivel10`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      },
      params: { identidad_numero: dni, similar: false }
    });

    const persona = response.data;
    const personaId = persona?.[0]?.id;

    if (personaId) {
      try {
        const fotoResponse = await axios.get(
          `${process.env.API_BASE}/api/v1/foto/${personaId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            responseType: "arraybuffer"
          }
        );

        const base64Foto = Buffer.from(fotoResponse.data, "binary").toString(
          "base64"
        );
        persona[0].foto = `data:image/jpeg;base64,${base64Foto}`;
      } catch (fotoErr) {
        console.error("Error obteniendo foto:", fotoErr);
        persona[0].foto = null;
      }
    }

    res.json(persona);
  } catch (err) {
    console.error("Error consultando FUC:", err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
}

app.get("/api/personas/:dni", async (req, res) => {
  console.log("entrada 3");
  try {
    await consultarPersona(req, res);
  } catch (err) {
    console.error("❌ Error en /api/personas/:dni:", err);
    res.status(500).json({ message: "Error interno en el servidor" });
  }
});

startServer().catch((err) => {
  console.error("💥 Error arrancando servidor:", err);
  process.exit(1);
});
