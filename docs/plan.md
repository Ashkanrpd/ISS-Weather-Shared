# ISS-weather app

**With this API we will find the ISS current location, how far are we from it, how much is our temperature difference and what are the weather detail for the region that is located at below of the ISS on earth.**

**URL**  
<calc?latitude=’’&&longitude=’’>

**Method:**  
Get

**URL Params:** (Required)  
latitude=’’  
longitude=’’

**Success Response:**  
Code:200  
success: true  
content: {  
distance: “km”,  
tempDif: “”,  
location: {observationTime: “”,name: “city name”,country:””,temperature: “”,weatherDescription: “”,windspeed: “”,humidity: “”, feelsLike: “”,visibility: “”,uvIndex: “”,icon: “”}}

**Error Response:**

- Code:404
- success: false
- message: “Unable to find the user location”

---

- Code:404
- success: false
- message: “Unable to find the ISS location”

---

- Code:404
- success: false
- message: “Unable to calculate the distance”

---

- Code:404
- success: false
- message: “Unable to find the user location”

---

- Code:404
- success: false
- message: “Unable to find the temperature for user location”

---

- Code:404
- success: false
- message: “Unable to find the temperature for ISS location”

---

- Code:404
- success: false
- message: “Unable to find the temperature for user location”

---

- Code:404
- success: false
- message: “Unable to find the location below the ISS on earth”

---

- Code:404
- success: false
- message: “Unable to find the weather detail for “” ”

---

**Sample Call:**  
Await fetch(“/calc?latitude=’’&&longitude=’’”)
