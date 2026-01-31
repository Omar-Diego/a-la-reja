-- Migration: 003_add_telefono.sql
-- Description: Add telefono field to USUARIOS table for profile editing

-- MySQL doesn't support IF NOT EXISTS for ADD COLUMN
-- Using a procedure to safely add the column
DELIMITER //
CREATE PROCEDURE add_telefono_if_not_exists()
BEGIN
    DECLARE column_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'USUARIOS'
    AND COLUMN_NAME = 'telefono';

    IF column_exists = 0 THEN
        ALTER TABLE USUARIOS ADD COLUMN telefono VARCHAR(20) DEFAULT NULL;
    END IF;
END //
DELIMITER ;

CALL add_telefono_if_not_exists();
DROP PROCEDURE IF EXISTS add_telefono_if_not_exists;
