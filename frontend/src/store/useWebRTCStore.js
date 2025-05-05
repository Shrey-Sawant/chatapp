import { create } from "zustand";
import { io } from "socket.io-client";

export const useWebRTCStore = create((set, get) => ({
  localStream: null,
  peerConnections: {},
  remoteStreams: {},

  joinRoom: async ({ roomId, userId, socket }) => {
    if (!socket) return;

    set({ socket });

    socket.emit("join-room", roomId, userId);

    socket.off("user-connected").on("user-connected", async (newUserId) => {
      await get().createPeerConnection(newUserId, true);
    });

    socket
      .off("receive-offer")
      .on("receive-offer", async ({ senderId, offer }) => {
        await get().createPeerConnection(senderId, false, offer);
      });

    socket
      .off("receive-answer")
      .on("receive-answer", async ({ senderId, answer }) => {
        await get().peerConnections[senderId]?.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      });

    socket
      .off("receive-ice-candidate")
      .on("receive-ice-candidate", async ({ senderId, candidate }) => {
        await get().peerConnections[senderId]?.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });

    socket.off("user-disconnected").on("user-disconnected", (id) => {
      const conn = get().peerConnections[id];
      if (conn) {
        conn.close();
        const peers = { ...get().peerConnections };
        const streams = { ...get().remoteStreams };
        delete peers[id];
        delete streams[id];

        set({ peerConnections: peers, remoteStreams: streams });
      }
    });

    await get().initializeMedia();
  },

  initalizeMedia: async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    set({ localStream: stream });
  },

  createPeerConnection: async (peerId, isInitiator, remoteOffer = null) => {
    const { localStream, socket, peerConnections, remoteStreams } = get();

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("send-ice-candidate", {
          targetUserId: peerId,
          candidate: event.candidate,
          senderId: socket.id,
        });
      }
    };

    peer.ontrack = async (event) => {
      set((state) => ({
        remoteStreams: {
          ...state.remoteStreams,
          [peerId]: event.streams[0],
        },
      }));

      set((state) => ({
        peerConnections: {
          ...state.peerConnections,
          [peerId]: peer,
        },
      }));

      if (isInitiator) {
        const offer = peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("send-offer", {
          targetUserId: peerId,
          offer: offer,
          senderId: socket.id,
        });
      } else {
        await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("send-answer", {
          targetUserId: peerId,
          answer: answer,
          senderId: socket.id,
        });
      }
    };
  },
}));
