// Middleware de Autenticación JWT

// Importa el módulo jsonwebtoken para verificar tokens
const jwt = require("jsonwebtoken");

// Middleware que verifica un token JWT
// Se utiliza para proteger rutas que requieren autenticación (osea, que la persona que realice las solicitudes si sea ella)
module.exports = (req, res, next) => {
  // Obtiene el header de autorización de la solicitud
  // El formato esperado es: "Bearer <token>"
  const header = req.headers.authorization;

  // Verifica si el header de autorización está presente
  if (!header) {
    // Si no está presente, responde con error 401 (No autorizado)
    return res.status(401).json({ error: "Token requerido" });
  }

  // Extrae el token del header (Quita el prefijo "Bearer ")
  const token = header.split(" ")[1];

// Verificación del Token
  try {
    // Verifica el token usando la clave secreta definida en las variables de entorno
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Si el token es válido, guarda la información decodificada en la solicitud
    req.usuario = decoded;

    // Continúa con el siguiente middleware o ruta
    next();
  } catch (error) {
    // Si el token es inválido o ha expirado, responde con error 401
    res.status(401).json({ error: "Token inválido" });
  }
};
