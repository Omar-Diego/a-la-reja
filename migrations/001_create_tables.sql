-- Migration: 001_create_tables.sql
-- Database: a_la_reja
-- Description: Create initial tables for padel court reservation system

-- Create USUARIOS table
CREATE TABLE IF NOT EXISTS USUARIOS (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create CANCHAS table
CREATE TABLE IF NOT EXISTS CANCHAS (
    idCancha INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    precio_por_hora DECIMAL(10,2) NOT NULL
);

-- Create RESERVACIONES table
CREATE TABLE IF NOT EXISTS RESERVACIONES (
    idReservacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    USUARIOS_idUsuario INT,
    CANCHAS_idCancha INT,
    FOREIGN KEY (USUARIOS_idUsuario) REFERENCES USUARIOS(idUsuario),
    FOREIGN KEY (CANCHAS_idCancha) REFERENCES CANCHAS(idCancha)
);
