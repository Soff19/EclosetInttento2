ALTER TABLE `Producto`
  ADD COLUMN `imagen` VARCHAR(500) NULL,
  ADD COLUMN `etiquetas` TEXT NULL,
  ADD COLUMN `contacto` VARCHAR(500) NULL;

CREATE TABLE `FavoritoProducto` (
  `id` VARCHAR(191) NOT NULL,
  `usuarioId` VARCHAR(191) NOT NULL,
  `productoId` VARCHAR(191) NOT NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `FavoritoProducto_usuarioId_productoId_key`(`usuarioId`, `productoId`),
  INDEX `FavoritoProducto_productoId_idx`(`productoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Compra` (
  `id` VARCHAR(191) NOT NULL,
  `compradorId` VARCHAR(191) NOT NULL,
  `productoId` VARCHAR(191) NOT NULL,
  `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Compra_compradorId_productoId_key`(`compradorId`, `productoId`),
  INDEX `Compra_productoId_idx`(`productoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ResenaProducto` (
  `id` VARCHAR(191) NOT NULL,
  `puntuacion` INTEGER NOT NULL,
  `comentario` TEXT NULL,
  `usuarioId` VARCHAR(191) NOT NULL,
  `productoId` VARCHAR(191) NOT NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ResenaProducto_usuarioId_productoId_key`(`usuarioId`, `productoId`),
  INDEX `ResenaProducto_productoId_idx`(`productoId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FavoritoProducto`
  ADD CONSTRAINT `FavoritoProducto_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FavoritoProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Compra`
  ADD CONSTRAINT `Compra_compradorId_fkey` FOREIGN KEY (`compradorId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Compra_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ResenaProducto`
  ADD CONSTRAINT `ResenaProducto_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ResenaProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;