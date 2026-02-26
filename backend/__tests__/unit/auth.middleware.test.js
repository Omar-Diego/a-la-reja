/**
 * Pruebas Unitarias - Middleware de Autenticación JWT
 * 
 * Este archivo contiene pruebas para el middleware de autenticación
 * que verifica tokens JWT en las solicitudes.
 */

const jwt = require('jsonwebtoken');

// Requerir el middleware después de setear las variables de entorno
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
const authMiddleware = require('../../middlewares/auth');

describe('Middleware de Autenticación (auth.js)', () => {
  // Variables mock para simular req, res, next
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cuando no hay header de autorización', () => {
    it('debe retornar error 401 si no existe el header de autorización', () => {
      // No agregar header de autorización
      authMiddleware(mockReq, mockRes, mockNext);

      // Verificar que se retornó el error correcto
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token requerido' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Cuando el header de autorización tiene formato inválido', () => {
    it('debe retornar error 401 si el header no tiene el formato Bearer', () => {
      mockReq.headers.authorization = 'InvalidFormat token123';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      // El código retorna 'Token inválido' porque jwt.verify falla con formato incorrecto
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar error 401 si el token está vacío', () => {
      mockReq.headers.authorization = 'Bearer ';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      // El código retorna 'Token inválido' porque jwt.verify falla con token vacío
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Cuando el token es inválido', () => {
    it('debe retornar error 401 si el token es inválido', () => {
      mockReq.headers.authorization = 'Bearer token-invalido';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar error 401 si el token ha expirado', () => {
      // Crear un token expirado
      const expiredToken = jwt.sign(
        { idUsuario: 1, nombre: 'Test User' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Expira en el pasado
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('debe retornar error 401 si el token tiene firma incorrecta', () => {
      // Crear un token con una firma diferente
      const wrongSignatureToken = jwt.sign(
        { idUsuario: 1, nombre: 'Test User' },
        'secret-incorrecto',
        { expiresIn: '1h' }
      );
      mockReq.headers.authorization = `Bearer ${wrongSignatureToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Cuando el token es válido', () => {
    let validToken;

    beforeEach(() => {
      // Crear un token válido para las pruebas
      const payload = {
        idUsuario: 1,
        nombre: 'Test User',
        email: 'test@example.com',
      };
      validToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    it('debe llamar a next() si el token es válido', () => {
      mockReq.headers.authorization = `Bearer ${validToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe agregar la información del usuario al objeto req', () => {
      mockReq.headers.authorization = `Bearer ${validToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.usuario).toBeDefined();
      expect(mockReq.usuario.idUsuario).toBe(1);
      expect(mockReq.usuario.nombre).toBe('Test User');
      expect(mockReq.usuario.email).toBe('test@example.com');
    });

    it('debe extraer el token correctamente del header Bearer', () => {
      mockReq.headers.authorization = `Bearer ${validToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Casos edge', () => {
    it('debe manejar tokens con diferentes tipos de payload', () => {
      const payload = { idUsuario: 99, nombre: 'Admin', role: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      mockReq.headers.authorization = `Bearer ${token}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.usuario.idUsuario).toBe(99);
      expect(mockReq.usuario.role).toBe('admin');
    });

    it('debe manejar tokens con claims adicionales', () => {
      const payload = {
        idUsuario: 1,
        nombre: 'Test User',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
