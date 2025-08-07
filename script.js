const search = document.querySelector("#search");
search.addEventListener("click", () => {
  searchCity();
  checkCity();
});
let pm10ChartInstance = null;
let pm25ChartInstance = null;
let map; // Declare globally
let currentMarker; // To track the marker
let tileLayer; // To update tile layer dynamically if needed

async function searchCity() {
  const city = document.querySelector("#cityInput").value.trim().toLowerCase();
  if (!city) return;
  //city overview api ninjas
  const overviewUrl = `https://api.api-ninjas.com/v1/city?name=${encodeURIComponent(
    city
  )}`;

  const option1 = {
    method: "GET",
    headers: {
      "X-Api-Key": "GC8hSyRLEn550RNeCnh4iQ==I9PUIHKfUy6pWIcm",
    },
  };
  try {
    const overview = await fetch(overviewUrl, option1);
    console.log(overviewUrl);
    if (!overview.ok) {
      throw new Error(`HTTP error! Status: ${overview.status}`);
    }
    const overviewData = await overview.json();
    // console.log(overviewData[0]);

    document.querySelector(
      "#cityInfo"
    ).innerHTML = `<p><strong>City: </strong>${overviewData[0].name}</p>
      <p><strong>Population: </strong>${overviewData[0].population}</p>
      <p><strong>Region: </strong>${overviewData[0].region}</p>
      <p><strong>Country: </strong>${overviewData[0].country}</p>`;
  } catch (err1) {
    console.error("Fetch error:", err1);
    document.querySelector("#cityInfo").innerText = "Failed to load";
  }

  //newsData api

  const newsUrl = `https://newsdata.io/api/1/news?apikey=pub_d90847c4b59b4ad8ba8d25a281dcdc22&country=in&q=${encodeURIComponent(
    city
  )}`;

  try {
    const news = await fetch(newsUrl);
    if (!news.ok) {
      throw new Error(`HTTP error! Status: ${news.status}`);
    }
    const dataNews = await news.json();
    console.log(dataNews);
    // console.log(dataNews.results);
    let html = "";

    dataNews.results.forEach((result) => {
      html += `
      <div class="news-article">
        <h3>${result.title}</h3>
        <img src="${result.image_url}" alt="news image" style="max-width:100%; height:auto;">
        
        <a href="${result.link}" target="_blank">Read more</a>
        <hr>
      </div>
    `;
    });
    document.querySelector("#newsData").innerHTML = html;
  } catch (err2) {
    console.error("Fetch error:", err2);
    const newsElem = document.querySelector("#newsData");
    if (newsElem) newsElem.innerText = "Failed to load news.";
  }

  //weathermap api
  // const weatherKey = "1f52e05f5ea4e5b96eb5e18512680721";
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=1f52e05f5ea4e5b96eb5e18512680721&units=metric`;
  let lat;
  let lon;
  let country;
  try {
    const weather = await fetch(weatherUrl);
    if (weather.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a minute.");
    }
    if (!weather.ok) {
      throw new Error(`HTTP Error: ${weather.status}`);
    }

    const dataWeather = await weather.json();
    lat = dataWeather.coord.lat;
    lon = dataWeather.coord.lon;

    const cityName = dataWeather.name;
    const temperature = dataWeather.main.temp;
    const feelsLike = dataWeather.main.feels_like;
    const humidity = dataWeather.main.humidity;
    const pressure = dataWeather.main.pressure;
    const windSpeed = dataWeather.wind.speed;
    const weatherMain = dataWeather.weather[0].main;
    const weatherDescription = dataWeather.weather[0].description;
    country = dataWeather.sys.country;

    // Convert UNIX timestamp to local time
    const localTimestamp = dataWeather.dt;
    let formattedTime;
    const rawDate = new Date(localTimestamp * 1000);

    if (country === "IN") {
      formattedTime =
        rawDate.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " (IST)";
    } else {
      formattedTime = rawDate.toUTCString() + " (GMT)";
    }

    document.querySelector("#weatherData").innerHTML = `
    <h3>🌤 Weather in ${cityName}, ${country}</h3>
     <p><strong>🕒 Local Time:</strong>${formattedTime}</p>
  <p><strong>🌡 Temperature:</strong> ${temperature} °C</p>
  <p><strong>🤒 Feels Like:</strong> ${feelsLike} °C</p>
  <p><strong>💧 Humidity:</strong> ${humidity} %</p>
  <p><strong>📊 Pressure:</strong> ${pressure} hPa</p>
  <p><strong>💨 Wind Speed:</strong> ${windSpeed} m/s</p>
  <p><strong>🌥 Condition:</strong> ${weatherMain} (${weatherDescription})</p>
`;
  } catch (err3) {
    console.error("Fetch error:", err3);
    document.querySelector("#weatherData").innerText =
      "Failed to load weather details.";
  }

  //WAQI api pollution detail

  const airUrl = `https://api.waqi.info/feed/${city}/?token=0a7a811014a4fc3465dace71c6bd5ab05349f47d`;
  try {
    const airRes = await fetch(airUrl);

    if (airRes.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a minute.");
    }
    if (!airRes.ok) {
      throw new Error(`HTTP Error: ${airRes.status}`);
    }

    const dataAir = await airRes.json();
    console.log(dataAir);
    let dailypm10 = dataAir.data.forecast.daily.pm10;
    let dailypm25 = dataAir.data.forecast.daily.pm25;

    // Prepare PM10 data
    let pm10Data = [];
    dailypm10.forEach((arraypm10) => {
      pm10Data.push(arraypm10);
    });
    pmPieChart(pm10Data);

    // Draw PM10 Pie Chart
    function pmPieChart(pm10Data) {
      const ctx = document.getElementById("myChart10");

      // Destroy existing chart if it exists
      if (pm10ChartInstance) {
        pm10ChartInstance.destroy();
      }

      const data = pm10Data.map((a) => a.avg);
      const labels = pm10Data.map((d) => d.day);

      pm10ChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Average PM10 Data",
              data: data,
              color: "black",
              borderWidth: 0,
              backgroundColor: [
                "rgba(52, 87, 122, 0.85)",
                "rgba(76, 137, 175, 0.85)",
                "rgba(113, 82, 148, 0.85)",
                "rgba(186, 108, 144, 0.85)",
                "rgba(59, 141, 151, 0.85)",
                "rgba(165, 118, 206, 0.85)",
                "rgba(192, 138, 153, 0.85)",
                "rgba(91, 121, 157, 0.85)",
                "rgba(137, 108, 181, 0.85)",
              ],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: "black", // Set legend text color to black
              },
            },
            tooltip: {
              bodyColor: "white", // Tooltip text
              titleColor: "white", // Tooltip title
            },
          },
          color: "black", // General text color (applies to labels where applicable)
        },
      });
    }

    // Prepare PM2.5 data
    let pm25Data = [];
    dailypm25.forEach((arraypm25) => {
      pm25Data.push(arraypm25);
    });
    pm25PieChart(pm25Data);

    // Draw PM2.5 Pie Chart
    function pm25PieChart(pm25Data) {
      const ctx = document.getElementById("myChart25");

      // Destroy existing chart if it exists
      if (pm25ChartInstance) {
        pm25ChartInstance.destroy();
      }

      const data = pm25Data.map((a) => a.avg);
      const labels = pm25Data.map((d) => d.day);

      pm25ChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Average PM2.5 Data",
              data: data,
              borderWidth: 0,
              backgroundColor: [
                "rgba(111, 142, 204, 0.8)",
                "rgba(119, 182, 231, 0.8)",
                "rgba(202, 157, 215, 0.8)",
                "rgba(225, 182, 217, 0.8)",
                "rgba(173, 210, 241, 0.8)",
                "rgba(188, 152, 223, 0.8)",
                "rgba(233, 205, 236, 0.8)",
                "rgba(158, 195, 222, 0.8)",
                "rgba(207, 180, 222, 0.8)",
              ],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: "black", // Set legend text color to black
              },
            },
            tooltip: {
              bodyColor: "white", // Tooltip text
              titleColor: "white", // Tooltip title
            },
          },
          color: "black", // General text color (applies to labels where applicable)
        },
      });
    }

    // console.log("carbon", dataAir.data.iaqi.co);
    document.querySelector("#aqi").innerHTML = `
     <p><strong>AQI: </strong>${dataAir.data.aqi}</p>`;
    document.querySelector("#pm10").innerHTML = `
     <p><strong>PM10: </strong>${dataAir.data.iaqi.pm10.v}</p>`;
    document.querySelector("#pm25").innerHTML = `
     <p><strong>PM25: </strong>${dataAir.data.iaqi.pm25.v}</p>`;
  } catch (err4) {
    console.error("Fetch error:", err4);
    const failText = document.querySelector("#fail");
    if (failText) failText.innerText = "Failed to load pollution details.";
  }

  // map api

  const mapurl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    city
  )}`;
  try {
    const mapres = await fetch(mapurl);
    const mapdata = await mapres.json();
    if (mapdata.length > 0) {
      const lat = parseFloat(mapdata[0].lat);
      const lon = parseFloat(mapdata[0].lon);

      // If map is not initialized, create it
      if (!map) {
        map = L.map("map").setView([lat, lon], 15);

        // Add satellite tile layer from Esri
        tileLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        );
        tileLayer.addTo(map);
      } else {
        map.setView([lat, lon], 15);
      }

      // Remove old marker if it exists
      if (currentMarker) {
        map.removeLayer(currentMarker);
      }

      // Add new marker
      currentMarker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(city)
        .openPopup();
    } else {
      console.error("City not found");
    }
  } catch (err6) {
    console.error("Map load failed:", err6);
    const mapImg = document.querySelector("#map");
    if (mapImg) mapImg.innerText = "Failed to load map.";
  }
}

// function for fuel
async function checkCity() {
  const city = document.querySelector("#cityInput").value.trim().toLowerCase();

  if (!city) return;

  let matchedState = null;

  // Find the state for the input city
  for (const [state, cities] of Object.entries(stateCity)) {
    if (cities.some((cityGet) => cityGet.toLowerCase() === city)) {
      matchedState = state;
      console.log(matchedState);
    }
  }
  // rapid fuel api
  // Call Fuel API (state-wise)
  const fuelsUrl = `https://daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com/v1/fuel-prices/today/india/${matchedState}`;
  const option2 = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "5d6421aecamsh0a68819d4e05f63p15fca0jsncc31523c3340",
      "x-rapidapi-host":
        "daily-petrol-diesel-lpg-cng-fuel-prices-in-india.p.rapidapi.com",
    },
  };

  try {
    const fuelres = await fetch(fuelsUrl, option2);
    if (!fuelres.ok) throw new Error(`HTTP error! Status: ${fuelres.status}`);

    const fuelData = await fuelres.json();
    const { petrol, diesel, cng, lpg } = fuelData.fuel;

    document.querySelector("#fuelData").innerHTML = `
      <strong>⛽ Fuel Prices in ${fuelData.stateName}</strong>
      <p><strong>⛽ Petrol:</strong> ₹${petrol.retailPrice}</p>
      <p><strong>🚛 Diesel:</strong> ₹${diesel.retailPrice}</p>
      <p><strong>🔋 CNG:</strong> ₹${cng.retailPrice}</p>
      <p><strong>🍳 LPG:</strong> ₹${lpg.retailPrice}</p>
    `;
  } catch (err) {
    console.error("Fuel API Error:", err);
    document.querySelector("#fuelData").innerText = " Fuel data not available!";
  }
}
(function () {
  const cityInput = document.querySelector("#cityInput");
  const defaultCity = "mumbai";

  cityInput.value = defaultCity;
  searchCity();
  checkCity();
  cityInput.value = "";
})();

let hamburger = document.querySelector("#hamburger");
let bookmark = document.querySelector(".bookmark");
let dashboard = document.querySelector(".dashboard");
let anchor = document.querySelectorAll(".anchor");
hamburger.addEventListener("mouseenter", (evnt) => {
  bookmark.style.display = "block";
  bookmark.style.transform = "scaleY(-1)";
  hamburger.style.transform = "scaleY(-100%)";
  dashboard.style.zIndex = "-1";
});
hamburger.addEventListener("mouseleave", () => {
  bookmark.style.display = "none";
  dashboard.style.zIndex = "1";
});
