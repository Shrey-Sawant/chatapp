import React from "react";
import VideoPlayer from "./VideoPlayer";
import Notification from "./Notification";

const VideoCallContainer = () => {
  return (
    <div>
      <VideoPlayer />
      <Options>
        <Notification />
      </Options>
    </div>
  );
};

export default VideoCallContainer;
