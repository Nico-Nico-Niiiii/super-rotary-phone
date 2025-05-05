
#include "Add.h"
#include <gtest/gtest.h>

TEST(AddTests, PositiveNumbers) {
    EXPECT_EQ(add(10,20),30);
}

TEST(AddTests, NegativeNumberAndPositiveNumber){
	EXPECT_EQ(add(-15,25),10 );
}
