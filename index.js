const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const filterdInfo = require("./filter");
const FILTER = new filterdInfo();
require('dotenv').config()
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


