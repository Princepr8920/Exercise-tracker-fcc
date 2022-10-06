module.exports = class Filter{
  filterInfo(info, out) {
   let exclude = out;
   let filterdInfo = info;
   if (Array.isArray(info)) {
     info.forEach((doc) => {
       exclude.forEach((elem) => {
         if (doc[elem]) {
           delete doc[elem];
         }
       });
     });
   } else {
     exclude.forEach((elem) => {
       if (filterdInfo[elem] || !filterdInfo[elem]) {
         delete filterdInfo[elem];
       }
     });
   }
   return filterdInfo;
 }
}