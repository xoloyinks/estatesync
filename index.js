import express from 'express';
import cors from 'cors';
import routes from './src/router/index.js'
import connectDb from './mongo.js';

const server = express();
const PORT = process.env.PORT || 3001
server.use(cors());
server.use(express.json());

server.get('/', (req, res) => {
    res.send('Welcome to the Server!');
});

server.use('/api', routes);

server.listen(PORT, () => {
    connectDb()
    console.log(`Connected to port ${PORT}`);
});