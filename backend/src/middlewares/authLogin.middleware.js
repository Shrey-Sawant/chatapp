import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.jwt || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return next(new ApiError(401, "Unauthorized request. Please check your permissions or log in again."));
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken?.userId).select("-password -refreshToken");

        if (!user) {
            return next(new ApiError(401, "The access token is invalid. Please log in again."))
        }

        req.user = user;
        next();
    } catch (error) {

        const errorMessage = error.name === 'TokenExpiredError'
            ? "Session expired. Please log in again."
            : "The access token is invalid. Please ensure you're logged in and try again.";

        return next(new ApiError(401, errorMessage));
    }
});