import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 80;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const publicPath = path.join(__dirname, 'public');
const logsFilePath = path.join(__dirname, 'log.txt'); // Changed to log.txt

// Create a write stream to log to the file
const logStream = fs.createWriteStream(logsFilePath, { flags: 'a' });

// Redirect console.log and console.error to the log file
console.log = function (message) {
  logStream.write(`[LOG] ${new Date().toISOString()}: ${message}\n`);
  // Optionally, you can also log to the console if needed
  process.stdout.write(`[LOG] ${new Date().toISOString()}: ${message}\n`);
};

console.error = function (message) {
  logStream.write(`[ERROR] ${new Date().toISOString()}: ${message}\n`);
  // Optionally, you can also log to the console if needed
  process.stderr.write(`[ERROR] ${new Date().toISOString()}: ${message}\n`);
};

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

  server.listen(PORT, function() {
    console.log('Server is listening on port', PORT);
  });
};
