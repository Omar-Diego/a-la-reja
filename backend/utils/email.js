/**
 * Módulo de Utilidades de Correo Electrónico
 *
 * Maneja el envío de correos usando Resend API.
 * Incluye funciones para enviar confirmaciones de reservación.
 */

// Importar Resend
const { Resend } = require("resend");

// Inicializar cliente de Resend con API key desde variables de entorno
const resend = new Resend(process.env.RESEND_API_KEY);

// Email desde el cual se envían los correos
// Por defecto usa el dominio gratuito de Resend, puede cambiarse a dominio propio
const FROM_EMAIL = process.env.FROM_EMAIL || "onresend.dev";

/**
 * Envía correo de confirmación de reservación
 *
 * @param {string} email - Correo del usuario
 * @param {string} nombreUsuario - Nombre del usuario
 * @param {Object} reservacion - Datos de la reservación
 * @param {string} reservacion.fecha - Fecha de la reservación
 * @param {string} reservacion.hora_inicio - Hora de inicio
 * @param {string} reservacion.hora_fin - Hora de fin
 * @param {string} reservacion.cancha - Nombre de la cancha
 * @param {number} reservacion.monto - Monto de la reservación
 * @returns {Promise<Object>} Resultado del envío
 */
async function enviarConfirmacionReservacion(
  email,
  nombreUsuario,
  reservacion,
) {
  const { fecha, hora_inicio, hora_fin, cancha, monto } = reservacion;

  // Formatear monto como moneda
  const montoFormateado = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);

  // Generar HTML del correo
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Reservación</title>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0&icon_names=sports_baseball" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Roboto', Arial, sans-serif;">

      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">

        <!-- Header con logo -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #090f0f 100%); border-radius: 12px 12px 0 0; padding: 32px 30px 28px; text-align: center;">

          <!-- Logo -->
          <div style="margin-bottom: 24px;">
            <span style="font-family: 'Barlow Condensed', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 3px; text-transform: uppercase; vertical-align: middle;">A LA REJA</span>
          </div>

          <!-- Ícono de confirmación -->
          <div style="display: inline-block; background-color: #ccff00; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; text-align: center; font-size: 30px; font-weight: 900; color: #0f172a;">✓</div>
          <h2 style="font-family: 'Barlow Condensed', Arial, sans-serif; color: #ffffff; font-size: 26px; font-weight: 700; margin: 14px 0 0; letter-spacing: 2px; text-transform: uppercase;">
            Reservación Confirmada
          </h2>
        </div>

        <!-- Cuerpo -->
        <div style="background-color: #ffffff; padding: 32px 30px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

          <p style="font-family: 'Roboto', Arial, sans-serif; color: #1e293b; font-size: 16px; margin: 0 0 10px;">
            Hola <strong>${nombreUsuario}</strong>,
          </p>

          <p style="font-family: 'Roboto', Arial, sans-serif; color: #64748b; font-size: 15px; margin: 0 0 26px;">
            Tu reservación ha sido confirmada exitosamente. Aquí están los detalles:
          </p>

          <!-- Tabla de detalles -->
          <div style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 14px 18px; font-family: 'Roboto', Arial, sans-serif; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-weight: 500;">📅 Fecha</td>
                <td style="padding: 14px 18px; font-family: 'Roboto', Arial, sans-serif; color: #374151; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${fecha}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-family: 'Roboto', Arial, sans-serif; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-weight: 500;">⏰ Horario</td>
                <td style="padding: 14px 18px; font-family: 'Roboto', Arial, sans-serif; color: #374151; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${hora_inicio} - ${hora_fin}</td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; font-family: 'Roboto', Arial, sans-serif; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-weight: 500;">🏟️ Cancha</td>
                <td style="padding: 14px 18px; font-family: 'Roboto', Arial, sans-serif; color: #374151; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${cancha}</td>
              </tr>
              <tr style="background-color: #0f172a;">
                <td style="padding: 16px 18px; font-family: 'Barlow Condensed', Arial, sans-serif; color: #ccff00; font-size: 17px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Total</td>
                <td style="padding: 16px 18px; font-family: 'Barlow Condensed', Arial, sans-serif; color: #ccff00; text-align: right; font-weight: 700; font-size: 24px; letter-spacing: 1px;">${montoFormateado}</td>
              </tr>
            </table>
          </div>

          <p style="font-family: 'Roboto', Arial, sans-serif; color: #94a3b8; font-size: 13px; text-align: center; margin: 26px 0 0; line-height: 1.7;">
            Si necesitas cancelar o modificar tu reservación, por favor contáctanos con al menos 24 horas de anticipación.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #0f172a; border-radius: 0 0 12px 12px; padding: 22px 30px; text-align: center;">
          <p style="font-family: 'Barlow Condensed', Arial, sans-serif; color: #ccff00; font-size: 16px; font-weight: 700; margin: 0 0 6px; letter-spacing: 2px; text-transform: uppercase;">A LA REJA</p>
          <p style="font-family: 'Roboto', Arial, sans-serif; color: #475569; font-size: 12px; margin: 0;">
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    console.log(
      `[Email] Intentando enviar a ${email} con API key: ${process.env.RESEND_API_KEY ? "configurada" : "NO CONFIGURADA"}`,
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Confirmación de tu Reservación - A La Reja",
      html: html,
    });

    console.log(`[Email] ✓ Correo enviado exitosamente a ${email}:`, result);
    return { success: true, data: result };
  } catch (error) {
    console.error(
      `[Email] ✗ Error al enviar correo a ${email}:`,
      error.message,
    );
    console.error(`[Email] Error completo:`, error);
    // No lanzamos el error para no afectar la creación de la reservación
    // El correo es secundário - la reservación ya está creada
    return { success: false, error: error.message };
  }
}

module.exports = {
  enviarConfirmacionReservacion,
};
