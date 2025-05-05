reviewer_start= "You are Code reviewer specialized in {}.\
You need to review the given code following guidelines and potential bugs\
and point out issues as bullet list.\
specialization: {}\
Code:\n {}\
style_guide:{}\
do not output nonsensical content, provide a proper response"

coder_start = (
    "You are a coder specializing in {}."
    "specialization: {}"
    "Improve the given code by following these style guidelines:\n"
    "Style Guide: {}\n\n"
    "Code:\n{}\n\n"
    "Output only the improved code, without any explanations or additional text. "
    "Do not include phrases like 'Here is the improved code'."
    "do not output nonsensical content, provide a proper response"

)



rating_start = (
    "Rate the skills of the coder on a scale of 10 based on the given actual code (not the revised code) and tool output "
    "Consider the following parameters while rating:\n"
    "- **Correctness & Errors**: Identify syntax errors, logical errors, and runtime issues.\n"
    "- **Code Efficiency**: Assess the time and space complexity of the solution.\n"
    "- **Readability & Maintainability**: Check variable names, formatting, and code structure.\n"
    "- **Documentation & Comments**: Evaluate if the code has meaningful comments.\n"
    "- **Best Practices & Optimization**: Check adherence to coding standards style_guide: {}, modularization, and potential improvements.\n"
    "Provide a **detailed review** highlighting strengths, weaknesses, and areas for improvement.\n"
    "Note: Do not include actual code snippets in the response. Also do not output nonsensical content, provide a proper response.\n" 
    "Code Review:\n{}"
    
)


code_comparison = (
    "Analyze and compare the two given code snippets based on the following criteria:\n\n"
    "1. **Rating**: Evaluate both code snippets on a scale of 1 to 10 based on:\n"
    "   - **Efficiency** (execution speed and resource utilization)\n"
    "   - **Readability** (clarity, structure, and comments)\n"
    "   - **Maintainability** (ease of modification and adherence to best practices)\n\n"
    "2. **Complexity Analysis**:\n"
    "   - Compute and compare the **time and space complexity** of both snippets.\n"
    "   - Provide a justification for the complexity assigned.\n\n"
    "3. **Code Explanation & Improvements**:\n"
    "   - Explain the logic and purpose of each snippet.\n"
    "   - Identify and suggest **optimizations** to improve efficiency.\n"
    "   - Highlight **structural differences** and areas where one snippet is superior.\n\n"
    "4. **Style Guide Adherence**:\n"
    "   - Compare both snippets against the provided style guide.\n"
    "   - Highlight any deviations and suggest improvements.\n\n"
    "### **Key Instructions**:\n"
    "- Do **NOT** include actual code snippets in the response.\n"
    "- Provide **logical and meaningful** insights, avoiding vague or nonsensical content.\n\n"
    "### **Input Details**:\n"
    "- **Revised Code**: {}\n"
    "- **Original Code**: {}\n"
    "- **Style Guide**: {}\n"
)


classify_feedback = "Are all feedback mentioned resolved in the code? Output just Yes or No.\
Code: \n {} \n Feedback: \n {} \n"
