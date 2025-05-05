cmake_minimum_required(VERSION 3.10)
project(UTCProject)

# GoogleTest requires at least C++11
set(CMAKE_CXX_STANDARD 11)

# Enable code coverage
if(CMAKE_COMPILER_IS_GNUCXX)
    add_compile_options(--coverage)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
endif()

# Locate GTest
find_package(GTest REQUIRED)
include_directories(${GTEST_INCLUDE_DIRS})

# Include directories
include_directories(src/main/include)

# Add test source files
file(GLOB TEST_SOURCES src/test/src/*.cpp)

# Add shared source files (exclude any files with main_ prefix)
file(GLOB MAIN_SOURCES src/main/src/*.cpp)
list(FILTER MAIN_SOURCES EXCLUDE REGEX ".*main_[^/]*\\.cpp$")

# Find all main files with the main_ prefix
file(GLOB MAIN_FILES src/main/src/main_*.cpp)

# Create an executable for each main file
foreach(main_file ${MAIN_FILES})
    # Extract the filename without extension
    get_filename_component(full_name ${main_file} NAME_WE)
    
    # Remove the "main_" prefix to get a cleaner executable name
    string(REGEX REPLACE "^main_" "" exec_name ${full_name})
    
    # Create executable target
    add_executable(${exec_name} ${main_file} ${MAIN_SOURCES})
endforeach()

# Add executable for the tests and link necessary implementation files
add_executable(run_tests ${TEST_SOURCES} ${MAIN_SOURCES})
target_link_libraries(run_tests PRIVATE gtest gtest_main)

# Optional: Add a test using CMake's CTest
enable_testing()
add_test(NAME MyTests COMMAND run_tests)

# Add target for generating code coverage report using lcov
if(CMAKE_COMPILER_IS_GNUCXX)
    find_program(LCOV lcov)
    find_program(GENHTML genhtml)
    
    if(LCOV AND GENHTML)
        add_custom_target(coverage
            COMMAND ${LCOV} --capture --directory . --output-file coverage.info
            COMMAND ${LCOV} --remove coverage.info '/usr/*' --output-file coverage.info
            COMMAND ${GENHTML} coverage.info --output-directory coverage_report
            COMMAND ${LCOV} --zerocounters --directory .
            WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
            COMMENT "Generating coverage report"
        )
    else()
        message(WARNING "lcov/genhtml not found, coverage report will not be generated")
    endif()
endif()