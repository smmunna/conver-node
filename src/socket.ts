import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface User {
    id: string;
    name: string;
    room: string;
}

interface RoomData {
    messages: { user: string; text: string }[];
    users: Map<string, User>;
}

const rooms = new Map<string, RoomData>();

export function setupSocket(server: HTTPServer) {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('joinRoom', ({ username, room }) => {
            if (!rooms.has(room)) {
                rooms.set(room, { messages: [], users: new Map() });
            }

            const roomData = rooms.get(room)!;
            const user: User = { id: socket.id, name: username, room };
            roomData.users.set(socket.id, user);
            socket.join(room);

            // Send existing chat history
            socket.emit('chatHistory', roomData.messages);

            // Broadcast user count
            io.to(room).emit('userCount', roomData.users.size);

            // List of users
            const userList = Array.from(roomData.users.values()).map(u => u.name);
            io.to(room).emit('userList', userList);

            // Notify others in the room
            socket.to(room).emit('chat message', { user: 'System', text: `${username} joined the room.` });
        });

        socket.on('chat message', (msg) => {
            const roomName = Array.from(rooms.values()).find(r => r.users.has(socket.id))?.users.get(socket.id)?.room;
            if (!roomName) return;

            const user = rooms.get(roomName)!.users.get(socket.id);
            if (!user) return;

            const message = { user: user.name, text: msg };
            rooms.get(roomName)!.messages.push(message);

            io.to(roomName).emit('chat message', message);
        });

        socket.on('typing', () => {
            const user = getUser(socket.id);
            if (user) {
                socket.to(user.room).emit('typing', user.name);
            }
        });

        socket.on('stop typing', () => {
            const user = getUser(socket.id);
            if (user) {
                socket.to(user.room).emit('stop typing', user.name);
            }
        });

        socket.on('disconnect', () => {
            for (const [roomName, roomData] of rooms.entries()) {
                if (roomData.users.has(socket.id)) {
                    const username = roomData.users.get(socket.id)!.name;

                    // Remove the user
                    roomData.users.delete(socket.id);

                    // Broadcast updated user count
                    io.to(roomName).emit('userCount', roomData.users.size);

                    // Broadcast updated user list
                    const userList = Array.from(roomData.users.values()).map(u => u.name);
                    io.to(roomName).emit('userList', userList);

                    // Notify others
                    io.to(roomName).emit('chat message', { user: 'System', text: `${username} left the room.` });

                    break;
                }
            }
        });

    });

    function getUser(id: string): User | undefined {
        for (const roomData of rooms.values()) {
            if (roomData.users.has(id)) return roomData.users.get(id);
        }
    }
}
