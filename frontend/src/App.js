import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { Copy, Forward, Reply, Trash2, MoreVertical, Check } from 'lucide-react';
import axios from 'axios';
import {
  Search,
  Paperclip,
  Smile,
  Send,
  MessageSquare,
  Settings,
  Image as ImageIcon,
  File,
  X
} from 'lucide-react';
import toast from './store/zustand/toast';
import Toast from './components/Toast/Toast';

const socket = io('http://localhost:3001');

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

function App() {

  const { dataToast, setDataToast, setShowToast, showToast } = toast()
  // States
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // New states for responsive design
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // emoji picker
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Add typing states
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false); // Replace typingUsers
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Add new state for online users
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchError, setSearchError] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageStatuses, setMessageStatuses] = useState({});

  //reply
  const [replyingTo, setReplyingTo] = useState(null);

  // Add these new states at the top of your App component
  const [pinnedChats, setPinnedChats] = useState(new Set());

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [showMessageActions, setShowMessageActions] = useState(null); // Store message ID
  const [showCopied, setShowCopied] = useState(false);

  // Functions
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleTypingStart = () => {
    if (!activeRoom) return;
    
    clearTimeout(typingTimeout);
    
    const newTimeout = setTimeout(() => {
      setIsTyping(false);
      fetch('http://localhost:3001/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          userId: userId,
          typing: false
        })
      });
    }, 1000);
    
    setTypingTimeout(newTimeout);
  
    if (!isTyping) {
      setIsTyping(true);
      fetch('http://localhost:3001/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoom.id,
          userId: userId,
          typing: true
        })
      });
    }
  };

  // Modify your message input handling
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTypingStart();
  };

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup emoji picker when component unmounts
  useEffect(() => {
    return () => {
      setShowEmoji(false);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
  
    // Emit online status when user logs in
    socket.emit('user_online', userId);
  
    // Listen for user status changes
    socket.on('user_status_change', ({ userId, online }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (online) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });
  
    // Fetch initial online users
    fetch('http://localhost:3001/api/users/online')
      .then(res => res.json())
      .then(onlineUserIds => {
        setOnlineUsers(new Set(onlineUserIds));
      });
  
    // Cleanup
    return () => {
      socket.emit('user_offline', userId);
      socket.off('user_status_change');
    };
  }, [userId]);

  

  const fetchUsers = useCallback(async () => {
    if (!userId) return;
    
    setUsersLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setUsersLoading(false);
    }
  }, [userId]);

  // Effects
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserId(user.id);
      setUsername(user.username);
    }

    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_connected', () => {
      fetchUsers();
    });

    socket.on('user_disconnected', () => {
      fetchUsers();
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_connected');
      socket.off('user_disconnected');
    };
  }, [fetchUsers]);

  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId, fetchUsers]);
  
  useEffect(() => {
    if (!activeRoom) return;
  
    const pollTypingStatus = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/typing/${activeRoom.id}`);
        const data = await response.json();
        setOtherUserTyping(data.typingUsers.includes(activeRoom.otherUser.id));
      } catch (error) {
        console.error('Error polling typing status:', error);
      }
    }, 1000);
  
    return () => clearInterval(pollTypingStatus);
  }, [activeRoom]);

  const handleLogin = async () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/users', {
        username: username.trim()
      });

      setUserId(response.data.id);
      setUsername(response.data.username);
      localStorage.setItem('chatUser', JSON.stringify(response.data));
      socket.emit('user_connected', response.data.id);
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Error logging in. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    socket.emit('user_offline', userId);
    socket.emit('user_disconnected', userId);
    setUserId(null);
    setUsername('');
    setActiveRoom(null);
    setMessages([]);
    localStorage.removeItem('chatUser');
  };

  const startChat = async (otherUser) => {
    try {
      const response = await axios.post('http://localhost:3001/api/rooms', {
        user1Id: userId,
        user2Id: otherUser.id
      });

      const roomId = response.data.id;
      setActiveRoom({ ...response.data, otherUser });
      
      socket.emit('join_room', { userId, roomId });
      
      const messagesResponse = await axios.get(`http://localhost:3001/api/messages/${roomId}`);
      setMessages(messagesResponse.data);

      if (isMobile) {
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Add function to mark messages as read
  const markMessagesAsRead = useCallback(async (roomId) => {
    if (!activeRoom) return;

    const unreadMessages = messages
      .filter(msg => msg.user_id !== userId && !msg.read)
      .map(msg => msg.id);

    if (unreadMessages.length === 0) return;

    try {
      await axios.post('http://localhost:3001/api/messages/read', {
        roomId,
        userId,
        messageIds: unreadMessages
      });

      // Update local message statuses
      setMessageStatuses(prev => {
        const newStatuses = { ...prev };
        unreadMessages.forEach(messageId => {
          newStatuses[messageId] = {
            ...newStatuses[messageId],
            read: true,
            readAt: new Date()
          };
        });
        return newStatuses;
      });

      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [roomId]: 0
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [activeRoom, messages, userId]); // Add dependencies here

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || !activeRoom) return;

    setMessage(''); // Clear input
    setShowEmoji(false); // Close emoji picker
    clearTimeout(typingTimeout);
    
    setIsTyping(false);
    fetch('http://localhost:3001/api/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: activeRoom.id,
        userId: userId,
        typing: false
      })
    });

    const messageData = {
      roomId: activeRoom.id,
      userId,
      content: message.trim(),
      created_at: new Date(),
      read: false,
      replied_to_message: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        username: replyingTo.username,
        user_id: replyingTo.user_id
      } : null
    };

    try {
      const response = await axios.post('http://localhost:3001/api/messages', messageData);
      const messageId = response.data.id;
  
      // Update message statuses
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: {
          sent: true,
          delivered: false,
          read: false
        }
      }));
  
      socket.emit('send_message', { ...messageData, id: messageId });
      setMessage('');
      setReplyingTo(null); // Clear reply state after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAttachment = (type) => {
    setShowAttachmentOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };  

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Function to get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  const handleFileUpload = async (file) => {
    if (!file || !activeRoom) return;
    
    setIsUploading(true);
    setUploadProgress(0);
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', activeRoom.id);
    formData.append('userId', userId);
    formData.append('filename', file.name);
  
    try {
      const uploadResponse = await axios.post(
        'http://localhost:3001/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          }
        }
      );
  
      const fileMessage = {
        roomId: activeRoom.id,
        userId: userId,
        content: 'Sent a file: ' + file.name,
        fileUrl: uploadResponse.data.fileUrl,
        fileName: file.name,
        fileType: getFileIcon(file.type),
        fileSize: file.size,
        messageType: 'file'
      };
      console.log(fileMessage)
      socket.emit('send_message', fileMessage);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };  

  const FilePreview = ({ file, onClose, onUpload }) => {
    const isImage = file?.type.startsWith('image/');
    const isPDF = file?.type === 'application/pdf';
    const isVideo = file?.type.startsWith('video/');
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">File Preview</h3>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-3xl">
                {isImage ? '🖼️' : isPDF ? '📄' : isVideo ? '🎥' : '📁'}
              </div>
              <div>
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
  
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              {isImage && (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="max-w-full h-auto rounded"
                />
              )}
              {isPDF && (
                <iframe
                  src={URL.createObjectURL(file)}
                  title={file.name}
                  className="w-full h-96 rounded"
                />
              )}
              {isVideo && (
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full rounded"
                />
              )}
              {!isImage && !isPDF && !isVideo && (
                <div className="text-center py-8 text-gray-500">
                  Preview not available for this file type
                </div>
              )}
            </div>
  
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onUpload}
                className="px-4 py-2 bg-[#176cf7] text-white rounded-lg hover:bg-[#002D84]"
              >
                Send File
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add this component for upload progress
  const UploadProgress = ({ progress }) => {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm font-medium">Uploading file...</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#176cf7] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const FileMessage = ({ msg, isOwn }) => {

    // Check file type
    const isImage = msg.fileType?.startsWith('image/');
    const isVideo = msg.fileType?.startsWith('video/');
    const isPDF = msg.fileType?.includes('pdf');

    // Progress state for download
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
  
    const handleDownload = async (url, filename) => {
      try {
        setIsDownloading(true);
        
        const response = await axios({
          url,
          method: 'GET',
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress(progress);
          },
        });
  
        // Create blob link to download
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
      } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download file. Please try again.');
      } finally {
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    };
  
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        {!isOwn && (
          <div className="w-8 h-8 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm mr-2">
            {msg.username?.[0].toUpperCase()}
          </div>
        )}
        <div className={`
          max-w-[70%] rounded-lg p-3 
          ${isOwn ? 'bg-[#176cf7] text-white' : 'bg-[#f0f0f0]'}
        `}>
          {!isOwn && (
            <div className="text-sm font-semibold mb-1">{msg.username}</div>
          )}
          
          <div className="space-y-2">
            {/* Image Preview */}
            {isImage ? (
              <div className="relative group">
                <img
                  src={msg.fileUrl}
                  alt={msg.fileName}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                  onClick={() => window.open(msg.fileUrl, '_blank')}
                />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                    disabled={isDownloading}
                    className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    {isDownloading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : isVideo ? (
              <div className="relative group">
                <video
                  src={msg.fileUrl}
                  controls
                  className="max-w-full rounded-lg"
                />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                    disabled={isDownloading}
                    className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                  >
                    {isDownloading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 hover:bg-opacity-90 transition-all p-2 rounded-lg">
                <div className="text-2xl">
                  {msg.fileType?.includes('pdf') ? '📄' :
                   msg.fileType?.includes('word') ? '📝' :
                   msg.fileType?.includes('excel') ? '📊' : '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {msg.fileName}
                  </div>
                  <div className="text-xs opacity-70">
                    {formatFileSize(msg.fileSize)}
                  </div>
                  {isDownloading && (
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-full bg-[#176cf7] rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(msg.fileUrl, msg.fileName)}
                  disabled={isDownloading}
                  className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full focus:outline-none focus:ring-2"
                >
                  {isDownloading ? (
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </button>
              </div>
            )}
            
            {/* Message Time */}
            <div className="text-xs opacity-70 text-right">
              {formatTime(msg.created_at)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Add TypingIndicator component
  // const TypingIndicator = () => (
  //   <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-xl max-w-[100px]">
  //     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
  //     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
  //     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  //   </div>
  // );

  const TypingIndicator = ({ username }) => {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>{username} is typing</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '0ms' }}/>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '200ms' }}/>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
               style={{ animationDelay: '400ms' }}/>
        </div>
      </div>
    );
  };

  // Update emoji click handler
  const handleEmojiClick = (emojiData, event) => {
    console.log("Emoji clicked:", emojiData); // For debugging
    
    const emoji = emojiData.emoji;
    const input = inputRef.current;
    
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const beforeCursor = message.slice(0, start);
      const afterCursor = message.slice(end);
      const newMessage = beforeCursor + emoji + afterCursor;
      
      setMessage(newMessage);
      
      // Set cursor position after the inserted emoji
      setTimeout(() => {
        const newPosition = start + emoji.length;
        input.focus();
        input.setSelectionRange(newPosition, newPosition);
      }, 10);
    } else {
      // Fallback if input ref not available
      setMessage(prevMessage => prevMessage + emoji);
    }
  };

  // Add Online Status Indicator component
  const OnlineStatusIndicator = ({ isOnline }) => (
    <div className={`
      w-3 h-3 rounded-full 
      ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
      absolute bottom-0 right-0 
      border-2 border-white
    `} />
  );

  const ReadReceipt = ({ status }) => {
    let icon = '✓'; // Single check for sent
    let color = 'text-gray-400';
  
    if (status === 'delivered') {
      icon = '✓✓'; // Double check for delivered
      color = 'text-gray-400';
    } else if (status === 'read') {
      icon = '✓✓'; // Double check in blue for read
      color = 'text-blue-500';
    }
  
    return (
      <span className={`text-xs ${color} ml-1`}>
        {icon}
      </span>
    );
  };
  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };
  
  const handleReplyMessage = (message) => {
    // setReplyingTo(message);
    // setShowMessageActions(null);
    setReplyingTo({
      id: message.id,
      content: message.content,
      username: message.username,
      user_id: message.user_id
    });
    setShowMessageActions(null);
    inputRef.current?.focus();
  };
  
  const handleForwardMessage = (message) => {
    setShowMessageActions(null);
    // Show forward modal with existing users list
    const forwardTo = window.prompt('Enter user ID to forward to:');
    if (forwardTo) {
      socket.emit('send_message', {
        roomId: forwardTo,
        userId: userId,
        content: `Forwarded: ${message.content}`,
        created_at: new Date(),
      });
    }
  };
  
  const handleDeleteMessage = async (messageId) => {
    try {
      // Only allow deleting messages less than 5 minutes old
      const message = messages.find(m => m.id === messageId);
      const messageTime = new Date(message.created_at).getTime();
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
  
      if (now - messageTime > fiveMinutes) {
        alert('Messages can only be deleted within 5 minutes of sending');
        return;
      }
  
      await axios.delete(`http://localhost:3001/api/messages/${messageId}`);
      setMessages(messages.filter(m => m.id !== messageId));
      setShowMessageActions(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };
  
  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.message-actions')) {
        setShowMessageActions(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add function to fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/messages/unread/${userId}`);
      const counts = {};
      response.data.forEach(item => {
        counts[item.room_id] = parseInt(item.count);
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, [userId]); // Add userId as dependency

  // Add read receipt handling
  useEffect(() => {
    if (!userId) return;

    // Listen for read receipts
    socket.on('messages_read', ({ roomId, userId: readByUserId, messageIds, readAt }) => {
      setMessageStatuses(prev => {
        const newStatuses = { ...prev };
        messageIds.forEach(messageId => {
          newStatuses[messageId] = {
            ...newStatuses[messageId],
            read: true,
            readAt: readAt
          };
        });
        return newStatuses;
      });
    });

    // Fetch initial unread counts
    fetchUnreadCounts();

    return () => {
      socket.off('messages_read');
    };
  }, [userId,fetchUnreadCounts]);

  
  // Update message viewing logic
  useEffect(() => {
    if (activeRoom) {
      markMessagesAsRead(activeRoom.id);
    }
  }, [activeRoom, messages, markMessagesAsRead]);

  // Add new function to handle pin/unpin chats
  const handlePinChat = (user, e) => {
    e.stopPropagation(); // Prevent chat selection when pinning
    const isPinned = pinnedChats.has(user.id);
    
    if (isPinned) {
      const newPinnedChats = new Set(pinnedChats);
      newPinnedChats.delete(user.id);
      setPinnedChats(newPinnedChats);
      localStorage.setItem('pinnedChats', JSON.stringify([...newPinnedChats]));
    } else {
      const newPinnedChats = new Set([...pinnedChats, user.id]);
      setPinnedChats(newPinnedChats);
      localStorage.setItem('pinnedChats', JSON.stringify([...newPinnedChats]));
    }
  };

  const handleChangeProfile = () => {
    setDataToast({
      type: "error",
      message: "Nama baru saja diperbarui. Penggantian nama selanjutnya dapat dilakukan dalam 30 hari lagi"
    })
    setShowToast(true)
  }

  // Add useEffect to load pinned chats from localStorage
  useEffect(() => {
    const savedPinnedChats = localStorage.getItem('pinnedChats');
    if (savedPinnedChats) {
      setPinnedChats(new Set(JSON.parse(savedPinnedChats)));
    }
  }, []);

  // Add this helper function to sort users
  const sortUsers = (users) => {
    return [...users].sort((a, b) => {
      // First sort by pinned status
      if (pinnedChats.has(a.id) && !pinnedChats.has(b.id)) return -1;
      if (!pinnedChats.has(a.id) && pinnedChats.has(b.id)) return 1;
      // Then sort by username
      return a.username.localeCompare(b.username);
    });
  };

  const PinIcon = ({ isPinned, onClick }) => (
    <button
      onClick={onClick}
      className={`
        p-1.5 rounded-full hover:bg-gray-200 transition-all
        ${isPinned ? 'text-[#176cf7]' : 'text-gray-400'}
        opacity-0 group-hover:opacity-100
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={isPinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="17" x2="12" y2="3" />
        <path d="M5 17h14v2H5z" />
        <path d="M15 7H9v8h6V7z" />
      </svg>
    </button>
  );

  const SearchMessages = ({ isOpen, onClose, roomId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef(null);
    const resultsContainerRef = useRef(null);
  
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);
    const handleSearch = useCallback(async () => {
      if (!searchQuery.trim() || !roomId) return;
    
      setIsSearching(true);
      setSearchError(null);
    
      try {
        const response = await axios.get(`http://localhost:3001/api/messages/search/${roomId}`, {
          params: {
            query: searchQuery.trim()
          }
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching messages:', error);
        setSearchError(error.response?.data?.error || 'Failed to search messages');
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, [searchQuery, roomId]);
  
    // Enhanced scroll to message function
    const scrollToMessage = useCallback((messageId, timestamp) => {
      // Try to find the message by ID first
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
  
      if (messageElement) {
        // Remove any existing highlights
        document.querySelectorAll('.message-highlight').forEach(el => {
          el.classList.remove('message-highlight');
        });
  
        // Scroll the message into view
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
  
        // Add highlight effect
        messageElement.classList.add('message-highlight');
  
        // Remove highlight after animation
        setTimeout(() => {
          messageElement.classList.remove('message-highlight');
        }, 3000);
      } else {
        // Fallback: If message not found by ID, try to find by timestamp
        const messageTime = new Date(timestamp).getTime();
        const messageElements = document.querySelectorAll('[data-message-time]');
        let closestMessage = null;
        let minTimeDiff = Infinity;
  
        messageElements.forEach(element => {
          const elementTime = parseInt(element.getAttribute('data-message-time'));
          const timeDiff = Math.abs(elementTime - messageTime);
          
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestMessage = element;
          }
        });
  
        if (closestMessage) {
          closestMessage.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
  
          closestMessage.classList.add('message-highlight');
          setTimeout(() => {
            closestMessage.classList.remove('message-highlight');
          }, 3000);
        }
      }
      
      // Close search modal
      onClose();
    }, [onClose]);
  
    // Debounce search
    useEffect(() => {
      const timer = setTimeout(() => {
        if (searchQuery.trim()) {
          handleSearch();
        }
      }, 300);
  
      return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);
  
    if (!isOpen) return null;
  
    return (
      <div className="absolute inset-0 bg-white z-50 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 bg-gray-100 rounded-lg outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
  
        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4" ref={resultsContainerRef}>
          {isSearching ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-6 w-6 border-2 border-[#176cf7] border-t-transparent rounded-full" />
            </div>
          ) : searchError ? (
            <div className="text-center text-red-500 mt-8">
              {searchError}
            </div>
          ) : searchResults ? (
            <div className="space-y-6">
              {searchResults.totalResults === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No messages found
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-500">
                    Found {searchResults.totalResults} results
                  </div>
                  {Object.entries(searchResults.groupedResults).map(([date, messages]) => (
                    <div key={date} className="space-y-2">
                      <div className="sticky top-0 bg-white py-2 z-10">
                        <div className="text-sm font-medium text-gray-500">
                          {new Date(date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                            onClick={() => scrollToMessage(message.id, message.created_at)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm">
                                  {message.username[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-sm">
                                  {message.username}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              {message.content.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                                part.toLowerCase() === searchQuery.toLowerCase() ? (
                                  <span key={i} className="bg-yellow-200 rounded px-1">
                                    {part}
                                  </span>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] p-4">
        <div className="bg-white p-6 lg:p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#176cf7] rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#176cf7]">Chat Application</h1>
            <p className="text-gray-500 mt-2">Sign in to start chatting</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176cf7]"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                disabled={loading}
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[#176cf7] text-white rounded-lg hover:bg-[#002D84] 
                       focus:outline-none focus:ring-2 focus:ring-[#176cf7] focus:ring-offset-2 
                       disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showToast ? (
        <Toast classname="z-[2]" type={dataToast?.type}>
          {dataToast?.message}
        </Toast>
      ) : null}
      <div className='py-6 px-18'>
        <div className="flex h-[calc(100vh_-_48px)] bg-[#f5f5f5] rounded-lg">
          {/* Desktop Navigation Sidebar */}
          <div className="hidden lg:flex w-[268px] bg-[#F8F8F8] p-3 flex-col justify-between">
            <div className='space-y-3'>
              <div className='pb-3 border-b-[1px] border-b-[#EBEBEB]'>
                Sesuatu
              </div>
              <div className='flex flex-row items-center gap-x-3'>
                <div className='rounded-[48px] border-[#EBEBEB] border-[1px] p-[9px] space-y-0'>
                  <img src="/icons/favourite-blue.svg" />
                </div>
                <span className='font-semibold text-[14px] leading-[16.8px] text-[#1B1B1B] items-center'>Obrolan Favorit</span>
              </div>
            </div>
            <div className='pt-3 border-t-[1px] border-t-[#EBEBEB] flex flex-row justify-between items-center'>
              <div className='flex flex-row gap-x-3'>
                <div>
                  Foto
                </div>
                <span>Daffa</span>
              </div>
              <span className='underline font-medium text-[12px] leading-[14.4px] text-[#176CF7] cursor-pointer' onClick={handleChangeProfile}>
                Ubah Nama
              </span>
            </div>
            {/* <button type="button" className="p-2 text-white hover:bg-[#002D84] rounded">
              <MessageSquare size={20} />
            </button>
            <div className="flex-1" />
            <button 
              type="button"
              onClick={handleLogout}
              className="p-2 text-white hover:bg-[#002D84] rounded"
            >
              <Settings size={20} />
            </button> */}
          </div>

          {/* Chat List Sidebar */}
          <div className={`${
            showSidebar ? 'flex' : 'hidden'
          } w-full lg:w-80 bg-white lg:bg-[#f0f0f0] border-r flex-col absolute lg:relative z-20 h-full`}>
            <div className="p-3 flex items-center justify-between border-b">
              {isMobile && activeRoom && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              )}
              <div className="flex-1 px-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-full text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-2 top-2 text-gray-400" size={16} />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {pinnedChats.size > 0 && (
                <div className="px-3 py-2 text-sm font-semibold text-gray-600">
                  Pinned Chats
                </div>
              )}
              {error ? (
                <div className="p-4 text-center text-red-500">
                  Failed to load users. Please try again.
                </div>
              ) : usersLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                <>
                  {sortUsers(users.filter(user => 
                    user.username.toLowerCase().includes(searchTerm.toLowerCase())
                  )).map((user) => {
                    const isPinned = pinnedChats.has(user.id);
                    
                    return (
                      <div
                        key={user.id}
                        className={`group px-3 py-2 cursor-pointer hover:bg-[#e1e1e1] flex items-center space-x-3
                          ${activeRoom?.otherUser?.id === user.id ? 'bg-[#e1e1e1]' : ''}
                          ${isPinned ? 'border-l-2 border-[#176cf7]' : ''}
                        `}
                      >
                        <div className="relative flex-1 flex items-center space-x-3" onClick={() => startChat(user)}>
                          <div className="relative">
                            <div className="w-10 h-10 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm">
                              {user.username[0].toUpperCase()}
                            </div>
                            <OnlineStatusIndicator isOnline={onlineUsers.has(user.id)} />
                            {unreadCounts[user.id] > 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                                {unreadCounts[user.id]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold truncate">
                                {user.username}
                                {isPinned && (
                                  <span className="ml-2 text-xs text-[#176cf7]">
                                    📌 Pinned
                                  </span>
                                )}
                                <span className="ml-2 text-xs text-gray-500">
                                  {onlineUsers.has(user.id) ? 'online' : 'offline'}
                                </span>
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(new Date())}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              Click to start chatting
                            </p>
                          </div>
                        </div>
                        <PinIcon 
                          isPinned={isPinned}
                          onClick={(e) => handlePinChat(user, e)}
                        />
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`flex-1 flex flex-col bg-white relative ${
            isMobile && showSidebar ? 'hidden' : 'flex'
          }`}>
            {activeRoom ? (
              <>
                {/* Chat Header - Modified for mobile */}
                <div className="h-14 border-b flex items-center justify-between px-4">
                  <div className="flex items-center space-x-3">
                  {isMobile && (
                      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-4 z-50">
                        <button 
                          onClick={() => setShowSidebar(true)}
                          className="p-3 text-gray-600 hover:text-[#176cf7] focus:outline-none focus:ring-2"
                        >
                          <MessageSquare size={24} />
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="p-3 text-gray-600 hover:text-[#176cf7] focus:outline-none focus:ring-2"
                        >
                          <Settings size={24} />
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <div className="w-8 h-8 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm">
                        {activeRoom.otherUser.username[0].toUpperCase()}
                      </div>
                      <OnlineStatusIndicator isOnline={onlineUsers.has(activeRoom.otherUser.id)} />
                    </div>
                    <div>
                      <h2 className="font-semibold">{activeRoom.otherUser.username}</h2>
                      <span className="text-xs text-gray-500">
                        {onlineUsers.has(activeRoom.otherUser.id) ? 'online' : 'offline'}
                      </span>
                    </div>
                  </div>
                  {/* Add the search button here */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setIsSearchOpen(true)} 
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Search size={20} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                  {/* Add SearchMessages component here */}
                  {activeRoom && (
                    <SearchMessages
                      isOpen={isSearchOpen}
                      onClose={() => setIsSearchOpen(false)}
                      roomId={activeRoom.id}
                    />
                  )}

                {/* Messages Area */}
                {/* <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4 pb-20 lg:pb-4"> */}
                <div className={`
                  flex-1 overflow-y-auto p-3 lg:p-4 space-y-4
                  ${isMobile ? 'pb-7' : 'pb-6'} // Increase bottom padding on mobile
                `}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const maxSize = 10 * 1024 * 1024; // 10MB max
                        if (file.size > maxSize) {
                          alert('File size should not exceed 10MB');
                          return;
                        }
                        setPreview(file);
                        setShowPreview(true);
                      }
                      e.target.value = ''; // Reset input
                    }}
                  />
                  {showPreview && preview && (
                    <FilePreview
                      file={preview}
                      onClose={() => {
                        setShowPreview(false);
                        setPreview(null);
                      }}
                      onUpload={() => {
                        handleFileUpload(preview);
                        setShowPreview(false);
                        setPreview(null);
                      }}
                    />
                  )}

                  {isUploading && <UploadProgress progress={uploadProgress} />}
                  
                  {messages.map((msg, index) => (
                    <div key={index}>
                      {msg.messageType === 'file' ? (
                        <FileMessage 
                          msg={msg} 
                          isOwn={msg.user_id === userId} 
                          readStatus={messageStatuses[msg.id]}
                        />
                      ) : (
                        <div
                          data-message-id={msg.id}
                          data-message-time={new Date(msg.created_at).getTime()}
                          className={`flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'} group`}
                        >
                          {msg.user_id !== userId && (
                            <div className="w-8 h-8 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm mr-2">
                              {msg.username?.[0].toUpperCase()}
                            </div>
                          )}
                          <div className="relative">
                            {/* Message Actions Button - Positioned relative to message */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMessageActions(msg.id === showMessageActions ? null : msg.id);
                              }}
                              className={`absolute top-2 ${msg.user_id === userId ? 'left-0 -ml-8' : 'right-0 -mr-8'} 
                                opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 
                                transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-300`}
                            >
                              <MoreVertical size={16} className="text-gray-500" />
                            </button>

                            {/* Message Actions Menu - Positioned relative to button */}
                            {showMessageActions === msg.id && (
                              <div className={`absolute ${msg.user_id === userId ? 'right-0' : 'left-0'} 
                                top-0 mt-8 w-48 bg-white rounded-lg shadow-lg py-1 z-50 message-actions`}
                              >
                                <button
                                  onClick={() => handleCopyMessage(msg.content)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  {showCopied ? (
                                    <>
                                      <Check size={16} className="text-green-500" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={16} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleForwardMessage(msg)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <Forward size={16} />
                                  <span>Forward</span>
                                </button>

                                <button
                                  onClick={() => handleReplyMessage(msg)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <Reply size={16} />
                                  <span>Reply</span>
                                </button>

                                {msg.user_id === userId && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-500"
                                  >
                                    <Trash2 size={16} />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            )}
                            
                            <div
                              className={`max-w rounded-lg p-3 ${
                                msg.user_id === userId
                                  ? 'bg-[#176cf7] text-white'
                                  : 'bg-[#f0f0f0]'
                              }`}
                            >
                              {msg.user_id !== userId && (
                                <div className="text-sm font-semibold mb-1">
                                  {msg.username}
                                </div>
                              )}
                              {/* Reply preview */}
                              {/* {msg.replied_to_message && (
                                <div className={`text-sm mb-2 p-2 rounded ${
                                  msg.user_id === userId ? 'bg-[#5c5c94]' : 'bg-gray-200'
                                }`}>
                                  <div className="font-medium text-xs">
                                    Replying to {msg.replied_to_message.username}
                                  </div>
                                  <div className="truncate">
                                    {msg.replied_to_message.content}
                                  </div>
                                </div>
                              )} */}
                                {msg.replied_to_message && (
                                  <div 
                                    className={`text-sm mb-2 p-2 rounded cursor-pointer ${
                                      msg.user_id === userId ? 'bg-[#002D84] bg-opacity-50' : 'bg-gray-200'
                                    }`}
                                    onClick={() => {
                                      const repliedMessageEl = document.querySelector(
                                        `[data-message-id="${msg.replied_to_message.id}"]`
                                      );
                                      if (repliedMessageEl) {
                                        repliedMessageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        repliedMessageEl.classList.add('message-highlight');
                                        setTimeout(() => {
                                          repliedMessageEl.classList.remove('message-highlight');
                                        }, 2000);
                                      }
                                    }}
                                  >
                                    <div className="font-medium text-xs flex items-center gap-1">
                                      <Reply size={12} />
                                      Reply to {msg.replied_to_message.username}
                                    </div>
                                    <div className="truncate mt-1 opacity-90">
                                      {msg.replied_to_message.content}
                                    </div>
                                  </div>
                                )}
                              <p className="text-sm break-words">{msg.content}</p>
                              <div className="text-xs mt-1 opacity-70 flex items-center justify-end space-x-1">
                                <span>{formatTime(msg.created_at)}</span>
                                {msg.user_id === userId && (
                                  <ReadReceipt 
                                    status={messageStatuses[msg.id]?.read ? 'read' : 
                                            messageStatuses[msg.id]?.delivered ? 'delivered' : 'sent'} 
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {activeRoom && otherUserTyping && (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-[#176cf7] rounded-full flex items-center justify-center text-white text-sm">
                        {activeRoom.otherUser.username[0].toUpperCase()}
                      </div>
                      <TypingIndicator />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-2 lg:p-4 bg-white relative">
                  <div className={`
                  bg-[#f0f0f0] rounded-lg p-2
                  ${isMobile ? 'mb-16' : ''} // Add margin bottom on mobile to account for nav bar
                `}>
                  {/* Add reply preview */}
                  {replyingTo && (
                    <div className="bg-gray-200 p-2 mb-2 rounded-lg flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-[#176cf7]">
                          Replying to {replyingTo.username}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {replyingTo.content}
                        </div>
                      </div>
                      <button onClick={() => setReplyingTo(null)}>
                        <X size={16} className="text-gray-500" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative">
                      <button 
                        type="button"
                        className="p-2 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#176cf7]"
                        onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                      >
                        <Paperclip size={20} className="text-gray-600" />
                      </button>
                      {showAttachmentOptions && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg py-2 z-50">
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                            onClick={() => handleAttachment('image')}
                          >
                            <ImageIcon size={16} />
                            <span>Image</span>
                          </button>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                            onClick={() => handleAttachment('file')}
                          >
                            <File size={16} />
                            <span>File</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={handleMessageChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a new message"
                      className="flex-1 bg-transparent outline-none text-sm p-2 rounded"
                    />

                    {/* Emoji Button and Picker */}
                    <div className="relative" ref={emojiPickerRef}>
                      <button 
                        type="button"
                        className="p-2 hover:bg-gray-200 rounded"
                        onClick={() => setShowEmoji(!showEmoji)}
                      >
                        <Smile size={20} className="text-gray-600" />
                      </button>
                      
                      {showEmoji && (
                        <div className="absolute bottom-full right-0 mb-2">
                          <div className="relative bg-white rounded-lg shadow-lg">
                            <button
                              className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmoji(false);
                              }}
                            >
                              <X size={16} />
                            </button>
                            <EmojiPicker
                              onEmojiClick={handleEmojiClick}
                              autoFocusSearch={false}
                              searchDisabled
                              skinTonesDisabled
                              height={350}
                              width={280}
                              previewConfig={{
                                showPreview: false
                              }}
                              lazyLoadEmojis={true}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      className={`
                        p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#176cf7]
                        ${message.trim() ? 'hover:bg-gray-200' : 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <Send size={20} className="text-[#176cf7]" />
                    </button>
                  </div>
                </div>
              </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-medium text-gray-600">
                    Select a chat to start messaging
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Choose a user from the list to begin a conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;