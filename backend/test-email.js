/**
 * Script de prueba para enviar correo de confirmación
 * Uso: node test-email.js
 */

require("dotenv").config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("[Test] Enviando correo de prueba...");
  console.log("[Test] From:", process.env.FROM_EMAIL);

  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: "paooofb@gmail.com",
      subject: "Confirmación de Reservación - A La Reja",
      html: `
        <h1>¡Reservación Confirmada!</h1>
        <p>Tu reservación ha sido confirmada exitosamente.</p>
        <ul>
          <li><strong>Fecha:</strong> 2026-02-27</li>
          <li><strong>Horario:</strong> 10:00 - 11:00</li>
          <li><strong>Cancha:</strong> Pista 1</li>
          <li><strong>Total:</strong> $200.00</li>
        </ul>
      `,
    });

    console.log("[Test] ✓ Resultado:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("[Test] ✗ Error:", error.message);
  }
}

testEmail();
