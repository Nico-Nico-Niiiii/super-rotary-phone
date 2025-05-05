import { useNavigate } from 'react-router-dom';
import { Cloud, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const mockCloudStats = [
  { name: 'Jan', aws: 4, azure: 3, gcp: 5 },
  { name: 'Feb', aws: 6, azure: 4, gcp: 7 },
  { name: 'Mar', aws: 5, azure: 6, gcp: 6 },
  { name: 'Apr', aws: 8, azure: 5, gcp: 8 },
  { name: 'May', aws: 7, azure: 4, gcp: 7 },
  { name: 'Jun', aws: 9, azure: 7, gcp: 9 }
];

const CloudCard = ({ title, description, icon: Icon, buttonText, onClick }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
    <div className="mb-6 w-12 h-12 bg-primary-light/10 rounded-full flex items-center justify-center">
      <Icon size={24} className="text-primary-light" />
    </div>
    
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
      {title}
    </h3>
    
    <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">
      {description}
    </p>
    
    <button 
      onClick={onClick}
      className="w-full px-4 py-2 border-2 border-primary-light text-primary-light hover:bg-primary-light hover:text-white rounded-full transition-colors duration-200"
    >
      {buttonText}
    </button>
  </div>
);

const StatCard = ({ title, value, trend, trendValue }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
    <h4 className="text-sm text-gray-500 dark:text-gray-400">{title}</h4>
    <div className="flex items-center mt-2">
      <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
      <div className={`ml-2 flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
        <span className="text-sm ml-1">{trendValue}%</span>
      </div>
    </div>
  </div>
);

const CloudDeployment = () => {
  const navigate = useNavigate();

  const handleDeploy = (provider) => {
    console.log(`Deploying to ${provider}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cloud Deployment Options</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Choose your preferred cloud provider for deployment</p>
      </div>

      {/* Cloud Provider Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CloudCard 
          title="Azure Deployment"
          description="Deploy to Microsoft Azure cloud for enterprise-grade security and global scalability with built-in Azure AI services integration."
          icon={Cloud}
          buttonText="Deploy to Azure"
          onClick={() => handleDeploy('azure')}
        />
        <CloudCard 
          title="AWS Deployment"
          description="Deploy to Amazon Web Services for high availability and performance using AWS's comprehensive cloud infrastructure."
          icon={Cloud}
          buttonText="Deploy to AWS"
          onClick={() => handleDeploy('aws')}
        />
        <CloudCard 
          title="GCP Deployment"
          description="Deploy to Google Cloud Platform for advanced analytics and machine learning capabilities with seamless Google services integration."
          icon={Cloud}
          buttonText="Deploy to GCP"
          onClick={() => handleDeploy('gcp')}
        />
      </div>

      {/* Stats Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cloud Deployment Statistics</h3>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total Cloud Deployments"
            value="89"
            trend="up"
            trendValue="15.2"
          />
          <StatCard 
            title="Active Cloud Models"
            value="34"
            trend="up"
            trendValue="9.7"
          />
          <StatCard 
            title="Avg Cloud Response Time"
            value="95ms"
            trend="down"
            trendValue="7.3"
          />
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Monthly Cloud Deployments</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCloudStats}>
                <XAxis dataKey="name" stroke="#718096" fontSize={12} />
                <YAxis stroke="#718096" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="aws" fill="#FF9900" radius={[4, 4, 0, 0]} />
                <Bar dataKey="azure" fill="#008AD7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gcp" fill="#4285F4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudDeployment;