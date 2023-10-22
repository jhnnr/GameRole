import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8080;

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const filename = 'logs.txt';


// Check if the file exists
if (!fs.existsSync(filename)) {
  // If it doesn't exist, create the file
  fs.writeFileSync(filename, '', 'utf-8');
  console.log(`The ${filename} file has been created.`);
} else {
  //console.log(`The ${filename} file already exists.`);
}

const publicPath = path.join(__dirname, 'public');
const logsFilePath = path.join(__dirname, filename);

export const logs = () => {
  // Serve static files
  app.use(express.static(publicPath));

  // Handle /logs endpoint
  app.get('/logs', (req, res) => {
    fs.readFile(logsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading logs file:', err);
        res.status(500).send('Error reading logs');
      } else {
        res.send(data);
      }
    });
  });

  // WebSocket connection handling
  io.on('connection', function(socket) {
    console.log('logger connected');

    // Stream log updates to connected clients
    const stream = fs.createReadStream(logsFilePath, { encoding: 'utf8', start: 0 });
    stream.on('data', (data) => {
      socket.emit('logUpdate', data);
    });

    // Handle errors
    stream.on('error', (error) => {
      console.error('Error occurred while streaming logs:', error);
    });

    // Clean up when the client disconnects
    socket.on('disconnect', function() {
      console.log('logger disconnected');
      stream.destroy();
    });
  });

  server.listen(PORT,'0.0.0.0', function() {
    const serverAddress = server.address(); // Get the server address info
    console.log('Server is listening on port',serverAddress.address, PORT);
  });
};
