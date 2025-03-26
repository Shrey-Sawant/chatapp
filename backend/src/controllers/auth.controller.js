import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/GenrateToken.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";

const signup = asyncHandler(async (req, res, next) => {
    console.log("\n=== SIGNUP CONTROLLER STARTED ===");
    const { fullName, email, password } = req.body;
    console.log("[Signup Request] Received data:", { fullName, email, password: password ? "***" : "missing" });

    // Password validation
    if (password.length < 6) {
        console.error("[Validation] ❌ Password too short:", password.length);
        return next(new ApiError(400, "Password must be at least 6 characters"));
    }
    console.log("[Validation] ✅ Password length valid");

    // Check existing user
    console.log("[Database] Checking for existing user...");
    const user = await User.findOne({ email });
    if (user) {
        console.error("[Conflict] ❌ User already exists:", email);
        return next(new ApiError(400, "User already exists"));
    }
    console.log("[Database] ✅ No existing user found");

    // Password hashing
    console.log("[Security] Generating salt...");
    const salt = await bcrypt.genSalt(10);
    console.log("[Security] Salt generated:", salt);
    
    console.log("[Security] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("[Security] Password hashed:", hashedPassword ? "***" : "failed");

    // User creation
    console.log("[Database] Creating new user...");
    const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
    });

    if (newUser) {
        console.log("[Auth] Generating JWT token...");
        generateToken(newUser._id, res);
        console.log("[Auth] ✅ Token generated for user ID:", newUser._id);

        console.log("[Database] Saving user to database...");
        await newUser.save();
        console.log("[Database] ✅ User saved successfully:", {
            _id: newUser._id,
            email: newUser.email,
            profilePic: newUser.profilePic ? "exists" : "none"
        });

        console.log("=== SIGNUP COMPLETED SUCCESSFULLY ===");
        return res.status(201).json(new ApiResponse(201, {
            _id: newUser._id,
            fullName,
            email,
            profilePic: newUser.profilePic
        }, "User created successfully"));
    } else {
        console.error("[Error] ❌ User creation failed");
        return next(new ApiError(400, "User not created"));
    }
});

const login = asyncHandler(async (req, res, next) => {
    console.log("\n=== LOGIN CONTROLLER STARTED ===");
    const { email, password } = req.body;
    console.log("[Login Request] Received credentials:", { email, password: password ? "***" : "missing" });

    console.log("[Database] Searching for user...");
    const user = await User.findOne({ email });
    if (!user) {
        console.error("[Auth] ❌ User not found:", email);
        return next(new ApiError(400, "Invalid credentials"));
    }
    console.log("[Database] ✅ User found:", user._id);

    console.log("[Security] Verifying password...");
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        console.error("[Auth] ❌ Password mismatch for user:", email);
        return next(new ApiError(400, "Invalid credentials"));
    }
    console.log("[Security] ✅ Password verified");

    console.log("[Auth] Generating JWT token...");
    generateToken(user._id, res);
    console.log("[Auth] ✅ Token generated for user ID:", user._id);

    console.log("=== LOGIN COMPLETED SUCCESSFULLY ===");
    res.status(200).json(new ApiResponse(200, { 
        _id: user._id, 
        fullName: user.fullName, 
        email, 
        profilePic: user.profilePic 
    }, "Login successful"));
});

const logout = asyncHandler(async (req, res, next) => {
    console.log("\n=== LOGOUT CONTROLLER STARTED ===");
    console.log("[Auth] Clearing JWT cookie...");
    
    res.cookie("jwt", "", { 
        maxAge: 0,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"
    });
    
    console.log("[Auth] ✅ Cookie cleared");
    console.log("=== LOGOUT COMPLETED ===");
    res.status(200).json(new ApiResponse(200, "Logout successful"));
});

const updateProfile = asyncHandler(async (req, res, next) => {
    console.log("\n=== PROFILE UPDATE STARTED ===");
    console.log("[Request] Received file:", req.file);
    
    const profilePicFilePath = req.file?.path;
    const userId = req.user._id;
    console.log("[User] Updating profile for:", userId);

    if (!profilePicFilePath) {
        console.error("[Validation] ❌ No file uploaded");
        return next(new ApiError(400, "Profile pic not found"));
    }
    console.log("[File] Temporary path:", profilePicFilePath);

    console.log("[Cloudinary] Starting upload...");
    const profilePic = await uploadOnCloudinary(profilePicFilePath);
    if (!profilePic?.secure_url) {
        console.error("[Cloudinary] ❌ Upload failed");
        return next(new ApiError(400, "Profile pic not uploaded"));
    }
    console.log("[Cloudinary] ✅ Upload successful:", profilePic.secure_url);

    console.log("[Database] Updating user profile...");
    const user = await User.findByIdAndUpdate(
        userId, 
        { profilePic: profilePic.secure_url }, 
        { new: true }
    ).select("-password");

    if (!user) {
        console.error("[Database] ❌ User not found:", userId);
        return next(new ApiError(404, "User not found"));
    }
    console.log("[Database] ✅ Profile updated successfully");

    console.log("=== PROFILE UPDATE COMPLETED ===");
    return res.status(200).json(new ApiResponse(200, "Profile pic updated successfully", user));
});

const checkAuth = (req, res) => {
    console.log("\n=== CHECK AUTH CONTROLLER ===");
    try {
        console.log("[Auth] Authenticated user:", req.user);
        console.log("=== AUTH CHECK COMPLETED ===");
        res.status(200).json(req.user);
    } catch (error) {
        console.error("[Error] ❌ Auth check failed:", error.message);
        console.error(error.stack);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export { signup, login, logout, updateProfile, checkAuth };