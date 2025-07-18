-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "site_name" TEXT NOT NULL DEFAULT 'Kamero Stock Management',
    "logo_url" TEXT,
    "tin" TEXT NOT NULL DEFAULT 'N/A',
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "tax_rate" REAL DEFAULT 0.18,
    "low_stock_alert" INTEGER NOT NULL DEFAULT 10,
    "notify_admin" BOOLEAN DEFAULT true,
    "admin_access" BOOLEAN DEFAULT false,
    "enable_checkout" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("address", "admin_access", "contact_email", "contact_phone", "created_at", "currency", "enable_checkout", "id", "logo_url", "low_stock_alert", "maintenance_mode", "notify_admin", "site_name", "tax_rate", "updated_at") SELECT "address", "admin_access", "contact_email", "contact_phone", "created_at", "currency", "enable_checkout", "id", "logo_url", "low_stock_alert", "maintenance_mode", "notify_admin", "site_name", "tax_rate", "updated_at" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
