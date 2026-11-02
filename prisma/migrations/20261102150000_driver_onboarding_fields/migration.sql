-- Driver 6-step onboarding wizard fields (all nullable, non-destructive)
ALTER TABLE `driver_profiles`
  ADD COLUMN `city` VARCHAR(100) NULL,
  ADD COLUMN `date_of_birth` VARCHAR(20) NULL,
  ADD COLUMN `contact_no_2` VARCHAR(20) NULL,
  ADD COLUMN `vehicle_number` VARCHAR(50) NULL,
  ADD COLUMN `vehicle_images` JSON NULL,
  ADD COLUMN `selfie_url` VARCHAR(500) NULL;

