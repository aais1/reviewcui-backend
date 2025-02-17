import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const router = Router();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

// ✅ SIGN-UP Route
router.post("/sign-up", async (req, res): Promise<any> => {
  console.log(req.body);
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    console.error("Sign-Up Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ SIGN-IN Route (Stores JWT in Cookies)
router.post("/sign-in", async (req, res): Promise<any> => {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "7d",
    });

    // Set Cookie with Token (HTTP-only for security)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    console.log("cookie set");

    const { password: pass, ...userWithoutPassword } = user.toObject();

    res.json({ message: "Login successful", user: userWithoutPassword });
  } catch (error: any) {
    console.error("Sign-In Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ LOGOUT Route (Clears the Cookie)
router.post("/logout", async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.json({ message: "Logged out successfully" });
});

export default router;
