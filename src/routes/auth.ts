import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { OTP } from "../models/OTP";
import nodemailer from "nodemailer";
import { dbConnect } from "../../lib/dbConnect";

const router = Router();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

// 📧 Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "aaisali228@gmail.com",
    pass: "wefh ktps rukq nszv",
  },
});

// ✅ SEND OTP Route (Store User Temp & Send OTP)
router.post("/send-otp", async (req, res): Promise<any> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(300).json({ message: "Email is already registered." });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Remove existing OTP if any
    await OTP.deleteMany({ email });

    // Hash the password (temp storage)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save OTP and user info (temp)
    const newOTP = new OTP({
      email,
      otp,
      tempUser: { name, email, password: hashedPassword },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await newOTP.save();

    // Send OTP via Email
    await transporter.sendMail({
      from: "aaisali228@gmail.com",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    });

    res.status(200).json({
      message: "OTP sent successfully. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP." });
  }
});

// ✅ VERIFY OTP, CREATE USER & SET JWT COOKIE
router.post("/verify-otp", async (req, res): Promise<any> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    await dbConnect();

    // Find OTP in DB
    const storedOTP = await OTP.findOne({ email, otp });

    if (!storedOTP) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (storedOTP.expiresAt < new Date()) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired." });
    }

    // Create User from temp data
    const { name, password } = storedOTP.tempUser;
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Generate JWT Token
    const token = jwt.sign({ userId: newUser._id }, SECRET_KEY, {
      expiresIn: "7d",
    });

    // Set JWT token as an HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set true if using HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Clean up OTP entry
    await OTP.deleteOne({ email });

    res.status(200).json({
      message: "Account created successfully! Token set in cookies.",
      user: { name, email },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: "Failed to verify OTP." });
  }
});

// ✅ SIGN-IN Route
router.post("/sign-in", async (req, res): Promise<any> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

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

    const { password, ...userWithoutPassword } = user.toObject();

    res.status(200).json({
      message: "Login successful.",
      user: {
        ...userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error("Sign-In Error:", error);
    res.status(500).json({ message: "Failed to sign in." });
  }
});

// ✅ LOGOUT Route
router.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.json({ message: "Logged out successfully." });
});

export default router;
