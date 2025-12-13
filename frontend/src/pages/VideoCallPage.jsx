import React from "react";
import VideoCallHeader from "../components/VideoCallHeader";
import MainVideoPanel from "../components/MainVideoPanel";
import ChatContainer from "../components/ChatContainer";

const VideoCallPage = () => {
  return (
    <div className="h-screen w-screen bg-primary-focus text-primary-content flex flex-col">
      <VideoCallHeader />
      <div className="flex flex-1 overflow-hidden">
        <MainVideoPanel />
        <ChatContainer />
      </div>
    </div>
  );
};

export default VideoCallPage;
