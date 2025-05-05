# #!/bin/bash

# # Set the directory containing the C files and test cases
# SRC_DIR="."
# OBJ_DIR="obj"
# BIN_DIR="bin"

# # Create directories if they don't exist
# mkdir -p $OBJ_DIR $BIN_DIR

# # Compile each C source file into an object file
# for src in $(find $SRC_DIR -name "*.c" ! -name "*_test.c"); do
#     obj_file="$OBJ_DIR/$(basename $src .c).o"
#     echo "Compiling $src into $obj_file"
#     gcc -c $src -o $obj_file
# done

# # Link each test source file into an executable
# for test_src in $(find $SRC_DIR -name "*_test.c"); do
#     test_name=$(basename $test_src _test.c)
#     test_executable="$BIN_DIR/${test_name}_test"
#     echo "Linking $test_src into $test_executable"
#     gcc $OBJ_DIR/*.o $test_src -o $test_executable
# done

# # Run the test executables and capture their output
# echo "Running tests..."
# for test_executable in $BIN_DIR/*_test; do
#     echo "Running tests for $test_executable..."
#     ./$test_executable
#     if [ $? -eq 0 ]; then
#         echo "$(basename $test_executable): pass"
#     else
#         echo "$(basename $test_executable): fail"
#     fi
# done

# Clean up object files and test executables
# echo "Cleaning up..."
# rm -f $OBJ_DIR/*.o $BIN_DIR/*_test


# # Remove the object and binary directories
# rm -rf $OBJ_DIR $BIN_DIR

# echo "Cleanup complete."


#!/bin/bash

# Set directories
SRC_DIR="."
TEST_DIR="./Test_Codes"
OBJ_DIR="obj"
BIN_DIR="bin"

# Create directories if they don't exist
mkdir -p $OBJ_DIR $BIN_DIR

# Compile each C source file into an object file
for src in $(find $SRC_DIR -maxdepth 1 -name "*.c" ! -name "*_test.c"); do
    obj_file="$OBJ_DIR/$(basename $src .c).o"
    echo "Compiling $src into $obj_file"
    gcc -c $src -o $obj_file
done

# Link each test source file into an executable
for test_src in $(find $TEST_DIR -maxdepth 1 -name "*.c"); do
    test_name=$(basename $test_src .c)
    test_executable="$BIN_DIR/${test_name}"
    echo "Linking $test_src into $test_executable"
    gcc $OBJ_DIR/*.o $test_src -o $test_executable
done

# Run the test executables and capture their output
echo "Running tests..."
for test_executable in $BIN_DIR/*; do
    echo "Running tests for $test_executable..."
    ./$test_executable
    if [ $? -eq 0 ]; then
        echo "$(basename $test_executable): pass"
    else
        echo "$(basename $test_executable): fail"
    fi
done

# Cleanup object files and test executables
echo "Cleaning up..."
rm -f $OBJ_DIR/*.o $BIN_DIR/*

# Remove the object and binary directories
rm -rf $OBJ_DIR $BIN_DIR

echo "Cleanup complete."
