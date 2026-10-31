CREATE TABLE `Notificacion` (
  `id` VARCHAR(191) NOT NULL,
  `destinatarioId` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NULL,
  `productoId` VARCHAR(191) NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `mensaje` VARCHAR(255) NOT NULL,
  `leidaEn` DATETIME(3) NULL,
  `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Notificacion_destinatarioId_creadoEn_idx`(`destinatarioId`, `creadoEn`),
  INDEX `Notificacion_productoId_idx`(`productoId`),
  UNIQUE INDEX `Notificacion_destinatarioId_actorId_productoId_tipo_key`(`destinatarioId`, `actorId`, `productoId`, `tipo`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Notificacion`
  ADD CONSTRAINT `Notificacion_destinatarioId_fkey` FOREIGN KEY (`destinatarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Notificacion_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Notificacion_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;