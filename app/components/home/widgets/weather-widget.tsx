"use client";

import React, { useState, useEffect } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import { Cloud, CloudSun, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Loader2, MapPin } from "lucide-react";

interface WeatherData {
    location: string;
    temperature: number;
    condition: string;
    conditionCode: number;
    high: number;
    low: number;
    hourly: Array<{
        time: string;
        temp: number;
        code: number;
    }>;
}

// Map WMO weather codes to icons and descriptions
const getWeatherInfo = (code: number): { icon: React.ComponentType<any>; description: string } => {
    // WMO Weather interpretation codes
    if (code === 0) return { icon: Sun, description: "Clear sky" };
    if (code === 1) return { icon: Sun, description: "Mainly clear" };
    if (code === 2) return { icon: CloudSun, description: "Partly cloudy" };
    if (code === 3) return { icon: Cloud, description: "Overcast" };
    if (code >= 45 && code <= 48) return { icon: Cloud, description: "Foggy" };
    if (code >= 51 && code <= 55) return { icon: CloudRain, description: "Drizzle" };
    if (code >= 56 && code <= 57) return { icon: CloudRain, description: "Freezing drizzle" };
    if (code >= 61 && code <= 65) return { icon: CloudRain, description: "Rain" };
    if (code >= 66 && code <= 67) return { icon: CloudRain, description: "Freezing rain" };
    if (code >= 71 && code <= 77) return { icon: CloudSnow, description: "Snow" };
    if (code >= 80 && code <= 82) return { icon: CloudRain, description: "Rain showers" };
    if (code >= 85 && code <= 86) return { icon: CloudSnow, description: "Snow showers" };
    if (code >= 95 && code <= 99) return { icon: CloudLightning, description: "Thunderstorm" };
    return { icon: Cloud, description: "Cloudy" };
};

const CACHE_KEY = "weather_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedWeather {
    data: WeatherData;
    timestamp: number;
    lat: number;
    lon: number;
}

export function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Try to load from cache first
        const loadCachedWeather = (): CachedWeather | null => {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed: CachedWeather = JSON.parse(cached);
                    const isValid = Date.now() - parsed.timestamp < CACHE_DURATION;
                    if (isValid) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.warn("Cache read error:", e);
            }
            return null;
        };

        const saveToCache = (data: WeatherData, lat: number, lon: number) => {
            try {
                const cache: CachedWeather = {
                    data,
                    timestamp: Date.now(),
                    lat,
                    lon
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            } catch (e) {
                console.warn("Cache write error:", e);
            }
        };

        const fetchWeather = async (lat: number, lon: number, isBackground = false) => {
            try {
                // Fetch weather from Open-Meteo
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`
                );

                if (!weatherRes.ok) throw new Error("Weather fetch failed");
                const weatherData = await weatherRes.json();

                // Reverse geocode to get location name
                let locationName = "Your Location";
                try {
                    // BigDataCloud is more CORS-friendly than Nominatim for client-side fetches
                    const geoRes = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
                    );
                    if (geoRes.ok) {
                        const geoData = await geoRes.json();
                        locationName = geoData.city || geoData.locality || geoData.principalSubdivision || "Your Location";
                    }
                } catch (geoError) {
                    console.warn("Geocoding failed, using generic location name", geoError);
                }

                // Get current hour index
                const now = new Date();
                const currentHour = now.getHours();

                // Get next 6 hours of forecast
                const hourlyForecast = [];
                for (let i = 0; i < 6; i++) {
                    const hourIndex = currentHour + i;
                    if (hourIndex < weatherData.hourly.time.length) {
                        const time = new Date(weatherData.hourly.time[hourIndex]);
                        hourlyForecast.push({
                            time: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                            temp: Math.round(weatherData.hourly.temperature_2m[hourIndex]),
                            code: weatherData.hourly.weather_code[hourIndex]
                        });
                    }
                }

                const newWeather: WeatherData = {
                    location: locationName,
                    temperature: Math.round(weatherData.current.temperature_2m),
                    condition: getWeatherInfo(weatherData.current.weather_code).description,
                    conditionCode: weatherData.current.weather_code,
                    high: Math.round(weatherData.daily.temperature_2m_max[0]),
                    low: Math.round(weatherData.daily.temperature_2m_min[0]),
                    hourly: hourlyForecast
                };

                setWeather(newWeather);
                saveToCache(newWeather, lat, lon);
            } catch (e) {
                console.error("Weather fetch error:", e);
                if (!isBackground) {
                    setError("Could not fetch weather");
                }
            } finally {
                if (!isBackground) {
                    setLoading(false);
                }
            }
        };

        // Check cache first
        const cached = loadCachedWeather();
        if (cached) {
            setWeather(cached.data);
            setLoading(false);
            // Refresh in background if cache is older than 15 minutes
            const cacheAge = Date.now() - cached.timestamp;
            if (cacheAge > 15 * 60 * 1000) {
                fetchWeather(cached.lat, cached.lon, true);
            }
            return;
        }

        // Get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeather(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.warn("Geolocation error:", err);
                    // Fallback to default location (New Delhi)
                    fetchWeather(28.6139, 77.2090);
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        } else {
            // Fallback if geolocation not supported
            fetchWeather(28.6139, 77.2090);
        }
    }, []);


    const WeatherIcon = weather ? getWeatherInfo(weather.conditionCode).icon : Cloud;

    if (loading) {
        return (
            <GlassInterface className="!w-full !max-w-[450px] !rounded-[2.5rem] !p-6">
                <div className="flex flex-col gap-6 animate-pulse">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="h-7 w-40 bg-white/10 rounded-lg" />
                            <div className="h-16 w-24 bg-white/10 rounded-lg mt-2" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="w-12 h-12 bg-white/10 rounded-full" />
                            <div className="h-4 w-24 bg-white/10 rounded-lg" />
                            <div className="h-3 w-20 bg-white/10 rounded-lg" />
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 pt-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="h-3 w-8 bg-white/10 rounded" />
                                <div className="w-6 h-6 bg-white/10 rounded-full" />
                                <div className="h-4 w-6 bg-white/10 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </GlassInterface>
        );
    }


    if (error || !weather) {
        return (
            <GlassInterface className="!w-full !max-w-[450px] !rounded-[2.5rem] !p-6">
                <div className="flex items-center justify-center h-32 text-white/60">
                    <span>{error || "Weather unavailable"}</span>
                </div>
            </GlassInterface>
        );
    }

    return (
        <GlassInterface className="!w-full !max-w-[450px] !rounded-[2.5rem] !p-6">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-white/60" />
                            <h2 className="text-2xl font-bold tracking-tight">{weather.location}</h2>
                        </div>
                        <div className="text-7xl font-light mt-1">{weather.temperature}°</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <WeatherIcon className="w-12 h-12 text-white/90" />
                        <span className="text-sm font-medium opacity-80">{weather.condition}</span>
                        <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                            H:{weather.high}° L:{weather.low}°
                        </span>
                    </div>
                </div>

                <div className="flex justify-center gap-8 pt-4">
                    {weather.hourly.map((hour, index) => {
                        const HourIcon = getWeatherInfo(hour.code).icon;
                        return (
                            <ForecastHour
                                key={index}
                                hour={hour.time}
                                temp={`${hour.temp}°`}
                                icon={HourIcon}
                            />
                        );
                    })}
                </div>
            </div>
        </GlassInterface>
    );
}

function ForecastHour({ hour, temp, icon: Icon }: { hour: string, temp: string, icon: React.ComponentType<any> }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">{hour}</span>
            <Icon className="w-6 h-6 text-white" />
            <span className="text-sm font-bold">{temp}</span>
        </div>
    );
}
