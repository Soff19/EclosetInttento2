-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `perfilCompletado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `preferencias` JSON NULL;
