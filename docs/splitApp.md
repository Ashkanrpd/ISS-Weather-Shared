# Splitting app.js

**First, i will make a backend folder and i will put everything related to backend inside of this folder. Then i will start spliting the app.js file. These are the sections that will be moved from app.js to different files:**

- **ISS data collector**  
  Iss data collector can be a function who doesnt need any arguments and in return it sends the ISS coordinates.  
  **File name:**  
  issDataCollector.js

```
const issCollector = function () {
    let issResponse = await fetch(process.env.OPEN_NOTIFY_URL_JSON);
    let issBody = await issResponse.text();
    issBody = JSON.parse(issBody);
    if (issBody.message !== "success") {
      return res.send(
        JSON.stringify({
          code: 502,
          success: false,
          message: "ISS info not found!",
        })
      );
    }
    else return issBody
}

module.exports = issCollector
```

---

- **distanceCalc Function**  
  This function needs the user and iss coordinates so i will pass them as arguments and in return i will get the distance.  
  **File name:**  
  distanceCalc.js

```
const distanceCalc = function (lat1, lon1, lat2, lon2, unit) {
 if (lat1 == lat2 && lon1 == lon2) {
   return 0;
 } else {
   let radlat1 = (Math.PI * lat1) / 180;
   let radlat2 = (Math.PI * lat2) / 180;
   let theta = lon1 - lon2;
   let radtheta = (Math.PI * theta) / 180;
   let dist =
     Math.sin(radlat1) * Math.sin(radlat2) +
     Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
   if (dist > 1) {
     dist = 1;
   }
   dist = Math.acos(dist);
   dist = (dist * 180) / Math.PI;
   dist = dist * 60 * 1.1515;
   if (unit == "K") {
     dist = dist * 1.609344;
   }
   if (unit == "N") {
     dist = dist * 0.8684;
   }
   return dist;
 }
};

module.exports = distanceCalc
```

---

- **weather stack collector**  
  This function will need 4 coordinates to return the weather detail for iss and user location.  
  **File name:**  
  weatherStack.js

```

const weatherStack = function (userLatitude,userLongitude,issBody.iss_position.latitude, issBody.iss_position.longitude  ) {
   // Finding the weather detials for the region below the ISS
   let wsForIssResponse = await fetch(
     `${process.env.WEATHER_STACK_URL}/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=${issBody.iss_position.latitude},${issBody.iss_position.longitude}`
   );
   let wsForIssBody = await wsForIssResponse.text();
   wsForIssBody = JSON.parse(wsForIssBody);

   // Finding the weather details for the user location
   let wsForUserResponse = await fetch(
     `${process.env.WEATHER_STACK_URL}/current?access_key=${process.env.WEATHER_STACK_ACCESS_KEY}&query=${userLatitude},${userLongitude}`
   );

   let wsForUserBody = await wsForUserResponse.text();
   wsForUserBody = JSON.parse(wsForUserBody);
   console.log("wsForUserBody", wsForUserBody);
   console.log("wsForIssBody", wsForIssBody);

   if (
     "success" in wsForIssBody ||
     "success" in wsForUserBody ||
     isNaN(wsForIssBody.current.temperature) ||
     isNaN(wsForUserBody.current.temperature) ||
     !wsForIssBody.location.name ||
     !wsForUserBody.location.name
   ) {
     return res.send(
       JSON.stringify({
         code: 404,
         success: false,
         message: "No weather found for location!",
       })
     );
   }
   else return {wsForIssBody,wsForUserBody }
}

module.exports = weatherStack
```
