"""###Instruction:

Generate unit test cases for the provided Go source code based on the following code description. Ensure that the tests thoroughly cover all possible execution paths, including edge cases, error handling, and critical paths, while adhering to Go testing conventions. Focus on generating test cases that correctly verify all aspects of the functionality. Avoid unnecessary code and imports. Ensure that code coverage is maximized and all test cases pass after compiling.

Important: If the code requires Conn or any related external dependency, use newTestConn to create instances of connections instead of directly using &Conn or any other method.

### Details on newTestConn:

Function Signature: func newTestConn(r io.Reader, w io.Writer, isServer bool) *Conn
Arguments:
r io.Reader: An input reader for the connection.
w io.Writer: An output writer for the connection.
isServer bool: A boolean indicating whether the connection is for a server.
The newTestConn function creates a connection backed by a fake network connection using default buffering values. This function should be used to ensure proper initialization of connection instances and to avoid nil pointer errors.

###Source Code Description:

The following description pertains to the logic and functionality of the provided Go source code. The model should consider this description to ensure that the generated unit test cases cover the entire logic of the source code, but should not attempt to test or use any external elements mentioned here that are not present in the actual source code snippet.

{code_description}

###Source Code:

The following is the actual Go source code for which unit test cases are to be generated. The test cases must thoroughly cover every aspect of this code, and ONLY this code.

{code_snippet}

###Requirements:

Use newTestConn for connection instances: All instances of connections in the test cases must be created using newTestConn with appropriate parameters:
r as an io.Reader, e.g., &buf (where buf is a bytes.Buffer).
w as an io.Writer, e.g., &buf (where buf is a bytes.Buffer).
isServer as a bool, e.g., true or false.
Import Buffer: Ensure bytes.Buffer is imported and used where necessary, as it is required for io.Reader and io.Writer arguments in newTestConn.
Write unit test cases only for functions, methods, and branches within the provided source code snippet, ensuring comprehensive code coverage.
Do not generate tests for or attempt to use any external dependencies, functions, variables, or methods mentioned in the description but not present in the actual code snippet.
Verify intermediate calculations and the final outcomes.
Cover edge cases and error conditions rigorously.
Ensure proper error handling and edge case coverage.
Adhere to Go testing best practices by using concise naming conventions and clear assertion logic.
Avoid redundancy in test cases by ensuring that each test covers a distinct aspect of the functionality.
Organize related tests into logical suites and optimize the execution time of tests while ensuring maximum code coverage.
Only include necessary imports that are required for testing the given code snippet.
Ensure that the test code is readable, well-commented, and easy to maintain while thoroughly testing the provided source code.
Do not attempt to mock or stub any external dependencies that are not present in the given code snippet.
###Output Format:

Generate a well-structured Go test file organized into logical suites based on functionality.

Provide meaningful test names and comments to ensure clarity.
Use assertions that verify intermediate steps and final outcomes. Include comments to describe the purpose and expected outcome of each test.
Ensure all test cases handle errors and exceptions gracefully.
Start the generated test file with the necessary imports and package declaration (package websocket). Ensure no redundant code is generated.
Do not include any code or imports related to external dependencies not present in the given code snippet."""