# Splitting app.js

**First, i will make a backend folder and i will put everything related to backend inside of this folder. Then i will start spliting the app.js file. These are the sections that will be moved from app.js to different files:**

- **First step: Separating the ISS data collector function**  
  Iss data collector can be a function who doesnt need any arguments and in return it sends back the ISS coordinates. I will declare 7 global variables (issLatitude, issLongitude, userLastitude, userLongitude, issWeather, userWeather and tempDif) with undefined values and then i will make a new file js file, then will move the function inside of it, then will export/import it in my /calc endpoint.(upadte the iss global variables values which we declared earlier). Finally, i will run the tests and if everything went well i go for 2nd step.

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

- **Second step: Separating the distanceCalc Function**  
  When user makes a request to our /calc endpoint we will get its coordinates and will update the user global variables. Our distanceCalc function needs the user and iss coordinates and at this point we should have all 4 coordinates. I will make another js file then will move this function inside of it, export/import it to mycalc endpoint and will call it with our 4 coordinates. This will send back the distance between the user ans iss. Finally, i will run the tests and if everything went well i go for next step.

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

- **Final step: Separating weather stack collector function**  
  This function will need 4 coordinates to return the weather detail for iss and user location, also i would like it to cacluate the difference between user and iss temperature. I will make a js file move this part of code to that, export/import it to calc endpoint and by calling it i should be able to update my issWeather and userWeather and tempDif variables and send all the required data to the user.

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
   else {
           // Calculating the temperature difference between the international space station and user
    const tempDif =
      wsForIssBody.current.temperature - wsForUserBody.current.temperature;
      return {wsForIssBody,wsForUserBody, tempDif }
}

module.exports = weatherStack
```
