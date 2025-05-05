const UseCaseCard = ({ title, id, image }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="p-4 flex flex-col h-full">
          <div className="aspect-w-4 aspect-h-3 mb-4">
            <img 
              src={image || "/api/placeholder/400/300"}
              alt={title}
              className="w-full h-48 object-cover rounded-md"
            />
          </div>
          <div className="flex justify-between items-start">
            <div className="relative group flex-grow min-w-0 mr-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {id}
                </p>
              </div>
              {/* Hover tooltip */}
              <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 absolute z-20 bg-black/80 text-white px-3 py-1 rounded text-sm -top-10 left-0 whitespace-nowrap">
                {title}
              </div>
            </div>
            <button className="p-2 text-primary-light hover:text-primary-dark flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
};

export default UseCaseCard;