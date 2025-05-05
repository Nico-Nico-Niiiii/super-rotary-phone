import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import UseCaseCard from '../components/home/UseCaseCard';
import FeatureSection from '../components/home/FeatureSection';
import software_debugger from '../assets/images/debug.jpg';
import data_analyser from '../assets/images/data.jpg';
import QnA_bot from '../assets/images/chatbot.jpg';
import bios_analyser from '../assets/images/bios.jpg';
import Source_Code_Review from '../assets/images/code-review-logo1.jpg';
import Automation_JAVA from '../assets/images/automate.jpg';
import Automation_Go from '../assets/images/automate_2.jpg';
import Sequence_State from '../assets/images/sequence-state.jpg';
import cori from '../assets/images/cori.jpg';

const Home = () => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 4;

  const allUseCases = [
    {
      title: 'Software Debugger',
      id: 'ID_GYAN_T5',
      image: software_debugger
    },
    {
      title: 'Data Analyser',
      id: 'ID_GYAN_T5',
      image: data_analyser
    },
    {
      title: 'GenAI QnA Bot',
      id: 'ID_GYAN_T5',
      image: QnA_bot
    },
    {
      title: 'Bios Analyser',
      id: 'ID_GYAN_T5',
      image: bios_analyser
    },
    {
      title: 'Source Code Review',
      id: 'ID_GYAN_LLAMA3',
      image: Source_Code_Review
    },
    {
      title: 'Automation_JAVA',
      id: 'ID_GYAN_CODELLAMA',
      image: Automation_JAVA
    },
    {
      title: 'Automation_GO',
      id: 'ID_GYAN_CODELLAMA',
      image: Automation_Go
    },
    {
      title: 'Boeing Chatbot',
      id: 'ID_GYAN_PHI-3',
      image: QnA_bot
    },
    {
      title: 'Sequence & State',
      id: 'ID_GYAN_PHI-3',
      image: Sequence_State
    },
    {
      title: 'CORI',
      id: 'ID_GYAN_LLAMA-3',
      image: cori
    },
    {
      title: 'Automation_C',
      id: 'ID_GYAN_CODELLAMA',
      image: Automation_Go
    },
    {
      title: 'Regression Analysis',
      id: 'ID_GYAN_T5',
      image: QnA_bot
    }
  ];

  const maxStartIndex = allUseCases.length - itemsPerPage;

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - itemsPerPage));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(maxStartIndex, prev + itemsPerPage));
  };

  const displayedUseCases = allUseCases.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full">
      <HeroBanner />
<section className="w-full py-12">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-3xl text-cyan-500 font-bold mb-8 px-8">USE CASES WITH GYAN</h2>
    <div className="relative">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={startIndex === 0}
        className={`absolute -left-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg
          ${startIndex === 0 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-primary-light hover:text-primary-dark'} 
          transition-all duration-300 z-10`}
      >
        <ChevronLeft size={30} />
      </button>

      {/* Use Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-12">
        {displayedUseCases.map((useCase) => (
          <UseCaseCard key={useCase.title} {...useCase} />
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={startIndex >= maxStartIndex}
        className={`absolute -right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg
          ${startIndex >= maxStartIndex 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-primary-light hover:text-primary-dark'} 
          transition-all duration-300 z-10`}
      >
        <ChevronRight size={30} />
      </button>
            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: Math.ceil(allUseCases.length / itemsPerPage) }).map((_, index) => (
                <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-300 
                    ${Math.floor(startIndex / itemsPerPage) === index 
                        ? 'bg-primary-light w-4' 
                        : 'bg-gray-300 dark:bg-gray-600'}`}
                />
                ))}
            </div>
            </div>
        </div>
        </section>
      <FeatureSection />
    </div>
  );
};

export default Home;