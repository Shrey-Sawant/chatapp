import React, { useEffect, useRef } from "react";
import Peer from "peerjs";
import io from "socket.io-client";
import VideoCard from "../components/VideoCard";
import { VideoIcon } from "lucide-react";
import { VideoOffIcon } from "lucide-react";
import { MicOffIcon } from "lucide-react";
import { MicIcon } from "lucide-react";
import { VideotapeIcon } from "lucide-react";
import { useState } from "react";

const CallPage = ({ roomId, userId }) => {
  const videoRef = useRef(null);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [hasVideoStream, setHasVideoStream] = useState(false);

  useEffect(() => {
    const setupMedia = async () => {
      if (videoOn || audioOn) {
        try {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          const newStream = await navigator.mediaDevices.getUserMedia({
            video: videoOn,
            audio: audioOn,
          });

          setStream(newStream);
          setHasVideoStream(videoOn);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
        } catch (error) {
          console.error("Error accessing media devices.", error);
        }
      } else {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setHasVideoStream(false);
      }
    };

    setupMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setHasVideoStream(videoOn);
    };
  }, [videoOn, audioOn]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-base-100 ">
      <VideoCard videoRef={videoRef} hasVideoStream={hasVideoStream} />

      <div className="w-1/3 px-20 py-2 mt-8 flex items-center justify-between bg-white opacity-10 border-2 border-primary rounded-2xl">
        <button
          className="btn btn-ghost btn-circle"
          onClick={() => setVideoOn((prev) => !prev)}
        >
          {videoOn ? (
            <VideoIcon className="size-10" />
          ) : (
            <VideoOffIcon className="size-10" />
          )}
        </button>
        <button
          className="btn btn-ghost btn-circle"
          onClick={() => setAudioOn((prev) => !prev)}
        >
          {audioOn ? (
            <MicIcon className="size-10" />
          ) : (
            <MicOffIcon className="size-10" />
          )}
        </button>
        <button className="btn btn-ghost btn-circle">
          <VideotapeIcon className="size-10" />
        </button>
      </div>
    </div>
  );
};

export default CallPage;
