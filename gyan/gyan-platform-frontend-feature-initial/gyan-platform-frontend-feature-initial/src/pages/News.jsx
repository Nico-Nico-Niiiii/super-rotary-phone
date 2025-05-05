const News = () => {
    return (
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Latest News</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for news items */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-300">
              News and updates about GYAN platform will be displayed here.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  export default News;




