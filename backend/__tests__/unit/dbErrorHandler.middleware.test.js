/**
 * Pruebas Unitarias - Middleware de Manejo de Errores de Base de Datos
 * 
 * Este archivo contiene pruebas para el middleware que maneja errores
 * relacionados con la base de datos MySQL.
 */

const dbErrorHandler = require('../../middlewares/dbErrorHandler');
const { isDatabaseError } = require('../../middlewares/dbErrorHandler');

describe('Middleware de Manejo de Errores de DB (dbErrorHandler.js)', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Función isDatabaseError', () => {
    it('debe retornar true para errores con código ER_', () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';
      
      expect(isDatabaseError(error)).toBe(true);
    });

    it('debe retornar true para errores de conexión', () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      
      expect(isDatabaseError(error)).toBe(true);
    });

    it('debe retornar true para errores de protocolo', () => {
      const error = new Error('Protocol error');
      error.code = 'PROTOCOL_CONNECTION_LOST';
      
      expect(isDatabaseError(error)).toBe(true);
    });

    it('debe retornar true para errores con errno', () => {
      const error = new Error('Some error');
      error.code = 'ER_UNKNOWN';
      error.errno = 1062;
      
      expect(isDatabaseError(error)).toBe(true);
    });

    it('debe retornar true para errores con mensaje containing "mysql"', () => {
      const error = new Error('mysql connection error');
      
      expect(isDatabaseError(error)).toBe(true);
    });

    it('debe retornar false para errores genéricos', () => {
      const error = new Error('Some random error');
      
      expect(isDatabaseError(error)).toBe(false);
    });
  });

  describe('Errores de entrada duplicada (ER_DUP_ENTRY)', () => {
    it('debe retornar 409 para error de entrada duplicada', () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';
      error.errno = 1062;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('Errores de clave foránea', () => {
    it('debe retornar 400 para error de clave foránea al insertar', () => {
      const error = new Error('Foreign key constraint failed');
      error.code = 'ER_NO_REFERENCED_ROW_2';
      error.errno = 1452;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe retornar 400 para error de clave foránea al eliminar', () => {
      const error = new Error('Cannot delete - referenced');
      error.code = 'ER_ROW_IS_REFERENCED_2';
      error.errno = 1451;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Errores de validación de datos', () => {
    it('debe retornar 400 para error de campo nulo', () => {
      const error = new Error('Column cannot be null');
      error.code = 'ER_BAD_NULL_ERROR';
      error.errno = 1048;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Errores de conexión', () => {
    it('debe retornar 503 para error de conexión rechazada', () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    it('debe retornar 503 para error de timeout de conexión', () => {
      const error = new Error('Connection timeout');
      error.code = 'ETIMEDOUT';

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
    });
  });

  describe('Errores de deadlock/bloqueo', () => {
    it('debe retornar 503 para error de deadlock', () => {
      const error = new Error('Deadlock found');
      error.code = 'ER_LOCK_DEADLOCK';
      error.errno = 1213;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
    });
  });

  describe('Errores de acceso denegado', () => {
    it('debe retornar 503 para error de acceso denegado', () => {
      const error = new Error('Access denied');
      error.code = 'ER_ACCESS_DENIED_ERROR';
      error.errno = 1045;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
    });
  });

  describe('Errores de base de datos/tabla', () => {
    it('debe retornar 500 para error de tabla no encontrada', () => {
      const error = new Error('Table not found');
      error.errno = 1146;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Errores no relacionados con DB', () => {
    it('debe pasar errores no-DB al siguiente middleware', () => {
      const error = new Error('Some random error');
      error.statusCode = 400;

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('debe manejar errores desconocidos correctamente', () => {
      const error = new Error('Unknown error');

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Cabeceras ya enviadas', () => {
    it('debe llamar a next si las cabeceras ya fueron enviadas', () => {
      mockRes.headersSent = true;
      const error = new Error('DB Error');
      error.code = 'ER_DUP_ENTRY';

      dbErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
