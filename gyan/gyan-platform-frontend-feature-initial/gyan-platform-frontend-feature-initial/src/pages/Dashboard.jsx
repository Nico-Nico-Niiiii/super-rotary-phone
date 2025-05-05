import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Plus, 
  FolderPlus, 
  Box, 
  Rocket, 
  PlayCircle, 
  BookOpen,
  ArrowUp,
  ArrowDown,
  Code2
} from 'lucide-react';

import endpoints from '../endpoints.json'
import axios from 'axios';
// const BASE_URL = 'http://gyan.capgemini.com:8000';
const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const mockChartData = [
  { name: 'Jan', deployments: 4, models: 3 },
  { name: 'Feb', deployments: 6, models: 4 },
  { name: 'Mar', deployments: 5, models: 6 },
  { name: 'Apr', deployments: 8, models: 5 },
  { name: 'May', deployments: 7, models: 4 },
  { name: 'Jun', deployments: 9, models: 7 },
  { name: 'Jul', deployments: 9, models: 7 },
  { name: 'Aug', deployments: 9, models: 7 },
  { name: 'Sept', deployments: 9, models: 7 },
  { name: 'Oct', deployments: 9, models: 7 },
  { name: 'Nov', deployments: 9, models: 7 },
  { name: 'Dec', deployments: 9, models: 7 }
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{value}</h3>
        {/* {trend && (
          <div className={`flex items-center mt-2 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="text-sm ml-1">{trendValue}%</span>
          </div>
        )} */}
      </div>
      <div className="p-3 bg-primary-light/10 rounded-lg">
        <Icon size={24} className="text-primary-light" />
      </div>
    </div>
  </div>
);

const RecentProjectCard = ({ title, type, date }) => (
  <div className="flex items-center justify-between p-4 bg-transparent hover:bg-white/5 rounded-lg mb-3 transition-colors duration-200">
    <div className="flex items-center">
      <div className="p-2 bg-primary-light/10 rounded-lg">
        <FolderPlus size={20} className="text-primary-light" />
      </div>
      <div className="ml-4">
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{type}</p>
      </div>
    </div>
    <span className="text-sm text-gray-500 dark:text-gray-400">{date}</span>
  </div>
);

const Dashboard = () => {

  const [projectCount, setProjectCount] = useState(0);
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [trainingCount, steTrainingCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
      fetchAllCounts();
      fetchRecentActivities();
  },[])

  const fetchRecentActivities = async () => {
    try {
      const response = await api.get(`${endpoints.evaluation.prefix}/recent-activities`);
      console.log(response);
      
      setRecentActivities(response.data.activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const fetchAllCounts = async () => {

    try {
      const [projectRes, evalRes, trainRes] = await Promise.all([
        api.get(`${endpoints.project.prefix}/count`),
        api.get(`${endpoints.evaluation.prefix}/count`), 
        api.get(`${endpoints.training.prefix}/count`)
      ]);
  
      setProjectCount(projectRes.data.count);
      setEvaluationCount(evalRes.data.count);
      steTrainingCount(trainRes.data.count);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }


  return (
    <div className="w-full space-y-6">
      {/* Create Project Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Getting Started with Gyan</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Start Building your GenAI solution with Studio</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-primary-light hover:bg-primary-dark text-white rounded-lg transition-colors duration-200"
           onClick={() => {
            navigate('/dashboard/studio/training')
          }}>
            <Plus size={20} className="mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Projects" 
          value={projectCount} 
          icon={Box}
          trend="up"
          trendValue="12.5"
        />
        <StatCard 
          title="Deployments" 
          value={deploymentCount} 
          icon={Rocket}
          trend="up"
          trendValue="8.2"
        />
        <StatCard 
          title="Trained Models" 
          value={trainingCount}
          icon={BookOpen}
          trend="up"
          trendValue="15.3"
        />
        <StatCard 
          title="Evaluation" 
          value={evaluationCount}
          icon={PlayCircle}
          trend="down"
          trendValue="4.1"
        />
      </div>

      {/* Charts and Recent Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment Stats Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Deployment Stats</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#718096"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#718096"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="deployments" fill="#00A3E0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="models" fill="#0082B3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Recent Activities</h3>
          <div className="space-y-4">
          {recentActivities?.map((activity, index) => (
  <RecentProjectCard 
    key={index}
    title={activity.name}
    type={activity.type}
    date={new Date(activity.completed_at).toLocaleString()}
  />
))}
            {/* <RecentProjectCard 
              title="BERT Fine-tuning"
              type="Training Project"
              date="2 hours ago"
            />
            <RecentProjectCard 
              title="Sentiment Analysis"
              type="Deployment"
              date="5 hours ago"
            />
            <RecentProjectCard 
              title="Image Classification"
              type="Training Project"
              date="1 day ago"
            /> */}
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playground */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Explore Playground</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Test and experiment with models</p>
            </div>
            <button className="px-4 py-2 bg-primary-light hover:bg-primary-dark text-white rounded-lg transition-colors duration-200"
            onClick={() => {
              navigate('/dashboard/studio/playground')
            }}
            >
              Open Playground
            </button>
          </div>
        </div>

        {/* Studio */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Training Studio</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Create and train new models</p>
            </div>
            <button className="flex items-center px-4 py-2 bg-primary-light hover:bg-primary-dark text-white rounded-lg transition-colors duration-200"
            onClick={() => {
              navigate('/dashboard/studio/training')
            }}
            >
              <Code2 size={18} className="mr-2" />
              Open Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;