CREATE TABLE `ResenaVendedor` (
  `id` VARCHAR(191) NOT NULL,
  `compraId` VARCHAR(191) NOT NULL,
  `compradorId` VARCHAR(191) NOT NULL,
  `vendedorId` VARCHAR(191) NOT NULL,
  `puntuacion` INTEGER NOT NULL,
  `comentario` TEXT NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ResenaVendedor_compraId_key`(`compraId`),
  INDEX `ResenaVendedor_vendedorId_creadoEn_idx`(`vendedorId`, `creadoEn`),
  INDEX `ResenaVendedor_compradorId_idx`(`compradorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ResenaVendedor`
  ADD CONSTRAINT `ResenaVendedor_compraId_fkey` FOREIGN KEY (`compraId`) REFERENCES `Compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ResenaVendedor_compradorId_fkey` FOREIGN KEY (`compradorId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ResenaVendedor_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
