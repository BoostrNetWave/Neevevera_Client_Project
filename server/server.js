import "dotenv/config";
import mongoose from "mongoose";
import app from "./src/app.js";
import { startOrphanCleanupJob } from "./src/jobs/orphanCleanup.js";

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

async function startServer() {
  try {
    console.log("MONGO_URI loaded:", Boolean(process.env.MONGO_URI));

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Atlas connected");
    
    // Start background jobs
    startOrphanCleanupJob();

    app.listen(PORT, () => {
      console.log(`✅ Neevevera Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error);
    process.exit(1);
  }
}

startServer();