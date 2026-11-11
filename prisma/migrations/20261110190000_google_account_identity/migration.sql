ALTER TABLE `Usuario`
  ADD COLUMN `googleId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Usuario_googleId_key` ON `Usuario`(`googleId`);
