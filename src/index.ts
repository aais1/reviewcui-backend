import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import dataRouter from "./routes/data";
import { dbConnect } from "../lib/dbConnect";

const app = express();
const PORT = 3000;

// ✅ Configure CORS properly
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ Set frontend origin explicitly
    credentials: true, // ✅ Allow cookies and authentication headers
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Enable cookies in Express

// Routes
app.use("/auth", authRouter);
app.use("/data", dataRouter);

app.get("/", (req, res) => {
  res.send("🚀 Express Server is Running!");
});

// Start Server
app.listen(PORT, () => {
  dbConnect();
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
