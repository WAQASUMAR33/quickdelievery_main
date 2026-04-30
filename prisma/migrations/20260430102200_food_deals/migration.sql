-- CreateTable
CREATE TABLE `food_deals` (
    `deal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `badge_label` VARCHAR(64) NULL,
    `start_at` DATETIME(3) NULL,
    `end_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `food_deals_product_id_key`(`product_id`),
    INDEX `food_deals_active_sort_order_idx`(`active`, `sort_order`),
    PRIMARY KEY (`deal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `food_deals` ADD CONSTRAINT `food_deals_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`pro_id`) ON DELETE CASCADE ON UPDATE CASCADE;
