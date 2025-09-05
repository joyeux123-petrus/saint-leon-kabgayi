ALTER TABLE `notes`
  DROP FOREIGN KEY `notes_ibfk_1`;

ALTER TABLE `notes`
  DROP COLUMN `subject_id`,
  ADD COLUMN `subject_name` VARCHAR(255) NOT NULL AFTER `description`;