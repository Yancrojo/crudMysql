-- Crea la base y tabla si no existen
CREATE DATABASE IF NOT EXISTS empleados;
USE empleados;

CREATE TABLE IF NOT EXISTS empleados (
  id_empleados INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE
);

-- Datos de prueba
INSERT INTO empleados (name, lastname, email) VALUES 
('Pedro', 'Caro', 'pedro@example.com'),
('Ana', 'López', 'ana@example.com')
ON DUPLICATE KEY UPDATE email=VALUES(email);
