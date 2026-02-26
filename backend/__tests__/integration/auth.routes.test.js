/**
 * Pruebas de Integración - Rutas de Autenticación
 * 
 * Este archivo contiene pruebas de integración para las rutas de login
 * y registro de usuarios.
 */

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configurar variables de entorno
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

// Importar el dbErrorHandler para usarlo en las pruebas
const dbErrorHandler = require('../../middlewares/dbErrorHandler');

// Mock de la base de datos
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn(),
};

jest.mock('../../config/db', () => ({
  pool: mockPool,
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Importar rutas después de los mocks
const authRoutes = require('../../routes/auth');

describe('Rutas de Autenticación (/api)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', authRoutes);
    
    // Middleware de manejo de errores de base de datos
    app.use(dbErrorHandler);

    jest.clearAllMocks();
  });

  describe('POST /api/login', () => {
    const validUser = {
      idUsuario: 1,
      nombre: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword', // bcrypt hash
    };

    it('debe retornar 400 si no se proporciona email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email y contrasena son requeridos');
    });

    it('debe retornar 400 si no se proporciona password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email y contrasena son requeridos');
    });

    it('debe retornar 401 si el usuario no existe', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciales invalidas');
    });

    it('debe retornar 401 si la contraseña es incorrecta', async () => {
      mockPool.query.mockResolvedValue([[validUser]]);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciales invalidas');
    });

    it('debe retornar token si las credenciales son válidas', async () => {
      mockPool.query.mockResolvedValue([[validUser]]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'TestPassword123' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('mock-token');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('debe usar consultas parametrizadas para prevenir inyección SQL', async () => {
      mockPool.query.mockResolvedValue([[]]);

      await request(app)
        .post('/api/login')
        .send({ email: "'; DROP TABLE USUARIOS; --", password: 'password' });

      // Verificar que se usó consulta parametrizada
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = ?'),
        expect.arrayContaining(["'; DROP TABLE USUARIOS; --"])
      );
    });
  });

  describe('POST /api/usuarios (Registro)', () => {
    it('debe retornar 400 si no se proporcionan todos los campos requeridos', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({ nombre: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nombre, email y contrasena son requeridos');
    });

    it('debe retornar 400 si el email tiene formato inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Test User',
          email: 'invalid-email',
          password: 'Test1234',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Formato de email invalido');
    });

    it('debe retornar 400 si la contraseña es muy corta', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('La contrasena debe tener al menos 8 caracteres');
    });

    it('debe retornar 400 si la contraseña no cumple los requisitos', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'alllowercase1',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('La contrasena debe contener al menos una mayuscula, una minuscula y un numero');
    });

    it('debe crear usuario exitosamente con datos válidos', async () => {
      bcrypt.hash.mockResolvedValue('$2a$10$hashedpassword');
      mockPool.query.mockResolvedValue([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuario creado exitosamente');
      expect(response.body.id).toBe(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('TestPassword123', 10);
    });

    it('debe retornar error si el email ya existe', async () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';
      error.errno = 1062;
      
      bcrypt.hash.mockResolvedValue('$2a$10$hashedpassword');
      mockPool.query.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nombre: 'Test User',
          email: 'existing@example.com',
          password: 'TestPassword123',
        });

      expect(response.status).toBe(409);
    });
  });
});
