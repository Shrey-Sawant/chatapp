import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/GenrateToken.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";

const signup = asyncHandler(async (req, res, next) => {
    const { fullName, email, password } = req.body;

    // Password validation
    if (password.length < 6) {
        return next(new ApiError(400, "Password must be at least 6 characters"));
    }

    // Check existing user
    const user = await User.findOne({ email });
    if (user) {
        return next(new ApiError(400, "User already exists"));
    }

    // Password hashing
    const salt = await bcrypt.genSalt(10);
  
    const hashedPassword = await bcrypt.hash(password, salt);

    // User creation
    const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
    });

    if (newUser) {
        generateToken(newUser._id, res);
        await newUser.save();

        return res.status(201).json(new ApiResponse(201, {
            _id: newUser._id,
            fullName,
            email,
            profilePic: newUser.profilePic
        }, "User created successfully"));
    } else {
        return next(new ApiError(400, "User not created"));
    }
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new ApiError(400, "Invalid credentials"));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return next(new ApiError(400, "Invalid credentials"));
    }

    generateToken(user._id, res);

    res.status(200).json(new ApiResponse(200, { 
        _id: user._id, 
        fullName: user.fullName, 
        email, 
        profilePic: user.profilePic 
    }, "Login successful"));
});

const logout = asyncHandler(async (req, res, next) => {
    
    res.cookie("jwt", "", { 
        maxAge: 0,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"
    });
    
    res.status(200).json(new ApiResponse(200, "Logout successful"));
});

const updateProfile = asyncHandler(async (req, res, next) => {
    const profilePicFilePath = req.file?.path;
    const userId = req.user._id;

    if (!profilePicFilePath) {
        return next(new ApiError(400, "Profile pic not found"));
    }

    const profilePic = await uploadOnCloudinary(profilePicFilePath);
    if (!profilePic?.secure_url) {
        return next(new ApiError(400, "Profile pic not uploaded"));
    }

    const user = await User.findByIdAndUpdate(
        userId, 
        { profilePic: profilePic.secure_url }, 
        { new: true }
    ).select("-password");
    console.log(user);
    if (!user) {
        return next(new ApiError(404, "User not found"));
    }

    return res.status(200).json(new ApiResponse(200, user ,"Profile pic updated successfully"));
});

const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export { signup, login, logout, updateProfile, checkAuth };
