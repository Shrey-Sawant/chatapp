import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore";
import Peer from "simple-peer";

export const useCallStore = create((set, get) => ({
  // const socket = useAuthStore.getState().socket;
  peer: null,
  peerId: null,
  stream: null,
  myVideoRef: null,
  userVideoRef: null,
  call: {},
  callSignal: null,
  callerName: "",
  callAccepted: false,
  callEnded: false,

  initVideoRefs: (myRef, userRef) => {
    set({ myVideoRef: myRef, userVideoRef: userRef });
  },

  getMediaStream: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      set({ stream });
      if (get().myVideoRef) {
        get().myVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  },

  initCallListners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("me", (id) => {
      set({ peerId: id });
    });

    socket.on("callUser", ({ from, name, signal }) => {
      set({
        call: {
          isReceivedCall: true,
          from,
          callerName: name,
          callSignal: signal,
        },
      });
    });

    socket.on("callAccepted", (signal) => {
      set({ callAccepted: true });
      get().peer?.signal(signal);
    });
  },

  answerCall: () => {
    const { call, callSignal, userVideoRef } = get();
    const socket = useAuthStore.getState().socket;
    set({ callAccepted: true });

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: get().stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: get().call.from });
    });

    peer.on("stream", (currentStream) => {
      userVideoRef.current.srcObject = currentStream;
    });

    peer.signal(callSignal);

    set({ peer });
  },

  callUser: (userId, callerName) => {
    const { stream, userVideoRef, peerId } = get();
    const socket = useAuthStore.getState().socket;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: userId,
        signalData: data,
        from: peerId,
        name: callerName,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideoRef) {
        userVideoRef.current.srcObject = remoteStream;
      }
    });

    socket.on("callAccepted", (signal) => {
      set({ callAccepted: true });
      peer.signal(signal);
    });

    set({ peer });
  },

  leaveCall: () => {
    get().peer?.destroy();

    set({
      callEnded: true,
      callAccepted: false,
      call: {},
      callSignal: null,
      callerName: "",
      peer: null,
      stream: null,
    });

    window.location.reload();
  },
}));
