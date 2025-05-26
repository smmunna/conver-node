import app from './app';
import { createServer } from 'http';
import { setupSocket } from './socket';

const PORT = process.env.PORT || 3000;
const server = createServer(app);

setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

