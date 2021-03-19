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

  const testcasesTwoSum = new Map<string,string>([
    ["testcase1arr", "2,7,1,15"],
    ["testcase1target", "9"],
    ["testcase2arr", "-3,4,3,90"],
    ["testcase2target", "0"],
    ["testcase3arr", "100,4,657,999,1,5,10,8,5,4,10"],
    ["testcase3target", "1656"],
    ["testcase4arr", "-500,4,3,60,40,0"],
    ["testcase4target", "100"],
    ["testcase5arr", "-500,4,3,60,40,0"],
    ["testcase5target", "-496"],
  ]);
  let testcaseAnswersTwoSum: Array<string> =
    ["(1, 2)", "(1, 3)", "(3, 4)", "(4, 5)", "(1, 2)"]

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
      io.to(roomName).emit("timer");
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
                output.codeOutput = req.data.stdout;
                output.errorOutput = req.data.stderr;
                console.log(output);
                sendCode(roomName, output, playerNumber);
              });
          })
          .catch((err: Error) => {
            io.to(roomName).emit("serverError", playerNumber);
            console.log(err);
          });
      });
    };

    const sendCode = async (roomName: string, output: any, playerNumber: string) => {
      console.log("senc code");
      console.log(output);
      console.log(roomName);
      io.to(roomName).emit("code", output, playerNumber);
    };

    const handleSubmit = (roomName: string, playerNumber: string) => {
      console.log(roomName);

      console.log("got to submit");
      console.log(playerNumber);

      app.route("/submit").post((req: any, res: any) => {
        //formatcode
        for (let value of testcasesTwoSum.values()) {
          console.log(value);
        }

        const input: any = `${req.body.code.code}        
      

        ${dedent(
          `''
        a1 = ${testcasesTwoSum.get("testcase1arr")} 
        t1 = ${testcasesTwoSum.get("testcase1target")}
        a2 = ${testcasesTwoSum.get("testcase2arr")}  
        t2 = ${testcasesTwoSum.get("testcase2target")}
        a3 = ${testcasesTwoSum.get("testcase3arr")} 
        t3 = ${testcasesTwoSum.get("testcase3target")}
        a4 = ${testcasesTwoSum.get("testcase4arr")} 
        t4 = ${testcasesTwoSum.get("testcase4target")}
        a5 = ${testcasesTwoSum.get("testcase5arr")} 
        t5 = ${testcasesTwoSum.get("testcase5target")}
        print(two_sum(a1,t1))
        print(two_sum(a2,t2))
        print(two_sum(a3,t3))
        print(two_sum(a4,t4))
        print(two_sum(a5,t5))
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
                output.codeOutput = req.data.stdout;
                output.errorOutput = req.data.stderr;
                console.log("OUTPUT", output);                
                if (!output.codeOutput) {
                  io.to(roomName).emit("wrongSubmit", playerNumber);
                  return;
                } 
                let outputArray = output.codeOutput.split('\n');                
                validateAnswer(outputArray, roomName, playerNumber);                
              });
          })
          .catch((err: Error) => {
            io.to(roomName).emit("serverError", playerNumber);
            console.log(err);
          });
      });
    };

    const validateAnswer = (
      output: Array<string>,
      roomName: string,
      playerNumber: string
    ) => {
      if (!output) {
        io.to(roomName).emit("serverError", playerNumber);
        return;
      }
      let USERSUBMIT: Array<string> = output;
      USERSUBMIT.pop() //remove last element which is empty because of the output
      
      //run throigh every test case
      USERSUBMIT.every((element, index) => {
        if (element.localeCompare(testcaseAnswersTwoSum[index])===0) {
          //winner
          console.log("game over, winner found")
          io.to(roomName).emit("gameOver", playerNumber);
          return;
        }
        else {
          //wrong answer
          console.log("wrong answer");
           io.to(roomName).emit("wrongSubmit", playerNumber);
        }
      })
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
