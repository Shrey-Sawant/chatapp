import React, { useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore';
import { Image, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageInput = () => {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
    setImages(Array.from(e.target.files));
  };

  const removeImage = (indexToRemove) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllImages = () => {
    setImagePreviews([]);
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text && images.length === 0) return;

    const formData = new FormData();
    formData.append('text', text);
    
    if (images.length > 0) {
      images.forEach((image, index) => {
        formData.append("pictures", image);
      });
    }

    try {
      await sendMessage(formData);
      
      // Clear Form
      setText("");
      clearAllImages();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className='p-4 w-full'>
      {imagePreviews.length > 0 && (
        <div className='mb-3 flex items-center gap-2 flex-wrap'>
          {imagePreviews.map((preview, index) => (
            <div key={index} className='relative'>
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="h-20 w-20 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(index)}
                className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center'
                type='button'
              >
                <X className='size-3' />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSendMessage} className='flex items-center gap-2'>
        <div className='flex-1 flex gap-2'>
          <input
            type="text"
            className='w-full input input-bordered rounded-lg input-sm sm:input-md'
            placeholder='Type a message...'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <input
            type="file"
            accept='image/*'
            multiple
            className='hidden'
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type='button'
            className={`hidden sm:flex btn btn-circle ${imagePreviews.length > 0 ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type='submit'
          className='btn btn-sm btn-circle'
          disabled={!text.trim() && images.length === 0}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;