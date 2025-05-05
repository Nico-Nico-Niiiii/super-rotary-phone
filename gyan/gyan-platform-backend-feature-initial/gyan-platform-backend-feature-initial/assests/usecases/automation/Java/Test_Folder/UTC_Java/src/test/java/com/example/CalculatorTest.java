package com.example;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class CalculatorTest {
    
    @Test
    void testAdd() {
        Calculator calculator = new Calculator();
        
        assertEquals(4, calculator.add(2, 3)); // Testing addition of two positive numbers
        assertEquals(-1, calculator.add(-2, 1)); // Testing addition of negative and positive numbers
        assertEquals(0, calculator.add(0, 0)); // Testing addition of zeroes
    }
    
    @Test
    void testSubtract() {
        Calculator calculator = new Calculator();
        
        assertEquals(2, calculator.subtract(5, 3)); // Testing subtraction of two positive numbers
        assertEquals(-6, calculator.subtract(-5, 1)); // Testing subtraction of negative and positive numbers
        assertEquals(0, calculator.subtract(0, 0)); // Testing subtraction of zeroes
    }
    
}