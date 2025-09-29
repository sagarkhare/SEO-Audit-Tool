import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auditAPI } from '../services/api';
import { FiArrowLeft, FiDownload, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiClock, FiMonitor, FiSmartphone } from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Audit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAudit();
  }, [id]);

  const loadAudit = async () => {
    try {
      const response = await auditAPI.getAuditById(id);
      setAudit(response.data.audit);
    } catch (error) {
      console.error('Failed to load audit:', error);
      toast.error('Failed to load audit details');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAudit = async () => {
    setIsRefreshing(true);
    try {
      await loadAudit();
      toast.success('Audit refreshed');
    } catch (error) {
      toast.error('Failed to refresh audit');
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await auditAPI.exportAuditReport(id, format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="w-6 h-6 text-green-500" />;
      case 'processing':
        return <FiClock className="w-6 h-6 text-blue-500" />;
      case 'failed':
        return <FiAlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <FiClock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <FiSmartphone className="w-6 h-6 text-blue-500" />;
      case 'desktop':
      default:
        return <FiMonitor className="w-6 h-6 text-blue-500" />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading audit details..." />;
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Audit Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The audit you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                SEO Audit Report
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {audit.url}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {audit.status === 'completed' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => exportReport('pdf')}
                  className="btn btn-outline"
                >
                  <FiDownload className="mr-2" />
                  PDF
                </button>
                <button
                  onClick={() => exportReport('csv')}
                  className="btn btn-outline"
                >
                  <FiDownload className="mr-2" />
                  CSV
                </button>
              </div>
            )}
            <button
              onClick={refreshAudit}
              disabled={isRefreshing}
              className="btn btn-outline"
            >
              <FiRefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status and Overall Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-gray-100 dark:bg-gray-800">
                  {getStatusIcon(audit.status)}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Status
              </h3>
              <p className="text-gray-600 dark:text-gray-400 capitalize">
                {audit.status}
              </p>
              {audit.processingTime && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Processed in {Math.round(audit.processingTime / 1000)}s
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center mx-auto ${getScoreBgColor(audit.overallScore)}`}>
                  <FiCheckCircle className={`w-5 h-5 ${getScoreColor(audit.overallScore)} mb-1`} />
                  <span className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}>
                    {audit.overallScore}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Overall Score
              </h3>
              <div className="progress">
                <div 
                  className={`progress-bar ${audit.overallScore >= 80 ? 'excellent' : audit.overallScore >= 60 ? 'good' : audit.overallScore >= 40 ? 'average' : 'poor'}`}
                  style={{ width: `${audit.overallScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {audit.overallScore >= 80 ? 'Excellent' : audit.overallScore >= 60 ? 'Good' : audit.overallScore >= 40 ? 'Average' : 'Needs Improvement'}
              </p>
            </div>
          </div>

                 <div className="card">
                   <div className="text-center">
                     <div className="flex items-center justify-center mb-4">
                       <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-gray-100 dark:bg-gray-800">
                         {getDeviceIcon(audit.deviceType || 'desktop')}
                       </div>
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                       Device Type
                     </h3>
                     <p className="text-gray-600 dark:text-gray-400 capitalize mb-2">
                       {audit.deviceType || 'desktop'}
                     </p>
                     <p className="text-sm text-gray-500 dark:text-gray-500">
                       Analyzed on {new Date(audit.createdAt).toLocaleDateString()}
                     </p>
                   </div>
                 </div>
        </div>

        {/* Detailed Results */}
        {audit.status === 'completed' && (
          <div className="space-y-8">
            {/* Performance Metrics */}
            {audit.performance && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Performance Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getScoreBgColor(audit.performance.score)}`}>
                      <span className={`text-xl font-bold ${getScoreColor(audit.performance.score)}`}>
                        {audit.performance.score}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Performance Score
                    </h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.performance.firstContentfulPaint}ms
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      First Contentful Paint
                    </h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.performance.largestContentfulPaint}ms
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Largest Contentful Paint
                    </h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.performance.cumulativeLayoutShift}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Cumulative Layout Shift
                    </h4>
                  </div>
                </div>
              </div>
            )}

            {/* Meta Tags Analysis */}
            {audit.metaTags && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Meta Tags Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Title Tag
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Present: {audit.metaTags.title?.present ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Length: {audit.metaTags.title?.length || 0} characters
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Score: {audit.metaTags.title?.score || 0}/100
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Meta Description
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Present: {audit.metaTags.description?.present ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Length: {audit.metaTags.description?.length || 0} characters
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Score: {audit.metaTags.description?.score || 0}/100
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image Analysis */}
            {audit.images && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Image Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.images.totalImages}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Total Images
                    </h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.images.imagesWithAlt}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      With Alt Text
                    </h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.images.webpImages}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      WebP Format
                    </h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {audit.images.lazyLoadedImages}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Lazy Loaded
                    </h4>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {audit.recommendations && audit.recommendations.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Recommendations
                </h3>
                <div className="space-y-4">
                  {audit.recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rec.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {rec.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Impact: {rec.impact} • Effort: {rec.effort}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {audit.status === 'processing' && (
          <div className="card text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analyzing Your Website
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This may take a few minutes. We'll analyze your website's performance, 
              meta tags, and images to provide comprehensive SEO insights.
            </p>
          </div>
        )}

        {/* Failed State */}
        {audit.status === 'failed' && (
          <div className="card text-center py-12">
            <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Audit Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We encountered an error while analyzing your website. This could be due to 
              network issues or the website being temporarily unavailable.
            </p>
            <button
              onClick={refreshAudit}
              className="btn btn-primary"
            >
              <FiRefreshCw className="mr-2" />
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Audit;
