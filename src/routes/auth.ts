import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { IOTP } from "../models/OTP";
import { OTP } from "../models/OTP";
import nodemailer from "nodemailer";
import { dbConnect } from "../../lib/dbConnect";

const router = Router();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

// 📧 Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aaisali228@gmail.com",
    pass: "conq9821",
  },
});

// ✅ SEND OTP Route
router.post("/send-otp", async (req, res): Promise<any> => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await dbConnect();

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Remove existing OTP if any
    await OTP.deleteMany({ email });

    // Save OTP in DB with 10 min expiration
    const newOTP = new OTP({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await newOTP.save();

    // Send OTP via Email
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ✅ VERIFY OTP Route
router.post("/verify-otp", async (req, res): Promise<any> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    await dbConnect();

    // Find OTP in DB
    const storedOTP: IOTP | null = await OTP.findOne({ email, otp });

    if (!storedOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (storedOTP.expiresAt < new Date()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP is valid; remove it from DB
    await OTP.deleteOne({ email });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// ✅ SIGN-UP Route
router.post("/sign-up", async (req, res): Promise<any> => {
  console.log(req.body);
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email is already in use, try with a different email",
      });
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

// ✅ SIGN-IN Route
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

    // Set Cookie with Token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("Cookie set");

    const { password: pass, ...userWithoutPassword } = user.toObject();

    res.json({
      message: "Login successful",
      user: { ...userWithoutPassword, token },
    });
  } catch (error: any) {
    console.error("Sign-In Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ LOGOUT Route
router.post("/logout", async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "none" });
  res.json({ message: "Logged out successfully" });
});

export default router;
