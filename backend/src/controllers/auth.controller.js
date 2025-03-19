import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/GenrateToken.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";

const signup = asyncHandler(async (req, res, next) => {
    const { fullName, email, password } = req.body;
    console.log("Signup request received:", { fullName, email });

    if (password.length < 6) {
        console.log("Password too short");
        return next(new ApiError(400, "Password must be at least 6 characters"));
    }

    const user = await User.findOne({ email });
    console.log("Existing user check:", user);

    if (user) {
        console.log("User already exists");
        return next(new ApiError(400, "User already exists"));
    }

    const salt = await bcrypt.genSalt(10);
    console.log("Generated salt:", salt);

    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed password:", hashedPassword);

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
    });

    if (newUser) {
        generateToken(newUser._id, res);
        console.log("Generated token for:", newUser._id);

        await newUser.save();
        console.log("New user saved:", newUser);

        return res.status(201).json(new ApiResponse(201, { 
            _id: newUser._id, 
            fullName, 
            email, 
            profilePic: newUser.profilePic 
        },"User created successfully"));
    } else {
        console.log("User creation failed");
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

    res.status(200).json(new ApiResponse(200, { _id: user._id, fullName: user.fullName, email, profilePic: user.profilePic },"Login successful"));
});

const logout = asyncHandler(async (req, res, next) => {

    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json(new ApiResponse(200, "Logout successful"));

});

const updateProfile = asyncHandler(async (req, res, next) => {
    const  profilePicFilePath  = req.file?.path;
    const userId = req.user._id;

    if (!profilePicFilePath) {
        return next(new ApiError(400, "Profile pic not found"));
    }

    const profilePic = await uploadOnCloudinary(profilePicFilePath);

    if (!profilePic) {
        return next(new ApiError(400, "Profile pic not uploaded"));
    }

    const user = await User.findByIdAndUpdate(userId, { profilePic: profilePic.secure_url }, { new: true }).select("-password");

    return res.status(200).json(new ApiResponse(200, "Profile pic updated successfully", user));

});

const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export { signup, login, logout, updateProfile, checkAuth };