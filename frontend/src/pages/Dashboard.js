import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auditAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { FiPlus, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [deviceType, setDeviceType] = useState('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [audits, setAudits] = useState([]);
  const [stats, setStats] = useState({
    totalAudits: 0,
    avgScore: 0,
    bestScore: 0,
    monthlyAudits: 0
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from registration with a URL
  useEffect(() => {
    const urlFromState = location.state?.url;
    if (urlFromState) {
      setUrl(urlFromState);
    }
  }, [location.state]);

  // Load user's audits
  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const response = await auditAPI.getAudits({ limit: 10 });
      setAudits(response.data.audits);
      
      // Calculate stats
      const completedAudits = response.data.audits.filter(audit => audit.status === 'completed');
      const scores = completedAudits.map(audit => audit.overallScore).filter(score => score > 0);
      
      // Calculate monthly audits (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyAudits = response.data.audits.filter(audit => {
        const auditDate = new Date(audit.createdAt);
        return auditDate.getMonth() === currentMonth && auditDate.getFullYear() === currentYear;
      }).length;
      
      setStats({
        totalAudits: response.data.total || 0,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        monthlyAudits: monthlyAudits
      });
    } catch (error) {
      console.error('Failed to load audits:', error);
    }
  };

  const handleAudit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    
    try {
      await auditAPI.createAudit({ url, deviceType });
      toast.success('Audit started successfully!');
      navigate('/audit-report', { state: { url } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start audit');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <FiClock className="w-5 h-5 text-blue-500" />;
      case 'failed':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getUsagePercentage = () => {
    const limits = {
      free: 10,
      basic: 100,
      premium: 500,
      enterprise: -1
    };
    
    const limit = limits[user?.subscription?.type] || limits.free;
    if (limit === -1) return 0; // Unlimited
    
    return Math.round((stats.monthlyAudits / limit) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your website's SEO performance and get actionable recommendations.
          </p>
        </div>

        {/* Quick Audit Form */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Start New Audit
          </h2>
          <form onSubmit={handleAudit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="px-6 py-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiPlus className="h-4 w-4 mr-2" />
                    Start Audit
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FiTrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Audits</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAudits}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgScore}/100</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FiTrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Best Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bestScore}/100</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FiClock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.monthlyAudits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Progress */}
        {user?.subscription?.type !== 'enterprise' && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monthly Usage
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.monthlyAudits} / {user?.subscription?.type === 'free' ? 10 : user?.subscription?.type === 'basic' ? 100 : 500}
              </span>
            </div>
            <div className="progress">
              <div 
                className={`progress-bar ${getUsagePercentage() > 80 ? 'poor' : getUsagePercentage() > 60 ? 'average' : 'good'}`}
                style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {user?.subscription?.type === 'free' && (
                <Link to="/pricing" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Upgrade to get more audits
                </Link>
              )}
            </p>
          </div>
        )}

        {/* Recent Audits */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Audits
            </h3>
            <Link 
              to="/history" 
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {audits.length === 0 ? (
            <div className="text-center py-8">
              <FiTrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No audits yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start your first SEO audit to see your website's performance
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {audits.map((audit) => (
                <div key={audit._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(audit.status)}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {audit.domain}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {audit.status === 'completed' && (
                      <div className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}>
                        {audit.overallScore}
                      </div>
                    )}
                    <Link
                      to={`/audit/${audit._id}`}
                      className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                    >
                      <FiExternalLink className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
