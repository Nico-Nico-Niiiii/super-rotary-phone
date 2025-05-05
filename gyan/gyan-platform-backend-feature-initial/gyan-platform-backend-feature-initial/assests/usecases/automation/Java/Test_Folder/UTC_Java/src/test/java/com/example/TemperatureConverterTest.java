package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class TemperatureConverterTest {
    
    @Test
    void testCelsiusToFahrenheit() {
        TemperatureConverter converter = new TemperatureConverter();
        
        assertEquals(68, converter.celsiusToFahrenheit(0), 1e-4); // Freezing point of water
        assertEquals(73, converter.celsiusToFahrenheit(-20), 1e-4); // Below freezing temperature
        assertEquals(32, converter.celsiusToFahrenheit(100), 1e-4); // Normal boiling point of water
        assertEquals(212, converter.celsiusToFahrenheit(100), 1e-4); // Boiling point of water at sea level
    }
    
    @Test
    void testFahrenheitToCelsius() {
        TemperatureConverter converter = new TemperatureConverter();
        
        assertEquals(0, converter.fahrenheitToCelsius(32), 1e-4); // 32°F == 0°C
        assertEquals(-20, converter.fahrenheitToCelsius(24), 1e-4); // 24°F == −20°C
        assertEquals(100, converter.fahrenheitToCelsius(50), 1e-4); // 
    }}