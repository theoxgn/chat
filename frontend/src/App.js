import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import {
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Paperclip,
  Smile,
  Send,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  Image as ImageIcon,
  File,
} from 'lucide-react';

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

  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Functions
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

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
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    
    if (!message.trim() || !activeRoom) return;

    const messageData = {
      roomId: activeRoom.id,
      userId,
      content: message.trim()
    };
    
    socket.emit('send_message', messageData);
    setMessage('');
  };

  const handleAttachment = (type) => {
    setShowAttachmentOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };  

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                className="px-4 py-2 bg-[#464775] text-white rounded-lg hover:bg-[#5c5c94]"
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
            className="h-full bg-[#464775] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const FileMessage = ({ msg, isOwn }) => {
    // Check if file is an image
    const isImage = msg.fileType?.startsWith('image/');
    const isVideo = msg.fileType?.startsWith('video/');
  
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        {!isOwn && (
          <div className="w-8 h-8 bg-[#464775] rounded-full flex items-center justify-center text-white text-sm mr-2">
            {msg.username?.[0].toUpperCase()}
          </div>
        )}
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isOwn ? 'bg-[#464775] text-white' : 'bg-[#f0f0f0]'
          }`}
        >
          {!isOwn && (
            <div className="text-sm font-semibold mb-1">
              {msg.username}
            </div>
          )}
          
          <div className="space-y-2">
            {/* File Preview/Download Section */}
            {isImage ? (
              <div className="relative group">
                <img
                  src={msg.fileUrl}
                  alt={msg.fileName}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                  onClick={() => window.open(msg.fileUrl, '_blank')}
                />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={msg.fileUrl}
                    download={msg.fileName}
                    className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⬇️
                  </a>
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
                  <a
                    href={msg.fileUrl}
                    download={msg.fileName}
                    className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⬇️
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 hover:bg-opacity-90 transition-all">
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
                </div>
                <a
                  href={msg.fileUrl}
                  download={msg.fileName}
                  className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⬇️
                </a>
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

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#464775] rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#464775]">Chat Application</h1>
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
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#464775]"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                disabled={loading}
              />
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-[#464775] text-white rounded-lg hover:bg-[#5c5c94] 
                       focus:outline-none focus:ring-2 focus:ring-[#464775] focus:ring-offset-2 
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
    <div className="flex h-screen bg-[#f5f5f5]">
      {/* Left Sidebar - Navigation */}
      <div className="w-12 bg-[#464775] flex flex-col items-center py-4 space-y-4">
        <button type="button" className="p-2 text-white hover:bg-[#5c5c94] rounded">
          <MessageSquare size={20} />
        </button>
        <button type="button" className="p-2 text-white hover:bg-[#5c5c94] rounded">
          <Calendar size={20} />
        </button>
        <button type="button" className="p-2 text-white hover:bg-[#5c5c94] rounded">
          <Users size={20} />
        </button>
        <div className="flex-1" />
        <button 
          type="button"
          onClick={handleLogout}
          className="p-2 text-white hover:bg-[#5c5c94] rounded"
        >
          <Settings size={20} />
        </button>
      </div>
      {/* Chat List Sidebar */}
      <div className="w-80 bg-[#f0f0f0] border-r flex flex-col">
        <div className="p-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-2 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-sm font-semibold text-gray-600">
            Chats
          </div>
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
            users
              .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => startChat(user)}
                  className={`px-3 py-2 cursor-pointer hover:bg-[#e1e1e1] flex items-center space-x-3
                    ${activeRoom?.otherUser?.id === user.id ? 'bg-[#e1e1e1]' : ''}`}
                >
                  <div className="w-10 h-10 bg-[#464775] rounded-full flex items-center justify-center text-white text-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold truncate">{user.username}</h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(new Date())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      Click to start chatting
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b flex items-center justify-between px-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#464775] rounded-full flex items-center justify-center text-white text-sm">
                  {activeRoom.otherUser.username[0].toUpperCase()}
                </div>
                <h2 className="font-semibold">{activeRoom.otherUser.username}</h2>
              </div>
              {/* <div className="flex items-center space-x-3">
                <button type="button" className="p-2 hover:bg-gray-100 rounded-full">
                  <Phone size={20} className="text-[#464775]" />
                </button>
                <button type="button" className="p-2 hover:bg-gray-100 rounded-full">
                  <Video size={20} className="text-[#464775]" />
                </button>
                <button type="button" className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal size={20} className="text-gray-600" />
                </button>
              </div> */}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <FileMessage msg={msg} isOwn={msg.user_id === userId} />
                  ) : (
                    <div
                      className={`flex ${msg.user_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.user_id !== userId && (
                        <div className="w-8 h-8 bg-[#464775] rounded-full flex items-center justify-center text-white text-sm mr-2">
                          {msg.username?.[0].toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.user_id === userId
                            ? 'bg-[#464775] text-white'
                            : 'bg-[#f0f0f0]'
                        }`}
                      >
                        {msg.user_id !== userId && (
                          <div className="text-sm font-semibold mb-1">
                            {msg.username}
                          </div>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="bg-[#f0f0f0] rounded-lg p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="relative">
                    <button 
                      type="button"
                      className="p-2 hover:bg-gray-200 rounded"
                      onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
                    >
                      <Paperclip size={20} className="text-gray-600" />
                    </button>
                    {showAttachmentOptions && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg py-2">
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
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a new message"
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  <button 
                    type="button"
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <Smile size={20} className="text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <Send size={20} className="text-[#464775]" />
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
  );
}

export default App;