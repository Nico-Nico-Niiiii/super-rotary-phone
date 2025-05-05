import os
import logging
import json
import re
import pandas as pd
import ast
import shutil
from typing import TypedDict, List, Dict, Tuple, Optional, Set, Any, Union, Callable
import operator
from datetime import datetime
from collections import defaultdict

from langgraph.graph import StateGraph, END
from langchain_core.messages import AnyMessage, HumanMessage

# Import the inference module for LLM interactions
from app.usecases.agent_development.inference import generate_initial_code, validate_code, correct_code, generate_module_api_doc, format_api_docs_for_llm, generate_integrated_code, get_openai_model, configure_openai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

class CodeGenerationState(TypedDict):
    """State management for code generation process"""
    messages: List[AnyMessage]
    current_code: str
    validation_status: bool
    error_messages: List[str]
    is_valid: bool
    user_story_id: str

def extract_user_story_id(user_story_text: str) -> str:
    """
    Extract user story ID from the text that contains 'User Story ID: XXX'
    
    Args:
        user_story_text (str): The full user story text
        
    Returns:
        str: The extracted user story ID or 'unknown_id' if not found
    """
    # Look for "User Story ID: XXX" pattern
    match = re.search(r'User\s+Story\s+ID\s*:\s*(\d+)', user_story_text, re.IGNORECASE)
    if match:
        return f"US_{match.group(1)}"
    
    # Alternative pattern - look for "userstory1" or similar patterns at the start of a line
    match = re.search(r'^(?:(?:user)?story|us)(\d+)', user_story_text, re.IGNORECASE | re.MULTILINE)
    if match:
        return f"US_{match.group(1)}"
    
    # If no ID is found, generate a fallback ID based on a hash of the content
    logger.warning("No user story ID found in text, using fallback ID")
    import hashlib
    hash_id = hashlib.md5(user_story_text.encode()).hexdigest()[:8]
    return f"Unknown_ID_{hash_id}"

def read_tech_specs_from_excel(df) -> List[Dict[str, str]]:
    """
    Read technical specifications from Excel file.
    
    Args:
        excel_file_path: Path to the Excel file
        
    Returns:
        List of dictionaries, each containing:
        - 'user_story_id': ID of the user story
        - 'tech_spec': Technical specification
    """
    try:
        # Read the Excel file
        # df = pd.read_excel(excel_file_path)
        
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
        
        if tech_spec_col is None and len(col_names) > 1:
            tech_spec_col = col_names[1]
        
        logger.info(f"Using columns: User Story = '{user_story_col}', Tech Spec = '{tech_spec_col}'")
        
        # Extract tech specs
        tech_specs = []
        
        # Skip the first row if it's empty (which appears to be the case)
        start_row = 1 if df.iloc[0].isna().all() else 0
        
        for idx, row in df.iloc[start_row:].iterrows():
            if pd.isna(row[user_story_col]) or pd.isna(row[tech_spec_col]):
                logger.warning(f"Skipping row {idx} due to missing data")
                continue
                
            user_story_text = str(row[user_story_col])
            tech_spec_text = str(row[tech_spec_col])
            
            # Extract user story ID using the helper function
            user_story_id = extract_user_story_id(user_story_text)
            
            tech_specs.append({
                'user_story_id': user_story_id,
                'tech_spec': tech_spec_text
            })
        
        logger.info(f"Successfully extracted {len(tech_specs)} tech specs from Excel file")
        return tech_specs
        
    except Exception as e:
        logger.error(f"Error reading Excel file: {e}")
        raise

class CodeGenerator:
    """Main class for generating, validating, and correcting code"""
    
    def __init__(self, model, base_output_dir):
        self.base_output_dir = base_output_dir
        os.makedirs(self.base_output_dir, exist_ok=True)
        
        # Initialize graph
        graph = StateGraph(CodeGenerationState)
        
        # Add nodes
        graph.add_node("developer", self.developer)
        graph.add_node("validator", self.validator)
        graph.add_node("correction", self.correction)
        
        # Add edges
        graph.add_edge("developer", "validator")
        
        # Add conditional edges
        graph.add_conditional_edges(
            "validator", 
            lambda state: state["is_valid"],
            {
                True: END,
                False: "correction"
            }
        )
        
        graph.add_edge("correction", END)
        
        # Set entry point
        graph.set_entry_point("developer")
        self.graph = graph.compile()
        self.model = model
        
        # Try to display graph visualization if possible (for notebook environments)
        # try:
        #     from IPython.display import Image, display
        #     display(Image(self.graph.get_graph().draw_mermaid_png()))
        # except Exception as e:
        #     logger.debug(f"Could not display graph: {e}")
        #     pass

    def get_output_dir(self, user_story_id: str) -> str:
        """Create and return a user story specific output directory"""
        # Create user story specific directory if it doesn't exist
        user_story_dir = os.path.join(self.base_output_dir, user_story_id)
        os.makedirs(user_story_dir, exist_ok=True)
        return user_story_dir

    def save_code_attempt(self, code: str, user_story_id: str, status: str = "initial") -> str:
        """Save code attempt and return directory path"""
        # Get user story specific output directory
        output_dir = self.get_output_dir(user_story_id)
        
        attempt_dir = os.path.join(output_dir, f"attempt_{status}")
        os.makedirs(attempt_dir, exist_ok=True)
        
        # Save code
        code_file = os.path.join(attempt_dir, "code.py")
        with open(code_file, 'w') as f:
            f.write(code)
        
        logger.info(f"Saved code attempt to {code_file}")
        return attempt_dir

    def developer(self, state: CodeGenerationState) -> Dict[str, Any]:
        """Generate initial code"""
        messages = state['messages']
        user_story_id = state.get('user_story_id', 'default_id')
        logger.info(f"Processing user story ID: {user_story_id}")
        
        # Use the inference module to generate code
        result = generate_initial_code(self.model, messages[0].content, user_story_id)
        
        # Save the generated code
        self.save_code_attempt(result['current_code'], user_story_id)
        
        return result

    def validator(self, state: CodeGenerationState) -> Dict[str, Any]:
        """Validate generated code"""
        user_story_id = state.get('user_story_id', 'default_id')
        logger.info(f"Validating code for user story ID: {user_story_id}")
        
        # Use the inference module to validate the code
        result = validate_code(self.model, state)
        
        # Save validation results to JSON if possible
        try:
            if result['messages'] and result['messages'][0].content:
                json_pattern = r"```json\s*(.*?)\s*```"
                match = re.search(json_pattern, result['messages'][0].content, re.DOTALL)
                if match:
                    validation_json = json.loads(match.group(1))
                    output_dir = self.get_output_dir(user_story_id)
                    json_path = os.path.join(output_dir, "validation_results.json")
                    with open(json_path, 'w') as f:
                        json.dump(validation_json, f, indent=2)
                    logger.info(f"Saved validation results to {json_path}")
        
        except Exception as e:
            logger.error(f"Failed to save validation results: {e}")
        
        # Save the code with validation status
        status = "validated_pass" if result['is_valid'] else "validated_fail"
        self.save_code_attempt(state['current_code'], user_story_id, status)
        
        return result

    def correction(self, state: CodeGenerationState) -> Dict[str, Any]:
        """Correct code based on validation feedback"""
        user_story_id = state.get('user_story_id', 'default_id')
        logger.info(f"Correcting code for user story ID: {user_story_id}")
        
        # Use the inference module to correct the code
        result = correct_code(self.model, state)
        
        # Save corrected code
        self.save_code_attempt(result['current_code'], user_story_id, "correction")
        
        return result

    def process_tech_spec(self, tech_spec: Dict[str, str]) -> Dict[str, Any]:
        """Process a single technical specification"""
        user_story_id = tech_spec['user_story_id']
        tech_spec_text = tech_spec['tech_spec']
        
        logger.info(f"Processing tech spec for user story ID: {user_story_id}")
        
        # Setup initial message
        messages = [HumanMessage(content=tech_spec_text)]
        
        # Set up the input state
        initial_state = {
            "messages": messages,
            "current_code": "",
            "validation_status": None,
            "error_messages": [],
            "is_valid": False,
            "user_story_id": user_story_id
        }
        
        try:
            # Run the graph
            result = self.graph.invoke(initial_state)
            
            # Log success
            logger.info(f"Successfully processed tech spec for user story ID: {user_story_id}")
            
            # Extract final code
            if 'current_code' in result and result['current_code']:
                final_status = "final_corrected" if not result.get('is_valid', False) else "final_validated"
                self.save_code_attempt(result['current_code'], user_story_id, final_status)
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing tech spec for user story ID {user_story_id}: {e}")
            raise

class RelationshipVisitor(ast.NodeVisitor):
    """AST visitor that extracts relationships between functions, classes, and variables."""
    
    def __init__(self):
        self.defined_names = set()  # All defined names in the module
        self.function_calls = defaultdict(set)  # Mapping of function name to the set of function names it calls
        self.class_instantiations = defaultdict(set)  # Mapping of function name to the set of class names it instantiates
        self.attribute_accesses = defaultdict(set)  # Mapping of function/method name to the attributes it accesses
        self.imports = []  # List of import statements
        self.global_vars = []  # List of global variables
        self.functions = []  # List of functions
        self.classes = []  # List of classes
        
        # Track current context (function or class being processed)
        self.current_function = None
        self.current_class = None
        self.current_method = None
        
        # Track known external names
        self.external_modules = set()
        
    def visit_Import(self, node):
        """Process import statements."""
        for name in node.names:
            import_name = name.name
            alias = name.asname or import_name
            self.imports.append({
                "module": import_name,
                "alias": name.asname
            })
            self.defined_names.add(alias)
            self.external_modules.add(alias)
        self.generic_visit(node)
    
    def visit_ImportFrom(self, node):
        """Process from ... import ... statements."""
        module = node.module or ""
        for name in node.names:
            import_name = name.name
            alias = name.asname or import_name
            self.imports.append({
                "module": module,
                "name": import_name,
                "alias": name.asname
            })
            self.defined_names.add(alias)
        self.generic_visit(node)
    
    def visit_ClassDef(self, node):
        """Process class definitions."""
        class_name = node.name
        self.defined_names.add(class_name)
        
        # Extract base classes
        bases = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                bases.append(base.id)
            else:
                try:
                    bases.append(ast.unparse(base))
                except:
                    bases.append(str(base))
        
        # Extract docstring
        docstring = None
        if (node.body and isinstance(node.body[0], ast.Expr) and 
            isinstance(node.body[0].value, ast.Str)):
            docstring = node.body[0].value.s.strip()
        
        # Save the current class context
        prev_class = self.current_class
        self.current_class = class_name
        
        # Process the class body
        methods = []
        for child in node.body:
            if isinstance(child, ast.FunctionDef):
                # This is a method
                method_info = self.process_function(child, is_method=True)
                if method_info:
                    methods.append(method_info)
        
        # Add class info
        self.classes.append({
            "name": class_name,
            "docstring": docstring or "No documentation available.",
            "bases": bases,
            "methods": methods,
            "relationships": {
                "inherits_from": bases,
                "used_by_functions": [],  # Will be filled later
                "instantiated_by": []  # Will be filled later
            }
        })
        
        # Restore previous class context
        self.current_class = prev_class
    
    def process_function(self, node, is_method=False):
        """Process function or method definition."""
        func_name = node.name
        
        # Skip if it's a special method (like __init__) - we'll still process its body though
        skip_adding = False
        if is_method and func_name.startswith('__') and func_name.endswith('__'):
            skip_adding = True
        
        # For methods, the full name includes the class name
        full_name = f"{self.current_class}.{func_name}" if is_method and self.current_class else func_name
        
        # Extract docstring
        docstring = None
        if (node.body and isinstance(node.body[0], ast.Expr) and 
            isinstance(node.body[0].value, ast.Str)):
            docstring = node.body[0].value.s.strip()
        
        # Extract parameters
        parameters = []
        for arg in node.args.args:
            param_name = arg.arg
            param_type = None
            if arg.annotation:
                try:
                    param_type = ast.unparse(arg.annotation)
                except:
                    param_type = str(arg.annotation)
            
            parameters.append({
                "name": param_name,
                "type": param_type,
                "description": "Parameter description not available."
            })
        
        # Extract return type
        returns = None
        if node.returns:
            try:
                returns = ast.unparse(node.returns)
            except:
                returns = str(node.returns)
        
        # Save the current function context
        prev_function = self.current_function
        prev_method = self.current_method
        
        if is_method:
            self.current_method = full_name
        else:
            self.current_function = full_name
            self.defined_names.add(func_name)
        
        # Visit the function body to capture calls and relationships
        self.generic_visit(node)
        
        # Create the function info object
        func_info = {
            "name": func_name,
            "docstring": docstring or "No documentation available.",
            "parameters": parameters,
            "returns": returns,
            "relationships": {
                "calls_functions": list(self.function_calls.get(full_name, set())),
                "instantiates_classes": list(self.class_instantiations.get(full_name, set())),
                "accesses_attributes": list(self.attribute_accesses.get(full_name, set())),
                "called_by": []  # Will be filled later
            }
        }
        
        # Restore previous function context
        self.current_function = prev_function
        self.current_method = prev_method
        
        # Add to functions list if not a method or not a special method
        if not skip_adding:
            if not is_method:
                self.functions.append(func_info)
            return func_info
        
        return None
    
    def visit_FunctionDef(self, node):
        """Process function definitions."""
        self.process_function(node)
    
    def visit_Call(self, node):
        """Process function calls."""
        # Determine the current context
        current_context = self.current_method if self.current_method else self.current_function
        
        if current_context:
            # Function call
            if isinstance(node.func, ast.Name):
                func_name = node.func.id
                self.function_calls[current_context].add(func_name)
            
            # Method call (obj.method())
            elif isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
                obj_name = node.func.value.id
                method_name = node.func.attr
                
                # Could be a module.function() call
                if obj_name in self.external_modules:
                    full_call = f"{obj_name}.{method_name}"
                else:
                    # Could be a class instantiation (ClassName())
                    for cls in self.classes:
                        if cls["name"] == obj_name:
                            self.class_instantiations[current_context].add(obj_name)
                            break
                    
                    full_call = f"{obj_name}.{method_name}"
                
                self.function_calls[current_context].add(full_call)
                self.attribute_accesses[current_context].add(f"{obj_name}.{method_name}")
        
        self.generic_visit(node)
    
    def visit_Assign(self, node):
        """Process assignments."""
        # Only process global assignments
        if not self.current_function and not self.current_method:
            for target in node.targets:
                if isinstance(target, ast.Name):
                    var_name = target.id
                    try:
                        var_value = ast.unparse(node.value)
                    except:
                        var_value = str(node.value)
                    
                    # Check if it's a class instantiation
                    if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
                        class_name = node.value.func.id
                        # Check if it's one of our known classes
                        for cls in self.classes:
                            if cls["name"] == class_name:
                                self.class_instantiations["global"].add(class_name)
                                break
                    
                    self.global_vars.append({
                        "name": var_name,
                        "value": var_value
                    })
                    self.defined_names.add(var_name)
        
        self.generic_visit(node)
    
    def post_process(self):
        """Build reverse relationships after processing."""
        # For each function call, update the called_by relationship
        for caller, callees in self.function_calls.items():
            for callee in callees:
                # Find the actual function record
                for func in self.functions:
                    if func["name"] == callee:
                        if caller not in func["relationships"]["called_by"]:
                            func["relationships"]["called_by"].append(caller)
        
        # For each class instantiation, update the instantiated_by relationship
        for instantiator, classes in self.class_instantiations.items():
            for class_name in classes:
                # Find the actual class record
                for cls in self.classes:
                    if cls["name"] == class_name:
                        if instantiator not in cls["relationships"]["instantiated_by"]:
                            cls["relationships"]["instantiated_by"].append(instantiator)
        
        # For each class, update the used_by_functions relationship
        for cls in self.classes:
            class_name = cls["name"]
            for func in self.functions:
                # If function instantiates this class
                if class_name in func["relationships"]["instantiates_classes"]:
                    if func["name"] not in cls["relationships"]["used_by_functions"]:
                        cls["relationships"]["used_by_functions"].append(func["name"])
                
                # If function accesses any attributes related to this class
                for attr in func["relationships"]["accesses_attributes"]:
                    if attr.startswith(f"{class_name}."):
                        if func["name"] not in cls["relationships"]["used_by_functions"]:
                            cls["relationships"]["used_by_functions"].append(func["name"])

class EnhancedAPIDocGenerator:
    """Class to generate enhanced API documentation with relationship information."""
    
    def __init__(self, model):
        self.model = model
    
    def generate_module_api_doc(self, module_name: str, code: str) -> Dict[str, Any]:
        """Generate enhanced API documentation for a module."""
        try:
            # Parse the AST
            tree = ast.parse(code)
            
            # Visit the AST to extract entities and relationships
            visitor = RelationshipVisitor()
            visitor.visit(tree)
            visitor.post_process()
            
            # Extract module docstring
            module_docstring = None
            if (tree.body and isinstance(tree.body[0], ast.Expr) and 
                isinstance(tree.body[0].value, ast.Str)):
                module_docstring = tree.body[0].value.s.strip()
            
            # Create module doc
            module_doc = {
                "name": module_name,
                "docstring": module_docstring or "No module documentation available.",
                "imports": visitor.imports,
                "global_vars": visitor.global_vars,
                "functions": visitor.functions,
                "classes": visitor.classes,
                "relationships": {
                    "dependencies": self._analyze_module_dependencies(visitor),
                    "entry_points": self._identify_entry_points(visitor)
                }
            }
            
            return module_doc
            
        except SyntaxError as e:
            logger.error(f"Syntax error in module {module_name}: {e}")
            return self._fallback_api_doc_generation(module_name, code)
        except Exception as e:
            logger.error(f"Error parsing module {module_name}: {e}")
            return self._fallback_api_doc_generation(module_name, code)
    
    def _analyze_module_dependencies(self, visitor: RelationshipVisitor) -> Dict[str, List[str]]:
        """Analyze module level dependencies."""
        dependencies = {
            "imports": [imp.get("module") for imp in visitor.imports if "module" in imp],
            "from_imports": [f"{imp.get('module')}.{imp.get('name')}" for imp in visitor.imports if "name" in imp],
        }
        return dependencies
    
    def _identify_entry_points(self, visitor: RelationshipVisitor) -> List[str]:
        """Identify potential entry points in the module."""
        # Entry points are functions that are not called by other functions
        entry_points = []
        
        for func in visitor.functions:
            if not func["relationships"]["called_by"]:
                # This function is not called by others
                entry_points.append(func["name"])
        
        return entry_points
    
    def _fallback_api_doc_generation(self, module_name: str, code: str) -> Dict[str, Any]:
        """Use the LLM as a fallback for API doc generation when parsing fails."""
        logger.info(f"Using LLM to extract enhanced API documentation for {module_name}")
        return generate_module_api_doc(self.model, module_name, code)
    
    def generate_all_module_docs(self, code_contents: Dict[str, str]) -> Dict[str, Any]:
        """Generate API documentation for all modules."""
        module_docs = {}
        
        for module_name, code in code_contents.items():
            try:
                module_doc = self.generate_module_api_doc(module_name, code)
                module_docs[module_name] = module_doc
                logger.info(f"Generated enhanced API documentation for {module_name}")
            except Exception as e:
                logger.error(f"Error generating API doc for {module_name}: {e}")
        
        return module_docs
    
    def try_generate_dependency_graph(self, module_docs: Dict[str, Any]):
        """Try to generate a dependency graph visualization for all modules."""
        try:
            # Check if matplotlib and networkx are available
            try:
                import matplotlib.pyplot as plt
                import networkx as nx
            except ImportError:
                logger.warning("matplotlib or networkx not available, skipping graph generation")
                return None
            
            # Create a directed graph
            G = nx.DiGraph()
            
            # Add nodes for each module
            for module_name in module_docs.keys():
                G.add_node(module_name, type='module')
            
            # Add edges for dependencies between modules
            for module_name, doc in module_docs.items():
                # For each function in this module
                for func in doc.get("functions", []):
                    # For each function call
                    for called_func in func.get("relationships", {}).get("calls_functions", []):
                        # If the function contains a dot, it might be a cross-module call
                        if "." in called_func:
                            parts = called_func.split(".")
                            if len(parts) == 2:
                                potential_module = parts[0]
                                # Check if this is one of our modules
                                if potential_module in module_docs:
                                    G.add_edge(module_name, potential_module, 
                                            label=f"{func['name']} -> {called_func}")
                                    
                # Add edges based on imports if we can determine they're our modules
                for imp in doc.get("imports", []):
                    module = imp.get("module")
                    if module in module_docs:
                        G.add_edge(module_name, module, label="imports")
            
            # Check if we have any edges
            if not G.edges():
                # Add edges based on function similarities
                self._add_similarity_edges(G, module_docs)
            
            # Create the visualization
            plt.figure(figsize=(12, 8))
            pos = nx.spring_layout(G)
            nx.draw(G, pos, with_labels=True, node_color='lightblue', 
                    font_weight='bold', node_size=2000, arrows=True)
            
            # Add edge labels
            edge_labels = {(u, v): d.get('label', '') for u, v, d in G.edges(data=True)}
            nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)
            
            return G
        except Exception as e:
            logger.error(f"Error generating dependency graph: {e}")
            return None
    
    def _add_similarity_edges(self, G, module_docs: Dict[str, Any]):
        """Add edges based on function and class name similarities."""
        # Create a dictionary of all function names to their modules
        function_to_module = {}
        for module_name, doc in module_docs.items():
            for func in doc.get("functions", []):
                function_to_module[func["name"]] = module_name
        
        # Look for similar function names across modules
        for module_name, doc in module_docs.items():
            for func in doc.get("functions", []):
                for called_func in func.get("relationships", {}).get("calls_functions", []):
                    # If the function appears in another module
                    if called_func in function_to_module and function_to_module[called_func] != module_name:
                        target_module = function_to_module[called_func]
                        G.add_edge(module_name, target_module, 
                                label=f"{func['name']} -> {called_func}")

class EnhancedCodeIntegrator:
    """Class to integrate code modules based on enhanced API documentation with relationships."""
    
    def __init__(self, model, doc_generator: EnhancedAPIDocGenerator):
        self.model = model
        self.doc_generator = doc_generator
    
    def generate_integrated_code(self, module_docs: Dict[str, Any]) -> str:
        """Generate integrated code based on enhanced API documentation with relationships."""
        # Format API docs for the LLM
        api_docs_text = format_api_docs_for_llm(module_docs)
        
        # Generate integrated code using inference
        integrated_code = generate_integrated_code(self.model, module_docs)
        
        # Validate and fix the integrated code
        validation_result = self.validate_integrated_code(integrated_code, module_docs.keys())
        
        if not validation_result["proper_imports"] or validation_result["improper_references"]:
            logger.info("Fixing issues in the integrated code")
            integrated_code = self.fix_integrated_code(integrated_code, validation_result)
        
        return integrated_code
    
    def validate_integrated_code(self, code: str, module_names: List[str]) -> Dict[str, Any]:
        """Validate that the integrated code properly imports all modules with correct names."""
        # Check if modules are imported with _code suffix
        proper_imports = True
        module_import_checks = []
        
        for module_name in module_names:
            module_import_name = f"{module_name}_code"
            if f"import {module_name}" in code and f"import {module_import_name}" not in code:
                proper_imports = False
                module_import_checks.append((module_name, False))
            else:
                module_import_checks.append((module_name, True))
        
        # Check for any functions or classes referenced without proper module prefix
        improper_references = []
        
        for module_name in module_names:
            # Look for patterns like "ModuleName.function" instead of "ModuleName_code.function"
            pattern = fr"{module_name}\.[a-zA-Z0-9_]+"
            matches = re.findall(pattern, code)
            if matches:
                improper_references.extend(matches)
        
        return {
            "proper_imports": proper_imports,
            "module_import_checks": module_import_checks,
            "improper_references": improper_references
        }
    
    def fix_integrated_code(self, code: str, validation_result: Dict[str, Any]) -> str:
        """Fix issues with the integrated code based on validation results."""
        fixed_code = code
        
        # Fix improper imports
        for module_name, is_proper in validation_result["module_import_checks"]:
            if not is_proper:
                # Replace "import ModuleName" with "import ModuleName_code"
                fixed_code = re.sub(
                    fr"import\s+{module_name}(?!_code)",
                    f"import {module_name}_code",
                    fixed_code
                )
                
                # Replace "from ModuleName import" with "from ModuleName_code import"
                fixed_code = re.sub(
                    fr"from\s+{module_name}(?!_code)\s+import",
                    f"from {module_name}_code import",
                    fixed_code
                )
        
        # Fix improper references
        for ref in validation_result["improper_references"]:
            module_name = ref.split('.')[0]
            fixed_code = fixed_code.replace(ref, ref.replace(f"{module_name}.", f"{module_name}_code."))
        
        return fixed_code
    
    def generate_init_file(self, output_dir: str, module_docs: Dict[str, Any]):
        """Generate an __init__.py file to make importing modules easier."""
        init_content = ['"""Package initialization file with module relationships documented."""\n']
        
        # Add imports for all modules
        for module_name in module_docs.keys():
            # Import the module
            init_content.append(f"import {module_name}_code")
            
            # Create shorter aliases for convenience
            init_content.append(f"{module_name} = {module_name}_code")
        
        # Add module relationship documentation
        init_content.append("\n# Module relationships:")
        for module_name, doc in module_docs.items():
            # Document entry points
            entry_points = doc.get("relationships", {}).get("entry_points", [])
            if entry_points:
                init_content.append(f"# {module_name}_code entry points: {', '.join(entry_points)}")
            
            # Document function calls between modules
            calls_found = False
            for func in doc.get("functions", []):
                for called_func in func.get("relationships", {}).get("calls_functions", []):
                    if "." in called_func:
                        parts = called_func.split(".")
                        if len(parts) == 2 and parts[0] in module_docs:
                            if not calls_found:
                                init_content.append(f"# {module_name}_code function dependencies:")
                                calls_found = True
                            init_content.append(f"#   {func['name']} -> {called_func}")
            
            if not calls_found:
                init_content.append(f"# {module_name}_code: No external function calls identified")
        
        # Write the file
        init_path = os.path.join(output_dir, "__init__.py")
        with open(init_path, 'w') as f:
            f.write("\n".join(init_content))
        
        logger.info(f"Created enhanced __init__.py file at {init_path}")

def find_latest_code_generation_folder(base_dir=None) -> str:
    """Find the latest code_generation folder based on creation time."""
    if base_dir is None:
        base_dir = os.getcwd()  # Current working directory
    
    code_gen_folders = [d for d in os.listdir(base_dir) if d.startswith("code_generation_") and os.path.isdir(os.path.join(base_dir, d))]
    if not code_gen_folders:
        raise FileNotFoundError("No code_generation folders found")
    
    # Sort by creation time, most recent first
    code_gen_folders.sort(key=lambda d: os.path.getctime(os.path.join(base_dir, d)), reverse=True)
    return os.path.join(base_dir, code_gen_folders[0])

def find_code_files(base_folder: str) -> List[Tuple[str, str]]:
    """
    Find all code files in subfolders.
    Prioritize files in this order:
    1. final_corrected
    2. final_validated
    3. correction
    4. validated_pass
    5. initial (fallback)
    
    Returns:
        List of tuples (module_name, file_path)
    """
    code_files = []
    
    # Priority order for folder names
    priority_folders = ["final_corrected", "final_validated", "correction", "validated_pass", "initial"]
    
    # First, get all user story folders
    user_story_folders = [f for f in os.listdir(base_folder) 
                         if os.path.isdir(os.path.join(base_folder, f))]
    
    for user_folder in user_story_folders:
        user_path = os.path.join(base_folder, user_folder)
        
        # Check each priority folder type
        found = False
        for priority in priority_folders:
            attempt_path = os.path.join(user_path, f"attempt_{priority}")
            code_file = os.path.join(attempt_path, "code.py")
            
            if os.path.exists(code_file):
                code_files.append((user_folder, code_file))
                found = True
                logger.info(f"Using '{priority}' code for {user_folder}")
                break
        
        if not found:
            logger.warning(f"No code files found at all for {user_folder}")
    
    return code_files

def read_code_files(code_files: List[Tuple[str, str]]) -> Dict[str, str]:
    """Read code files and return a dictionary mapping module names to code content."""
    code_contents = {}
    
    for module_name, file_path in code_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                code_contents[module_name] = content
                logger.info(f"Read {len(content)} bytes from {file_path}")
        except Exception as e:
            logger.error(f"Error reading {file_path}: {e}")
    
    return code_contents

def get_docstring_summary(docstring: Optional[str]) -> str:
    """Extract the first sentence of a docstring or return a default message."""
    if not docstring:
        return "No documentation available"
    
    # Try to get the first sentence
    if '.' in docstring:
        return docstring.split('.')[0].strip()
    
    return docstring.strip()

def save_modules_with_proper_names(output_dir: str, code_contents: Dict[str, str]):
    """Save individual modules with proper names based on user story IDs."""
    os.makedirs(output_dir, exist_ok=True)
    
    for module_name, code in code_contents.items():
        file_name = f"{module_name}_code.py"
        file_path = os.path.join(output_dir, file_name)
        
        with open(file_path, 'w') as f:
            f.write(code)
        
        logger.info(f"Saved module {module_name} to {file_path}")

def create_relationship_documentation(output_dir: str, module_docs: Dict[str, Any]):
    """Create a RELATIONSHIPS.md file documenting the relationships between all components."""
    content = [
        "# Module Relationship Documentation",
        "",
        "This document provides detailed information about the relationships between modules, functions, and classes.",
        "",
        "## Overview",
        ""
    ]
    
    # Create a list of all modules
    content.append("### Modules")
    for module_name in module_docs.keys():
        content.append(f"- {module_name}_code.py")
    content.append("")
    
    # Document module-level relationships
    content.append("## Module Dependencies")
    content.append("")
    
    for module_name, doc in module_docs.items():
        content.append(f"### {module_name}_code.py")
        content.append(f"*{doc['docstring']}*")
        content.append("")
        
        # Dependencies
        deps = doc.get("relationships", {}).get("dependencies", {})
        imports = deps.get("imports", [])
        if imports:
            content.append("**Imports modules:**")
            for imp in imports:
                content.append(f"- {imp}")
            content.append("")
        
        # Entry points
        entry_points = doc.get("relationships", {}).get("entry_points", [])
        if entry_points:
            content.append("**Entry points:**")
            for ep in entry_points:
                content.append(f"- {ep}")
            content.append("")
        
        # Functions
        if doc.get("functions"):
            content.append("**Functions:**")
            for func in doc["functions"]:
                # Add function with its relationships
                # Safely extract the docstring summary
                docstring_summary = get_docstring_summary(func.get('docstring'))
                content.append(f"- `{func['name']}`: {docstring_summary}")
                
                # Function calls
                calls = func.get("relationships", {}).get("calls_functions", [])
                if calls:
                    content.append(f"  - Calls: {', '.join([f'`{c}`' for c in calls])}")
                
                # Function instantiations
                instantiates = func.get("relationships", {}).get("instantiates_classes", [])
                if instantiates:
                    content.append(f"  - Instantiates: {', '.join([f'`{c}`' for c in instantiates])}")
                
                # Called by
                called_by = func.get("relationships", {}).get("called_by", [])
                if called_by:
                    content.append(f"  - Called by: {', '.join([f'`{c}`' for c in called_by])}")
            
            content.append("")
        
        # Classes
        if doc.get("classes"):
            content.append("**Classes:**")
            for cls in doc["classes"]:
                # Add class with its relationships
                docstring_summary = get_docstring_summary(cls.get('docstring'))
                content.append(f"- `{cls['name']}`: {docstring_summary}")
                
                # Inheritance
                inherits = cls.get("relationships", {}).get("inherits_from", [])
                if inherits:
                    content.append(f"  - Inherits from: {', '.join([f'`{c}`' for c in inherits])}")
                
                # Used by
                used_by = cls.get("relationships", {}).get("used_by_functions", [])
                if used_by:
                    content.append(f"  - Used by: {', '.join([f'`{c}`' for c in used_by])}")
                
                # Instantiated by
                inst_by = cls.get("relationships", {}).get("instantiated_by", [])
                if inst_by:
                    content.append(f"  - Instantiated by: {', '.join([f'`{c}`' for c in inst_by])}")
            
            content.append("")
    
    # Create function call graph section
    content.append("## Function Call Graph")
    content.append("")
    content.append("This section shows which functions call other functions across all modules.")
    content.append("")
    
    # Build the function call graph
    call_graph = defaultdict(list)
    
    for module_name, doc in module_docs.items():
        for func in doc.get("functions", []):
            func_full_name = f"{module_name}_code.{func['name']}"
            for called_func in func.get("relationships", {}).get("calls_functions", []):
                if "." in called_func:
                    call_graph[func_full_name].append(called_func)
                else:
                    # It's in the same module
                    call_graph[func_full_name].append(f"{module_name}_code.{called_func}")
    
    # Print call graph
    for caller, callees in sorted(call_graph.items()):
        if callees:
            content.append(f"- `{caller}` calls:")
            for callee in sorted(callees):
                content.append(f"  - `{callee}`")
            content.append("")
    
    # Write to file
    rel_path = os.path.join(output_dir, "RELATIONSHIPS.md")
    with open(rel_path, 'w') as f:
        f.write("\n".join(content))
    
    logger.info(f"Created detailed relationship documentation at {rel_path}")

def create_setup_py(output_dir: str, module_name: str = "integrated_solution"):
    """Create a setup.py file to make the package installable."""
    setup_content = f'''"""
Setup script for {module_name} package.
This package combines multiple modules with their relationships preserved.
"""

from setuptools import setup, find_packages

setup(
    name="{module_name}",
    version="0.1.0",
    packages=find_packages(),
    author="AI Code Generator",
    author_email="ai@example.com",
    description="Integrated solution generated from multiple modules with relationship awareness",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
)
'''
    
    setup_path = os.path.join(output_dir, "setup.py")
    with open(setup_path, 'w') as f:
        f.write(setup_content)
    
    logger.info(f"Created setup.py file at {setup_path}")

def create_readme(output_dir: str, module_docs: Dict[str, Any]):
    """Create a README.md file with information about the integrated solution."""
    readme_content = [
        "# Relationship-Enhanced Integrated Solution",
        "",
        "This is an automatically generated integrated solution that combines functionality from multiple modules,",
        "with enhanced documentation of relationships between functions and classes.",
        "",
        "## Architecture Overview",
        "",
        "The solution consists of the following modules, each with distinct responsibilities:",
        ""
    ]
    
    # Add module descriptions
    for module_name, doc in module_docs.items():
        readme_content.append(f"### {module_name}_code")
        readme_content.append(f"{doc['docstring']}")
        
        # Add entry points
        entry_points = doc.get("relationships", {}).get("entry_points", [])
        if entry_points:
            readme_content.append("\nEntry Points:")
            for ep in entry_points:
                readme_content.append(f"- `{ep}`")
        
        # Add functions with their relationships
        if doc["functions"]:
            readme_content.append("\nKey Functions:")
            for func in doc["functions"]:
                # Only include functions that have relationships or are entry points
                has_relationships = (
                    func.get("relationships", {}).get("calls_functions") or 
                    func.get("relationships", {}).get("instantiates_classes") or
                    func.get("relationships", {}).get("called_by")
                )
                
                is_entry_point = func["name"] in entry_points
                
                if has_relationships or is_entry_point:
                    # Safely get docstring summary
                    docstring_summary = get_docstring_summary(func.get('docstring'))
                    readme_content.append(f"- `{func['name']}`: {docstring_summary}")
                    
                    # Add relationship info
                    if has_relationships:
                        rel = func.get("relationships", {})
                        calls = rel.get("calls_functions", [])
                        if calls:
                            readme_content.append(f"  - Calls: {', '.join(calls)}")
                        
                        called_by = rel.get("called_by", [])
                        if called_by:
                            readme_content.append(f"  - Called by: {', '.join(called_by)}")
                        
                        instantiates = rel.get("instantiates_classes", [])
                        if instantiates:
                            readme_content.append(f"  - Instantiates: {', '.join(instantiates)}")
        
        readme_content.append("")
    
    # Add integration information
    readme_content.extend([
        "## Integration Strategy",
        "",
        "The integration follows these principles:",
        "",
        "1. **Dependency-Based Execution**: Functions are called in an order that respects their dependencies",
        "2. **Module Isolation**: Each module maintains its own namespace to prevent conflicts",
        "3. **Coordinated Execution**: The main execution orchestrates the flow across modules",
        "",
        "## Documentation",
        "",
        "For more detailed information about the relationships between components, see:",
        "",
        "- `RELATIONSHIPS.md`: Detailed documentation of all module and function relationships",
        "- `integrated_solution.py`: The main integration file with relationship comments",
        "- `__init__.py`: Contains module relationship information"
    ])
    
    readme_path = os.path.join(output_dir, "README.md")
    with open(readme_path, 'w') as f:
        f.write("\n".join(readme_content))
    
    logger.info(f"Created enhanced README.md file at {readme_path}")

class CodeGenerationManager:
    """Main class that orchestrates the entire code generation and integration process."""
    
    def __init__(self):
        # Initialize the model
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
            self.data = json.load(file)

        self.model = get_openai_model()
        self.file_paths = self.data["agents"]["dev_agent"]["files_path"]
    
    def process_tech_specs(self, excel_df) :
        """
        Process tech specs from an Excel file
        
        Args:
            excel_file_path: Path to Excel file with tech specs
            
        Returns:
            str: Path to the output directory with generated code
        """
        try:
            # Verify OpenAI configuration
            configure_openai()
            
            # Read tech specs from Excel
            tech_specs = read_tech_specs_from_excel(excel_df)
            
            if not tech_specs:
                logger.error("No tech specs found in Excel file")
                return None
            
            # Create base output directory
            base_output_dir =  f"{self.file_paths}/code_generation_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Initialize code generator
            code_gen = CodeGenerator(model=self.model, base_output_dir=base_output_dir)
            
            # Process each tech spec
            for idx, spec in enumerate(tech_specs):
                logger.info(f"Processing tech spec {idx+1}/{len(tech_specs)}")
                try:
                    code_gen.process_tech_spec(spec)
                except Exception as e:
                    logger.error(f"Error processing tech spec {spec['user_story_id']}: {e}")
                    continue
            
            logger.info(f"Completed processing all tech specs. Output directory: {base_output_dir}")
            return base_output_dir
            
        except Exception as e:
            logger.error(f"Error in process_tech_specs: {e}")
            raise
    
    def integrate_code(self, code_generation_folder: Optional[str] = None) -> str:
        """
        Integrate code with enhanced relationship documentation and analysis
        
        Args:
            code_generation_folder: Path to the folder containing generated code (if None, uses the latest folder)
            
        Returns:
            str: Path to the output directory with integrated solution
        """
        try:
            # Find the code generation folder (latest or specified)
            if code_generation_folder is None:
                code_generation_folder = find_latest_code_generation_folder()
            
            logger.info(f"Using code generation folder: {code_generation_folder}")
            
            # Create output directory
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_dir = os.path.join(os.path.dirname(code_generation_folder), f"integrated_solution_{timestamp}")
            os.makedirs(output_dir, exist_ok=True)
            
            # Find all code files
            code_files = find_code_files(code_generation_folder)
            logger.info(f"Found {len(code_files)} code files to integrate")
            
            if not code_files:
                logger.error("No code files found to integrate")
                return None
            
            # Read all code files
            code_contents = read_code_files(code_files)
            
            # Save modules with proper names
            save_modules_with_proper_names(output_dir, code_contents)
            
            # Generate enhanced API documentation with relationships
            doc_generator = EnhancedAPIDocGenerator(self.model)
            module_docs = doc_generator.generate_all_module_docs(code_contents)
            
            # Save enhanced API documentation
            api_docs_path = os.path.join(output_dir, "enhanced_api_documentation.json")
            with open(api_docs_path, 'w') as f:
                json.dump(module_docs, f, indent=2)
            logger.info(f"Saved enhanced API documentation to {api_docs_path}")
            
            # Create detailed relationship documentation
            create_relationship_documentation(output_dir, module_docs)
            
            # Try to generate dependency graph
            try:
                # Try to import required libraries
                import matplotlib.pyplot as plt
                import networkx as nx
                
                # Try to generate the graph
                dependency_graph = doc_generator.try_generate_dependency_graph(module_docs)
                if dependency_graph:
                    graph_path = os.path.join(output_dir, "module_dependencies.png")
                    plt.savefig(graph_path)
                    logger.info(f"Saved dependency graph visualization to {graph_path}")
            except ImportError:
                logger.warning("matplotlib or networkx not available, skipping graph generation")
            except Exception as e:
                logger.warning(f"Could not generate dependency graph: {e}")
            
            # Generate integrated code
            integrator = EnhancedCodeIntegrator(self.model, doc_generator)
            integrated_code = integrator.generate_integrated_code(module_docs)
            
            # Add header
            header = f'''"""
            Relationship-Enhanced Integrated Solution
            This file was automatically generated by the Combined Code Generation and Integration System.
            Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

            This code serves as an integration layer that coordinates all the individual modules.
            Each module's code is stored in separate files named by their user story IDs with "_code.py" suffix.
            The integration is based on detailed analysis of function and class relationships between modules.
            """

            '''
            integrated_code = header + integrated_code
            
            # Save integrated code
            integrated_code_path = os.path.join(output_dir, "integrated_solution.py")
            with open(integrated_code_path, 'w') as f:
                f.write(integrated_code)
            
            # Create enhanced __init__.py file
            integrator.generate_init_file(output_dir, module_docs)
            
            # Create enhanced README.md
            create_readme(output_dir, module_docs)
            
            # Create setup.py
            create_setup_py(output_dir)
            
            logger.info(f"Successfully created relationship-enhanced integrated solution: {integrated_code_path}")
            print(f"Relationship-enhanced integrated solution created at: {output_dir}")
            
            return output_dir
        
        except Exception as e:
            logger.error(f"Error in code integration: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def run_combined_workflow(self, excel_df) -> Tuple[Optional[str], Optional[str]]:
        """
        Run the complete code generation and integration workflow
        
        Args:
            excel_file_path: Path to Excel file with technical specifications
            
        Returns:
            Tuple[str, str]: Paths to the code generation and integrated solution directories
        """
        try:
            # Step 1: Generate code from technical specifications
            print("Starting code generation from technical specifications...")
            code_generation_dir = self.process_tech_specs(excel_df)
            
            if not code_generation_dir:
                logger.error("Code generation failed or no tech specs found")
                return None, None
            
            print(f"Completed code generation. Directory: {code_generation_dir}")
            
            # Step 2: Integrate the generated code with relationship enhancement
            print("Starting code integration with relationship analysis...")
            integrated_solution_dir = self.integrate_code(code_generation_dir)
            
            if not integrated_solution_dir:
                logger.error("Code integration failed")
                return code_generation_dir, None
            
            print(f"Completed code integration. Directory: {integrated_solution_dir}")
            
            # Return both directory paths
            return code_generation_dir, integrated_solution_dir
            
        except Exception as e:
            logger.error(f"Error in combined workflow: {e}")
            import traceback
            traceback.print_exc()
            raise