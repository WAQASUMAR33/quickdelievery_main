-- AlterTable (optional product row for curated catalog deals vs custom bundles)
ALTER TABLE `food_deals` MODIFY `product_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `food_deals` ADD COLUMN `vendor_uid` VARCHAR(128) NULL;
ALTER TABLE `food_deals` ADD COLUMN `custom_title` VARCHAR(255) NULL;
ALTER TABLE `food_deals` ADD COLUMN `custom_items_json` TEXT NULL;
ALTER TABLE `food_deals` ADD COLUMN `custom_image_url` VARCHAR(500) NULL;
ALTER TABLE `food_deals` ADD COLUMN `custom_price_label` VARCHAR(64) NULL;

-- Mirror product vendor onto deal row for filtering / FK ownership hints
UPDATE `food_deals` fd
INNER JOIN `products` p ON fd.`product_id` = p.`pro_id`
SET fd.`vendor_uid` = p.`vendor_id`
WHERE fd.`product_id` IS NOT NULL;

CREATE INDEX `food_deals_vendor_uid_idx` ON `food_deals`(`vendor_uid`);

-- AddForeignKey
ALTER TABLE `food_deals` ADD CONSTRAINT `food_deals_vendor_uid_fkey` FOREIGN KEY (`vendor_uid`) REFERENCES `users`(`uid`) ON DELETE SET NULL ON UPDATE CASCADE;
