const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const logger = require("morgan")
const filterdInfo = require("./filter");
const FILTER = new filterdInfo();
require('dotenv').config()
app.use(logger("dev"));
app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
}); 

mongoose.connect(process.env.MY_DB, { useNewUrlParser: true }, () => {
  console.log("Database in connected 🧠");
});

const listener = app.listen(process.env.PORT || 2000, () => {
  console.log(
    "Your app is listening on port " + listener.address().port
  );
});

let userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  log: [
    {
      description: { type: String },
      date: { type: Date, default: new Date() },
      duration: { type: Number },
    },
  ],
});

let userId = mongoose.model("userId", userSchema);

app.post("/api/users", (req, res) => {
  let username = req.body.username;
  userId.findOne({ username: username }, "-count", (err, user) => {
    if (err) {
      console.log(err);
    } else if (user) {
      res.status(409).send("<h1>username already taken, Try another</h1>");
    } else {
      let newUser = new userId({
        username: username,
      });
      newUser.save((err, profile) => {
        if (err) {
          console.log(err);
        } else {
          let filtredProfile = FILTER.filterInfo(profile._doc, [
            "count",
            "__v",
            "log",
          ]);
          res.status(200).json(filtredProfile);
        }
      });
    }
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => { 
  let leanObj = await userId.findOne({ _id: req.body._id }).lean();
  let counted = leanObj?.log.length > 0 ? leanObj?.log.length : 1;
  
  let updatedUser = await userId
    .findOneAndUpdate(
      { _id: req.body._id },
      {
        count: counted,
        $push: {
          log: {
            description: req.body.description,
            duration: req.body.duration,
            date: req.body.date || new Date(),
          },
        },
      },
      { new: true }
    )
    .lean(); 

  let filtredLog = FILTER.filterInfo(updatedUser?.log[0], ["_id"]);
  let filtredProfile = FILTER.filterInfo(updatedUser, ["count", "__v", "log"]);
  let { date, description, duration } = filtredLog;
  res.json({
    username: filtredProfile?.username,
    description,
    duration,
    date,
    _id: filtredProfile?._id,
  });
});

app.get("/api/users", async (req, res) => {
  let users = await userId.find().lean();
  let filtred = FILTER.filterInfo(users, ["log", "count"]);
  res.json(filtred);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let id = req.params._id;
  let user = await userId.findOne({ id }).lean();
    let filtred = FILTER.filterInfo(user, ["__v"]);
  res.json(filtred)
});


