import "reflect-metadata";
import { createConnection, getConnectionOptions } from "typeorm";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloWorldResolver } from "./resolvers/HelloWorldResolver";
import makeId from "./const/utils";
import { router } from "websocket";
const cors = require("cors");

(async () => {

 // const state = {}
  const clientRooms: any = {}

  const app = express();
  app.use(cors())
  app.use(express.json());
  const http = require("http").Server(app);  
  const io = require("socket.io")(http, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (client: any) => {    
    
    const handleNewGame = () => {
      let roomName = makeId(5)
      clientRooms[client.id] = roomName;
      client.emit('gameCode', roomName);
      client.join(roomName);
      client.number = 1;
      client.emit('create', 1, roomName);
      console.log(roomName);

      //send to game screen, use the emit roomname as the header in the navbar or
      //make a details tab on the left side of the screen
    }

    const handleJoinGame = async (roomName: string) => {
      console.log(client.id);
      roomName.trim
      roomName.toString
      const room = await io.in(roomName).allSockets()
      console.log(roomName);
      
      console.log(room);
    let numClients = 0;
    if (room) {
      numClients = room.size
      console.log(numClients);
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 1) {
      console.log("too many players");
      client.emit('tooManyPlayers');
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit('join', 2, roomName)
    //now we can start the game!!
 }

    // const emitGameState = (roomName: any, state: any) => {
    //   io.sockets.in(roomName)
    //   .emit('gameState', JSON.stringify(state))
    // }

    // const emitGameOver = (roomName: any, winner: any) => {
    //   io.sockets.in(roomName)
    //   .emit('gameOver', JSON.stringify({winner}))
    // }

    client.on("newGame", handleNewGame)
    client.on("joinGame", handleJoinGame)
  });
  io.listen(4001);

  // const startGameInterval = (client: any, state: any) => {
  //   const intervalId = setInterval(() => {
  //     const winner = //
  //
  // if (!winner) {
  //
  // }
  //   }, 1000)
  // }
  

  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await createConnection({ ...options, name: "default" });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloWorldResolver],
      validate: true,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  const codeRouter = require("./routes/routes");
  app.use("/", codeRouter)

  apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}/graphql`);
  });
})();
