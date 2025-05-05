import studioIcon from '../../assets/images/studio.png';
import playgroundIcon from '../../assets/images/playground.png';
import deploymentIcon from '../../assets/images/deployment.png';

const FeatureSection = () => {
  const features = [
    {
      icon: studioIcon,
      title: "GenAI Training Studio",
      description: "Supports various LLMs to train your own model with local infra. Get it experienced by clicking on the Create project.",
      buttonText: "Create Project",
      link: "/create-project"
    },
    {
      icon: playgroundIcon,
      title: "Model Playground",
      description: "Test the infer of your model on the playground. To get started with test the GYAN ready models on playground.",
      buttonText: "Model Playground",
      link: "/playground"
    },
    {
      icon: deploymentIcon,
      title: "KServe Deployment",
      description: "Get created your LLM deployment with KServe based K8S Yaml generation. Steps are simple with GYAN, Build, Train, infer & Deploy.",
      buttonText: "Deployment Studio",
      link: "/deployment"
    }
  ];

  return (
    <div className="py-12 bg-[#f7f8fc] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            // <div 
            //   key={index}
            //   className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[400px]"
            // >
            //   {/* Icon */}
            //   <div className="w-16 h-16 mb-6 bg-primary-light/10 rounded-full flex items-center justify-center">
            //     <img 
            //       src={feature.icon} 
            //       alt={`${feature.title} icon`}
            //       className="w-8 h-8 text-primary-light"
            //     />
            //   </div>

            //   {/* Content */}
            //   <div className="flex flex-col flex-grow">
            //     <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            //       {feature.title}
            //     </h3>
            //     <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed flex-grow">
            //       {feature.description}
            //     </p>

            //     {/* Button Container */}
            //     <div className="mt-8">
            //       <a 
            //         href={feature.link}
            //         className="inline-block px-8 py-3 rounded-full border-2 border-primary-light text-primary-light hover:bg-primary-light hover:text-white transition-colors duration-300 text-lg font-medium"
            //       >
            //         {feature.buttonText}
            //       </a>
            //     </div>
            //   </div>
            // </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col min-h-[350px]">
  {/* Icon */}
  <div className="w-12 h-12 mb-4 bg-primary-light/10 rounded-full flex items-center justify-center">
    <img 
      src={feature.icon} 
      alt={`${feature.title} icon`}
      className="w-6 h-6 text-primary-light"
    />
  </div>

  {/* Content */}
  <div className="flex flex-col flex-grow">
    <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
      {feature.title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed flex-grow">
      {feature.description}
    </p>

    {/* Button Container */}
    <div className="mt-6">
      <a 
        href={feature.link}
        className="inline-block px-6 py-2 rounded-full border-2 border-primary-light text-primary-light hover:bg-primary-light hover:text-white transition-colors duration-300 text-base font-medium"
      >
        {feature.buttonText}
      </a>
    </div>
  </div>
</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;