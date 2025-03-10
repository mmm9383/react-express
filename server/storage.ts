import { User, InsertUser, Quiz, InsertQuiz } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getUserQuizzes(userId: number): Promise<Quiz[]>;
  deleteQuiz(id: number): Promise<void>;
  cleanupOldQuizzes(): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private currentUserId: number;
  private currentQuizId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.currentUserId = 1;
    this.currentQuizId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create default admin user
    this.createUser({
      username: "_BoSs1@",
      password: "adminpass", // This will be hashed
    });

    // Start cleanup interval
    setInterval(() => this.cleanupOldQuizzes(), 24 * 60 * 60 * 1000); // Daily check
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isAdmin: insertUser.username.endsWith("_BoSs1@"),
      lastLogin: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
    // Delete associated quizzes
    for (const [quizId, quiz] of this.quizzes.entries()) {
      if (quiz.userId === id) {
        this.quizzes.delete(quizId);
      }
    }
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentQuizId++;
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      quiz.lastAccessed = new Date();
      this.quizzes.set(id, quiz);
    }
    return quiz;
  }

  async getUserQuizzes(userId: number): Promise<Quiz[]> {
    return Array.from(this.quizzes.values())
      .filter((quiz) => quiz.userId === userId)
      .map(quiz => {
        quiz.lastAccessed = new Date();
        return quiz;
      });
  }

  async updateQuiz(id: number, quizData: Quiz): Promise<Quiz> {
    if (!this.quizzes.has(id)) {
      throw new Error(`Quiz with id ${id} not found`);
    }
    
    // Ensure we're keeping the original ID and updating lastAccessed
    const updatedQuiz = {
      ...quizData,
      id: id, // Ensure ID stays the same
      lastAccessed: new Date()
    };
    
    this.quizzes.set(id, updatedQuiz);
    console.log(`Quiz ${id} updated successfully:`, updatedQuiz);
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    this.quizzes.delete(id);
  }

  async cleanupOldQuizzes(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const [id, quiz] of this.quizzes.entries()) {
      if (quiz.lastAccessed && quiz.lastAccessed < thirtyDaysAgo) {
        this.quizzes.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();