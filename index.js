const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const logger = require("morgan");
const filterdInfo = require("./filter");
const FILTER = new filterdInfo();
require("dotenv").config();
app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(process.env.MY_DB, { useNewUrlParser: true }, () => {
  console.log("Database in connected 🧠");
});

const listener = app.listen(process.env.PORT || 2000, () => {
  console.log("Your app is listening on port " + listener.address().port);
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
      console.error(err);
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
  let user = await userId.findOne({ _id: req.body._id });
  if (user) {
    let counted = user?.log.length > 0 ? user?.log.length : 1;

    user.count = counted;

    user?.log.push({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || new Date(),
    });
    let saved = await user.save();
    console.log(saved._doc);

    let filtredLog = FILTER.filterInfo(
      saved?._doc?.log[saved?._doc?.log.length - 1],
      ["_id"]
    );
    let filtredProfile = FILTER.filterInfo(saved?._doc, [
      "count",
      "__v",
      "log",
    ]);
    let { date, description, duration } = filtredLog;

    return res.json({
      username: filtredProfile?.username,
      description,
      duration,
      date,
      _id: filtredProfile?._id,
    });
  }else{
    return res.sendStatus(500)
  }
});

app.get("/api/users", async (req, res) => {
  let users = await userId.find().lean();
  if(users){
      let filtred = FILTER.filterInfo(users, ["log", "count"]);
  res.json(filtred);
  }else{
    res.sendStatus(404)
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let id = req.params._id;
  console.log(id);
  let user = await userId.findOne({ _id: id }).lean();

  if (user) {
    let filtred = FILTER.filterInfo(user, ["__v"]);
    res.json(filtred);
  } else {
    res.sendStatus(404);
  }
});
