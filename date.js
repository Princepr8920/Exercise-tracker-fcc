module.exports = function calcTime(currentDate,offset) {
  // create Date object for current location
  var d = new Date(currentDate);

  // convert to msec
  // subtract local time zone offset
  // get UTC time in msec
  var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

  // create new Date object for different city
  // using supplied offset
  var nd = new Date(utc + (3600000*offset));

  // return time as a string
  return nd.toDateString();
}


 