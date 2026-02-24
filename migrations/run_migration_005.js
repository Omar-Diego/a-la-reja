require("dotenv").config({
  path: require("path").join(__dirname, "..", "backend", ".env"),
});
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  console.log("Conectando a la base de datos...");
  console.log("Host:", process.env.DB_HOST || "No configurado");
  console.log("Database:", process.env.DB_NAME || "No configurado");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
  });

  try {
    const sqlPath = path.join(__dirname, "005_add_monto_to_reservaciones.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Ejecutando migración 005: Agregar columna monto...");
    await connection.query(sql);
    console.log("✓ Migración completada exitosamente!");

    // Verificar que la columna fue agregada
    console.log("\nVerificando estructura de RESERVACIONES...");
    const [columns] = await connection.query(`DESCRIBE RESERVACIONES`);
    console.log("Columnas en RESERVACIONES:");
    columns.forEach((col) => {
      console.log(
        `  ${col.Field}: ${col.Type}${col.Default !== null ? ` (default: ${col.Default})` : ""}`,
      );
    });
  } catch (error) {
    console.error("❌ Migración falló:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
