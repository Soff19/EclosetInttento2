ALTER TABLE `Usuario`
  ADD COLUMN `rol` VARCHAR(191) NOT NULL DEFAULT 'USUARIA',
  ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'ACTIVA';

UPDATE `Usuario`
SET `rol` = 'ADMIN'
WHERE LOWER(`email`) LIKE '%@ecloset.com';

ALTER TABLE `Prenda`
  ADD COLUMN `fechaCreacion` DATETIME(3) NULL,
  ADD INDEX `Prenda_fechaCreacion_idx`(`fechaCreacion`);

ALTER TABLE `Outfit`
  ADD COLUMN `fechaCreacion` DATETIME(3) NULL,
  ADD INDEX `Outfit_fechaCreacion_idx`(`fechaCreacion`);

ALTER TABLE `Producto`
  ADD COLUMN `motivoEliminacion` VARCHAR(191) NULL,
  ADD COLUMN `explicacionEliminacion` TEXT NULL,
  ADD COLUMN `fechaEliminacion` DATETIME(3) NULL,
  ADD INDEX `Producto_fechaInicio_idx`(`fechaInicio`),
  ADD INDEX `Producto_fechaEliminacion_idx`(`fechaEliminacion`);

ALTER TABLE `Compra`
  ADD COLUMN `fechaConcretada` DATETIME(3) NULL,
  ADD INDEX `Compra_fechaConcretada_idx`(`fechaConcretada`);
