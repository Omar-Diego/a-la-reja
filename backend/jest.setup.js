/**
 * Jest Setup - Configuración global para pruebas
 */

// Silenciar console ANTES de cualquier cosa
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Configurar variables de entorno por defecto
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.RESEND_API_KEY = 'test-resend-api-key';

// Limpiar todos los mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
});
