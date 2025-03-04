import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import User from "../models/User.js";
import { generateToken } from "../utils/GenrateToken.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const signup = asyncHandler(async (req, res, next) => {
    const { fullName, email, password } = req.body;

    if (password.length < 6) {
        return next(new ApiError(400, "Password must be at least 6 characters"));
    }

    const user = await User.findOne({ email });

    if (user) {
        return next(new ApiError(400, "User already exists"));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword,
    });

    if (newUser) {
        generateToken(newUser._id, res);
        await newUser.save();

        return res.status(201).json(new ApiResponse(201, "User created successfully", { _id: newUser._id, fullName, email, profilePic: newUser.profilePic }));
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

    res.status(200).json(new ApiResponse(200, "Login successful", { _id: user._id, fullName: user.fullName, email, profilePic: user.profilePic }));
});

const logout = asyncHandler(async (req, res, next) => {

    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json(new ApiResponse(200, "Logout successful"));

});

const updateProfile = asyncHandler(async (req, res, next) => {
    const { profilePicFilePath } = req.file?.path;

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

export { signup, login, logout, updateProfile };