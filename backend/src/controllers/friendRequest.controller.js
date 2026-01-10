import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiRespones.js";
import { ApiError } from "../utils/ApiError.js";

export const sendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const senderId = req.user._id;

  console.log("Sender ID:", senderId);
  console.log("Receiver ID:", userId);
  
  if (userId === senderId.toString()) {
    throw new ApiError(400, "Cannot add yourself");
  }

  const [sender, receiver] = await Promise.all([
    User.findById(senderId),
    User.findById(userId),
  ]);

  if (sender.friends.includes(userId)) {
    throw new ApiError(400, "Already friends");
  }
  if (sender.friendRequestsSent.includes(userId)) {
    throw new ApiError(400, "Request already sent");
  }

  sender.friendRequestsSent.push(userId);
  receiver.friendRequestsReceived.push(senderId);

  await Promise.all([sender.save(), receiver.save()]);
  res.status(200).json(new ApiResponse(200, null, "Friend request sent"));
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const acceptorId = req.user._id;

  const [acceptor, requester] = await Promise.all([
    User.findById(acceptorId),
    User.findById(userId),
  ]);

  acceptor.friendRequestsReceived = acceptor.friendRequestsReceived.filter(
    (id) => id.toString() !== userId
  );
  acceptor.friends.push(userId);

  requester.friendRequestsSent = requester.friendRequestsSent.filter(
    (id) => id.toString() !== acceptorId.toString()
  );
  requester.friends.push(acceptorId);

  await Promise.all([acceptor.save(), requester.save()]);
  res.status(200).json(new ApiResponse(200, null, "Friend request accepted"));
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .populate("friendRequestsReceived", "fullName profilePic email")
    .populate("friendRequestsSent", "fullName profilePic email");

  const requests = {
    incoming: user.friendRequestsReceived,
    outgoing: user.friendRequestsSent,
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, requests, "Pending requests fetched successfully")
    );
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const myId = req.user._id;

  const [me, requester] = await Promise.all([
    User.findById(myId),
    User.findById(userId),
  ]);

  me.friendRequestsReceived = me.friendRequestsReceived.filter(
    (id) => id.toString() !== userId
  );
  requester.friendRequestsSent = requester.friendRequestsSent.filter(
    (id) => id.toString() !== myId.toString()
  );

  await Promise.all([me.save(), requester.save()]);
  res.status(200).json(new ApiResponse(200, null, "Friend request rejected"));
});

export const searchGlobalUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const loggedInUserId = req.user._id;

  const users = await User.find({
    _id: { $ne: loggedInUserId },
    $or: [
      { fullName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  }).select("fullName profilePic email");

  return res.status(200).json(new ApiResponse(200, users, "Users found"));
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const loggedInUserId = req.user._id;

  console.log("Logged in user ID:", loggedInUserId);
  console.log("Search query:", query);

  const users = await User.find({
    _id: { $ne: loggedInUserId },
    $or: [
      { fullName: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ],
  }).select("fullName profilePic email friends friendRequestsReceived");

  const results = users.map((user) => ({
    _id: user._id,
    fullName: user.fullName,
    profilePic: user.profilePic,
    email: user.email,
    isFriend: user.friends.includes(loggedInUserId),
    hasSentRequest: user.friendRequestsReceived.includes(loggedInUserId),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, results, "Users fetched successfully"));
});
