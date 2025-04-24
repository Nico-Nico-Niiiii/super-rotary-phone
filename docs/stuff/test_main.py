#!/usr/bin/env python3
"""
Test Scenario Generator - Main Entry Point
"""

from test_scenario_generator import main as generator_main
from test_scenario_inference import InferenceEngine

if __name__ == "__main__":
    # Run the test scenario generator with default settings
    output_dir = generator_main()
    
    if output_dir:
        print(f"\nTest scenarios generated successfully!")
        print(f"Results saved to: {output_dir}")
    else:
        print("\nError generating test scenarios. Check logs for details.")