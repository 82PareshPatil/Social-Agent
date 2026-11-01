import { check, integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Mirrors the tables already applied on the InsForge database.
// `users.id` and `campaigns.user_id` reference InsForge-managed auth.users(id)
// (ON DELETE CASCADE); that foreign key lives in the database, not here.
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  iconUrl: text("icon_url"),
  iconKey: text("icon_key"),
  officeImage: text("office_image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("campaigns_name_check", sql`length(trim(${t.name})) between 1 and 80`),
  check("campaigns_office_image_check", sql`${t.officeImage} in ('/offices/modern-office.png','/offices/wooden-office.png')`),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
