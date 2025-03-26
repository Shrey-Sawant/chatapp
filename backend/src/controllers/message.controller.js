import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import Message from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getReceiverSocketId, io } from "../app.js";

const getUserForSideBar = asyncHandler(async (req, res) => {
    const loogedInUserId = req.user?._id;
    const filterUsers = await User.find({ _id: { $ne: loogedInUserId } }).select('-password');

    if (!filterUsers) return next(new ApiError(404, 'No users found'));

    return res.status(200).json(new ApiResponse(200, filterUsers, 'Users fetched successfully'));
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
    console.log("\n=== Starting sendMessage controller ===");
    console.log("Request parameters:", req.params);
    console.log("Authenticated user:", req.user);

    const { text } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user?._id;

    console.log("\n[Parameters]");
    console.log("Sender ID:", senderId);
    console.log("Receiver ID:", receiverId);
    console.log("Text content:", text);

    let imagesPaths = [];

    // File handling debug
    console.log("\n[File Handling]");
    if (req.files?.pictures) {
        const files = Array.isArray(req.files.pictures) 
            ? req.files.pictures 
            : [req.files.pictures];
        
        console.log(`Received ${files.length} file(s):`);
        files.forEach((file, index) => {
            console.log(`File ${index + 1}:`);
            console.log("- Fieldname:", file.fieldname);
            console.log("- Originalname:", file.originalname);
            console.log("- Mimetype:", file.mimetype);
            console.log("- Size:", file.size);
            console.log("- Path:", file.path);
        });

        imagesPaths = files.map(file => {
            if (!file.path) {
                console.error("Invalid file format detected");
                throw new ApiError(400, "Invalid file format received");
            }
            return file.path;
        });
    } else {
        console.log("No files received in request");
    }

    console.log("\n[Image Paths]");
    console.log("Local image paths:", imagesPaths);

    // Validation check
    console.log("\n[Validation]");
    if (!text && imagesPaths.length === 0) {
        console.error("Validation failed: Empty message content");
        return next(new ApiError(400, "Message must contain text or an image"));
    }
    console.log("Content validation passed");

    // Cloudinary upload debug
    let images = [];
    if (imagesPaths.length > 0) {
        console.log("\n[Cloudinary Upload]");
        try {
            console.log(`Starting upload of ${imagesPaths.length} image(s) to Cloudinary`);
            images = await Promise.all(
                imagesPaths.map(async (path, index) => {
                    console.log(`Uploading image ${index + 1}: ${path}`);
                    const photo = await uploadOnCloudinary(path);
                    if (!photo?.secure_url) {
                        console.error(`Failed upload for image ${index + 1}`);
                        throw new ApiError(500, "Error uploading file to cloud");
                    }
                    console.log(`Upload successful for image ${index + 1}:`, photo.secure_url);
                    return photo.secure_url;
                })
            );
            console.log("All images uploaded successfully");
        } catch (uploadError) {
            console.error("Image upload error:", uploadError);
            return next(uploadError);
        }
    }

    // Database operation debug
    console.log("\n[Database Operation]");
    try {
        console.log("Creating new message document...");
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text,
            images
        });

        console.log("Message created successfully:", newMessage);

        // Socket.io debug
        console.log("\n[Socket.io Notification]");
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            console.log(`Receiver ${receiverId} is online (socket ID: ${receiverSocketId})`);
            io.to(receiverSocketId).emit("newMessage", newMessage);
            console.log("Message event emitted successfully");
        } else {
            console.log(`Receiver ${receiverId} is offline - no socket notification sent`);
        }

        console.log("\n=== Controller completed successfully ===");
        return res.status(201).json(
            new ApiResponse(200, newMessage, "Message sent successfully")
        );

    } catch (dbError) {
        console.error("Database error:", dbError);
        console.error("Error stack:", dbError.stack);
        return next(new ApiError(500, "Failed to save message to database"));
    }
});

export { getUserForSideBar, getMessages, sendMessage };