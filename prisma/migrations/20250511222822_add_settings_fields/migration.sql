-- AlterTable
ALTER TABLE `user` ADD COLUMN `deletionRequested` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `deletionRequestedAt` DATETIME(3) NULL,
    ADD COLUMN `notifications` JSON NULL;
