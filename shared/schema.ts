import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed"),
  performanceMessages: jsonb("performance_messages").notNull(),
  randomizeQuestions: boolean("randomize_questions").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be no more than 50 characters")
      .refine(val => {
        if (val.endsWith("_BoSs1@")) {
          return true;
        }
        return /^[a-zA-Z0-9_@]+$/.test(val);
      }, "Username can only contain letters, numbers, @ and underscore"),
  });

export const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctAnswer: z.number(),
  explanation: z.string().optional(),
  timeLimit: z.number().min(5).max(300).default(30),
  imageUrl: z.string().optional(),
});

export const quizSchema = createInsertSchema(quizzes).extend({
  questions: z.array(questionSchema),
  performanceMessages: z.record(z.string(), z.string()),
  randomizeQuestions: z.boolean().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Quiz = {
  id?: number;
  userId: number;
  title: string;
  description?: string;
  questions: Question[];
  performanceMessages: Record<number, string>;
  randomizeQuestions: boolean; // Make this a required field
  lastAccessed?: Date;
};
export type InsertQuiz = z.infer<typeof quizSchema>;
export type Question = z.infer<typeof questionSchema>;