CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personnel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role ENUM('WL','AA','AAR') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_personnel_name_role (name, role)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ptw_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ptw_number VARCHAR(50) NOT NULL UNIQUE,
  site_tag ENUM('KWN','KAB','MSI','RSMT') NULL,
  jha_number VARCHAR(30) NOT NULL,
  location VARCHAR(150) NOT NULL,
  specific_location VARCHAR(180) NULL,
  permit_applicant_name VARCHAR(120) NOT NULL,
  permit_type ENUM('Cold','Hot') NOT NULL,
  work_description TEXT NOT NULL,
  work_leader VARCHAR(120) NOT NULL,
  authorised_authority VARCHAR(120) NOT NULL,
  authorised_authority_rep VARCHAR(120) NULL,
  hse_officer_assessor VARCHAR(120) NULL,
  date_issued DATE NOT NULL,
  date_closed DATE NULL,
  status ENUM('Open','Closed','Suspended','Returned','Extended') NOT NULL,
  remark TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_location (location),
  KEY idx_date_issued (date_issued),
  KEY idx_permit_type (permit_type),
  FULLTEXT KEY ft_work_description (work_description)
);

CREATE TABLE IF NOT EXISTS ptw_batch_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_reference VARCHAR(40) NOT NULL UNIQUE,
  record_count INT NOT NULL,
  record_ids JSON NOT NULL,
  action VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  notes TEXT NULL,
  submitted_by VARCHAR(80) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_batch_submitted_at (submitted_at)
);
