import { ApolloServer } from "apollo-server-express";
import dedent from "dedent";
import { Socket } from "dgram";
import express from "express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection, getConnectionOptions } from "typeorm";
import makeId from "./const/utils";
import { HelloWorldResolver } from "./resolvers/HelloWorldResolver";
const cors = require("cors");

(async () => {
  // const state = {}
  const clientRooms: any = {};
  const state: any = {};

  const app = express();
  app.use(cors());
  app.use(express.json());
  const http = require("http").Server(app);
  const io = require("socket.io")(http, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    forceNew: true,
    perMessageDeflate: false,
  });

  const axios = require("axios");

  let code;
  let finalOutput: any;

  let data = {
    source_code: code,
    language_id: 70,
    number_of_runs: "1",
    stdin: "Judge0",
    expected_output: null,
    cpu_time_limit: "2",
    cpu_extra_time: "0.5",
    wall_time_limit: "5",
    memory_limit: "128000",
    stack_limit: "64000",
    max_processes_and_or_threads: "60",
    enable_per_process_and_thread_time_limit: false,
    enable_per_process_and_thread_memory_limit: false,
    max_file_size: "1024",
    base64_encoded: true,
  };
  const codeOutput: string = "";
  const errorOutput: string = "";

  let testcasesTwoSum = {
    testcase1arr: "(2,7,1,15)",
    testcase1target: "9",
    testcase2arr: "(-3,4,3,90)",
    testcase2target: "0",
    testcase3arr: "(100,4,657,999,1,5,10,8,5,4,10)",
    testcase3target: "1656",
    testcase4arr: "-500,4,3,60,40,0",
    testcase4target: "100",
    testcase5arr: "-500,4,3,60,40,0",
    testcase5target: "-496",
  };

  let testcaseAnswersTwoSum = {
    testcase1expected: "(1, 2)",
    testcase2expected: "(1, 3)",
    testcase3expected: "(3, 4)",
    testcase4expected: "(4, 5)",
    testcase5expected: "(1, 2)",
  };

  let output: any = {
    codeOutput: codeOutput,
    errorOutput: errorOutput,
  };

  let timerRunning: boolean = true;

  io.on("connection", async (client: any) => {
    client.removeAllListeners();

    const handleNewGame = () => {
      let roomName = makeId(5);
      clientRooms[client.id] = roomName;
      client.emit("gameCode", roomName);
      client.join(roomName);
      client.number = 1;
      client.emit("create", 1, roomName);
      console.log(roomName);
    };

    const handleJoinGame = async (roomName: string) => {
      console.log(client.id);
      roomName.trim;
      roomName.toString;
      const room = await io.in(roomName).allSockets();
      console.log(roomName);

      console.log(room);
      let numClients = 0;
      if (room) {
        numClients = room.size;
        console.log(numClients);
      }
      if (!roomName) {
        client.emit("noCode");
        return;
      }

      if (numClients === 0) {
        client.emit("unknownGame");
        return;
      } else if (numClients > 1) {
        console.log("too many players");
        client.emit("tooManyPlayers");
        return;
      }

      clientRooms[client.id] = roomName;

      client.join(roomName);
      client.number = 2;
      client.emit("join", 2, roomName);
      //now we can start the game!!
      startCountDownFrom10(roomName);
    };

    const startCountDownFrom10 = (roomName: string) => {
      let time = 10;
      let interval = setInterval(() => {
        time = time - 1;
        io.to(roomName).emit("countdown10", time);
        if (time === 0) {
          clearInterval(interval);
          startGameInterval(roomName);
          return;
        }
      }, 1000);
    };

    const startGameInterval = async (roomName: string) => {
      console.log("both players joined in", roomName);
      let time = 0;
      setInterval(() => {
        time = time + 0.1;
        io.to(roomName).emit("timer", time);
      }, 100);
    };

    const handleRun = (roomName: string, playerNumber: string) => {
      console.log("got to run");

      app.route("/run").post((req: any, res: any) => {
        data.source_code = req.body.code.code;        
        axios({
          url: "http://35.205.20.238/submissions",
          method: "POST",
          data: data,
        })
          .then(async (req: any, res: any) => {
            
            //first call generates a token
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 sec
            //after waiting, use the token to get the res.data.stdout which is
            //what I want to send to frontend using res.send()
            axios
              .get("http://35.205.20.238/submissions/" + req.data.token)
              .then((req: any, res: any) => {
                console.log(req);
                if (!req) {
                  console.log("no output");
                }
                finalOutput = req.data.stdout;
                console.log(finalOutput);
                output.codeOutput = req.data.stdout;
                output.errorOutput = req.data.stderr;
                console.log(output);
                sendCode(roomName, output);
              });
          })
          .catch((err: Error) => {
            io.to(roomName).emit("serverError", playerNumber);
            console.log(err);
          });
      });
    };

    const sendCode = async (roomName: string, output: any) => {
      console.log("senc code");
      console.log(output);
      console.log(roomName);
      io.to(roomName).emit("code", output);
    };

    const handleSubmit = (roomName: string, playerNumber: string) => {
      console.log(roomName);

      console.log("got to submit");
      console.log(playerNumber);

      app.route("/submit").post((req: any, res: any) => {
        //formatcode
        const input: any = `${req.body.code.code}        


        ${dedent(
          `''
        a = ${testcasesTwoSum.testcase1arr} 
        t = ${testcasesTwoSum.testcase1target} 
        print(two_sum(a,t)) 
        `
        )}
       `;

        //run the code
        data.source_code = input;
        console.log(data);
        console.log("GOT INTO RUN AXIOS CALL", data);

        axios({
          url: "http://35.205.20.238/submissions",
          method: "POST",
          data: data,
        })
          .then(async (req: any, res: any) => {
            console.log("got the token", req.data.token);
            console.log("code inputted", data.source_code);

            //first call generates a token
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 3 sec
            //after waiting, use the token to get the res.data.stdout which is
            //what I want to send to frontend using res.send()
            axios
              .get("http://35.205.20.238/submissions/" + req.data.token)
              .then((req: any, res: any) => {
                console.log(req);
                if (!req) {
                  console.log("no output");
                }
                finalOutput = req.data.stdout;
                console.log(finalOutput);
                output.codeOutput = req.data.stdout;
                output.errorOutput = req.data.stderr;
                console.log("OUTPUT", output);
                validateAnswer(output.codeOutput, roomName, playerNumber);
                console.log(playerNumber);
                console.log(roomName);
              });
          })
          .catch((err: Error) => {
            io.to(roomName).emit("serverError", playerNumber);

            console.log(err);
          });
      });
    };

    const validateAnswer = (
      output: string,
      roomName: string,
      playerNumber: string
    ) => {
      if (!output) {
        io.to(roomName).emit("serverError", playerNumber);
      }
      const USERSUBMIT = output.trim();
      const ANSWER = testcaseAnswersTwoSum.testcase1expected.trim();
      console.log(playerNumber);
      if (USERSUBMIT.localeCompare(ANSWER) === 0) {
        console.log("game over");
        io.to(roomName).emit("gameOver", playerNumber);
        timerRunning = false;
      } else {
        io.to(roomName).emit("wrongSubmit", playerNumber);
      }
      return;
    };

    client.on("newGame", handleNewGame);
    client.on("joinGame", handleJoinGame);
    client.on("run", handleRun);
    client.on("submit", handleSubmit);
    client.on("disconnectClient", function () {      
      client.removeAllListeners("send message");
      client.removeAllListeners("disconnect");
      io.removeAllListeners("connection");
    });
  });

  io.listen(4001);

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

  apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http:/localhost:${port}/graphql`);
  });
})();
