import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { routerConfig } from './routes/Router';
import swaggerDocument from './swagger.json';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import MeiliSearch from 'meilisearch';
import AdminService from './services/AdminService';

dotenv.config();
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const corsMiddleware = (req : Request, res : Response, next : NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Intercept OPTIONS method
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

app.use(corsMiddleware);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Include PATCH method
}));

app.use(
  "/docs",
  corsMiddleware,
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true })
);

routerConfig(app);

export const meiliSearchClient = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'aSampleMasterKey'
});

(async () => {
  try {
    const user = await AdminService.getAllUser();


    await meiliSearchClient.index('discord').addDocuments(user);}
    catch(err){
      console.log(err);
    
    }
  })();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'], // Allow the methods you need
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
});

io.on('connection', (socket: any) => {
  console.log('a user connected');

  socket.emit('hello', 'world');

  socket.on('hello', () => {
    console.log('hello event received');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

export default io;



