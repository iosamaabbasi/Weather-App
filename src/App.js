import React, { useState } from "react";
import { Country, City } from "country-state-city";
import Select from "react-select";
import "./styles.css";

export default function App() {
  const [countries] = useState(
    Country.getAllCountries().map((c) => ({
      value: c.isoCode,
      label: c.name,
    }))
  );
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [pastForecast, setPastForecast] = useState([]);
  const [futureForecast, setFutureForecast] = useState([]);
  const [viewMode, setViewMode] = useState("weather");
  const [countryCode, setCountryCode] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const API_KEY = "5fe302c5dd917cf654f27c2ab2740be2";

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      padding: "4px",
      borderRadius: "10px",
    }),
  };

  const formatTime = (timestamp, offset) => {
    return new Date((timestamp + offset) * 1000).toLocaleTimeString();
  };

  const handleSubmit = async () => {
    if (!selectedCountry || !selectedCity) return;

    const cityName = selectedCity.label;
    const countryISO = selectedCountry.value;
    const countryInfo = Country.getCountryByCode(countryISO);
    setCountryCode(countryInfo.phonecode);

    // Current Weather
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${cityName},${countryISO}&units=metric&appid=${API_KEY}`
    );
    const data = await res.json();
    setWeather(data);

    // Future Forecast (7 days from 5-day/3-hour API approximation)
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cityName},${countryISO}&units=metric&appid=${API_KEY}`
    );
    const forecastData = await forecastRes.json();

    const futureDays = [];
    for (let i = 0; i < forecastData.list.length; i += 8) {
      const item = forecastData.list[i];
      const date = new Date(item.dt * 1000).toLocaleDateString();
      futureDays.push({
        date,
        temp: item.main.temp,
        condition: item.weather[0].main,
        humidity: item.main.humidity,
        wind: item.wind.speed,
        rain: item.rain ? `${item.rain["3h"]} mm` : "No rain",
      });
    }
    setFutureForecast(futureDays.slice(0, 7));

    // Past Forecast - Mock data
    const pastDays = [];
    for (let i = 7; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      pastDays.push({
        date: date.toLocaleDateString(),
        temp: Math.floor(Math.random() * 15) + 15,
        condition: ["Clear", "Rain", "Clouds"][Math.floor(Math.random() * 3)],
        humidity: Math.floor(Math.random() * 40) + 50,
        wind: (Math.random() * 5 + 1).toFixed(1),
        rain: Math.random() > 0.5 ? `${(Math.random() * 10).toFixed(1)} mm` : "No rain",
      });
    }
    setPastForecast(pastDays);

    setCurrentDayIndex(0);
    setViewMode("weather");
  };

  const renderForecastDay = (data, index) => {
    const day = data[index];
    return (
      <div className="forecast-box">
        <h3>{day.date}</h3>
        <p>🌡 Temperature: {day.temp} °C</p>
        <p>☁ Condition: {day.condition}</p>
        <p>💧 Humidity: {day.humidity}%</p>
        <p>🌬 Wind: {day.wind} m/s</p>
        <p>🌧 Rain: {day.rain}</p>
        <div className="nav-buttons">
          <button
            className="submit-btn"
            onClick={() => setCurrentDayIndex((prev) => Math.max(prev - 1, 0))}
            disabled={index === 0}
          >
            ⬅ Previous
          </button>
          <button
            className="submit-btn"
            onClick={() => setCurrentDayIndex((prev) => Math.min(prev + 1, data.length - 1))}
            disabled={index === data.length - 1}
          >
            Next ➡
          </button>
        </div>
        <button className="submit-btn" onClick={() => setViewMode("weather")}>
          🏠 Back to Home
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1>Weather App</h1>
      <div className="search-section">
        <Select
          options={countries}
          placeholder="Select Country"
          onChange={(value) => {
            setSelectedCountry(value);
            setSelectedCity(null);
            setWeather(null);
            setPastForecast([]);
            setFutureForecast([]);
            setViewMode("weather");
            if (value) {
              setCities(
                City.getCitiesOfCountry(value.value).map((c) => ({
                  value: c.name,
                  label: c.name,
                }))
              );
            } else {
              setCities([]);
            }
          }}
          value={selectedCountry}
          isSearchable
          isClearable
          styles={customSelectStyles}
        />

        <Select
          options={cities}
          placeholder="Select City"
          onChange={(value) => setSelectedCity(value)}
          value={selectedCity}
          isDisabled={!selectedCountry}
          isSearchable
          isClearable
          styles={customSelectStyles}
        />

        <button onClick={handleSubmit} className="submit-btn">
          Submit
        </button>
      </div>

      {viewMode === "weather" && weather && (
        <>
          <div className="weather-box">
            <h2>Weather in {weather.name}</h2>
            <p>📞 Country Code: +{countryCode}</p>
            <p>🌡 Temperature: {weather.main.temp} °C</p>
            <p>☁ Condition: {weather.weather[0].main}</p>
            <p>💧 Humidity: {weather.main.humidity}%</p>
            <p>🌬 Wind: {weather.wind.speed} m/s</p>
            <p>🕒 Local Time: {new Date().toLocaleTimeString()}</p>
            <p>🌅 Sunrise: {formatTime(weather.sys.sunrise, weather.timezone)}</p>
            <p>🌇 Sunset: {formatTime(weather.sys.sunset, weather.timezone)}</p>
            <p>🌧 Rain: {weather.rain ? `${weather.rain["1h"]} mm` : "No rain"}</p>
          </div>

          <div className="forecast-toggle">
            <button onClick={() => { setViewMode("past"); setCurrentDayIndex(0); }} className="submit-btn">
              7-Days Past
            </button>
            <button onClick={() => { setViewMode("future"); setCurrentDayIndex(0); }} className="submit-btn">
              7-Days Future
            </button>
          </div>
        </>
      )}

      {viewMode === "past" && renderForecastDay(pastForecast, currentDayIndex)}
      {viewMode === "future" && renderForecastDay(futureForecast, currentDayIndex)}
    </div>
  );
}
