import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

const getAuthStore = useAuthStore.getState;

export const useCallStore = create((set, get) => ({
  localStream: null,
  remoteStreams: {},
  peers: {},

  startRoomCall: async (roomId) => {
    const { socket, peer, authUser } = getAuthStore();

    console.log("[CallStore] Starting room call...");
    console.log(`[CallStore] Room ID: ${roomId}`);
    console.log(`[CallStore] Peer ID: ${peer?.id}`);
    console.log(`[CallStore] Auth User ID: ${authUser?._id}`);

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("[CallStore] Local stream acquired.");
      set({ localStream });

      socket.emit("join-room", { roomId, peerId: peer.id });
      console.log("[CallStore] Emitted join-room event.");

      socket.on("user-joined", (remotePeerId) => {
        console.log(`[CallStore] New user joined: ${remotePeerId}`);

        if (get().peers[remotePeerId]) {
          console.log(`[CallStore] Already connected to ${remotePeerId}`);
          return;
        }

        const call = peer.call(remotePeerId, localStream);
        console.log(`[CallStore] Calling ${remotePeerId}...`);

        call.on("stream", (remoteStream) => {
          console.log(`[CallStore] Receiving stream from ${remotePeerId}`);
          set((state) => ({
            remoteStreams: {
              ...state.remoteStreams,
              [remotePeerId]: remoteStream,
            },
          }));
        });

        set((state) => ({
          peers: { ...state.peers, [remotePeerId]: call },
        }));
      });

      peer.on("call", (call) => {
        console.log(`[CallStore] Incoming call from ${call.peer}`);
        call.answer(localStream);
        console.log(`[CallStore] Answered call from ${call.peer}`);

        call.on("stream", (remoteStream) => {
          console.log(`[CallStore] Receiving stream from ${call.peer}`);
          set((state) => ({
            remoteStreams: {
              ...state.remoteStreams,
              [call.peer]: remoteStream,
            },
          }));
        });

        set((state) => ({
          peers: { ...state.peers, [call.peer]: call },
        }));
      });

      socket.on("user-left", (peerId) => {
        console.log(`[CallStore] User left: ${peerId}`);
        if (get().peers[peerId]) {
          get().peers[peerId].close();
          const updatedPeers = { ...get().peers };
          const updatedStreams = { ...get().remoteStreams };
          delete updatedPeers[peerId];
          delete updatedStreams[peerId];

          set({ peers: updatedPeers, remoteStreams: updatedStreams });
          console.log(`[CallStore] Closed call with ${peerId}`);
        }
      });
    } catch (error) {
      console.error("[CallStore] Error starting room call:", error);
    }
  },

  initiateCall: (calleeUserId, roomId) => {
    const { socket, authUser, peerId } = useAuthStore.getState();

    if (!socket || !authUser || !peerId) return;

    console.log(`[CallStore] Initiating call to ${calleeUserId}`);

    // Notify callee
    socket.emit("call-user", {
      to: calleeUserId,
      from: authUser._id,
      roomId,
      peerId,
    });
  },

  endRoomCall: () => {
    console.log("[CallStore] Ending room call...");

    Object.values(get().peers).forEach((call) => {
      console.log(`[CallStore] Closing call with ${call.peer}`);
      call.close();
    });

    get()
      .localStream?.getTracks()
      .forEach((track) => {
        console.log(`[CallStore] Stopping local track: ${track.kind}`);
        track.stop();
      });

    set({ localStream: null, remoteStreams: {}, peers: {} });
    console.log("[CallStore] Cleared all streams and peer connections.");
  },
}));
