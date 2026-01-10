import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import SidebarSkeleton from './skeletons/SidebarSkeleton';
import { Users, UserPlus, Check, X as CloseX } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Sidebar = () => {
  const { 
    getUsers, users, selectedUser, setSelectedUser, isUsersLoading,
    pendingRequests, getPendingRequests, acceptFriendRequest, rejectFriendRequest 
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("friends"); 

  useEffect(() => {
    getUsers();
    getPendingRequests();
  }, [getUsers, getPendingRequests]);

  const filteredUsers = showOnlineOnly ? users.filter((user) => onlineUsers.includes(user._id)) : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className='h-full w-1/4 md:42 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200'>
      {/* Header Tabs */}
      <div className='border-b border-base-300 w-full p-5'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Users className='size-6' />
            <span className='font-medium hidden lg:block'>Chat</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className='flex bg-base-200 p-1 rounded-lg'>
          <button 
            onClick={() => setActiveTab("friends")}
            className={`flex-1 flex justify-center py-1.5 rounded-md text-sm transition-all ${activeTab === "friends" ? "bg-base-100 shadow-sm" : "opacity-50"}`}
          >
            Friends
          </button>
          <button 
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex justify-center py-1.5 rounded-md text-sm transition-all relative ${activeTab === "requests" ? "bg-base-100 shadow-sm" : "opacity-50"}`}
          >
            Requests
            {pendingRequests.incoming?.length > 0 && (
              <span className='absolute -top-1 -right-1 size-4 bg-primary text-[10px] text-primary-content flex items-center justify-center rounded-full'>
                {pendingRequests.incoming.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "friends" && (
          <div className='mt-3 hidden lg:flex items-center gap-2'>
            <label className='cursor-pointer flex items-center gap-2'>
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className='checkbox checkbox-sm'
              />
              <span className='text-sm'>Show online only</span>
            </label>
          </div>
        )}
      </div>

      <div className='overflow-y-auto w-full py-3'>
        {activeTab === "friends" ? (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`w-full lg:p-3 md:p-3 rounded-3xl flex items-center gap-3 hover:bg-base-300 transition-colors ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}
              >
                <div className='relative mx-auto lg:mx-0'>
                  <img src={user.profilePic || "/avatar.png"} alt={user.name} className='size-12 object-cover rounded-full' />
                  {onlineUsers.includes(user._id) && (
                    <span className='absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900' />
                  )}
                </div>
                <div className='hidden lg:block md:block text-left min-w-0'>
                  <div className='font-medium truncate'>{user.fullName}</div>
                  <div className='text-sm text-zinc-400'>{onlineUsers.includes(user._id) ? "Online" : "Offline"}</div>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className='text-center text-zinc-500 py-4'>No friends found</div>
            )}
          </>
        ) : (
          /* Requests View */
          <div className='px-2 space-y-2'>
            {pendingRequests.incoming?.map((request) => (
              <div key={request._id} className='flex items-center gap-2 p-2 bg-base-200 rounded-xl'>
                <img src={request.profilePic || "/avatar.png"} className='size-10 rounded-full' />
                <div className='flex-1 overflow-hidden'>
                  <p className='text-sm font-medium truncate'>{request.fullName}</p>
                </div>
                <div className='flex gap-1'>
                  <button onClick={() => acceptFriendRequest(request._id)} className='btn btn-square btn-xs btn-primary'>
                    <Check className='size-3' />
                  </button>
                  <button onClick={() => rejectFriendRequest(request._id)} className='btn btn-square btn-xs btn-ghost'>
                    <CloseX className='size-3' />
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.incoming?.length === 0 && (
              <div className='text-center text-zinc-500 py-4'>No pending requests</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;