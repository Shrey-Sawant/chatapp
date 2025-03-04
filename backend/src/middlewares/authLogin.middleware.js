import { asyncHandler } from "../utils/asyncHandler";

export const verfiyJwt=asyncHandler(async (req,res,next)=>{ 
    const token=req.cookies.jwt;

    if(!token){
        return next(new ApiError(401,"Unauthenticated"));
    }

    const decoded=jwt.verify(token,process.env.JWT_SECRET);

    if(!decoded){
        return next(new ApiError(401,"Unauthenticated"));
    }

    const user=await User.findById(decoded.id).select("-password"); 

    if(!user){
        return next(new ApiError(400,"Unauthenticated"));
    }

    req.user=user;

    next();
});