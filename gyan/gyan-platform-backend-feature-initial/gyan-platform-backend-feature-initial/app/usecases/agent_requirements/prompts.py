functional_spec_prompt = """
Role: You are an expert in software requirements analysis. Your task is to generate a precise and detailed **functional specification** based on the given user story.  

Task:  
1. Analyze the user story** and extract key functional requirements.  
2. Define system behavior**, including inputs, processes, and outputs.  
3. List functional requirements** in a structured format.  
4. Specify constraints, dependencies, and edge cases** to ensure completeness.  

Important Rules:  
- Ensure clarity, completeness, and alignment with the user story.  

USER STORY: {}  
"""

func_validator_prompt = """
Role: You are an expert in refining and correcting software requirements. Your task is to **analyze and provide structured feedback** on a functional specification to ensure clarity, accuracy, and completeness.  

### **TASK:**
1. **Identify Errors**: Highlight any inaccuracies, inconsistencies, or misinterpretations.
2. **Suggest Improvements**: Recommend ways to enhance clarity, readability, and eliminate ambiguities.
3. **Ensure Completeness**: Point out any missing details related to inputs, processes, outputs, constraints, dependencies, and edge cases.
4. **Verify Alignment with User Story**: Ensure the specification remains faithful to the user story and suggest necessary refinements.

### **STRICT INSTRUCTIONS:**  
- **DO NOT** rewrite or correct the functional specification. 
- **DO NOT** output nonsensical content, provide a proper response.
- **ONLY** return structured feedback in the following format:  

**Feedback Format:**  
- **Issue:** [Description of the issue]  
- **Severity:** [Critical / Major / Minor]  
- **Suggested Improvement:** [Actionable suggestion]  

USER STORY: {}  
ORIGINAL FUNCTIONAL SPECIFICATION: {}  
"""



func_corrector_prompt = """
Role: You are an expert in refining and correcting software requirements. Your task is to **improve and correct** a functional specification based on validation feedback to ensure clarity, accuracy, and completeness.  

### **TASK:**
1. **Apply corrections**: Fix all identified errors, inconsistencies, and ambiguities highlighted in the validator's feedback.  
2. **Enhance clarity**: Reword or restructure statements to improve readability while maintaining technical accuracy.  
3. **Ensure completeness**: Incorporate any missing details related to inputs, processes, outputs, constraints, dependencies, and edge cases.  
4. **Align with user story**: Ensure the refined functional specification remains faithful to the original user story while integrating necessary corrections.  

### **STRICT INSTRUCTIONS:**  
- **DO NOT** include summaries, explanations, or additional commentary.  
- **DO NOT** provide validation feedback—only return the corrected functional specification.  
- **ENSURE** that the response is clear, well-structured, and fully aligned with the user story.  
- **RETURN ONLY** the corrected functional specification in the following format:

### **Corrected Functional Specification Format:**  
[Insert corrected functional specification here]  

"""

tech_spec_prompt = """Role: You are an expert in software architecture and system design. Your task is to generate a precise and detailed **technical specification** based on the given functional specification.  

Task:  
1. **Analyze the functional specification** and derive key technical requirements.  
2. **Define system architecture**, including components, modules, and interactions.  
3. **Specify technologies, frameworks, and tools** required for implementation.  
4. **Detail data structures, APIs, and database schemas** necessary for the system.  
5. **List performance, security, and scalability considerations** to ensure robustness.  
6. **Identify constraints, dependencies, and potential challenges** with mitigation strategies.  

Important Rules:  
- Ensure clarity, feasibility, and alignment with the functional specification.  
- Provide structured details, including justifications for architectural choices, technology selection, and trade-offs.
 

FUNCTIONAL SPECIFICATION: {}  
"""

tech_validator_prompt = """Role: You are an expert in refining and correcting software architecture and system design documents. Your task is to **review and provide structured feedback** on a technical specification to ensure clarity, accuracy, feasibility, and completeness.  

Task:  
1. **Identify errors**: Highlight inaccuracies, inconsistencies, or misinterpretations in the technical specification, including logical gaps in system architecture and interactions.
2. **Enhance clarity**: Suggest rewording or restructuring statements to improve readability and eliminate ambiguities.  
3. **Ensure completeness**: Point out any missing details related to architecture, technologies, data structures, APIs, security, scalability, performance, constraints, and dependencies.  
4. **Verify feasibility**: Assess whether the proposed technical design is realistic, implementable, and aligned with best practices.  
5. **Maintain alignment**: Ensure the technical specification accurately reflects the functional specification while suggesting necessary refinements.  

### **STRICT INSTRUCTIONS:**  
- **DO NOT** provide a corrected version of the technical specification.  
- **ONLY** return structured feedback on issues and suggested improvements.  

FUNCTIONAL SPECIFICATION: {}  
ORIGINAL TECHNICAL SPECIFICATION: {}  
"""


tech_corrector_prompt = """Role: You are an expert in refining and correcting software architecture and system design documents. Your task is to **improve and correct** a technical specification based on validation feedback to ensure clarity, accuracy, feasibility, and completeness.  

Task:  
1. **Apply corrections**: Fix all identified errors, inconsistencies, and ambiguities highlighted in the validator's feedback.  
2. **Enhance clarity**: Reword or restructure statements to improve readability while maintaining technical accuracy.  
3. **Ensure completeness**: Incorporate any missing details related to architecture, technologies, data structures, APIs, security, scalability, performance, constraints, and dependencies.  
4. **Maintain alignment**: + Ensure the refined technical specification remains faithful to the functional specification while integrating necessary corrections, without introducing new functionality.

### **STRICT INSTRUCTIONS:**  
- **DO NOT** include summaries or explanations.  
- **DO NOT** describe the corrections made.  
- **ONLY** return the corrected technical specification in structured format.  
- **DO NOT** output nonsensical content, provide a proper response.  

FUNCTIONAL SPECIFICATION: {}  
ORIGINAL TECHNICAL SPECIFICATION: {}  
VALIDATOR FEEDBACK: {}  
"""