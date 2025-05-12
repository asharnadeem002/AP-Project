-- AlterTable
ALTER TABLE `subscription` ADD COLUMN `rejectionReason` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `deactivationReason` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `reactivationRequested` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reactivationRequestedAt` DATETIME(3) NULL;
