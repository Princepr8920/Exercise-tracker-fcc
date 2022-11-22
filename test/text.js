const { describe } = require("mocha");

const assert = require("chai").assert;





const expected = {
date: new Date().toDateString()
};

const a = {
  "_id": "637c4ce78b9a213cb25f083f",
  "username": "Prince",
  "count": 1,
  "log": [
    {
      "duration": 3,
      "description": "qwerty",
      "date": "Thu Jan 01 1970"
    }
  ]
}
 

describe("string test", function () {

it("is a is string", function () {
  assert.isString(a.log[0].date); 
  });

  it("is this equal", function () { 
   assert.equal(a.log[0].date, expected.date); 
  });
  
});
