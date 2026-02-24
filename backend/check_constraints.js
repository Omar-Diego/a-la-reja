require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkConstraints() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
  });

  try {
    console.log("Verificando constraints de RESERVACIONES...\n");

    const [constraints] = await connection.query(
      `
            SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'RESERVACIONES'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `,
      [process.env.DB_NAME],
    );

    console.log("Constraints actuales:");
    console.table(constraints);

    // Ver también la definición completa
    const [createTable] = await connection.query(
      "SHOW CREATE TABLE RESERVACIONES",
    );
    console.log("\nDefinición completa de la tabla:");
    console.log(createTable[0]["Create Table"]);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await connection.end();
  }
}

checkConstraints();
