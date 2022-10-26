const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const logger = require("morgan");
const filterdInfo = require("./filter");
const FILTER = new filterdInfo();
const moment = require("moment");
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

let exerciseSchema = {
  description: { type: String, required: true, trim: true },
  date: { type: String, trim: true },
  duration: { type: Number, required: true, trim: true },
};

let userSchema = mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: [exerciseSchema],
});

let exercise = mongoose.model("exercise", exerciseSchema);
let userId = mongoose.model("userId", userSchema);

app.post("/api/users", (req, res) => {
  let username = req.body.username;
  let newUser = new userId({
    username: username,
  });
  newUser.save((err, profile) => {
    if (err) {
      console.log(err);
    } else {
      // let filtredProfile = FILTER.filterInfo(profile._doc, [
      //   "count",
      //   "__v",
      //   "log",
      // ]);
      let response = {
        username: profile.username,
        _id: profile._id,
      };

      res.status(200).json(response);
    }
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { duration, description, date } = req.body;
  let _id = req.params._id;
  let user = await userId.findOne({ _id: _id }).lean();
  let counter = user?.log.length > 0 ? user?.log.length : 0;

  if (user) {
    if (isNaN(duration) || !description || duration === "") {
      res.status(400).send("invalid format");
    } else {
      let newExercise = new exercise({
        duration: duration,
        description: description,
        date:
          new Date(date).toDateString() !== "Invalid Date"
            ? new Date(date).toDateString()
            : new Date().toDateString(),
      });

      let updated = await userId
        .findByIdAndUpdate(
          { _id },
          { count: (counter += 1), $push: { log: newExercise } },
          { new: true }
        )
        .lean();

      // let filtredLog = FILTER.filterInfo(updated.log[counter - 1], ["_id"]);
      // let filtredJson = FILTER.filterInfo(updated, ["count", "__v", "log"]);{ ...filtredJson, ...filtredLog }
      let response = {
        username: updated.username,
        _id: updated._id,
        date: updated.log[counter - 1].date,
        description: updated.log[counter - 1].description,
        duration: parseInt(updated.log[counter - 1].duration),
      };
      console.log(typeof response.description);
      res.status(200).json(response);
    }
  } else {
    res.status(404).send("user not found");
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let id = req.params._id;
  let user = await userId.findOne({ _id: id }).lean();
  let { from, to, limit } = req.query;

  if (user) {
    if (from && to) {
      let logArr = user.log;
      let limitedLog = logArr.filter((e) =>
        new Date(e.date).getTime() >= new Date(from).getTime() &&
        new Date(e.date).getTime() <= new Date(to).getTime()
          ? e
          : ""
      );
      if (limit && limit > 0) {
          while (limitedLog.length > limit) {
            limitedLog.pop();
        }
      }

      let filtred = FILTER.filterInfo(limitedLog, ["_id"]);
      let response = {
        _id: user._id,
        username: user.username,
        from,
        to,
        count: limitedLog.length,
        log: filtred,
      };
      res.status(200).json(response);
    } else {
      res.status(200).json(user);
    }
  } else {
    res.sendStatus(404);
  }
});

app.get("/api/users", async (req, res) => {
  let users = await userId.find().lean();
  if (users) {
    let filtred = FILTER.filterInfo(users, ["log", "count"]);
    res.status(200).json(filtred);
  } else {
    res.sendStatus(404);
  }
});
