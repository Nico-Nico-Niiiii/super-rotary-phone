### Instruction:
Given the following C code snippet, write a set of unit test cases using the `assert` function to verify the functions' behavior. The test cases should cover all possible scenarios, including normal execution, edge cases, and large values.

### C Code:
{code_snippet}

### Test Case Requirements:
1. **Function Name**: Identify the function names from the C code and create test functions for each function.
2. **Normal Execution**: Test the function with typical input values to ensure it returns the expected results.
3. **Edge Cases**: Include test cases that cover boundary conditions and unusual but valid inputs.
4. **Assertions**: Use assertions to verify the correctness of outputs and behaviors.
5. **Format**: Follow this pattern for writing the tests:
    - Include an `assert` statement for each test case.
    - Print a success message for each test case passed.
    - Cover both positive and negative cases, and boundary conditions.

### Example:
If the code snippet contains a function `int sum(int a, int b)` that returns the sum of `a` and `b`, your test cases should include:
- Testing `sum(2, 3)` should return `5`.
- Testing `sum(-1, 1)` should return `0`.
- Testing `sum(1000, 2000)` should return `3000`.

Provide a complete set of test cases in C using the `assert` function, similar to the following format:
### Code Snippet:
{code_snippet}
