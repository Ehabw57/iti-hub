# WebSocket Events Documentation

## Connection

### Authentication
```javascript
// Client connects with JWT token
const socket = io('http://localhost:3030', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

### Connection Events
- **`connect`** - Fired when successfully connected
- **`connect_error`** - Fired when connection fails (e.g., invalid token)
- **`disconnect`** - Fired when disconnected from server

---

## Emitted Events (Client → Server)

### 1. message:send
Send a real-time message event (used internally, messages are sent via REST API)

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",  // required
  content: "Hello!",                            // optional
  image: "https://...",                         // optional
  senderId: "507f1f77bcf86cd799439012",        // required
  senderName: "John Doe",                       // optional
  messageId: "507f1f77bcf86cd799439013"        // optional
}
```

**Behavior:**
- Emits to all conversation participants except sender
- Works for both individual and group conversations
- Handles offline participants gracefully

---

### 2. message:seen
Notify that user has seen messages in a conversation

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",  // required
  userId: "507f1f77bcf86cd799439012"           // required (user who saw)
}
```

**Behavior:**
- Emits to all conversation participants
- Updates message status to "seen"
- Resets unread count for the user

---

### 3. typing:start
Indicate that user started typing

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",  // required
  userId: "507f1f77bcf86cd799439012"           // required (who is typing)
}
```

**Behavior:**
- Emits to all conversation participants except sender
- Throttled to max 1 event per second per user
- Auto-stops after 3 seconds if no `typing:stop` received

---

### 4. typing:stop
Indicate that user stopped typing

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",  // required
  userId: "507f1f77bcf86cd799439012"           // required (who stopped)
}
```

**Behavior:**
- Emits to all conversation participants except sender
- Clears typing indicator for the user

---

## Received Events (Server → Client)

### 1. message:new
Receive a new message in real-time

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",
  content: "Hello!",
  image: "https://cloudinary.com/...",           // optional
  senderId: "507f1f77bcf86cd799439012",
  senderName: "John Doe",
  messageId: "507f1f77bcf86cd799439013",
  timestamp: "2025-12-15T10:30:00.000Z"
}
```

**Usage:**
```javascript
socket.on('message:new', (data) => {
  console.log('New message:', data);
  // Update UI with new message
});
```

---

### 2. message:seen
Receive notification that someone saw messages

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012",           // who saw the messages
  timestamp: "2025-12-15T10:30:00.000Z"
}
```

**Usage:**
```javascript
socket.on('message:seen', (data) => {
  console.log('Messages seen by:', data.userId);
  // Update message status indicators
});
```

---

### 3. typing:start
Receive notification that someone started typing

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012"            // who is typing
}
```

**Usage:**
```javascript
socket.on('typing:start', (data) => {
  console.log('User typing:', data.userId);
  // Show "User is typing..." indicator
});
```

---

### 4. typing:stop
Receive notification that someone stopped typing

**Payload:**
```javascript
{
  conversationId: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012"            // who stopped typing
}
```

**Usage:**
```javascript
socket.on('typing:stop', (data) => {
  console.log('User stopped typing:', data.userId);
  // Hide "User is typing..." indicator
});
```

---

### 5. user:online (Pending - Requires Connection Model)
Receive notification when a contact comes online

**Payload:**
```javascript
{
  userId: "507f1f77bcf86cd799439012",
  status: "online"
}
```

---

### 6. user:offline (Pending - Requires Connection Model)
Receive notification when a contact goes offline

**Payload:**
```javascript
{
  userId: "507f1f77bcf86cd799439012",
  status: "offline",
  lastSeen: "2025-12-15T10:30:00.000Z"
}
```

---

## Client Implementation Examples

### React + Socket.io-client

```javascript
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

function Chat({ conversationId, token }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    // Connect to server
    const newSocket = io('http://localhost:3030', {
      auth: { token }
    });

    // Listen for new messages
    newSocket.on('message:new', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data]);
      }
    });

    // Listen for typing indicators
    newSocket.on('typing:start', (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    });

    newSocket.on('typing:stop', (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    // Listen for seen status
    newSocket.on('message:seen', (data) => {
      if (data.conversationId === conversationId) {
        // Update message status in UI
        console.log('Messages seen by:', data.userId);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [conversationId, token]);

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing:start', {
        conversationId,
        userId: currentUserId
      });
    }
  };

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('typing:stop', {
        conversationId,
        userId: currentUserId
      });
    }
  };

  return (
    <div>
      {/* Chat UI */}
      {typingUsers.size > 0 && <div>Someone is typing...</div>}
    </div>
  );
}
```

---

## Error Handling

### Authentication Errors
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Possible errors:
  // - "Authentication error: No token provided"
  // - "Authentication error: Invalid token"
  // - "Authentication error: Token expired"
  // - "Authentication error: User not found"
});
```

### Event Errors
Events fail silently on the server if:
- Invalid conversation ID
- Missing required fields
- User not a participant

Client should validate data before emitting events.

---

## Performance Considerations

### Throttling
- **typing:start** events are throttled to 1 per second per user
- **typing:start** auto-triggers **typing:stop** after 3 seconds
- **lastSeen** updates in auth middleware throttled to 1 per 60 seconds

### Multi-device Support
- Users can connect from multiple devices simultaneously
- Each device has its own socket connection
- Events are sent to all active sockets for a user

### Offline Handling
- Events to offline users are skipped (no queuing)
- Messages are stored in database regardless of delivery status
- Users receive missed messages via REST API on reconnection

---

## Security

### Authentication
- All WebSocket connections require valid JWT token
- Token is verified before establishing connection
- Invalid tokens are rejected with `connect_error`

### Authorization
- Users can only receive events for conversations they participate in
- Server validates participation before emitting events
- Blocked users cannot send messages (checked via REST API)

### Rate Limiting
- Typing events throttled per user
- Consider adding connection rate limiting in production

---

## Testing WebSockets

### Using Socket.io-client (Node.js)
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3030', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Emit typing event
  socket.emit('typing:start', {
    conversationId: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012'
  });
});

socket.on('message:new', (data) => {
  console.log('New message:', data);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### Using Browser DevTools
```javascript
// In browser console
const socket = io('http://localhost:3030', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('message:new', console.log);
socket.on('typing:start', console.log);
```
