SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone_encrypted VARCHAR(255) NULL,
  public_phone VARCHAR(25) NULL,
  license_number VARCHAR(60) NULL,
  avatar_url VARCHAR(255) NULL,
  role ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS properties (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  objective ENUM('comprar', 'arrendar') NOT NULL,
  property_type ENUM('apartamento', 'moradia', 'terreno', 'loja', 'garagem') NOT NULL,
  status ENUM('novo', 'usado', 'em_construcao', 'para_recuperar') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  district VARCHAR(50) NOT NULL,
  county VARCHAR(50) NOT NULL,
  parish VARCHAR(50) NOT NULL,
  address_map VARCHAR(255) NOT NULL,
  rooms INT NOT NULL,
  bathrooms INT NOT NULL,
  useful_area DECIMAL(8,2) NOT NULL,
  gross_area DECIMAL(8,2) NOT NULL,
  privative_gross_area DECIMAL(8,2) NOT NULL,
  lot_area DECIMAL(10,2) NULL,
  build_year INT NULL,
  floor VARCHAR(20) NULL,
  elevator TINYINT(1) NOT NULL DEFAULT 0,
  parking_spaces INT NOT NULL DEFAULT 0,
  ev_charging TINYINT(1) NOT NULL DEFAULT 0,
  energy_cert ENUM('A', 'B', 'C', 'D', 'E', 'F', 'Isento') NOT NULL,
  views_count INT NOT NULL DEFAULT 0,
  owner_id INT UNSIGNED NULL,
  agent_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_properties_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_properties_agent
    FOREIGN KEY (agent_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_properties_objective (objective),
  INDEX idx_properties_type (property_type),
  INDEX idx_properties_status (status),
  INDEX idx_properties_price (price),
  INDEX idx_properties_location (district, county, parish),
  INDEX idx_properties_rooms (rooms),
  INDEX idx_properties_bathrooms (bathrooms),
  INDEX idx_properties_useful_area (useful_area),
  INDEX idx_properties_energy (energy_cert),
  INDEX idx_properties_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_main TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_property_images_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_property_images_property (property_id),
  INDEX idx_property_images_main (is_main)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_divisions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id INT UNSIGNED NOT NULL,
  name VARCHAR(50) NOT NULL,
  area DECIMAL(8,2) NULL,
  CONSTRAINT fk_property_divisions_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_property_divisions_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id INT UNSIGNED NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_email VARCHAR(100) NOT NULL,
  sender_id INT UNSIGNED NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sender_phone VARCHAR(20) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_messages_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_messages_property (property_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_created_at (created_at),
  INDEX idx_messages_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_password_reset_user (user_id),
  INDEX idx_password_reset_token_hash (token_hash),
  INDEX idx_password_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
