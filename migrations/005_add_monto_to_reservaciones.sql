-- Migration: 005_add_monto_to_reservaciones.sql
-- Description: Add monto column to RESERVACIONES table to store the total cost

ALTER TABLE RESERVACIONES 
ADD COLUMN monto DECIMAL(10,2) NOT NULL DEFAULT 0.00;
