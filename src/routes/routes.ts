import { response } from "express";

const router = require("express").Router();
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

router.route("/run").post((req: any, res: any) => {
  data.source_code = req.body.code;
  axios({
    url: "http://35.205.20.238/submissions",
    method: "POST",
    data: data,
  })
    .then(async (req: any, res: any) => {
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
          console.log(req.data.stdout);
        });
    })
    .catch((err: Error) => console.log(err));
});

router.route("/submit").post((req: any) => {
  console.log(req.body.code);

  console.log("submit");
});

const testcases = [];

module.exports = router;
