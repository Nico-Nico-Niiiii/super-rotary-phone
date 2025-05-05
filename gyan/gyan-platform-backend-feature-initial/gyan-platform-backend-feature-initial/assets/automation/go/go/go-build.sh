#!/bin/bash

Command=${1:-"all"}
File=${2:-""}
FunctionName=${3:-""}

build() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "Building all..."
        go build
    else
        echo "Building $file..."
        go build -v "$file"
    fi
}

test_go() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "Running all tests..."
        go test -v ./...
    else
        echo "Running tests for $file..."
        local test_file="${file%.go}_test.go"
        go test -v "$test_file"
    fi
}

coverage() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "Generating coverage report for all..."
        go test -coverprofile=coverage
    else
        echo "Generating coverage report for $file..."
        local test_file="${file%.go}_test.go"
        go test -coverprofile=coverage "$test_file"
    fi
    go tool cover -html=coverage -o coverage.html
}

lint() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "Running linter on all files..."
        golint .
    else
        echo "Running linter on $file..."
        golint "$file"
    fi
}

format() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "Formatting all files..."
        goimports .
    else
        echo "Formatting $file..."
        goimports "$file"
    fi
}

vet() {
    local file="$1"
    if [ -z "$file" ]; then
        echo "Running go vet on all files..."
        go vet .
    else
        echo "Running go vet on $file..."
        go vet "$file"
    fi
}

find_functions() {
    local directory="${1:-.}"
    local function_name="$2"

    echo "Searching for functions in directory: $directory"

    while IFS= read -r -d '' file; do
        while IFS= read -r line; do
            if [[ $line =~ ^func[[:space:]]+([[:alnum:]_]+)[[:space:]]*\( ]]; then
                local detected_function="${BASH_REMATCH[1]}"
                if [ -z "$function_name" ] || [[ $detected_function == *"$function_name"* ]]; then
                    local relative_path="${file#$directory/}"
                    echo "$detected_function | $relative_path | $((line_number + 1)) | go run $relative_path -function $detected_function"
                fi
            fi
            ((line_number++))
        done < "$file"
        line_number=0
    done < <(find "$directory" -type f -name "*.go" -print0)
}


cyclo() {
    local file="$1"
    local threshold="${2:-5}"
    local export_to_file="$3"

    if [ -z "$file" ]; then
        echo "Checking cyclomatic complexity for all files..."
        gocyclo .
    else
        echo "Checking cyclomatic complexity for $file..."
        gocyclo "$file"
    fi | {
        local total_complexity=0
        local count=0
        local max_complexity=0
        local min_complexity=1000000
        local high_complexity=0
        local medium_complexity=0
        local low_complexity=0
        local function_list=()

        while IFS= read -r line; do
            if [[ $line =~ ^([0-9]+)[[:space:]]+([^[:space:]]+)[[:space:]]+([^[:space:]]+)[[:space:]]+(.+):([0-9]+):([0-9]+)$ ]]; then
                local complexity="${BASH_REMATCH[1]}"
                local package="${BASH_REMATCH[2]}"
                local function="${BASH_REMATCH[3]}"
                local file_path="${BASH_REMATCH[4]}"
                local line_number="${BASH_REMATCH[5]}"

                total_complexity=$((total_complexity + complexity))
                count=$((count + 1))
                max_complexity=$((complexity > max_complexity ? complexity : max_complexity))
                min_complexity=$((complexity < min_complexity ? complexity : min_complexity))

                if [ "$complexity" -ge $((2 * threshold)) ]; then
                    high_complexity=$((high_complexity + 1))
                elif [ "$complexity" -ge $((3 * threshold / 2)) ]; then
                    medium_complexity=$((medium_complexity + 1))
                else
                    low_complexity=$((low_complexity + 1))
                fi

                function_list+=("$(printf "%4d | %-15s | %-30s | %-30s | %5d" "$complexity" "$package" "$function" "$(basename "$file_path")" "$line_number")")
            fi
        done

        if [ "$count" -gt 0 ]; then
            average_complexity=$(awk "BEGIN {printf \"%.2f\", $total_complexity / $count}")
        else
            average_complexity="0.00"
        fi

        echo "----- Cyclomatic Complexity Report -----"
        echo
        echo "Summary:"
        echo "  Total functions analyzed: $count"
        echo "  Total complexity: $total_complexity"
        echo "  Average complexity: $average_complexity"
        echo "  Maximum complexity: $max_complexity"
        echo "  Minimum complexity: $min_complexity"
        echo
        echo "Complexity distribution:"
        echo "  High (>= $((2 * threshold))): $high_complexity"
        echo "  Medium ($((3 * threshold / 2)) - $((2 * threshold - 1))): $medium_complexity"
        echo "  Low (<= $((3 * threshold / 2 - 1))): $low_complexity"
        echo
        echo "List of functions:"
        echo
        echo "Comp | Package         | Function                       | File                           | Line"
        echo "-----+------------------+--------------------------------+--------------------------------+-----"
        printf "%s\n" "${function_list[@]}"
    } | if [ "$export_to_file" = "true" ]; then
        tee "CyclomaticComplexityReport_$(date +%Y%m%d_%H%M%S).txt"
    else
        cat
    fi
}

check() {
    local file="$1"
    format "$file"
    vet "$file"
    lint "$file"
    cyclo "$file"
    test_go "$file"
}

all() {
    check
    build
}

case "$Command" in
    "build") build "$File" ;;
    "test") test_go "$File" ;;
    "coverage") coverage "$File" ;;
    "lint") lint "$File" ;;
    "fmt") format "$File" ;;
    "vet") vet "$File" ;;
    "cyclo") cyclo "$File" "$Threshold" ;;
    "check") check "$File" ;;
    "find") find_functions "$File" "$FunctionName" ;;
    "all") all ;;
    *) echo "Unknown command: $Command" ;;
esac