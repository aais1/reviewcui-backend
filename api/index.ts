import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import dataRouter from "./routes/data";
import { dbConnect } from "../lib/dbConnect";
import { Faculty } from "./models/Faculty";
import { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();

// ✅ Configure CORS properly
app.use(
  cors({
    origin: "https://reviewcui-frontend.vercel.app",
    credentials: true, // ✅ Allow cookies and authentication headers
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Enable cookies in Express

// ✅ Ensure database connection before handling requests
dbConnect().then(() => {
  console.log("✅ Database Connected");
});

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/data", dataRouter);

app.get("/api", (req, res) => {
  res.send("🚀 Express Server is Running on Vercel!");
});

// ✅ Export app as a serverless function for Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
