# Guía Simple para Pagos en Tu App 🏟️

> **Para quién es esto**: Esta guía es para alguien que está aprendiendo a programar. Voy a explicar todo desde cero, muy despacio, sin palabras difíciles.

---

## 1. Qué es pagar por internet (en español sencillo)

### El problema
Cuando alguien quiere rentar tu cancha, necesita pagarte. En la vida real le das dinero en efectivo. Pero en internet no puedes hacer eso directamente.

### La solución
Necesitas una "empresa de pagos" que se encargue de:
- Cobrar a la persona
- Verificar que la tarjeta es válida
- Decirte a ti "ya pagaron, está listo"

Esa empresa es como un amigo de confianza que maneja el dinero por ti.

---

## 2. Las empresas de pagos más fáciles

### MercadoPago (Recomendado para México/Latinoamérica)
- Es de MercadoLibre, muy conocido aquí
- Funciona bien en México
- Tiene español

### Stripe (Para internacional)
- Es el más popular del mundo
- La documentación está en inglés
- Funciona en casi todos los países

---

## 3. Entuende el flujo (la parte importante)

Imagina que vas a un restaurante:

```
1. Cliente pide comida (elige su reservación)
2. Mesero va a la cocina (tu app envía datos)
3. Cocina prepara la comida (el pago se procesa)
4. Mesero trae la cuenta (el usuario ve el precio)
5. Cliente paga (ingresa datos de tarjeta)
6. Mesero dice "sí pagó" (tu app recibe confirmación)
7. Sirven la comida (se crea la reservación)
```

**Básicamente**: Tu app pregunta "¿cuánto cuesta?", el proveedor de pagos dice "paga aquí", el cliente paga, y el proveedor te dice "ya pagaron".

---

## 4. Qué necesitas hacer en tu proyecto

### Paso 1: Date de alta
- Ve a mercadopago.com.mx o stripe.com
- Crea una cuenta de desarrollador (es gratis)
- Obtén tus "claves" (son como contraseñas)

### Paso 2: Instala algo en tu backend
En tu carpeta `backend`, escribe esto en la terminal:

```bash
cd backend
npm install stripe
```
(O `npm install mercadopago` si usas MercadoPago)

### Paso 3: Crea una ruta para cobrar
En tu archivo `backend/routes/pagos.js` (tienes que crearlo):

```javascript
const express = require('express');
const router = express.Router();
const stripe = require('stripe')('TU_CLAVE_SECRETA_AQUI');

// Esta ruta sirve para que el frontend pida "quiero cobrar"
router.post('/cobrar', async (req, res) => {
    // El frontend te dice cuánto y qué se está vendiendo
    const { precio, concepto } = req.body;
    
    // Le preguntas a Stripe: "crea una forma de pagar"
    const sesion = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'mxn',  // pesos mexicanos
                product_data: {
                    name: concepto,  // qué se está comprando
                },
                unit_amount: precio * 100,  // el precio (en centavos)
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:3000/reservar/ok',  // si paga, va aquí
        cancel_url: 'http://localhost:3000/reservar/error',  // si cancela, va aquí
    });
    
    // Le das al frontend la "liga" para pagar
    res.json({ url: sesion.url });
});

module.exports = router;
```

### Paso 4: Conecta la ruta en tu servidor
En `backend/index.js`, agrega:

```javascript
const pagosRoutes = require('./routes/pagos');
app.use('/api', pagosRoutes);
```

### Paso 5: Llama eso desde tu frontend
En tu página de React, cuando el usuario presione "Pagar":

```javascript
// Cuando el usuario hace clic en "Pagar"
async function pagar() {
    // Le dices al backend "quiero cobrar 200 pesos por una cancha"
    const respuesta = await fetch('http://localhost:4000/api/cobrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            precio: 200,
            concepto: 'Renta de cancha 1 hora'
        })
    });
    
    const datos = await respuesta.json();
    
    // Esto lleva al usuario a la página de Stripe/MercadoPago
    window.location.href = datos.url;
}
```

---

## 5. Resumen en 3 puntos

1. **El usuario dice "quiero pagar"** → Tu frontend le pregunta al backend
2. **El backend crea un "link de pago"** → Lo obtiene del proveedor (Stripe/MercadoPago)
3. **El usuario va a pagar** → Cuando termina, el proveedor lo trae de vuelta a tu app

---

## 6. Cosas importantes que debes saber

### Las tarjetas de prueba
Antes de запустить en serio, necesitas probar. Todos los proveedores dan tarjetas falsas:
- Stripe: Usa `4242 4242 4242 4242` con cualquier fecha futura y cualquier CVV

### El dinero no entra inmediatamente
Tarda uno o dos días hábiles en llegar a tu cuenta bancaria.

### Siempre verifica
Nunca confíes solo en que el usuario te diga "ya pagué". Siempre pregunta al proveedor "¿realmente pagó?".

---

## 7. Ejemplo super simple

Aquí tienes un ejemplo completo que puedes copiar y pegar:

### backend/routes/pagos.js
```javascript
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/crear-pago', async (req, res) => {
    const { monto, descripcion } = req.body;
    
    const sesion = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'mxn',
                product_data: { name: descripcion },
                unit_amount: monto * 100,
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: 'http://localhost:3000/exito',
        cancel_url: 'http://localhost:3000/error',
    });
    
    res.json({ url: sesion.url });
});

module.exports = router;
```

### En tu componente React
```jsx
<button onClick={async () => {
    const res = await fetch('http://localhost:4000/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: 200, descripcion: 'Cancha 1 hora' })
    });
    const data = await res.json();
    window.location.href = data.url;
}}>
    Pagar $200
</button>
```

---

## Siguiente paso

Si esto te parece muy difícil, puedo ayudarte a:
1. Instalar las dependencias en tu proyecto
2. Crear los archivos necesarios
3. Probar que funcione

¿Te gustaría que te ayude con alguno de estos pasos?
