-- Migration: 004_allow_null_usuario_in_reservaciones.sql
-- Description: Permitir que las reservaciones puedan existir sin usuario
--              Esto preserva el historial de ingresos cuando se elimina un usuario

-- Modificar la columna USUARIOS_idUsuario para permitir NULL
ALTER TABLE RESERVACIONES 
MODIFY COLUMN USUARIOS_idUsuario INT NULL;

-- Nota: Las reservaciones existentes mantienen su relación con usuarios
-- Solo las reservaciones de usuarios eliminados tendrán NULL en USUARIOS_idUsuario
