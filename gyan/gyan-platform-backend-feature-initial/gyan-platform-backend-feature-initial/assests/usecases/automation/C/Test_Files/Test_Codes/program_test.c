 #include<stdio.h>
 #include<assert.h>
 
 int sum(int,int);
 int main() {
    // Test cases
    assert(sum(2, 3) == 5);
    assert(sum(-1, 1) == 0);
    assert(sum(1000, 2000) == 3000);

    return 0;
}
