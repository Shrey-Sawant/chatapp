import { useEffect, useRef } from "react";
import { useCallStore } from "../store/useCallStore";
import Controls from "./Controls";
import VideoCallHeader from "./VideoCallHeader";
import ChatContainer from "./ChatContainer";

const MainVideoPanel = () => {
  const myVideoRef = useRef(null);
  const userVideoRef = useRef(null);

  const {
    getMediaStream,
    initVideoRefs,
    initCallListners,
    stream,
    callAccepted,
    callEnded,
  } = useCallStore();

  useEffect(() => {
    initVideoRefs(myVideoRef, userVideoRef);
    getMediaStream();
    initCallListners();
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col">
      <VideoCallHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative flex flex-col items-center justify-center bg-gray-950">
          <div className="w-[80%] max-w-5xl aspect-video bg-black rounded-xl overflow-hidden relative">
            <video
              playsInline
              muted
              ref={myVideoRef}
              autoPlay
              className="absolute top-2 left-2 w-32 h-20 object-cover rounded shadow-lg z-10"
            />
            {callAccepted && !callEnded && (
              <video
                playsInline
                ref={userVideoRef}
                autoPlay
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <Controls />
        </div>
        <ChatContainer />
      </div>
    </div>
  );
};

export default MainVideoPanel;
