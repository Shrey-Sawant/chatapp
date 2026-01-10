import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import Message from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getReceiverSocketId, io } from "../app.js";

const getUserForSideBar = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user?._id;

    const currentUser = await User.findById(loggedInUserId)
        .populate({
            path: "friends",
            select: "-password", 
        });

    if (!currentUser) {
        throw new ApiError(404, "User not found");
    }

    const friendsList = currentUser.friends;

    return res
        .status(200)
        .json(new ApiResponse(200, friendsList, "Friends fetched successfully"));
});

const getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const loogedInUserId = req.user?._id;

    const messages = await Message.find({
        $or: [
            { senderId: loogedInUserId, receiverId: id },
            { senderId: id, receiverId: loogedInUserId }
        ]
    }).sort({ createdAt: 1 });

    if (!messages) {
        console.log("No messages found for the given criteria");
        return next(new ApiError(404, 'No messages found'));
    }

    return res.status(200).json(new ApiResponse(200, messages, 'Messages fetched successfully'));
});

const sendMessage = asyncHandler(async (req, res, next) => {
    const { text } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user?._id;

    let imagesPaths = [];

    if (req.files?.pictures) {
        const files = Array.isArray(req.files.pictures) 
            ? req.files.pictures 
            : [req.files.pictures];

        imagesPaths = files.map(file => {
            if (!file.path) {
                throw new ApiError(400, "Invalid file format received");
            }
            return file.path;
        });
    }

    if (!text && imagesPaths.length === 0) {
        return next(new ApiError(400, "Message must contain text or an image"));
    }

    let images = [];
    if (imagesPaths.length > 0) {
        console.log("\n[Cloudinary Upload]");
        try {
            images = await Promise.all(
                imagesPaths.map(async (path, index) => {
                    const photo = await uploadOnCloudinary(path);
                    if (!photo?.secure_url) {
                        throw new ApiError(500, "Error uploading file to cloud");
                    }
                    return photo.secure_url;
                })
            );
        } catch (uploadError) {
            return next(uploadError);
        }
    }

    try {
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text,
            images
        });

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        } 

        return res.status(201).json(
            new ApiResponse(200, newMessage, "Message sent successfully")
        );

    } catch (dbError) {
        return next(new ApiError(500, "Failed to save message to database"));
    }
});

export { getUserForSideBar, getMessages, sendMessage };