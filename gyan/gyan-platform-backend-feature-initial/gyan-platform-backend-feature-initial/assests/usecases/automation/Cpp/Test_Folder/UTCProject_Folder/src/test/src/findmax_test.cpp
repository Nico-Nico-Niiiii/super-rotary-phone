
#include "FindMax.h"
#include <gtest/gtest.h>

TEST(FindMaxTests, EmptyArrayReturnsZero) {
    const int emptyArr[] = {};
    EXPECT_EQ(findMax(emptyArr, sizeof(emptyArr)/sizeof(*emptyArr)), 0);
}

TEST(FindMaxTests, SingleElementArrayReturnsThatValue) {
    const int singleElemArr[]{10};
    EXPECT_EQ(findMax(singleElemArr, sizeof(singleElemArr)/sizeof(*singleElemArr)), 10);
}

TEST(FindMaxTests, MultipleElementsReturnLargestOne) {
    const int multipleElems[]{-12, -23, 34, 45, 56};//sorted array of integers.
    EXPECT_EQ(findMax(multipleElems,sizeof(multipleElems)/sizeof(*multipleElems)),56); 
}
