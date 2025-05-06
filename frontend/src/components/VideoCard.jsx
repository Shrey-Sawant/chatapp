import React from "react";

const VideoCard = ({ videoRef, hasVideoStream }) => {
  console.log("VideoCard rendered with hasVideoStream:", hasVideoStream);
  
  return (
    <div className="w-1/2 h-2/3 p-2.5 flex flex-col justify-center items-center space-y-5 border-2 border-primary rounded-2xl bg-black">
      {/* Always render the video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`rounded-2xl w-full h-full object-cover ${hasVideoStream ? "" : "hidden"}`}
      />

      {/* Avatar fallback if video is off */}
      {!hasVideoStream && (
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-full overflow-hidden w-24 h-24">
            <img src="/avatar.png" alt="User" className="w-full h-full object-cover" />
          </div>
          <h3 className="font-medium text-lg text-white">User Name</h3>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
