#!/usr/bin/env node

/**
 * Script para verificar la comunicación con el backend
 * Uso: node test-backend.js
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://82-180-163-31.sslip.io";

async function testBackend() {
  console.log("\n🔍 Probando conexión con backend...");
  console.log("URL:", API_URL);
  console.log("");

  // Test 1: Health check
  console.log("1️⃣  Test: Health check");
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      console.log("   ✅ Backend está funcionando");
    } else {
      console.log("   ❌ Backend responde pero con error:", response.status);
    }
  } catch (error) {
    console.log("   ❌ No se puede conectar al backend:", error.message);
    console.log("   💡 Verifica que el backend esté corriendo");
    console.log("   💡 Verifica que NEXT_PUBLIC_API_URL esté correcto");
    return;
  }

  // Test 2: Canchas (endpoint público)
  console.log("\n2️⃣  Test: Obtener canchas (público)");
  try {
    const response = await fetch(`${API_URL}/api/canchas`);
    const data = await response.json();
    console.log("   ✅ Canchas obtenidas:", data.length || "N/A");
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 3: Login normal
  console.log("\n3️⃣  Test: Login con usuario normal (si existe)");
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@test.com",
        password: "test123",
      }),
    });
    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ Login exitoso, token recibido");

      // Test 4: Usar el token para obtener reservaciones
      console.log("\n4️⃣  Test: Obtener reservaciones con token de usuario");
      const resRes = await fetch(`${API_URL}/api/reservaciones`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      if (resRes.ok) {
        const reservaciones = await resRes.json();
        console.log(
          "   ✅ Reservaciones obtenidas:",
          reservaciones.length || "N/A",
        );
      } else {
        console.log("   ❌ Error al obtener reservaciones:", resRes.status);
      }
    } else {
      console.log("   ⚠️  Usuario test no existe (esto es normal)");
    }
  } catch (error) {
    console.log("   ❌ Error:", error.message);
  }

  // Test 5: Verificar JWT_SECRET
  console.log("\n5️⃣  Test: Verificar JWT_SECRET");
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.log("   ❌ JWT_SECRET no está configurado");
  } else {
    console.log("   ✅ JWT_SECRET configurado");
    console.log("   📝 Longitud:", JWT_SECRET.length, "caracteres");
    console.log("   📝 Preview:", JWT_SECRET.substring(0, 10) + "...");
    console.log("\n   ⚠️  IMPORTANTE:");
    console.log("   Este JWT_SECRET debe ser EXACTAMENTE el mismo");
    console.log("   que el configurado en el backend.");
    console.log("   Si son diferentes, los tokens no funcionarán.");
  }

  console.log("\n✅ Tests completados\n");
}

testBackend().catch(console.error);
