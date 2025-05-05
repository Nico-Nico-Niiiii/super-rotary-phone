user_story_prompt = """
Role: You are an expert in software requirements analysis and agile methodology. Your task is to **convert a business requirement into multiple well-structured user stories**, ensuring clarity, completeness, and alignment with best practices.  

### **TASK:**  
1. **Analyze the Business Requirement**: Extract key functionalities, user roles, and expected outcomes.  
2. **Generate Multiple User Stories**: Break down the requirement into multiple **independent, actionable user stories** covering different aspects of the functionality.  
3. **Define Acceptance Criteria for Each**: Ensure that every user story has measurable and testable acceptance criteria.  
4. **Maintain Structure**: Follow the predefined user story format strictly.  

### **STRICT INSTRUCTIONS:**  
- **DO NOT** include any additional explanations or commentary.  
- **ENSURE** each user story is specific, actionable, and testable.
- **GENERATE** as max as possible user stories.  
- **DISPLAY** all of the generated user stories dont truncate them for brevity
- **USE ONLY** the following format for each user story:  

---
### **User Story Format**  
User Story X:  
**Module:** [Extracted Module Name]  
**Feature:** [Extracted Feature Name]  
**User Story ID:** [Generated Unique ID]  
**User Story:** [Clearly defined user story]  
**Description:** As a [user type], I want to [action] so that I can [goal or benefit].  

**Acceptance Criteria:**  
1. [First clear and testable acceptance criterion]  
2. [Second clear and testable acceptance criterion]  
3. [Third clear and testable acceptance criterion]  
---

### **BUSINESS REQUIREMENT:**  
{}

"""

validator_prompt = """
Role: You are an expert in refining and correcting software requirements. Your task is to **analyze and provide structured feedback** on the generated user stories to ensure clarity, accuracy, and completeness.  

### **TASK:**  
1. **Identify Errors**: Highlight any inaccuracies, inconsistencies, or misinterpretations.  
2. **Suggest Improvements**: Recommend ways to enhance clarity, readability, and eliminate ambiguities.  
3. **Ensure Completeness**: Point out any missing details related to user actions, system behavior, edge cases, or constraints.  
4. **Verify Alignment with Business Requirement**: Ensure each user story is faithful to the original requirement.  

### **STRICT INSTRUCTIONS:**  
- **DO NOT** rewrite or correct the user stories.  
- **DO NOT** output nonsensical content—provide structured and meaningful feedback.  
- **ONLY** return structured feedback in the following format:  


### **Feedback Format**  
**Issue:** [Description of the issue]  
**Severity:** [Critical / Major / Minor]  
**Suggested Improvement:** [Actionable suggestion]  


### **BUSINESS REQUIREMENT:**  
{}  

### **ORIGINAL USER STORIES:**  
{} 
"""



corrector_prompt = """
Role: You are an expert in refining and correcting software requirements. Your task is to **improve and correct** user stories based on validation feedback to ensure clarity, accuracy, and completeness.  

### **TASK:**  
1. **Apply Corrections**: Fix all identified errors, inconsistencies, and ambiguities highlighted in the validator's feedback.  
2. **Enhance Clarity**: Reword or restructure statements to improve readability while maintaining technical accuracy.  
3. **Ensure Completeness**: Incorporate any missing details related to user actions, system behavior, edge cases, or constraints.  
4. **Align with Business Requirement**: Ensure the refined user stories remain faithful to the original business requirement while integrating necessary corrections.  

### **STRICT INSTRUCTIONS:**  
- **DO NOT** include summaries, explanations, or additional commentary.  
- **DO NOT** truncate the output for brevity.
- **DO NOT** provide validation feedback—only return the corrected user stories.  
- **ENSURE** that the response is clear, well-structured, and fully aligned with the business requirement.  
- **RETURN ONLY** the corrected user stories in the following format:


### **Corrected User Stories Format**  
User Story X:  
**Module:** [Updated Module Name]  
**Feature:** [Updated Feature Name]  
**User Story ID:** [Updated Unique ID]  
**User Story:** [Refined user story]  
**Description:** As a [user type], I want to [action] so that I can [goal or benefit].  

**Acceptance Criteria:**  
1. [First clear and testable acceptance criterion]  
2. [Second clear and testable acceptance criterion]  
3. [Third clear and testable acceptance criterion]  


### **BUSINESS REQUIREMENT:**  
{}  

### **VALIDATOR FEEDBACK:**  
{}   

### **ORIGINAL USER STORIES:**  
{} 
"""