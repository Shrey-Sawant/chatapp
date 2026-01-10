import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Search, UserPlus, Check, Clock, Loader2 } from 'lucide-react';

const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const { searchUsers, sendFriendRequest } = useChatStore();

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await searchUsers(query);
                setResults(data);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, searchUsers]);

    return (
        <div className='h-screen bg-base-200 pt-20'>
            <div className='max-w-2xl mx-auto p-4'>
                <div className='bg-base-100 rounded-xl shadow-xl p-6'>
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-2xl font-bold'>Find Friends</h2>
                        {isSearching && <Loader2 className='size-5 animate-spin text-primary' />}
                    </div>
                    
                    <div className='relative mb-8'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <Search className='size-5 text-base-content/40' />
                        </div>
                        <input
                            type="text"
                            placeholder="Type a name or email..."
                            className='input input-bordered w-full pl-10'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className='space-y-4 max-h-[60vh] overflow-y-auto pr-2'>
                        {results.map((user) => (
                            <div key={user._id} className='flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors'>
                                <div className='flex items-center gap-4'>
                                    <img 
                                        src={user.profilePic || "/avatar.png"} 
                                        className='size-12 rounded-full object-cover border-2 border-base-100' 
                                        alt={user.fullName} 
                                    />
                                    <div>
                                        <p className='font-medium'>{user.fullName}</p>
                                        <p className='text-xs text-base-content/60'>{user.email}</p>
                                    </div>
                                </div>

                                <div className='flex items-center'>
                                    {user.isFriend ? (
                                        <div className='badge badge-success gap-2 py-3 px-4'>
                                            <Check className='size-4' /> Friend
                                        </div>
                                    ) : user.hasSentRequest ? (
                                        <button className='btn btn-sm btn-disabled gap-2'>
                                            <Clock className='size-4' /> Pending
                                        </button>
                                    ) : (
                                        <button 
                                            className='btn btn-sm btn-primary gap-2'
                                            onClick={() => {
                                                sendFriendRequest(user._id);
                                                setResults(prev => prev.map(u => u._id === user._id ? {...u, hasSentRequest: true} : u));
                                            }}
                                        >
                                            <UserPlus className='size-4' /> Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {results.length === 0 && query.trim() !== "" && !isSearching && (
                            <div className='text-center py-10'>
                                <p className='text-base-content/50'>No users found matching "{query}"</p>
                            </div>
                        )}
                        
                        {!query && (
                            <div className='text-center py-10'>
                                <p className='text-base-content/40'>Start typing to find people...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;