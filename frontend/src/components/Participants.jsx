import React from 'react'

const Participants = () => {
  return (
    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
      <img
        src="/user.jpg" // Replace with dynamic user stream
        alt="User"
        className="object-cover w-full h-full"
      />
    </div>
  )
}

export default Participants
