# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.22

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /usr/bin/cmake

# The command to remove a file.
RM = /usr/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build

# Include any dependencies generated for this target.
include CMakeFiles/findmax.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include CMakeFiles/findmax.dir/compiler_depend.make

# Include the progress variables for this target.
include CMakeFiles/findmax.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/findmax.dir/flags.make

CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o: CMakeFiles/findmax.dir/flags.make
CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o: ../src/main/src/main_findmax.cpp
CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o: CMakeFiles/findmax.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o -MF CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o.d -o CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o -c /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/main_findmax.cpp

CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/main_findmax.cpp > CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.i

CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/main_findmax.cpp -o CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.s

CMakeFiles/findmax.dir/src/main/src/add.cpp.o: CMakeFiles/findmax.dir/flags.make
CMakeFiles/findmax.dir/src/main/src/add.cpp.o: ../src/main/src/add.cpp
CMakeFiles/findmax.dir/src/main/src/add.cpp.o: CMakeFiles/findmax.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Building CXX object CMakeFiles/findmax.dir/src/main/src/add.cpp.o"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT CMakeFiles/findmax.dir/src/main/src/add.cpp.o -MF CMakeFiles/findmax.dir/src/main/src/add.cpp.o.d -o CMakeFiles/findmax.dir/src/main/src/add.cpp.o -c /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/add.cpp

CMakeFiles/findmax.dir/src/main/src/add.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/findmax.dir/src/main/src/add.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/add.cpp > CMakeFiles/findmax.dir/src/main/src/add.cpp.i

CMakeFiles/findmax.dir/src/main/src/add.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/findmax.dir/src/main/src/add.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/add.cpp -o CMakeFiles/findmax.dir/src/main/src/add.cpp.s

CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o: CMakeFiles/findmax.dir/flags.make
CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o: ../src/main/src/findmax.cpp
CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o: CMakeFiles/findmax.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --progress-dir=/media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_3) "Building CXX object CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o -MF CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o.d -o CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o -c /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/findmax.cpp

CMakeFiles/findmax.dir/src/main/src/findmax.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Preprocessing CXX source to CMakeFiles/findmax.dir/src/main/src/findmax.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/findmax.cpp > CMakeFiles/findmax.dir/src/main/src/findmax.cpp.i

CMakeFiles/findmax.dir/src/main/src/findmax.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green "Compiling CXX source to assembly CMakeFiles/findmax.dir/src/main/src/findmax.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/src/main/src/findmax.cpp -o CMakeFiles/findmax.dir/src/main/src/findmax.cpp.s

# Object files for target findmax
findmax_OBJECTS = \
"CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o" \
"CMakeFiles/findmax.dir/src/main/src/add.cpp.o" \
"CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o"

# External object files for target findmax
findmax_EXTERNAL_OBJECTS =

findmax: CMakeFiles/findmax.dir/src/main/src/main_findmax.cpp.o
findmax: CMakeFiles/findmax.dir/src/main/src/add.cpp.o
findmax: CMakeFiles/findmax.dir/src/main/src/findmax.cpp.o
findmax: CMakeFiles/findmax.dir/build.make
findmax: CMakeFiles/findmax.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color --switch=$(COLOR) --green --bold --progress-dir=/media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_4) "Linking CXX executable findmax"
	$(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/findmax.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
CMakeFiles/findmax.dir/build: findmax
.PHONY : CMakeFiles/findmax.dir/build

CMakeFiles/findmax.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/findmax.dir/cmake_clean.cmake
.PHONY : CMakeFiles/findmax.dir/clean

CMakeFiles/findmax.dir/depend:
	cd /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build /media/sahil/data1/gyan_backend/assests/usecases/automation/Cpp/Test_Folder/UTCProject_Folder/build/CMakeFiles/findmax.dir/DependInfo.cmake --color=$(COLOR)
.PHONY : CMakeFiles/findmax.dir/depend

