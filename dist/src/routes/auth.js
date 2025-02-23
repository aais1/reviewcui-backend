"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const OTP_1 = require("../models/OTP");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dbConnect_1 = require("../../lib/dbConnect");
const router = (0, express_1.Router)();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";
// 📧 Nodemailer Transporter
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
});
// ✅ SEND OTP Route (Store User Temp & Send OTP)
router.post("/send-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res
            .status(400)
            .json({ message: "Name, email, and password are required." });
    }
    try {
        yield (0, dbConnect_1.dbConnect)();
        // Check if user already exists
        const existingUser = yield User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }
        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        // Remove existing OTP if any
        yield OTP_1.OTP.deleteMany({ email });
        // Hash the password (temp storage)
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Save OTP and user info (temp)
        const newOTP = new OTP_1.OTP({
            email,
            otp,
            tempUser: { name, email, password: hashedPassword },
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        yield newOTP.save();
        // Send OTP via Email
        yield transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
        });
        res.status(200).json({
            message: "OTP sent successfully. Please verify to complete registration.",
        });
    }
    catch (error) {
        console.error("Send OTP Error:", error);
        res.status(500).json({ message: "Failed to send OTP." });
    }
}));
// ✅ VERIFY OTP & CREATE USER
router.post("/verify-otp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required." });
    }
    try {
        yield (0, dbConnect_1.dbConnect)();
        // Find OTP in DB
        const storedOTP = yield OTP_1.OTP.findOne({ email, otp });
        if (!storedOTP) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }
        if (storedOTP.expiresAt < new Date()) {
            yield OTP_1.OTP.deleteOne({ email });
            return res.status(400).json({ message: "OTP expired." });
        }
        // Create User from temp data
        const { name, password } = storedOTP.tempUser;
        const newUser = new User_1.User({ name, email, password });
        yield newUser.save();
        // Clean up OTP entry
        yield OTP_1.OTP.deleteOne({ email });
        res
            .status(200)
            .json({ message: "Account created successfully! You can now sign in." });
    }
    catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ message: "Failed to verify OTP." });
    }
}));
// ✅ SIGN-IN Route
router.post("/sign-in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield User_1.User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: "Invalid email or password." });
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid email or password." });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, SECRET_KEY, {
            expiresIn: "7d",
        });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({ message: "Login successful.", user, token });
    }
    catch (error) {
        console.error("Sign-In Error:", error);
        res.status(500).json({ message: "Failed to sign in." });
    }
}));
// ✅ LOGOUT Route
router.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
    res.json({ message: "Logged out successfully." });
});
exports.default = router;
