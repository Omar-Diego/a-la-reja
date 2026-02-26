/**
 * Pruebas de Integración - Rutas de Canchas
 * 
 * Este archivo contiene pruebas de integración para las rutas de gestión
 * de canchas de pádel.
 */

const request = require('supertest');
const express = require('express');

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

// Importar rutas después de los mocks
const canchasRoutes = require('../../routes/canchas');

describe('Rutas de Canchas (/api/canchas)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', canchasRoutes);
    
    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: 'Error interno del servidor' });
    });

    jest.clearAllMocks();
  });

  describe('GET /api/canchas (Listar todas las canchas)', () => {
    const mockCanchas = [
      { idCancha: 1, nombre: 'Pista 1', ubicacion: 'Frente al club', precio_por_hora: 50 },
      { idCancha: 2, nombre: 'Pista Central', ubicacion: 'Centro del complejo', precio_por_hora: 80 },
    ];

    it('debe retornar 200 y lista de canchas', async () => {
      mockPool.query.mockResolvedValue([mockCanchas]);

      const response = await request(app).get('/api/canchas');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCanchas);
    });

    it('debe retornar array vacío si no hay canchas', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const response = await request(app).get('/api/canchas');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/canchas/top (Canchas más populares)', () => {
    it('debe retornar las 3 canchas más rentadas', async () => {
      const mockTopCanchas = [
        { idCancha: 1, nombre: 'Pista 1', totalReservaciones: 10 },
      ];
      mockPool.query.mockResolvedValue([mockTopCanchas]);

      const response = await request(app).get('/api/canchas/top');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/canchas/:idCancha (Obtener una cancha)', () => {
    it('debe retornar 400 si el ID es inválido', async () => {
      const response = await request(app).get('/api/canchas/abc');

      expect(response.status).toBe(400);
    });

    it('debe retornar 404 si la cancha no existe', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const response = await request(app).get('/api/canchas/999');

      expect(response.status).toBe(404);
    });

    it('debe retornar la cancha si existe', async () => {
      const mockCancha = { idCancha: 1, nombre: 'Pista 1', ubicacion: 'Frente', precio_por_hora: 50 };
      mockPool.query.mockResolvedValue([[mockCancha]]);

      const response = await request(app).get('/api/canchas/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCancha);
    });
  });

  describe('GET /api/canchas/by-slug/:slug (Obtener por slug)', () => {
    it('debe retornar la cancha por slug', async () => {
      const mockCancha = { idCancha: 1, nombre: 'Pista 1', ubicacion: 'Frente', precio_por_hora: 50 };
      mockPool.query.mockResolvedValue([[mockCancha]]);

      const response = await request(app).get('/api/canchas/by-slug/pista-1');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/canchas/stats (Estadísticas)', () => {
    it('debe requerir autenticación de admin', async () => {
      const response = await request(app).get('/api/canchas/stats');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/canchas (Crear cancha)', () => {
    it('debe requerir autenticación de admin', async () => {
      const response = await request(app)
        .post('/api/canchas')
        .send({ nombre: 'Nueva Pista', ubicacion: 'Ubicación', precio_por_hora: 60 });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/canchas/:idCancha (Actualizar cancha)', () => {
    it('debe requerir autenticación de admin', async () => {
      const response = await request(app)
        .put('/api/canchas/1')
        .send({ nombre: 'Pista Actualizada' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/canchas/:idCancha (Eliminar cancha)', () => {
    it('debe requerir autenticación de admin', async () => {
      const response = await request(app).delete('/api/canchas/1');

      expect(response.status).toBe(401);
    });
  });
});
