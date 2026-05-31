// middlewares/auth.js
const authMiddleware = (req, res, next) => {
  // Ejemplo: Verificar si el usuario envió un token en el header
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ success: false, message: "No autorizado" });
  }

  // Aquí validarías tu token (ej: jwt.verify(token, secret))
  // req.user = usuarioDecodificado;
  next();
};

module.exports = { authMiddleware };
