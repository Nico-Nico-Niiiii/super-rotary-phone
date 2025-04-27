"""
Test Scenario Generator for Integrated Solution

This module provides an end-to-end solution that:
1. Extracts the uploaded zip file containing integrated solution
2. Analyzes each US_[number]_code.py file to create detailed descriptions
3. Saves these descriptions in JSON format
4. Reads the original technical specifications from the Excel file
5. Combines code descriptions, tech specs, and user stories to generate test scenarios
6. Saves the test scenarios in both JSON and Markdown formats

The workflow is completely automated from integrated solution to test scenarios.
"""

import os
import logging
import json
import re
import pandas as pd
import zipfile
import tempfile
import shutil
from typing import TypedDict, Annotated, List, Dict, Tuple, Optional, Set, Any
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import AnyMessage
from datetime import datetime
from glob import glob

# Import the inference engine
from inference import InferenceEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

#############################################################
# TypedDict definitions for state management
#############################################################

class CodeDescriptionState(TypedDict):
    """State management for code description process"""
    messages: Annotated[list[AnyMessage], operator.add]
    current_description: dict
    user_story_id: str
    file_path: str

class TestScenarioState(TypedDict):
    """State management for test scenario generation process"""
    messages: Annotated[list[AnyMessage], operator.add]
    current_test_scenarios: dict
    user_story_id: str
    code_description: dict
    tech_spec: str
    user_story: str

#############################################################
# Utility Functions
#############################################################

class FileUtils:
    """Utility class for file operations"""
    
    @staticmethod
    def extract_zip_file(zip_path, extract_to=None):
        """
        Extract a zip file to a temporary directory or specified location.
        
        Args:
            zip_path (str): Path to the zip file
            extract_to (str, optional): Directory to extract to. If None, creates a temp directory.
            
        Returns:
            str: Path to the directory containing extracted files
        """
        if not os.path.exists(zip_path):
            raise FileNotFoundError(f"Zip file not found at {zip_path}")
        
        # Create a temporary directory if none provided
        if extract_to is None:
            extract_to = tempfile.mkdtemp(prefix="integrated_solution_")
        else:
            os.makedirs(extract_to, exist_ok=True)
        
        # Try to extract the zip file
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_to)
                
            logger.info(f"Extracted zip file to {extract_to}")
            return extract_to
            
        except zipfile.BadZipFile:
            # Clean up the temporary directory if it's corrupt
            if os.path.exists(extract_to):
                shutil.rmtree(extract_to)
            raise ValueError(f"The file at {zip_path} is not a valid zip file")
        
        except Exception as e:
            # Clean up on any other error
            if os.path.exists(extract_to):
                shutil.rmtree(extract_to)
            raise Exception(f"Error extracting zip file: {str(e)}")
    
    @staticmethod
    def find_code_files(solution_folder):
        """Find all US_[number]_code.py files in the integrated solution folder."""
        pattern = os.path.join(solution_folder, "**", "US_*_code.py")
        return glob(pattern, recursive=True)
    
    @staticmethod
    def create_output_directory():
        """Create output directory for code descriptions and test scenarios."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_dir = f"test_scenarios_{timestamp}"
        
        # Create main directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Create subdirectories
        descriptions_dir = os.path.join(output_dir, "code_descriptions")
        test_scenarios_dir = os.path.join(output_dir, "test_scenarios")
        
        os.makedirs(descriptions_dir, exist_ok=True)
        os.makedirs(test_scenarios_dir, exist_ok=True)
        
        return output_dir, descriptions_dir, test_scenarios_dir
    
    @staticmethod
    def extract_user_story_id(file_path):
        """Extract user story ID from filename."""
        filename = os.path.basename(file_path)
        match = re.match(r'US_(\d+)_code\.py', filename)
        if match:
            return f"US_{match.group(1)}"
        return None
    
    @staticmethod
    def read_tech_specs_and_user_stories(excel_file_path):
        """Read technical specifications and user stories from Excel file."""
        try:
            # Check if file exists
            if not os.path.exists(excel_file_path):
                logger.error(f"Excel file not found at {excel_file_path}")
                return {}, {}
                
            # Try to read the Excel file
            try:
                df = pd.read_excel(excel_file_path)
            except Exception as e:
                logger.error(f"Failed to read Excel file: {e}")
                return {}, {}
                
            # Check if dataframe is empty
            if df.empty:
                logger.error("Excel file contains no data")
                return {}, {}
            
            # Find the user story column and tech spec column
            user_story_col = None
            tech_spec_col = None
            
            # Determine column names - assuming first row has column headers
            col_names = df.columns.tolist()
            
            # Find user story column
            for col in col_names:
                if 'user' in str(col).lower() and 'story' in str(col).lower():
                    user_story_col = col
                    break
            
            # Find tech spec column
            for col in col_names:
                if ('tech' in str(col).lower() and 'spec' in str(col).lower()) or 'requirement' in str(col).lower():
                    tech_spec_col = col
                    break
            
            # If we didn't find the right columns, default to the first two
            if user_story_col is None and len(col_names) > 0:
                user_story_col = col_names[0]
                logger.warning(f"No user story column identified - using first column: '{user_story_col}'")
            
            if tech_spec_col is None and len(col_names) > 1:
                tech_spec_col = col_names[1]
                logger.warning(f"No tech spec column identified - using second column: '{tech_spec_col}'")
            
            # If we still don't have columns (only one column in file), return empty
            if user_story_col is None or tech_spec_col is None:
                logger.error("Excel file doesn't have enough columns for user stories and tech specs")
                return {}, {}
                
            logger.info(f"Using columns: User Story = '{user_story_col}', Tech Spec = '{tech_spec_col}'")
            
            # Extract user stories and tech specs
            user_stories = {}
            tech_specs = {}
            
            # Skip the first row if it's empty
            start_row = 1 if df.iloc[0].isna().all() else 0
            
            for idx, row in df.iloc[start_row:].iterrows():
                if pd.isna(row[user_story_col]) or pd.isna(row[tech_spec_col]):
                    logger.warning(f"Skipping row {idx} due to missing data")
                    continue
                    
                user_story_text = str(row[user_story_col])
                tech_spec_text = str(row[tech_spec_col])
                
                # Extract user story ID
                match = re.search(r'User\s+Story\s+ID\s*:\s*(\d+)', user_story_text, re.IGNORECASE)
                if match:
                    user_story_id = f"US_{match.group(1)}"
                    user_stories[user_story_id] = user_story_text
                    tech_specs[user_story_id] = tech_spec_text
                else:
                    # Alternative pattern
                    match = re.search(r'^(?:(?:user)?story|us)(\d+)', user_story_text, re.IGNORECASE | re.MULTILINE)
                    if match:
                        user_story_id = f"US_{match.group(1)}"
                        user_stories[user_story_id] = user_story_text
                        tech_specs[user_story_id] = tech_spec_text
                    else:
                        # If we can't extract an ID, generate one based on the row number
                        user_story_id = f"US_ROW_{idx}"
                        user_stories[user_story_id] = user_story_text
                        tech_specs[user_story_id] = tech_spec_text
                        logger.warning(f"Created artificial ID {user_story_id} for user story: {user_story_text[:50]}...")
            
            logger.info(f"Successfully extracted {len(user_stories)} user stories and tech specs from Excel file")
            return user_stories, tech_specs
            
        except Exception as e:
            logger.error(f"Error reading Excel file: {e}")
            return {}, {}

    @staticmethod
    def cleanup_temp_directory(directory):
        """Clean up temporary directory after processing."""
        if directory and os.path.exists(directory):
            try:
                shutil.rmtree(directory)
                logger.info(f"Cleaned up temporary directory: {directory}")
            except Exception as e:
                logger.warning(f"Failed to clean up directory {directory}: {e}")


#############################################################
# Code Description Generation
#############################################################

class CodeDescriptionGenerator:
    """Class for generating detailed code descriptions"""
    
    def __init__(self, inference_engine, output_dir):
        """
        Initialize code description generator
        
        Args:
            inference_engine: InferenceEngine instance for making model calls
            output_dir: Directory to save code descriptions
        """
        self.output_dir = output_dir
        self.inference_engine = inference_engine
        
        # Initialize graph
        graph = StateGraph(CodeDescriptionState)
        
        # Add nodes
        graph.add_node("analyzer", self.analyzer)
        
        # Add edges
        graph.add_edge("analyzer", END)
        
        # Set entry point
        graph.set_entry_point("analyzer")
        self.graph = graph.compile()
    
    def analyzer(self, state: CodeDescriptionState):
        """Generate code description"""
        user_story_id = state.get('user_story_id', 'unknown_id')
        file_path = state.get('file_path', '')
        
        logger.info(f"Analyzing code for {user_story_id} from {file_path}")
        
        # Read code file
        with open(file_path, 'r') as f:
            code = f.read()
        
        module_name = os.path.basename(file_path)
        
        # Call inference engine to analyze code
        description = self.inference_engine.analyze_code(code, module_name)
        
        # Save description
        self._save_description(description, user_story_id)
        
        return {
            'messages': [],
            'current_description': description,
            'user_story_id': user_story_id,
            'file_path': file_path
        }
    
    def _save_description(self, description, user_story_id):
        """Save code description to JSON file."""
        file_path = os.path.join(self.output_dir, f"{user_story_id}_description.json")
        with open(file_path, 'w') as f:
            json.dump(description, f, indent=2)
        
        logger.info(f"Saved code description to {file_path}")


#############################################################
# Test Scenario Generation
#############################################################

class TestScenarioGenerator:
    """Class for generating test scenarios"""
    
    def __init__(self, inference_engine, output_dir):
        """
        Initialize test scenario generator
        
        Args:
            inference_engine: InferenceEngine instance for making model calls
            output_dir: Directory to save test scenarios
        """
        self.output_dir = output_dir
        self.inference_engine = inference_engine
        
        # Initialize graph
        graph = StateGraph(TestScenarioState)
        
        # Add nodes
        graph.add_node("generator", self.generator)
        
        # Add edges
        graph.add_edge("generator", END)
        
        # Set entry point
        graph.set_entry_point("generator")
        self.graph = graph.compile()
    
    def generator(self, state: TestScenarioState):
        """Generate test scenarios"""
        user_story_id = state.get('user_story_id', 'unknown_id')
        code_description = state.get('code_description', {})
        tech_spec = state.get('tech_spec', '')
        user_story = state.get('user_story', '')
        
        logger.info(f"Generating test scenarios for {user_story_id}")
        
        # Call inference engine to generate test scenarios
        test_scenarios = self.inference_engine.generate_test_scenarios(
            code_description, tech_spec, user_story, user_story_id
        )
        
        # Save test scenarios
        self._save_test_scenarios(test_scenarios, user_story_id)
        
        return {
            'messages': [],
            'current_test_scenarios': test_scenarios,
            'user_story_id': user_story_id,
            'code_description': code_description,
            'tech_spec': tech_spec,
            'user_story': user_story
        }
    
    def _save_test_scenarios(self, test_scenarios, user_story_id):
        """Save test scenarios to JSON and MD files."""
        # Save as JSON
        json_path = os.path.join(self.output_dir, f"{user_story_id}_test_scenarios.json")
        with open(json_path, 'w') as f:
            json.dump(test_scenarios, f, indent=2)
        
        # Save as Markdown
        md_path = os.path.join(self.output_dir, f"{user_story_id}_test_scenarios.md")
        with open(md_path, 'w') as f:
            f.write(self._convert_to_markdown(test_scenarios))
        
        logger.info(f"Saved test scenarios to {json_path} and {md_path}")
    
    def _convert_to_markdown(self, test_scenarios):
        """Convert test scenarios JSON to Markdown format."""
        md_content = []
        
        # Add header
        md_content.append(f"# {test_scenarios.get('test_suite_name', 'Test Scenarios')}")
        md_content.append("")
        
        # Add summary
        md_content.append("## Summary")
        md_content.append(test_scenarios.get('summary', 'No summary provided.'))
        md_content.append("")
        
        # Add test coverage
        coverage = test_scenarios.get('coverage', {})
        if coverage:
            md_content.append("## Test Coverage")
            
            # Functional areas
            functional = coverage.get('functional_areas', [])
            if functional:
                md_content.append("### Functional Areas")
                for area in functional:
                    md_content.append(f"- {area}")
                md_content.append("")
            
            # Edge cases
            edge_cases = coverage.get('edge_cases', [])
            if edge_cases:
                md_content.append("### Edge Cases")
                for case in edge_cases:
                    md_content.append(f"- {case}")
                md_content.append("")
            
            # Not covered
            not_covered = coverage.get('not_covered', [])
            if not_covered:
                md_content.append("### Areas Not Covered")
                for area in not_covered:
                    md_content.append(f"- {area}")
                md_content.append("")
        
        # Add test scenarios
        md_content.append("## Test Scenarios")
        md_content.append("")
        
        for ts in test_scenarios.get('test_scenarios', []):
            md_content.append(f"### {ts.get('id', 'TS-XXX')}: {ts.get('name', 'Unnamed Test Scenario')}")
            md_content.append("")
            
            md_content.append(f"**Category:** {ts.get('category', 'Unknown')}")
            md_content.append("")
            
            md_content.append("**Description:**")
            md_content.append(ts.get('description', 'No description provided.'))
            md_content.append("")
            
            md_content.append("**Test Objective:**")
            md_content.append(ts.get('test_objective', 'No objective provided.'))
            md_content.append("")
            
            md_content.append("**Expected Outcome:**")
            md_content.append(ts.get('expected_outcome', 'No expected outcome provided.'))
            md_content.append("")
            
            # Relevant requirements
            relevant_requirements = ts.get('relevant_requirements', '')
            if relevant_requirements:
                md_content.append(f"**Relevant Requirements:** {relevant_requirements}")
                md_content.append("")
        
        return "\n".join(md_content)


#############################################################
# Main Workflow Manager
#############################################################

class TestScenarioGeneratorWorkflow:
    """Main class that orchestrates the entire test scenario generation workflow"""
    
    def __init__(self, zip_file_path, excel_file_path):
        """
        Initialize the workflow
        
        Args:
            zip_file_path: Path to zip file containing integrated solution
            excel_file_path: Path to Excel file with user stories and tech specs
        """
        self.zip_file_path = zip_file_path
        self.excel_file_path = excel_file_path
        self.inference_engine = None
        self.output_dir = None
        self.descriptions_dir = None
        self.test_scenarios_dir = None
        self.code_files = []
        self.user_stories = {}
        self.tech_specs = {}
        self.descriptions = {}
        self.test_scenarios = {}
        self.temp_directory = None
    
    def initialize(self):
        """Initialize the workflow by setting up directories and inference engine"""
        logger.info("Initializing test scenario generator workflow")
        
        # Validate input files
        if not os.path.exists(self.zip_file_path):
            raise FileNotFoundError(f"Zip file not found at: {self.zip_file_path}")
        
        if not os.path.exists(self.excel_file_path):
            raise FileNotFoundError(f"Excel file not found at: {self.excel_file_path}")
        
        # Initialize inference engine
        self.inference_engine = InferenceEngine()
        
        # Create output directories
        self.output_dir, self.descriptions_dir, self.test_scenarios_dir = FileUtils.create_output_directory()
        logger.info(f"Created output directories: {self.output_dir}")
        
        # Extract zip file
        self.temp_directory = FileUtils.extract_zip_file(self.zip_file_path)
        logger.info(f"Extracted zip file to temporary directory: {self.temp_directory}")
        
        # Find code files
        self.code_files = FileUtils.find_code_files(self.temp_directory)
        logger.info(f"Found {len(self.code_files)} code files")
        
        if not self.code_files:
            raise FileNotFoundError("No code files found in the zip archive")
        
        # Read user stories and tech specs
        self.user_stories, self.tech_specs = FileUtils.read_tech_specs_and_user_stories(self.excel_file_path)
        logger.info(f"Read {len(self.user_stories)} user stories and tech specs from Excel")
        
        if not self.user_stories:
            logger.warning("No user stories found in the Excel file. Test scenarios may be incomplete.")
        
        return self
    
    def process_code_files(self):
        """Process all code files to generate descriptions"""
        logger.info("Starting code file processing")
        
        # Initialize code description generator
        code_desc_gen = CodeDescriptionGenerator(
            inference_engine=self.inference_engine,
            output_dir=self.descriptions_dir
        )
        
        # Process each code file
        for file_path in self.code_files:
            user_story_id = FileUtils.extract_user_story_id(file_path)
            if not user_story_id:
                logger.warning(f"Could not extract user story ID from {file_path}, skipping")
                continue
            
            logger.info(f"Processing code file for {user_story_id}")
            
            # Setup initial state
            initial_state = {
                "messages": [],
                "current_description": {},
                "user_story_id": user_story_id,
                "file_path": file_path
            }
            
            try:
                # Run the graph
                result = code_desc_gen.graph.invoke(initial_state)
                
                # Store description
                if 'current_description' in result and result['current_description']:
                    self.descriptions[user_story_id] = result['current_description']
                    logger.info(f"Successfully generated description for {user_story_id}")
            
            except Exception as e:
                logger.error(f"Error processing code file for {user_story_id}: {e}")
                continue
        
        logger.info(f"Generated {len(self.descriptions)} code descriptions")
        return self
    
    def generate_test_scenarios(self):
        """Generate test scenarios for each module"""
        logger.info("Starting test scenario generation")
        
        # Initialize test scenario generator
        test_gen = TestScenarioGenerator(
            inference_engine=self.inference_engine,
            output_dir=self.test_scenarios_dir
        )
        
        # Process each module
        for user_story_id, description in self.descriptions.items():
            # Get user story and tech spec if available
            user_story = self.user_stories.get(user_story_id, f"User story for {user_story_id} not available")
            tech_spec = self.tech_specs.get(user_story_id, f"Technical specification for {user_story_id} not available")
            
            logger.info(f"Generating test scenarios for {user_story_id}")
            
            # Setup initial state
            initial_state = {
                "messages": [],
                "current_test_scenarios": {},
                "user_story_id": user_story_id,
                "code_description": description,
                "tech_spec": tech_spec,
                "user_story": user_story
            }
            
            try:
                # Run the graph
                result = test_gen.graph.invoke(initial_state)
                
                # Store test scenarios
                if 'current_test_scenarios' in result and result['current_test_scenarios']:
                    self.test_scenarios[user_story_id] = result['current_test_scenarios']
                    logger.info(f"Successfully generated test scenarios for {user_story_id}")
            
            except Exception as e:
                logger.error(f"Error generating test scenarios for {user_story_id}: {e}")
                continue
        
        logger.info(f"Generated test scenarios for {len(self.test_scenarios)} modules")
        return self
    
    def create_summary_report(self):
        """Create a summary report of all code descriptions and test scenarios"""
        logger.info("Creating summary report")
        
        report = {
            "generation_timestamp": datetime.now().isoformat(),
            "modules_analyzed": len(self.descriptions),
            "test_scenarios_generated": sum(len(ts.get('test_scenarios', [])) for ts in self.test_scenarios.values()),
            "modules": [
                {
                    "id": module_id,
                    "purpose": desc.get('overall_purpose', 'No purpose provided'),
                    "scenario_count": len(self.test_scenarios.get(module_id, {}).get('test_scenarios', [])),
                    "scenario_categories": list(set(ts.get('category', 'unknown') 
                                               for ts in self.test_scenarios.get(module_id, {}).get('test_scenarios', [])))
                }
                for module_id, desc in self.descriptions.items()
            ]
        }
        
        # Save as JSON
        report_path = os.path.join(self.output_dir, "summary_report.json")
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Save as Markdown
        md_report_path = os.path.join(self.output_dir, "summary_report.md")
        
        md_content = [
            "# Test Scenario Generation Summary Report",
            "",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Modules Analyzed:** {report['modules_analyzed']}",
            f"**Total Test Scenarios:** {report['test_scenarios_generated']}",
            "",
            "## Module Summary",
            ""
        ]
        
        # Add table header
        md_content.append("| Module ID | Purpose | Scenario Count | Scenario Categories |")
        md_content.append("| --- | --- | --- | --- |")
        
        # Add table rows
        for module in report['modules']:
            purpose = module['purpose']
            if len(purpose) > 50:
                purpose = purpose[:47] + "..."
            
            categories = ", ".join(module['scenario_categories']) if module['scenario_categories'] else "None"
            
            md_content.append(f"| {module['id']} | {purpose} | {module['scenario_count']} | {categories} |")
        
        with open(md_report_path, 'w') as f:
            f.write("\n".join(md_content))
        
        logger.info(f"Created summary report at {report_path} and {md_report_path}")
        return self
    
    def cleanup(self):
        """Clean up temporary files and directories"""
        if self.temp_directory:
            FileUtils.cleanup_temp_directory(self.temp_directory)
        return self
    
    def run(self):
        """Run the complete workflow"""
        try:
            logger.info("Starting test scenario generation workflow")
            
            # Initialize
            self.initialize()
            
            # Check if we found any code files
            if not self.code_files:
                logger.error("No code files found in the uploaded zip file")
                print("Error: No code files found in the uploaded zip file. Please ensure the zip contains US_*_code.py files.")
                self.cleanup()
                return None
            
            # Check if we found any user stories
            if not self.user_stories:
                logger.warning("No user stories found in the Excel file")
                print("Warning: No user stories found in the Excel file. Will attempt to generate test scenarios without them.")
            
            # Process code files
            self.process_code_files()
            
            # Check if we generated any descriptions
            if not self.descriptions:
                logger.error("Failed to generate any code descriptions")
                print("Error: Failed to generate any code descriptions. Please check the log for details.")
                self.cleanup()
                return None
            
            # Generate test scenarios
            self.generate_test_scenarios()
            
            # Check if we generated any test scenarios
            if not self.test_scenarios:
                logger.error("Failed to generate any test scenarios")
                print("Error: Failed to generate any test scenarios. Please check the log for details.")
                self.cleanup()
                return None
            
            # Create summary report
            self.create_summary_report()
            
            # Clean up temporary files
            self.cleanup()
            
            logger.info(f"Test scenario generation completed successfully. Output directory: {self.output_dir}")
            print(f"Test scenario generation completed successfully. Output directory: {self.output_dir}")
            
            return self.output_dir
            
        except FileNotFoundError as e:
            logger.error(f"File not found: {e}")
            print(f"Error: {e}")
            # Still try to clean up on error
            self.cleanup()
            return None
            
        except Exception as e:
            logger.error(f"Error in workflow: {e}")
            import traceback
            traceback.print_exc()
            print(f"Error: {e}")
            
            # Still try to clean up on error
            self.cleanup()
            return None


#############################################################
# Main Function
#############################################################

def main(zip_file_path, excel_file_path):
    """
    Main function to run the test scenario generation process
    
    Args:
        zip_file_path (str): Path to zip file containing integrated solution code
        excel_file_path (str): Path to Excel file with user stories and tech specs
        
    Returns:
        str: Path to the output directory
    """
    workflow = TestScenarioGeneratorWorkflow(zip_file_path, excel_file_path)
    return workflow.run()

if __name__ == "__main__":
    import argparse
    
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description="Generate test scenarios from integrated solution code")
    parser.add_argument("zip_file", help="Path to zip file containing integrated solution code")
    parser.add_argument("excel_file", help="Path to Excel file with user stories and tech specs")
    
    args = parser.parse_args()
    
    # Check if files exist
    if not os.path.exists(args.zip_file):
        print(f"Error: Zip file not found at {args.zip_file}")
        exit(1)
        
    if not os.path.exists(args.excel_file):
        print(f"Error: Excel file not found at {args.excel_file}")
        exit(1)
    
    # Execute the test scenario generation process
    try:
        output_dir = main(args.zip_file, args.excel_file)
        
        if output_dir:
            print(f"\nWorkflow completed successfully!")
            print(f"Test scenarios and code descriptions saved to: {output_dir}")
        else:
            print("\nWorkflow completed with errors. Check logs for details.")
    except Exception as e:
        print(f"\nError running test scenario generator: {e}")
        exit(1)