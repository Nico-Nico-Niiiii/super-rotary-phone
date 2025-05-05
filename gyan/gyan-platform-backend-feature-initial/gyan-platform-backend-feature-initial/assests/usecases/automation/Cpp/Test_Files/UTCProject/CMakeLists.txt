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

# Add main source files (without main.cpp)
file(GLOB MAIN_SOURCES src/main/src/program.cpp)  # Only include implementation files

# Add executable for the main program
add_executable(main_exec src/main/src/main.cpp ${MAIN_SOURCES})

# Add executable for the tests and link necessary implementation files
add_executable(run_tests ${TEST_SOURCES} ${MAIN_SOURCES})
target_link_libraries(run_tests ${GTEST_LIBRARIES} pthread)

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
