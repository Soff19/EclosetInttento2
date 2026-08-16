-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `fotoPerfil` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `Prenda` ADD COLUMN `nombre` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Outfit` ADD COLUMN `categoria` VARCHAR(191) NULL,
    ADD COLUMN `descripcion` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `OutfitPrenda_outfitId_prendaId_key` ON `OutfitPrenda`(`outfitId`, `prendaId`);
