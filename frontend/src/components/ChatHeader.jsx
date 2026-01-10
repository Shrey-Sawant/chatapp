import React from 'react'
import { X } from 'lucide-react'
import { VideoIcon } from 'lucide-react';
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore';
import { useCallStore } from '../store/useCallStore';
import { useNavigate } from 'react-router-dom'

const ChatHeader = () => {
    const { selectedUser, setSelectedUser } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const { initiateCall } = useCallStore();
    const navigate = useNavigate();
    return (
        <div className='p-2.5 border-b border-base-300'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    {/* Avtar */}
                    <div className='avtar'>
                        <div className='size-10 relative'>
                            <img src={selectedUser.profilePic || "./avatar.png"} alt={selectedUser.fullName} className='rounded-full' />
                        </div>
                    </div>

                    {/* User Info */}
                    <div>
                        <h3 className='font-medium'>{selectedUser.fullName}</h3>
                        <p className='text-sm text-base-content/70'>
                            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
                        </p>
                    </div>
                </div>
                
                <div className='flex items-center gap-5'>
                {/* Video Call Button */}
                <button className='btn btn-ghost btn-circle' onClick={() =>{ navigate("/video-call")}}> 
                    <VideoIcon className='w-5 h-5' />
                </button>
                {/* Close Button */}
                <button onClick={() => setSelectedUser(null)}>
                    <X />
                </button>
                </div>
            </div>
        </div>
    )
}

export default ChatHeader;
