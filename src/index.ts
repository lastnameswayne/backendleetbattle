import dedent from "dedent";
import express from "express";
import "reflect-metadata";
import { createConnection, getConnectionOptions } from "typeorm";
import makeId from "./const/utils";
import 'dotenv/config'
import compareStrings from './const/util/compareStrings'
//import { buildSchema } from "type-graphql";
//import { HelloWorldResolver } from "./resolvers/HelloWorldResolver";
//import { ApolloServer } from "apollo-server-express";

const cors = require("cors");

(async () => {
  const clientRooms: any = {};
  let playerNumberRun: string  = ""
  let playerNumberSubmit: string = ""
  let code;
  let codeOutput: string = "";
  let errorOutput: string = "";

  const app = express();
  console.log(process.env.CLIENT_URL);
  
  app.use(cors());
  app.use(express.json());
  const http = require("http").Server(app);
  const io = require("socket.io")(http, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
    forceNew: true,
    perMessageDeflate: false,
  });

  const axios = require("axios");

  let data = {
    source_code: code,
    language_id: 71,
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

  const testcasesTwoSum = new Map<string, string>([
    ["testcase1arr", "[2,7,11,15]"],
    ["testcase1target", "9"],
    ["testcase2arr", "[-3,4,3,90]"],
    ["testcase2target", "0"],
    ["testcase3arr", "[100,4,657,999,1,5,10,8,5,4,10]"],
    ["testcase3target", "1656"],
    ["testcase4arr", "[-500,4,3,60,40,0]"],
    ["testcase4target", "100"],
    ["testcase5arr", "[-500,4,3,60,40,0]"],
    ["testcase5target", "-496"],
  ]);

  let testcaseAnswersTwoSum: Array<string> = [
    "[0, 1]",
    "[0, 2]",
    "[2, 3]",
    "[4, 3]",
    "[0, 1]",
  ];

  let output: any = {
    codeOutput: codeOutput,
    errorOutput: errorOutput,
  };


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

    const handleRun = async (roomName: string, playerNumber: string) => {
      playerNumberRun = playerNumber
      app.route("/run").post((req: any, res: any) => { 
        data.source_code = req.body.code.code;
        axios({
          url: process.env.VM_URL,
          method: "POST",
          data: data,
        })
          .then(async (req: any, res: any) => {
            //first call generates a token
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 sec
            //after waiting, use the token to get the res.data.stdout which is
            //what I want to send to frontend using res.send()
            axios
              .get(process.env.VM_URL+ '/'+ req.data.token)
              .then((req: any, res: any) => {
                if (!req) {
                  console.log("no output");
                }
                output.codeOutput = req.data.stdout;
                output.errorOutput = req.data.stderr;
                sendCode(roomName, output, playerNumberRun);
              })
          })
          .catch((err: Error) => {
            io.to(roomName).emit("serverError", playerNumberRun);
            console.log(err);
          });
      });
      
    };

    const sendCode = async (
      roomName: string,
      output: any,
      playerNumber: string
    ) => {
      console.log("player number in send code",playerNumber);
      
      console.log("senc code");
      console.log(output);
      console.log(roomName);
      io.to(roomName).emit("code", output, playerNumber);
    };

    const handleSubmit = (roomName: string, playerNumber: string) => {

      playerNumberSubmit = playerNumber

      app.route("/submit").post((req: any, res: any) => {
        //adding all testcases and printing them to check the solution
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
          console.log(data.source_code);
          
        axios({
          url: process.env.VM_URL,
          method: "POST",
          data: data,
        })
          .then(async (req: any, res: any) => {
            //first call generates a token
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 3 sec
            //after waiting, use the token to get the res.data.stdout which is
            //what I want to send to frontend using res.send()
            axios
              .get(process.env.VM_URL + '/' + req.data.token)
              .then((req: any, res: any) => {
                if (!req) {
                  console.log("no output");
                }
                output.codeOutput = req.data.stdout;
                output.errorOutput = req.data.stderr;
                if (!output.codeOutput) {
                  console.log("no code output");
                  io.to(roomName).emit("wrongSubmit", playerNumberSubmit);
                  return;
                }
                let outputArray = output.codeOutput.split("\n");
                validateAnswer(outputArray, roomName, playerNumberSubmit);
              });
          })
          .catch((err: Error) => {
            io.to(roomName).emit("serverError", playerNumberSubmit);
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
      USERSUBMIT.pop(); //remove last element which is empty because of the output

      //run through every test case
      console.log(USERSUBMIT);
      console.log(testcaseAnswersTwoSum);
      
      USERSUBMIT.every((element, index) => {
        if (compareStrings(element, testcaseAnswersTwoSum[index])) {
          //winner
          console.log("game over, winner found");
          io.to(roomName).emit("gameOver", playerNumber);
          return;
        } else {
          //wrong answer
          console.log("wrong answer");
          io.to(roomName).emit("wrongSubmit", playerNumber);
        }
      });
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
  
  //graphQL support
  // const apolloServer = new ApolloServer({
  //   schema: await buildSchema({
  //     resolvers: [HelloWorldResolver],
  //     validate: true,
  //   }),
  //   context: ({ req, res }) => ({ req, res }),
  // });

  //apolloServer.applyMiddleware({ app, cors: false });
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`server started at http:/localhost:${port}/graphql`);
  });
})();
