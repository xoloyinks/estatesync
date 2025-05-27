import express from 'express';
import cors from 'cors';
import routes from './src/router/index.js'


const server = express();

server.use(cors());
server.use(express.json());

server.get('/', (req, res) => {
    res.send('Welcome to the Server!');
});

server.use('/api', routes);

server.listen(3001, () => {
    console.log('Server is running on port 3001');
});