import React from 'react'

const VideoCallHeader = () => {
  return (
    <header className='h-14 px-6 flex items-center justify-between bg-primary border-b border-base-300'>
        <h2 className='text-lg font-semibold'>User</h2>
        <div className='flex gap-4 items-center'>
            <button className='text-sm text-secondary hover:text-white'>Options</button>
        </div>
    </header>
  )
}

export default VideoCallHeader
