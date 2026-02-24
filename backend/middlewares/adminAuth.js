// Middleware de Autenticación JWT para Administradores

const jwt = require("jsonwebtoken");

// Middleware que verifica un token JWT y requiere rol de administrador
module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        error: "Acceso denegado: se requieren permisos de administrador",
      });
    }

    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};
