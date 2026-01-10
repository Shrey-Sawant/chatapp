import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  pendingRequests: { incoming: [], outgoing: [] },
  isUsersLoading: false,
  isMessagesLoading: false,
  selectedUser: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching friends");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getPendingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ pendingRequests: res.data.data });
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      toast.success(res.data.message || "Request sent!");
      get().getPendingRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send request");
    }
  },

  acceptFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/accept/${userId}`);
      toast.success("Request accepted!");
      await get().getUsers();
      await get().getPendingRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error accepting request");
    }
  },

  rejectFriendRequest: async (userId) => {
    try {
      await axiosInstance.post(`/friends/reject/${userId}`);
      toast.success("Request removed");
      get().getPendingRequests();
    } catch (error) {
      toast.error("Error rejecting request");
    }
  },

  searchUsers: async (query) => {
    if (!query) return set({ searchResults: [] });
    try {
      const res = await axiosInstance.get(`/friends/search?query=${query}`);
      return res.data.data; 
    } catch (error) {
      toast.error("Search failed");
      return [];
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data.data });
    } catch (error) {
      toast.error(error.response.data);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      set({ messages: [...messages, res.data.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return;
      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
