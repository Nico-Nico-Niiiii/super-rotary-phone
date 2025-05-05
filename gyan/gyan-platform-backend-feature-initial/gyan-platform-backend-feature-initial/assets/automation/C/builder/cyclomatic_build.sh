#!/bin/bash

# Exit on any error
set -e

# Directory containing the C files
C_FILES_DIR=$1

# Check if lizard is installed, otherwise install it
if ! command -v lizard &> /dev/null
then
    echo "Lizard is not installed. Installing it now..."
    pip install lizard
fi

# Check if the directory is provided and exists
if [ -z "$C_FILES_DIR" ]; then
    echo "Error: No directory provided."
    echo "Usage: ./cyclomatic_build.sh <directory_with_c_files>"
    exit 1
fi

if [ ! -d "$C_FILES_DIR" ]; then
    echo "Error: Directory '$C_FILES_DIR' does not exist."
    exit 1
fi

# Calculate cyclomatic complexity for each C file in the directory, excluding files that end with _test.c
# echo "Calculating cyclomatic complexity for C files in $C_FILES_DIR"
for file in "$C_FILES_DIR"/*.c
do
    # Exclude _test.c files
    if [[ ! "$file" == *_test.c ]]; then
        if [ -f "$file" ]; then
            file_name=$(basename "$file")  # Extract the file name from the path
            echo "Processing $file_name..."
            lizard "$file"
        fi
    else
        file_name=$(basename "$file")  # Extract the file name from the path
        # echo "Skipping test file: $file_name"
    fi
done
