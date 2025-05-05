import bannerbg from '../../assets/images/banner-bg.jfif'

const HeroBanner = () => {
    return (
      <div className="w-full">
        <div 
          className="relative bg-cover bg-center h-[300px] overflow-hidden" 
          style={{ 
            backgroundImage: `url(${bannerbg})`,
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50"></div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto flex items-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
              <div className="px-8">
                <p className="mt-4 text-xl text-white/80">
                  GYAN GenAI Platform
                </p>

                <h1 className="text-4xl font-bold text-white sm:text-3xl">
                  BROWSE OUR GYAN MODEL PLAYGROUND!
                </h1>

                <div className="mt-8 flex space-x-4">
                  <button className="bg-primary-light hover:bg-primary-dark text-white px-6 py-3 rounded-md transition duration-300">
                    Models Playground
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md backdrop-blur-sm transition duration-300">
                    Training Studio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
  
export default HeroBanner;