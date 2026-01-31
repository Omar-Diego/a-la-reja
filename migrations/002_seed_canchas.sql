-- Migration: 002_seed_canchas.sql
-- Database: a_la_reja
-- Description: Insert initial padel courts data

-- Insert the three courts with specific IDs to match frontend
INSERT INTO CANCHAS (idCancha, nombre, ubicacion, precio_por_hora) VALUES
(1, 'Pista 1', 'Cancha central con iluminacion LED profesional', 25.00),
(2, 'Pista 2', 'Cancha exterior con cesped artificial premium', 20.00),
(3, 'Pista Central', 'Nuestra cancha estrella para torneos y eventos', 30.00)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    ubicacion = VALUES(ubicacion),
    precio_por_hora = VALUES(precio_por_hora);
