require("dotenv").config();
const mysql = require("mysql2/promise");

async function updateOldReservations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
  });

  try {
    console.log("Actualizando reservaciones antiguas con monto = 0...\n");

    // Primero, ver cuántas reservaciones tienen monto = 0
    const [count] = await connection.query(
      "SELECT COUNT(*) as total FROM RESERVACIONES WHERE monto = 0",
    );

    console.log(`Encontradas ${count[0].total} reservaciones con monto = 0\n`);

    if (count[0].total === 0) {
      console.log("✓ Todas las reservaciones ya tienen monto calculado.");
      return;
    }

    // Actualizar el monto basado en precio_por_hora y duración
    const updateSql = `
            UPDATE RESERVACIONES r
            JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
            SET r.monto = c.precio_por_hora * (
                TIMESTAMPDIFF(MINUTE, r.hora_inicio, r.hora_fin) / 60
            )
            WHERE r.monto = 0
        `;

    const [result] = await connection.query(updateSql);

    console.log(`✓ Actualizadas ${result.affectedRows} reservaciones`);

    // Mostrar algunas de las reservaciones actualizadas
    const [updated] = await connection.query(`
            SELECT 
                r.idReservacion,
                DATE_FORMAT(r.fecha, '%Y-%m-%d') as fecha,
                r.hora_inicio,
                r.hora_fin,
                c.nombre as cancha,
                c.precio_por_hora,
                r.monto as monto_actualizado,
                TIMESTAMPDIFF(MINUTE, r.hora_inicio, r.hora_fin) / 60 as horas
            FROM RESERVACIONES r
            JOIN CANCHAS c ON r.CANCHAS_idCancha = c.idCancha
            ORDER BY r.idReservacion DESC
            LIMIT 10
        `);

    console.log("\nÚltimas 10 reservaciones actualizadas:");
    console.table(
      updated.map((r) => ({
        ID: r.idReservacion,
        Fecha: r.fecha,
        Cancha: r.cancha,
        Horas: r.horas,
        "Precio/h": `$${r.precio_por_hora}`,
        "Monto Total": `$${r.monto_actualizado}`,
      })),
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateOldReservations();
