const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const logger = require("morgan");
const filterdInfo = require("./filter");
const FILTER = new filterdInfo();
require("dotenv").config();
app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
const setDate = require("./date");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 2000, () => {
  console.log("Your app is listening on port " + listener.address().port);
  connectToDatabase();
});

const client = new MongoClient(process.env.MY_DB);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Database connected successfully 🧠");
    let collections = await client.db("FCC").listCollections().toArray();
    let collectionExists = collections.map((e) => e.name);
    !collectionExists.includes("exercise-tracker-db")
      ? await createCollection()
      : "";
  } catch (error) {
    console.error(error);
  }
}

async function createCollection() {
  await client.db("FCC").createCollection("exercise-tracker-db", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        title: "exercise vaidation",
        required: ["username"],
        properties: {
          username: {
            bsonType: "string",
            description: "username must be a string and is required",
          },
          count: {
            bsonType: "int",
          },
          log: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["duration", "description"],
              properties: {
                description: {
                  bsonType: "string",
                  description: "des must be a string and is required",
                },
                duration: {
                  bsonType: "number",
                  description: "duration must be a number and is required",
                },
                date: {
                  bsonType: "string",
                  description: "date must be a number and is required",
                },
              },
            },
          },
        },
      },
    },
    validationLevel: "moderate",
  });
}

const db = client.db("FCC").collection("exercise-tracker-db");

app.post("/api/users", async (req, res) => {
  let { insertedId } = await db.insertOne({ username: req.body.username });
  let { username, _id } = await db.findOne({ _id: insertedId });
  let response = { username, _id };
  res.status(200).json(response);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { duration, description, date } = req.body;
  let _id = new ObjectId(req.params._id);
  let user = await db.findOne({ _id });
  let counter = user?.log?.length > 0 ? user?.log?.length : 0;

  if (user) {
    if (isNaN(duration) || !description || duration === "") {
      return res.status(400).send("invalid format");
    } else {
      let newExercise = {
        duration,
        description,
        date:
          new Date(date) === "Invalid Date" || date === ""
            ? new Date().toDateString()
            : new Date(date).toDateString(),
      };
      counter += 1;
      db.findOneAndUpdate(
        { _id },
        { $push: { log: newExercise }, $set: { count: counter } },
        { returnDocument: "after" },
        async function (err, document) {
          if (err) return err;
          const { value } = document;

          let response = {
            username: value.username,
            _id: value._id,
            date: new Date(value.log[counter - 1].date).toDateString(),
            description: value.log[counter - 1].description,
            duration: parseInt(value.log[counter - 1].duration),
          };
          return res.status(200).json(response);
        }
      );
    }
  } else {
    return res.status(404).send("user not found");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let _id = new ObjectId(req.params._id);
  let user = await db.findOne({ _id });
  let { limit } = req.query;

  if (user) {
    let { username, _id, log } = user;
    if (req.query.from != undefined && req.query.to != undefined) {
      log = log.filter((ele) => {
        let eleDate = new Date(ele.date).getTime();
        let fromDate = new Date(req.query.from + " 00:00:00").getTime();
        let toDate = new Date(req.query.to + " 00:00:00").getTime();

        return eleDate >= fromDate && eleDate <= toDate;
      });
    }

    if (limit != undefined) {
      log = log.slice(0, limit);
    }

    log = log.map((ele) => {
      return {
        description: ele.description,
        duration: parseInt(ele.duration),
        date: new Date(ele.date).toDateString()
      };
    });
 
    let count = 0;
    if (log != undefined) count = log.length;
    return res.json({ username, _id, count, log });
  }
  return res.sendStatus(404);
});

app.get("/api/users", async (req, res) => {
  let users = await db.find().toArray();
  if (users) {
    let filtred = FILTER.filterInfo(users, ["log", "count"]);
    res.status(200).json(filtred);
  } else {
    res.sendStatus(404);
  }
});
    