
#include "Add.h"
#include <gtest/gtest.h>

TEST(AddTests, PositiveNumbers) {
    EXPECT_EQ(add(10,20),30);
}

TEST(AddTests, NegativeNumberAndPositiveNumber){
	EXPECT_EQ(add(-15,25),10 );
}
        
int main(int argc, char**argv){ 
	::testing:: InitGoogleTest (&argc,argv);	
	return	RUN_ALL_TESTS();
}

