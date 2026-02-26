module.exports = {
  // Entorno de prueba
  testEnvironment: 'node',
  
  // Patrón para encontrar archivos de prueba
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  
  // Directorio raíz de las pruebas
  rootDir: '.',
  
  // Archivos de setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Timeout para las pruebas (10 segundos)
  testTimeout: 10000,
  
  // Recopilación de coverage
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/'
  ],
  
  // Verbose
  verbose: true,
  
  // Limpiar mocks después de cada prueba
  clearMocks: true,
  
  // Restaurar mocks después de cada prueba
  restoreMocks: true
};
