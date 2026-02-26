/**
 * Mocks de Base de Datos para Pruebas
 * 
 * Este módulo proporciona mocks del pool de conexiones MySQL
 * para usar en las pruebas unitarias y de integración.
 */

const mockQuery = jest.fn();
const mockGetConnection = jest.fn();
const mockRelease = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockQueryConnection = jest.fn();

/**
 * Crea un mock de pool de conexiones
 * @param {Array} mockResults - Resultados a retornar en las consultas
 * @param {Error|null} mockError - Error a throwear (opcional)
 */
function createPoolMock(mockResults = [[]], mockError = null) {
  const mockConnection = {
    query: mockQueryConnection,
    beginTransaction: mockBeginTransaction,
    commit: mockCommit,
    rollback: mockRollback,
    release: mockRelease,
  };

  mockGetConnection.mockResolvedValue(mockConnection);
  
  // Configurar query para que retorne los resultados o throwee el error
  mockQuery.mockImplementation((sql, params) => {
    if (mockError) {
      throw mockError;
    }
    return mockResults;
  });

  mockQueryConnection.mockImplementation((sql, params) => {
    if (mockError) {
      throw mockError;
    }
    return mockResults;
  });

  return {
    query: mockQuery,
    getConnection: mockGetConnection,
    release: mockRelease,
  };
}

/**
 * Resetea todos los mocks
 */
function resetMocks() {
  mockQuery.mockReset();
  mockGetConnection.mockReset();
  mockRelease.mockReset();
  mockBeginTransaction.mockReset();
  mockCommit.mockReset();
  mockRollback.mockReset();
  mockQueryConnection.mockReset();
}

/**
 * Mock del pool de conexiones
 */
const mockPool = {
  query: mockQuery,
  getConnection: mockGetConnection,
};

// Datos de prueba comunes
const testUsers = [
  {
    idUsuario: 1,
    nombre: 'Test User',
    email: 'test@example.com',
    password: '$2a$10$testHash', // bcrypt hash for "TestPassword123"
  },
  {
    idUsuario: 2,
    nombre: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$adminHash',
    role: 'admin',
  },
];

const testCanchas = [
  {
    idCancha: 1,
    nombre: 'Pista 1',
    ubicacion: 'Frente al club',
    precio_por_hora: 50,
  },
  {
    idCancha: 2,
    nombre: 'Pista Central',
    ubicacion: 'Centro del complejo',
    precio_por_hora: 80,
  },
];

const testReservaciones = [
  {
    idReservacion: 1,
    fecha: '2024-12-01',
    hora_inicio: '10:00:00',
    hora_fin: '11:00:00',
    USUARIOS_idUsuario: 1,
    CANCHAS_idCancha: 1,
    monto: 50,
  },
  {
    idReservacion: 2,
    fecha: '2024-12-01',
    hora_inicio: '14:00:00',
    hora_fin: '15:00:00',
    USUARIOS_idUsuario: 1,
    CANCHAS_idCancha: 2,
    monto: 80,
  },
];

module.exports = {
  mockPool,
  mockQuery,
  mockGetConnection,
  mockRelease,
  mockBeginTransaction,
  mockCommit,
  mockRollback,
  mockQueryConnection,
  createPoolMock,
  resetMocks,
  testUsers,
  testCanchas,
  testReservaciones,
};
