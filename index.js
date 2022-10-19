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
  date: { type: String, default: new Date(), trim: true },
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
      let filtredProfile = FILTER.filterInfo(profile._doc, [
        "count",
        "__v",
        "log",
      ]);
      res.status(200).json(filtredProfile);
    }
  });
});

// app.post("/api/users/:_id/exercises", async (req, res) => {
//   let { duration, description, date, _id } = req.body;
//   let user = await userId.findOne({ _id: _id }).lean();
//   let counter = user?.log.length > 0 ? user?.log.length : 0;

//   if (user) {
//     let newExercise = new exercise({
//       duration,
//       description,
//       date:
//         new Date(date).toDateString() !== "Invalid Date"
//           ? new Date(date).toDateString()
//           : new Date().toDateString(),
//     });

//     let updated = await userId
//       .findByIdAndUpdate(
//         { _id },
//         { count: (counter += 1), $push: { log: newExercise } },
//         { new: true }
//       )
//       .lean();
//     let recentExercise = FILTER.filterInfo(updated.log[counter - 1], ["_id"]);
//     let filterJson = FILTER.filterInfo(updated, ["count", "__v", "log"]);
//     res.json({ ...filterJson, ...recentExercise });
//   }
// });

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { duration, description, date, _id } = req.body;
  let user = await userId.findOne({ _id: _id }).lean();
  let counter = user?.log.length > 0 ? user?.log.length : 0;

  if (user) {
    let newExercise = new exercise({
      duration:isNaN(duration) ? null : duration,
      description,
      date:
        new Date(date).toDateString() !== "Invalid Date"
          ? new Date(date).toDateString()
          : new Date().toDateString(),
    });

    let updated = await userId.findByIdAndUpdate(
      { _id },
      { count: (counter += 1), $push: { log: newExercise } },
      { new: true }
    ).lean();

    let filtredLog = FILTER.filterInfo(updated.log[counter-1], [
      "_id", 
    ]);
    let filtredJson = FILTER.filterInfo(updated, [
      "count",
      "__v",
      "log",
    ]);
    
    res.send({...filtredJson,...filtredLog})
  }else{
    res.status(404).send('user not found')
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let id = req.params._id;
  let user = await userId.findOne({ _id: id }).lean();

  if (user) {
    // let filtred = FILTER.filterInfo(user, ["__v"]);
    res.json(user);
  } else {
    res.sendStatus(404);
  }
});

app.get("/api/users", async (req, res) => {
  let users = await userId.find().lean();
  if (users) {
    let filtred = FILTER.filterInfo(users, ["log", "count"]);
    res.json(filtred);
  } else {
    res.sendStatus(404);
  }
});
