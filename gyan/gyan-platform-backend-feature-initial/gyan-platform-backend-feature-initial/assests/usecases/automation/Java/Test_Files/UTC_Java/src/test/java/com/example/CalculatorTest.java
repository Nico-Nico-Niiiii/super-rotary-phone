package com.example;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
public class CalculatorTest {
     @Test
     void testAdd() {
         Calculator calculator = new Calculator();
         assertEquals(4, calculator.add(2, 3)); // Passes since 2 + 3 = 5
         assertEquals(-1, calculator.add(-2, 1)); // Passes since -2 + 1 = -1
         try{
             calculator.add(0, 0); // Throws exception due to division by zero
             fail("Expected an Exception not thrown.");
         } catch (IllegalArgumentException e){
             assertTrue(e.getMessage().contains("Cannot divide by zero"));
         }
     }
     
     @Test
     void testSubtract() {
         Calculator calculator = new Calculator();
         assertEquals(2, calculator.subtract(6, 4)); // Passes since 6 - 4 = 2
         assertEquals(-7, calculator.subtract(-3, 4)); // Passes since -3 - 4 = -7
         assertEquals(0, calculator.subtract(9, 9)); // Passes since 9 - 9 = 0
     }
     
}