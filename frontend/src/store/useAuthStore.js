import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import Peer from "peerjs";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  peer: null,
  peerId: null,

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check");

      set({ authUser: response.data });
      get().connectSocket();
    } catch (error) {
      console.log(error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });

    try {
      const response = await axiosInstance.post("/auth/signup", data, {
        headers: {
          "Content-Type": "application/json", // Explicitly set JSON
        },
      });
      console.log(response.data.data);
      set({ authUser: response.data.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log(data);
      const response = await axiosInstance.post("/auth/login", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      set({ authUser: response.data.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
      get().disconnectPeer();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    console.log(data);
    try {
      const response = await axiosInstance.put("/auth/update-profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      set({ authUser: response.data.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error.response.data);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("incoming-call", ({ from, roomId, peerId }) => {
      console.log(`[AuthStore] Incoming call from ${from} in room ${roomId}`);

      window.confirm("Incoming call. Join?") &&
        window.location.assign(`/video-call?roomId=${roomId}`);
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

  initPeer: () => {
    console.log("[PeerJS] Initializing peer...");

    const peer = new Peer(undefined, {
      host: "/",
      port: "8001",
      path: "/peerjs",
    });

    peer.on("open", (id) => {
      console.log(`[PeerJS] Connection opened with ID: ${id}`);
      set({ peerId: id });
    });

    peer.on("error", (err) => {
      console.error("[PeerJS] Error:", err);
    });

    peer.on("disconnected", () => {
      console.warn("[PeerJS] Disconnected");
    });

    peer.on("close", () => {
      console.log("[PeerJS] Connection closed");
    });

    set({ peer: peer });
  },

  disconnectPeer: () => {
    const { peer } = get();
    if (peer) {
      console.log("[PeerJS] Destroying peer connection...");
      peer.destroy();
    } else {
      console.log("[PeerJS] No active peer to destroy.");
    }
    set({ peer: null });
  },
}));
