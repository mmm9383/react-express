import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { quizSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Quiz routes
  app.post("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const quizData = quizSchema.parse({
        ...req.body,
        userId: req.user.id,
        randomizeQuestions: !!req.body.randomizeQuestions // Ensure randomizeQuestions is a boolean
      });
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (err) {
      res.status(400).json({ error: "Invalid quiz data" });
    }
  });

  app.get("/api/quizzes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quizzes = await storage.getUserQuizzes(req.user.id);
    // Ensure uniqueness by ID to prevent duplicates
    const uniqueQuizzes = Array.from(new Map(quizzes.map(quiz => [quiz.id, quiz])).values());
    console.log(`[debug] GET /api/quizzes returning ${uniqueQuizzes.length} quizzes for user ${req.user.id}`);
    res.json(uniqueQuizzes);
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    const quiz = await storage.getQuiz(parseInt(req.params.id));
    if (!quiz) return res.sendStatus(404);
    res.json(quiz);
  });

  app.put("/api/quizzes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const quizId = parseInt(req.params.id);
    const existingQuiz = await storage.getQuiz(quizId);

    if (!existingQuiz) return res.sendStatus(404);
    if (existingQuiz.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(403);
    }

    try {
      const quizData = quizSchema.parse({
        ...req.body,
        userId: req.user.id,
        id: quizId,
        randomizeQuestions: !!req.body.randomizeQuestions // Ensure randomizeQuestions is a boolean
      });

      const updatedQuiz = await storage.updateQuiz(quizId, quizData);
      res.json(updatedQuiz);
    } catch (err) {
      res.status(400).json({ error: "Invalid quiz data" });
    }
  });

  app.delete("/api/quizzes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quiz = await storage.getQuiz(parseInt(req.params.id));
    if (!quiz) return res.sendStatus(404);
    if (quiz.userId !== req.user.id && !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    await storage.deleteQuiz(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.sendStatus(403);
    }
    await storage.deleteUser(parseInt(req.params.id));
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}