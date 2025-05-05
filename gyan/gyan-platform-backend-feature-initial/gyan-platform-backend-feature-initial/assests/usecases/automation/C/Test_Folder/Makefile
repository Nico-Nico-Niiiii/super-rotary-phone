# # Compiler and flags
# CC = gcc
# CFLAGS = -Wall -Werror -g

# # Source files
# SRC = $(wildcard *.c)

# # Test executables (any file starting with test_)
# TESTS = $(patsubst %.c, %, $(wildcard test_*.c))

# # Build all test executables
# all: $(TESTS)

# # Rule to build each test executable
# %: %.c
# 	$(CC) $(CFLAGS) -o $@ $^

# # Clean up executables and object files
# clean:
# 	rm -f $(TESTS) *.o


# Compiler and flags
CC = gcc
CFLAGS = -Wall -Werror -g

# Source and test directories
SRC_DIR = .
TEST_DIR = ./Test_Codes

# Source files
SRC = $(wildcard $(SRC_DIR)/*.c)
SRC_OBJ = $(patsubst %.c, %.o, $(wildcard $(SRC_DIR)/*.c))

# Test files
TESTS = $(patsubst $(TEST_DIR)/%.c, $(TEST_DIR)/%, $(wildcard $(TEST_DIR)/*.c))

# Build all test executables
all: $(TESTS)

# Rule to build each test executable
$(TEST_DIR)/%: $(TEST_DIR)/%.c $(SRC_OBJ)
	$(CC) $(CFLAGS) -o $@ $^

# Clean up executables and object files
clean:
	rm -f $(TEST_DIR)/* $(SRC_DIR)/*.o
