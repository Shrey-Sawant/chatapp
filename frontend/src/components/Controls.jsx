import { PhoneOff, Video, Mic, Phone } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";

export default function Controls() {
  const { call, callAccepted, answerCall, leaveCall } = useCallStore();
  const { user } = useAuthStore();

  return (
    <div className="absolute bottom-6 flex gap-6 bg-gray-800 px-6 py-3 rounded-full shadow-md">
      {call?.isReceivedCall && !callAccepted && (
        <button
          onClick={answerCall}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full"
        >
          <Phone />
        </button>
      )}
      {callAccepted && (
        <>
          <button className="text-white hover:text-blue-400">
            <Mic />
          </button>
          <button className="text-white hover:text-blue-400">
            <Video />
          </button>
          <button
            onClick={leaveCall}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full"
          >
            <PhoneOff />
          </button>
        </>
      )}
    </div>
  );
}
