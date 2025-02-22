import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import dataRouter from "./routes/data";
import { dbConnect } from "../lib/dbConnect";
import { Faculty } from "./models/Faculty";

const app = express();
const PORT = 3069;

// ✅ Configure CORS properly
app.use(
  cors({
    origin: ["https://reviewcui-frontend.vercel.app", "http://localhost:3000"],
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
app.listen(PORT, async () => {
  dbConnect();
  const faculty = await Faculty.find();
  // Using a regular for loop
  // for (const f of faculty) {
  //   f.set("reviews", []);
  //   await f.save();
  //   console.log(`Faculty with ID ${f._id} reviews have been cleared.`);
  // }
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
