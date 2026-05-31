// scripts/generate-version.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

try {
  const version = require("../package.json").version;
  // Obtiene el hash del último commit de Git
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  const buildDate = new Date().toISOString();

  const buildInfo = { version, commit, buildDate };

  // Lo guarda en la carpeta public para que sea accesible desde el navegador
  const outputPath = path.join(__dirname, "../public/build-info.json");
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log("✅ Build info generado correctamente en public/build-info.json");
} catch (error) {
  console.error("❌ Error generando build-info:", error.message);
}
