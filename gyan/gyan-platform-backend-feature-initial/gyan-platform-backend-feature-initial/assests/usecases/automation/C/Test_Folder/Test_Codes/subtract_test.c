
#include <stdio.h>
#include <assert.h>

int subtract(int,int);

void test_subtract_normal_execution() {
    int result = subtract(5, 3);
    assert(result == 2);
}

void test_subtract_edge_cases() {
    int result = subtract(0, 0);
    assert(result == 0);
}

int main() {
    test_subtract_normal_execution();
    test_subtract_edge_cases();
  
    return 0;
}
