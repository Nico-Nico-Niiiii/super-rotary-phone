"""
Main script for code generation and integration.

This script provides the entry point for generating code from technical specifications
and integrating the generated code into a cohesive solution.
"""

import os
import logging
import argparse
from typing import Tuple, Optional

# Import the code generator module
import code_generator
import inference

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main entry point for the code generation and integration process."""
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Generate and integrate code from technical specifications.')
    parser.add_argument('--excel', type=str, default='tech.xlsx', help='Path to Excel file with technical specifications')
    parser.add_argument('--gen-only', action='store_true', help='Only generate code without integration')
    parser.add_argument('--integrate-only', action='store_true', help='Only integrate existing code')
    parser.add_argument('--code-dir', type=str, help='Path to existing code generation directory for integration')
    parser.add_argument('--output-dir', type=str, help='Path to output directory')
    
    # Parse arguments
    args = parser.parse_args()
    
    try:
        # Initialize the manager
        manager = code_generator.CodeGenerationManager()
        
        # Check for Azure OpenAI configuration
        inference.configure_openai()
        
        # Process based on arguments
        if args.integrate_only:
            # Only integrate existing code
            if args.code_dir:
                print(f"Integrating existing code from directory: {args.code_dir}")
                integrated_dir = manager.integrate_code(args.code_dir)
                if integrated_dir:
                    print(f"Integration completed successfully. Output directory: {integrated_dir}")
                else:
                    print("Integration failed. Check logs for details.")
            else:
                print("No code directory specified for integration. Using the latest code generation folder.")
                integrated_dir = manager.integrate_code()
                if integrated_dir:
                    print(f"Integration completed successfully. Output directory: {integrated_dir}")
                else:
                    print("Integration failed. Check logs for details.")
        elif args.gen_only:
            # Only generate code without integration
            excel_path = args.excel
            if not os.path.exists(excel_path):
                print(f"Excel file not found: {excel_path}")
                return
            
            print(f"Generating code from technical specifications in: {excel_path}")
            code_gen_dir = manager.process_tech_specs(excel_path)
            if code_gen_dir:
                print(f"Code generation completed successfully. Output directory: {code_gen_dir}")
            else:
                print("Code generation failed. Check logs for details.")
        else:
            # Run the complete workflow
            excel_path = args.excel
            if not os.path.exists(excel_path):
                print(f"Excel file not found: {excel_path}")
                return
            
            print(f"Running complete workflow with specifications from: {excel_path}")
            code_gen_dir, integrated_dir = manager.run_combined_workflow(excel_path)
            
            if code_gen_dir and integrated_dir:
                print("\nWorkflow completed successfully!")
                print(f"Generated code: {code_gen_dir}")
                print(f"Integrated solution: {integrated_dir}")
            else:
                print("\nWorkflow completed with errors. Check logs for details.")
    
    except Exception as e:
        logger.error(f"Error in main: {e}")
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")

if __name__ == "__main__":
    main()