const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST — Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered!" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // Save user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verifyToken,
    });
    await user.save();

    // Send verification email
    const verifyURL = `http://localhost:5000/api/users/verify/${verifyToken}`;

    await transporter.sendMail({
      from: `"Urban Diva 🌸" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your Urban Diva account",
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:500px;margin:auto;padding:40px;background:#fdf7f2;border-radius:16px;">
          <h2 style="font-family:Georgia,serif;color:#c96c6c;">Welcome to Urban Diva 🌸</h2>
          <p style="color:#2c1f1f;">Hi <b>${name}</b>, please verify your email to activate your account.</p>
          <a href="${verifyURL}" style="display:inline-block;margin-top:20px;background:#c96c6c;color:#fff;padding:12px 32px;border-radius:30px;text-decoration:none;font-size:14px;letter-spacing:1px;">
            Verify Email
          </a>
          <p style="color:#a07878;font-size:12px;margin-top:24px;">If you didn't sign up, ignore this email.</p>
        </div>
      `,
    });

    res.status(201).json({ message: "Signup successful! Please verify your email." });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET — Verify Email
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verifyToken: req.params.token });
    if (!user) return res.status(400).send("Invalid or expired token!");

    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();

    // Redirect to frontend
    res.redirect("http://localhost:3000/login?verified=true");

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST — Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found!" });

    if (!user.isVerified) return res.status(401).json({ message: "Please verify your email first!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password!" });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      message: "Login successful!",
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET — All users (admin)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;