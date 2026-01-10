const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import Server from socket.io
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const Message = require('./models/Message'); // Import Message model

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// --- ROUTES ---
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/users', authRoutes);
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// --- SOCKET.IO SETUP ---
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow frontend URL
        methods: ["GET", "POST"],
    },
});

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
    });

    socket.on('leave_room', (data) => {
        socket.leave(data);
        console.log(`User with ID: ${socket.id} left room: ${data}`);
    });

    socket.on('send_message', async (data) => {
        // data expects: { roomId, sender (userId), content, senderName }
        console.log('Message Received:', data);

        // Save to DB
        try {
            const newMessage = await Message.create({
                sender: data.sender, // Ensure frontend sends user ID
                content: data.content,
                roomId: data.roomId || 'general',
            });

            // Emit back to room including the saved message info/timestamp
            // We might want to populate sender details if needed, but for now simple echo
            const messageToEmit = {
                ...data,
                _id: newMessage._id,
                timestamp: newMessage.createdAt
            };

            socket.to(data.roomId).emit('receive_message', messageToEmit);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

// Change app.listen to server.listen
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
