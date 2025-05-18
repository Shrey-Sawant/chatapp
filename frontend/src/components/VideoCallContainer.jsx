import React, { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { useSearchParams } from "react-router-dom";

const VideoCallContainer = () => {
  const localVideoRef = useRef(null);
  const [params] = useSearchParams();
  const roomId = params.get("roomId") || "default-room";
  const { localStream, remoteStreams, startRoomCall, endRoomCall } =
    useCallStore();

  const { socket, peer, peerId, initPeer, authUser } = useAuthStore();

  const [isReady, setIsReady] = useState(false);

  // Initialize peer and socket on mount
  useEffect(() => {
    initPeer();
  }, []);

  // Wait for peer to be ready, then start call
  useEffect(() => {
    if (peer && peerId && authUser && socket) {
      console.log("[VideoCallContainer] Peer is ready, starting call...");
      startRoomCall(roomId);
      setIsReady(true);
    }
  }, [peer, peerId, authUser, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isReady) {
        endRoomCall();
        console.log("[VideoCallContainer] Call ended.");
      }
    };
  }, [isReady]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="grid grid-cols-2 gap-4 h-screen">
      <video ref={localVideoRef} autoPlay muted className="w-full rounded" />
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <video
          key={peerId}
          ref={(video) => {
            if (video) video.srcObject = stream;
          }}
          autoPlay
          className="w-full rounded"
        />
      ))}
    </div>
  );
};

export default VideoCallContainer;
