import { Routes, Route } from 'react-router-dom';
import MainLayout from './Layouts/MainLayout';
import DashboardLayout from './Layouts/DashboardLayout';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import UseCases from './pages/UseCases';
import Deployment from './pages/Deployment';
import Pipeline from './pages/Pipeline';
import Training from './pages/Training';
import Playground from './pages/Playground';
import CloudDeployment from './pages/CloudDeployment';
import FoundationModels from './pages/FoundationModels';
import ProjectDetails from './components/ProjectDetails';
import JobDashboard from './pages/JobDashboard';
import ScratchTraining from './pages/ScratchTraining';
import RAG from './pages/RAG';
import Prompt from './pages/Prompt'
import RaiseQuery from './pages/RaiseQuery';
import ModelRepositories from './pages/ModelRepositories';
import DatasetRepositories from './pages/DatasetRepositories';
import ProjectPage from './pages/ProjectPage';
import Profile from './pages/Profile';
import AccessToken from './pages/AccessToken';
import ModelPlayground from './components/ModelPlayground'
import EvaluationModel from './components/EvaluationModel';
import Evaluation from './pages/Evaluation';
import EvalProjectJobDetails from './components/EvalProjectJobDetails';
import PipelineProjectJobDetails from './components/pipeline/PipelineProjectJobDetails';
import ProtectedRoute from './components/ProtectedRoute';
import FoundationModelPlayground from './components/FoundationModelPlayground';
import QueryDetail from './pages/QueryDetail';
import ConversationalDetails from './pages/ConversationalDetails';
import SoftwareDebugger from './pages/SoftwareDebugger';
import DebuggerDetails from './pages/DebuggerDetails';
import SoftwareDebuggerDetail from './pages/SoftwareDebuggerDetail';
import Automation from './pages/Automation';
import AutomationDetails from './pages/AutomationDetails';
import TestGeneration from './pages/TestGeneration';
import TestGenerationDetails from './pages/TestGenerationDetails';
import DeviceTest from './pages/DeviceTest';
import DeviceTestDetails from './pages/DeviceTestDetails';
import BiosAnalyserDetail from './pages/BiosAnalyserDetail';
import DataAnalyserDetail from './pages/DebuggerDetails';


import TicketManagement from './pages/TicketManagement';
import TicketManagementDetails from './pages/TicketManagementDetails';
import SDLCAutomation from './pages/SDLCAutomation';
import UserStories from './pages/UserStories';
import UserStoriesDetails from './pages/UserStoriesDetails';

// Testing components
import WorkflowPipeline from './components/pipeline/WorkflowPipeline';

import AIWorkflowBuilder from './components/AIWorkflowBuilder';

import NemoLLM from './pages/NemoLLM';
import DeploymentDetails from './pages/DeploymentDetails';
import ModelDetails from './components/ModelDetails';

// agentic ai
import AgenticFramework from './components/agentic ai/AgenticFramework';

// custom ai
import N8nWorkflowDashboard from './components/custom ai agents/N8nWorkflowDashboard'

import SourceCodeReview from './pages/SourceCodeReview';



import CoriDetails from './pages/CoriDetails';
import TestScenarioDetails from './pages/TestScenarioDetails';

import OpenAI from './pages/Cloud AI/OpenAI';
import Bedrock from './pages/Cloud AI/Bedrock';
import CustomAgents from './pages/CustomAgents';
import AgentProjectDetails from './components/custom ai agents/AgentProjectDetails';
import AgentInfoForm from './components/custom ai agents/AgentInfoForm';
import Compilation from './pages/Compilation';
import ComingSoonPage from './components/cloud ai/ComingSoonPage';

import CosmosComponent from './pages/CosmosComponent';
import CosmosLanding from './pages/CosmosLanding';

import RequirementGathering from './pages/RequirementGathering';
import RequirementGatheringDetails from './pages/RequirementGatheringDetails';
import ProjectManager from './pages/ProjectManager';
import ProjectManagerDetails from './pages/ProjectManagerDetails';
import DevelopmentAutomation from './pages/DevelopmentAutomation';
import DevelopmentAutomationDetails from './pages/DevelopmentAutomationDetails';
import TestAutomation from './pages/TestAutomation';
import TestAutomationDetails from './pages/TestAutomationDetails';

import ModelRepositoryView from './pages/ModelRepositoryView';
import ReviewAgent from './pages/ReviewAgent';
import ServerStatus from './pages/ServerStatus';


import { useProject } from './context/ProjectContext';
 import { useNavigate, Navigate } from 'react-router-dom';


function App() {

const {selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();


  return (
    <ServerStatus>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
{/* 
        <Route 
            path="current-project" 
            element={selectedProjectId ? <Navigate to={`/dashboard/project/${selectedProjectId}`} /> : <Navigate to="/dashboard/studio/training" />} 
          />
          <Route 
            path="current-project/playground" 
            element={selectedProjectId ? <Navigate to={`/dashboard/project/${selectedProjectId}/playground`} /> : <Navigate to="/dashboard/studio/playground" />} 
          />
          <Route 
            path="current-project/pipeline" 
            element={selectedProjectId ? <Navigate to={`/dashboard/project/${selectedProjectId}/pipeline`} /> : <Navigate to="/dashboard/studio/pipeline" />} 
          />
          <Route 
            path="current-project/evaluation" 
            element={selectedProjectId ? <Navigate to={`/dashboard/project/${selectedProjectId}/evaluation`} /> : <Navigate to="/dashboard/studio/evaluation" />} 
          />
           <Route 
            path="current-project/deployment" 
            element={selectedProjectId ? <Navigate to={`/dashboard/project/${selectedProjectId}/deployment`} /> : <Navigate to="/dashboard/studio/deployment" />} 
          /> */}



        <Route path="use-cases" element={<UseCases />} />
        <Route path="studio/deployment" element={<Deployment />} />
        <Route path="studio/deployment/cloud" element={<CloudDeployment />} />
        <Route path="studio/pipeline" element={<Pipeline />} />
        <Route path="studio/playground" element={<Playground />} />
        <Route path="studio/evaluation" element={<Evaluation />} />
        <Route path="/dashboard/foundation-models" element={<FoundationModels />} />
        <Route path="studio/training" element={<Training />} />
        <Route path="studio/compilation" element={<Compilation/>} />
        <Route path="project/:id" element={<ProjectDetails />} />
        <Route path="/dashboard/job/:id" element={<JobDashboard />} />
        <Route path="studio/scratch-training" element={<ScratchTraining />} />
        <Route path="studio/rag" element={<RAG />} />
        <Route path="studio/prompt" element={<Prompt />} />
        {/* <Route path="raise-query" element={<RaiseQuery />} /> */}
      
  <Route path="/dashboard/queries" element={<RaiseQuery />} />
  <Route path="/dashboard/queries/:queryId" element={<QueryDetail />} />
  {/* Other routes */}

        <Route path="model-repositories" element={<ModelRepositories />} />
        <Route path="dataset-repositories" element={<DatasetRepositories />} />
        <Route path="/dashboard/projects" element={<ProjectPage />} />
        <Route path="/dashboard/settings/profile" element={<Profile />} />
        <Route path="/dashboard/settings/access-token" element={<AccessToken />} />
        <Route path="project/:id/playground" element={<ModelPlayground />} />
        <Route path="project/:id/evaluation" element={<EvalProjectJobDetails />} />
        <Route path="project/:id/pipeline" element={<PipelineProjectJobDetails />} />
        <Route path="job/:id/evaluation_report" element={<EvaluationModel />} />
        <Route path='/dashboard/foundation-models/:id' element={<FoundationModelPlayground/>}/>

        <Route path="model-repository/:id" element={<ModelRepositoryView />} />

        <Route path="use-cases/conversational" element={<ConversationalDetails />} />
        <Route path="use-cases/debugger" element={<SoftwareDebugger />} />
        <Route path="use-cases/debugger/details" element={<DebuggerDetails />} />
        <Route path="/dashboard/use-cases/software-debugger" element={<SoftwareDebuggerDetail />} />
        <Route path="use-cases/Bios-Analyser/details" element={<BiosAnalyserDetail />} />
        <Route path="use-cases/Data-Analyser/details" element={<DataAnalyserDetail />} />
        <Route path="use-cases/sdlc-automation" element={<SDLCAutomation />} />
        <Route path="use-cases/sdlc-automation" element={<SDLCAutomation />} />
        <Route path="use-cases/user-stories" element={<UserStories />} />
        <Route path="use-cases/user-stories/details" element={<UserStoriesDetails />} />
        <Route path="use-cases/automation" element={<Automation />} />
        <Route path="use-cases/automation/details" element={<AutomationDetails />} />
        <Route path="use-cases/test-generation" element={<TestGeneration />} />
        <Route path="use-cases/test-generation/details" element={<TestGenerationDetails />} />
        <Route path="use-cases/device-test" element={<DeviceTest />} />
        <Route path="use-cases/device-test/details" element={<DeviceTestDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="use-cases/ticket-management" element={<TicketManagement />} />
        <Route path="use-cases/ticket-management/details" element={<TicketManagementDetails />} />

        <Route path="use-cases/requirement-gathering" element={<RequirementGathering />} />
        <Route path="use-cases/requirement-gathering/details" element={<RequirementGatheringDetails />} />
        <Route path="use-cases/project-manager" element={<ProjectManager />} />
        <Route path="use-cases/project-manager/details" element={<ProjectManagerDetails />} />
        <Route path="use-cases/test-automation" element={<TestAutomation />} />
        <Route path="use-cases/test-automation/details" element={<TestAutomationDetails />} />
        <Route path="use-cases/development-automation" element={<DevelopmentAutomation />} />
        <Route path="use-cases/development-automation/details" element={<DevelopmentAutomationDetails />} />

        {/* /dashboard/agentic-ai/agentic-framework */}
        <Route path="/dashboard/agentic-framework" element={<AgenticFramework/>} />
        <Route path="/dashboard/agentic-ai/review-agent" element={<ReviewAgent />} />


        {/* testing routes */}
        <Route path="test" element={<WorkflowPipeline />} />
        <Route path="ai-agent" element={<AIWorkflowBuilder/>} />
        {/* <Route path="studio/ai-tool-creation" element={<AIWorkflowBuilder/>} /> */}
        <Route path="studio/agents" element={<CustomAgents/>} />
      
        <Route path="cloud/open-ai" element={<OpenAI/>} />
      
        <Route path="cloud/:provider" element={<ComingSoonPage />} />
        {/* <Route path="cloud/bedrock" element={<ComingSoonPage />} />
    <Route path="cloud/nemo-llm" element={<ComingSoonPage />} />
    <Route path="cloud/google-vertex" element={<ComingSoonPage />} /> */}

        <Route path="/dashboard/project/:id/deployment" element={<DeploymentDetails />} />
        <Route path="/dashboard/foundation-models/:modelId" element={<ModelDetails />} />

        <Route path="use-cases/source-code-review" element={<SourceCodeReview />} />
        <Route path="use-cases/test-generation/scenario-details" element={<TestScenarioDetails />} />
        <Route path="use-cases/test-generation/cori-details" element={<CoriDetails />} />
      
        {/* <Route path="/dashboard/agenttest" element={<N8nWorkflowDashboard/>} /> */}

        {/* <Route path="/dashboard/agent-project/:id" element={<AgentProjectDetails/>} /> */}

        <Route path="/dashboard/agent-projects" element={<AgentProjectDetails />} />
  <Route path="/dashboard/agent-project/:id/flow" element={<N8nWorkflowDashboard />} />
  <Route path="/dashboard/agent-project/:id/flow/agent/:agentId" element={<AgentInfoForm />} />
  <Route path="physical-ai/cosmos" element={<CosmosLanding/>} />
<Route path="physical-ai/cosmos/autoregressive" element={<CosmosComponent modelType="autoregressive" />} />
 <Route path="physical-ai/cosmos/diffusion" element={<CosmosComponent modelType="diffusion" />} />

        

      </Route>
    </Routes>
    </ServerStatus>
  );
}

export default App;