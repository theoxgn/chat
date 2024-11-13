const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});


// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'chatbaru',
  password: 'user',
  port: 5432,
});

app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  
    socket.on('user_connected', (userId) => {
      socket.userId = userId;
      io.emit('user_connected');
    });
  
    socket.on('join_room', async (data) => {
      const { userId, roomId } = data;
      socket.join(roomId);
      
      try {
        const result = await pool.query(
          'SELECT EXISTS(SELECT 1 FROM chat_participants WHERE user_id = $1 AND room_id = $2)',
          [userId, roomId]
        );
        
        if (!result.rows[0].exists) {
          await pool.query(
            'INSERT INTO chat_participants (user_id, room_id) VALUES ($1, $2)',
            [userId, roomId]
          );
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });
  
    socket.on('send_message', async (data) => {
      const { roomId, userId, content } = data;
      
      try {
        const result = await pool.query(
          `INSERT INTO messages (room_id, user_id, content) 
           VALUES ($1, $2, $3) 
           RETURNING *, (SELECT username FROM users WHERE id = $2)`,
          [roomId, userId, content]
        );
        
        io.to(roomId).emit('receive_message', result.rows[0]);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });
  
    socket.on('disconnect', () => {
      if (socket.userId) {
        io.emit('user_disconnected');
      }
      console.log('User disconnected:', socket.id);
    });
});

// API Routes
// app.post('/api/users', async (req, res) => {
//   const { username } = req.body;
//   try {
//     const result = await pool.query(
//       'INSERT INTO users (username) VALUES ($1) RETURNING *',
//       [username]
//     );
//     res.json(result.rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/rooms', async (req, res) => {
//   try {
//     const result = await pool.query('INSERT INTO chat_rooms DEFAULT VALUES RETURNING *');
//     res.json(result.rows[0]);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

app.post('/api/rooms', async (req, res) => {
    const { user1Id, user2Id } = req.body;
    
    try {
      // First check if a room already exists for these users
      const existingRoomQuery = `
        SELECT r.id, r.created_at
        FROM chat_rooms r
        JOIN chat_participants p1 ON r.id = p1.room_id
        JOIN chat_participants p2 ON r.id = p2.room_id
        WHERE p1.user_id = $1 AND p2.user_id = $2
      `;
      
      const existingRoom = await pool.query(existingRoomQuery, [user1Id, user2Id]);
      
      if (existingRoom.rows.length > 0) {
        return res.json(existingRoom.rows[0]);
      }
      
      // If no room exists, create a new one
      const result = await pool.query(
        'INSERT INTO chat_rooms DEFAULT VALUES RETURNING *'
      );
      
      const roomId = result.rows[0].id;
      
      // Add both users to the room
      await pool.query(
        'INSERT INTO chat_participants (user_id, room_id) VALUES ($1, $2), ($3, $2)',
        [user1Id, roomId, user2Id]
      );
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating/finding room:', error);
      res.status(500).json({ error: error.message });
    }
});



// app.get('/api/messages/:roomId', async (req, res) => {
//   const { roomId } = req.params;
//   try {
//     const result = await pool.query(
//       `SELECT m.*, u.username 
//        FROM messages m 
//        JOIN users u ON m.user_id = u.id 
//        WHERE room_id = $1 
//        ORDER BY created_at ASC`,
//       [roomId]
//     );
//     res.json(result.rows);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


app.get('/api/messages/:roomId', async (req, res) => {
    const { roomId } = req.params;
    try {
      const result = await pool.query(
        `SELECT m.*, u.username 
         FROM messages m 
         JOIN users u ON m.user_id = u.id 
         WHERE room_id = $1 
         ORDER BY m.created_at ASC`,
        [roomId]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

const checkUserExists = async (username) => {
    const result = await pool.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  };
  
// Updated users endpoint with better handling
app.post('/api/users', async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
  
    try {
      // First check if user exists
      const existingUser = await checkUserExists(username);
      if (existingUser) {
        return res.json(existingUser); // Return existing user instead of creating new one
      }
  
      // Create new user
      const result = await pool.query(
        'INSERT INTO users (username) VALUES ($1) RETURNING id, username',
        [username]
      );
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});
  
  // Add a route to get all users (useful for debugging)
app.get('/api/users', async (req, res) => {
    try {
      const result = await pool.query('SELECT id, username FROM users ORDER BY id');
      res.json(result.rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});
  
// Add a route to reset the sequence if needed
app.post('/api/admin/reset-sequence', async (req, res) => {
    try {
      // Get the maximum id from the users table
      const result = await pool.query('SELECT MAX(id) FROM users');
      const maxId = result.rows[0].max || 0;
  
      // Reset the sequence to the max id + 1
      await pool.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${maxId + 1}`);
      
      res.json({ message: 'Sequence reset successfully', next_id: maxId + 1 });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

// Configure multer for file upload

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Add any file type restrictions here
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
};  

const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: fileFilter
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      // You might want to save file info to your database here
      
      res.json({
        success: true,
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error('Error handling file upload:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
});
  
// Serve uploaded files
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});