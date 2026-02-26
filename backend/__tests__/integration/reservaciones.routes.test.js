/**
 * Pruebas de Integración - Rutas de Reservaciones
 * 
 * Este archivo contiene pruebas de integración para las rutas de gestión
 * de reservaciones de canchas de pádel.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Configurar variables de entorno
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

// Mock de la base de datos
const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn(),
};

jest.mock('../../config/db', () => ({
  pool: mockPool,
}));

// NO hacer mock completo de jsonwebtoken - usamos el middleware real

// Mock del middleware adminAuth

// Mock del servicio de email
jest.mock('../../utils/email', () => ({
  enviarConfirmacionReservacion: jest.fn().mockResolvedValue(true),
}));
jest.mock('../../middlewares/adminAuth', () => {
  return jest.fn((req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    const token = header.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          error: 'Acceso denegado: se requieren permisos de administrador',
        });
      }
      req.usuario = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  });
});

// Importar rutas después de los mocks
const reservacionesRoutes = require('../../routes/reservaciones');

describe('Rutas de Reservaciones (/api/reservaciones)', () => {
  let app;
  let userToken;
  let adminToken;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Agregar middleware de autenticación simulado
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.usuario = decoded;
        } catch (e) {
          // Token inválido
        }
      }
      next();
    });
    
    app.use('/api', reservacionesRoutes);
    
    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: 'Error interno del servidor' });
    });

    // Generar tokens para pruebas
    userToken = jwt.sign({ idUsuario: 2, nombre: 'Test User' }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ idUsuario: 1, nombre: 'Admin', role: 'admin' }, process.env.JWT_SECRET);

    jest.clearAllMocks();
  });

  describe('POST /api/reservaciones (Crear reservación)', () => {
    it('debe requerir autenticación', async () => {
      const response = await request(app)
        .post('/api/reservaciones')
        .send({
          fecha: '2024-12-01',
          hora_inicio: '10:00',
          hora_fin: '11:00',
          idCancha: 1,
          monto: 50,
        });

      expect(response.status).toBe(401);
    });

    it('debe retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/reservaciones')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fecha: '2024-12-01' });

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si el monto es inválido', async () => {
      const response = await request(app)
        .post('/api/reservaciones')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fecha: '2024-12-01',
          hora_inicio: '10:00',
          hora_fin: '11:00',
          idCancha: 1,
          monto: -10,
        });

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si el formato de fecha es inválido', async () => {
      const response = await request(app)
        .post('/api/reservaciones')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fecha: '01-12-2024',
          hora_inicio: '10:00',
          hora_fin: '11:00',
          idCancha: 1,
          monto: 50,
        });

      expect(response.status).toBe(400);
    });

    it('debe retornar 400 si la hora de fin no es posterior a hora de inicio', async () => {
      const response = await request(app)
        .post('/api/reservaciones')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fecha: '2024-12-01',
          hora_inicio: '11:00',
          hora_fin: '10:00',
          idCancha: 1,
          monto: 50,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reservaciones (Listar reservaciones)', () => {
    it('debe permitir acceso público con filtros de disponibilidad', async () => {
      mockPool.query.mockResolvedValue([[{ idReservacion: 1, hora_inicio: '10:00', hora_fin: '11:00' }]]);

      const response = await request(app)
        .get('/api/reservaciones?fecha=2024-12-01&canchaId=1');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/reservaciones/usuario (Mis reservaciones)', () => {
    it('debe requerir autenticación', async () => {
      const response = await request(app).get('/api/reservaciones/usuario');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reservaciones/:idReservacion (Obtener una reservación)', () => {
    it('debe requerir autenticación', async () => {
      const response = await request(app).get('/api/reservaciones/1');

      expect(response.status).toBe(401);
    });

    it('debe retornar 400 si el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/reservaciones/invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/reservaciones/:idReservacion (Cancelar reservación)', () => {
    it('debe requerir autenticación', async () => {
      const response = await request(app).delete('/api/reservaciones/1');

      expect(response.status).toBe(401);
    });

    it('debe retornar 400 si el ID es inválido', async () => {
      const response = await request(app)
        .delete('/api/reservaciones/invalid')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/reservaciones/:idReservacion (Actualizar reservación)', () => {
    it('debe requerir autenticación', async () => {
      const response = await request(app)
        .put('/api/reservaciones/1')
        .send({
          fecha: '2024-12-02',
          hora_inicio: '14:00',
          hora_fin: '15:00',
          idCancha: 1,
        });

      expect(response.status).toBe(401);
    });
  });
});
