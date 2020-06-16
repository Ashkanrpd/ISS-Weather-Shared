# ISS-weather app

**With this API we will find the ISS current location, how far are we from it, how much is our temperature difference and what are the weather detail for the region that is located at below of the ISS on earth.**

**URL**  
[/calc?latitude=’’&&longitude=’’]()

**Method:**  
Get

**URL Params:** (Required)  
latitude=’’  
longitude=’’

**Success Response:**

```
{
  "Code":200
  "success": true
  "content": {
      "distance": “1000km”,
      "tempDif": “50c”,
      "location": {
           "observationTime": “12:35 PM”,
           "name": “San Francisco",
           "country:”USA”,
           "temperature": 16,
           "weatherDescription": ["Overcast"],
           "windspeed": 17 ,
           "humidity": 87,
           "feelsLike": 16,
           "visibility": 16,
           "uvIndex": 0,
           "icon": [“https://assets.weatherstack.com/images/symbol.png”]
                   }
            }
}
```

**Error Response:**

```
{
  "Code": 400
  "success": false
  "message": "Bad Request!”
}
```

```
{
  "Code": 404
  "success": false
  "message": "No location found for coordinates!”
}
```

---

```
{
  "Code": 404
  "success": false
  "message": “No weather found for location!”
}
```

---

```
{
  "Code": 502
  "success": false
  "message": “ISS info not found!”
}
```

---

**Sample Call:**  
Await fetch(“/calc?latitude=’’&&longitude=’’”)
