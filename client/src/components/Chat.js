import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chat = ({ chatId, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const connectWebSocket = () => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            // Fixed: Connect to port 3001 where your server is actually running
            ws.current = new WebSocket('ws://localhost:3001');
            
            ws.current.onopen = () => {
                console.log('WebSocket connection established.');
                setConnectionStatus('Connected');
                reconnectAttempts.current = 0;
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'chat_message' && message.data.chatId === chatId) {
                        setMessages(prevMessages => [...prevMessages, message.data.message]);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            ws.current.onclose = (event) => {
                console.log('WebSocket connection closed.', event.code, event.reason);
                setConnectionStatus('Disconnected');
                
                // Attempt to reconnect if not a manual close
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    setConnectionStatus(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    setTimeout(connectWebSocket, 3000 * reconnectAttempts.current);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('Connection Error');
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setConnectionStatus('Failed to Connect');
        }
    };

    useEffect(() => {
        // Fetch initial messages from the local server
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/chats/${chatId}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
        connectWebSocket();

        return () => {
            if (ws.current) {
                ws.current.close(1000, 'Component unmounting');
            }
        };
    }, [chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;
        
        const messagePayload = {
            type: 'chat_message',
            data: {
                chatId: chatId,
                message: {
                    text: newMessage,
                    senderId: user.uid,
                    createdAt: new Date().toISOString()
                }
            }
        };

        // Try WebSocket first, fallback to HTTP API
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            try {
                ws.current.send(JSON.stringify(messagePayload));
                setNewMessage('');
            } catch (error) {
                console.error('Failed to send via WebSocket:', error);
                // Fallback to HTTP API
                await sendViaAPI(messagePayload.data.message);
            }
        } else {
            // WebSocket not available, use HTTP API
            await sendViaAPI(messagePayload.data.message);
        }
    };

    const sendViaAPI = async (message) => {
        try {
            await axios.post(`http://localhost:3001/api/chats/${chatId}/messages`, {
                text: message.text,
                senderId: message.senderId
            });
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message via API:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 className="panel-title">Chat with {chatId}</h3>
                <small style={{ 
                    color: connectionStatus === 'Connected' ? '#10b981' : 
                           connectionStatus.includes('Reconnecting') ? '#f59e0b' : '#ef4444',
                    fontSize: '12px'
                }}>
                    {connectionStatus}
                </small>
            </div>
            <div style={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                padding: '10px', 
                background: '#1e293b', 
                borderRadius: '8px',
                minHeight: '300px'
            }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#64748b', marginTop: '50px' }}>
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            style={{ 
                                marginBottom: '10px', 
                                padding: '8px', 
                                borderRadius: '8px', 
                                background: msg.senderId === user.uid ? '#3b82f6' : '#475569', 
                                marginLeft: msg.senderId === user.uid ? 'auto' : '0',
                                maxWidth: '80%'
                            }}
                        >
                            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '12px' }}>
                                {msg.senderId === user.uid ? 'You' : msg.senderId}
                            </p>
                            <p style={{ margin: '0 0 4px 0' }}>{msg.text}</p>
                            <small style={{ fontSize: '10px', opacity: 0.7 }}>
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                            </small>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{ marginTop: '10px', display: 'flex' }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ 
                        flexGrow: 1, 
                        padding: '10px', 
                        border: 'none', 
                        background: '#334155', 
                        color: 'white', 
                        borderRadius: '6px',
                        outline: 'none'
                    }}
                />
                <button 
                    type="submit" 
                    style={{ marginLeft: '10px' }} 
                    className="btn btn-primary"
                    disabled={!newMessage.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;