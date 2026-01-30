// Conexión a MySQL

// Importa el módulo mysql2 para conectar con la base de datos MySQL
const mysql = require('mysql2');


// Aqui se crea una conexión a la base de datos usando las variables de entorno
// DB_HOST: Servidor de la base de datos (por defecto 'localhost')
// DB_USER: Usuario de la base de datos
// DB_PASSWORD: Contraseña del usuario
// DB_NAME: Nombre de la base de datos
// DB_PORT: Puerto de MySQL (por defecto 3306)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Verificación de Conexión

// Intenta conectar a la base de datos e imprime el estado en la consola
db.connect((err) => {
  // Si hay un error, lo muestra en la consola y termina la ejecución del callback
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  // Si la conexión es exitosa, muestra un mensaje de confirmación
  console.log('Conectado a MySQL');
});

// Exporta la conexión para ser utilizada en otros módulos del proyecto
module.exports = db;
