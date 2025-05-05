# #!/bin/bash

# # Create a coverage directory
# mkdir -p coverage

# # Compile and run each test case
# for file in *_test.c; do
#     # Get the base name (e.g., "add" from "add_test.c")
#     base_name=$(echo $file | sed 's/_test\.c//')

#     # Compile the source and test files together with coverage flags
#     gcc -fprofile-arcs -ftest-coverage -o "$base_name"_test "$base_name".c "$base_name"_test.c

#     # Run the test executable
#     ./"$base_name"_test

#     # Generate coverage report using gcov
#     gcov "$base_name".c

#     # Move the coverage files to the coverage directory
#     mv "$base_name".gcda coverage/
#     mv "$base_name".gcno coverage/
#     mv "$base_name".c.gcov coverage/
# done

# # Optionally, generate HTML coverage report using lcov
# lcov --capture --directory . --output-file coverage/coverage.info
# genhtml coverage/coverage.info --output-directory coverage/html

# echo "Coverage report generated in the 'coverage/html' folder."


#!/bin/bash

# Set directories
TEST_DIR="Test_Codes"
COV_DIR="coverage"

# Ensure coverage directory exists
mkdir -p "$COV_DIR"

# Compile and run each test case
for test_file in "$TEST_DIR"/*_test.c; do
    # Extract base name (e.g., "add" from "add_test.c")
    base_name=$(basename "$test_file" _test.c)

    # Compile source and test files together with coverage flags
    gcc -fprofile-arcs -ftest-coverage -o "$COV_DIR/${base_name}_test" "$base_name.c" "$TEST_DIR/$base_name"_test.c

    # Run the test executable
    "$COV_DIR/${base_name}_test"

    # Generate coverage report using gcov
    gcov -o "$COV_DIR" "$base_name.c"

    # Move coverage files to the coverage directory
    mv "$base_name.c.gcov" "$COV_DIR/"
    mv "$base_name.gcda" "$COV_DIR/"
    mv "$base_name.gcno" "$COV_DIR/"
done

# Generate HTML coverage report using lcov
lcov --capture --directory "$COV_DIR" --output-file "$COV_DIR/coverage.info"
genhtml "$COV_DIR/coverage.info" --output-directory "$COV_DIR/html"

echo "Coverage report generated in '$COV_DIR/html'."
