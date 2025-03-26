import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    console.log("\n=== JWT VERIFICATION STARTED ===");
    
    try {
        // Token extraction
        const token = req.cookies?.jwt || req.header("Authorization")?.replace("Bearer ", "");
        console.log(`[JWT] Token source: ${req.cookies?.jwt ? 'Cookie' : 'Header'}`);
        console.log(`[JWT] Token received: ${token ? `${token.substring(0, 15)}...` : 'None'}`);

        if (!token) {
            console.error("[JWT] ❌ No token provided");
            return next(new ApiError(401, "Unauthorized request. Please check your permissions or log in again."));
        }

        // Token verification
        console.log("[JWT] Verifying token...");
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log("[JWT] ✅ Token decoded successfully");
        console.log(`[JWT] Decoded payload: UserID - ${decodedToken?.userId}, Issued At - ${new Date(decodedToken.iat * 1000).toISOString()}`);

        // User lookup
        console.log(`[Database] Searching for user: ${decodedToken?.userId}`);
        const user = await User.findById(decodedToken?.userId).select("-password -refreshToken");
        
        if (!user) {
            console.error(`[Database] ❌ User not found for ID: ${decodedToken?.userId}`);
            return next(new ApiError(401, "The access token is invalid. Please log in again."))
        }

        console.log(`[Database] ✅ User found: ${user._id} (${user.email})`);
        console.log(`[Auth] Setting user context: ${user._id}`);

        req.user = user;
        console.log("=== JWT VERIFICATION SUCCESSFUL ===");
        next();
    } catch (error) {
        console.error("[JWT] ❌ Verification failed:", error.message);
        console.error("[Error Details]", error.stack);
        
        const errorMessage = error.name === 'TokenExpiredError' 
            ? "Session expired. Please log in again."
            : "The access token is invalid. Please ensure you're logged in and try again.";

        console.log(`[JWT] Error type: ${error.name}`);
        return next(new ApiError(401, errorMessage));
    }
});