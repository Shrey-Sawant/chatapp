import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/user.model";
import Message from "../models/message.model";
import { ApiResponse } from "../utils/ApiRespones";
import { ApiError } from "../utils/ApiError";

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
            { sender: loogedInUserId, receiver: id },
            { sender: id, receiver: loogedInUserId }
        ]
    }).sort({ createdAt: 1 });

    if (!messages) return next(new ApiError(404, 'No messages found'));

    return res.status(200).json(new ApiResponse(200, messages, 'Messages fetched successfully'));
});

const sendMessage = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const { imagesPath } = req.files?.path;
    const images = [];
    const { receiverId } = req.params;
    const senderId = req.user?._id;

    if (imagesPath) {
        imagesPath.map(async (image) => {
            const imageLink = await uploadOnCloudinary(image);

            if (!imageLink) return next(new ApiError(400, 'Image not uploaded'));

            images.push(imageLink);
        });
    }

    const newMessage = new Message({
        senderId,
        receiverId,
        text,
        images,
    });

    await newMessage.save();

    if (!newMessage) return next(new ApiError(400, 'Message not sent'));

    return res.status(200).json(new ApiResponse(200, newMessage, 'Message sent successfully'));

});

export { getUserForSideBar, getMessages, sendMessage };