import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Monitor,
  Smartphone
} from 'lucide-react';
import { auditAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LighthouseReport from '../components/charts/LighthouseReport';
import toast from 'react-hot-toast';

const AuditReport = () => {
  const [audit, setAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  const url = location.state?.url;

  useEffect(() => {
    if (url) {
      startAudit(url);
    } else {
      navigate('/dashboard');
    }
  }, [url, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const startAudit = async (auditUrl) => {
    setIsLoading(true);
    try {
      // First, check if there's already an audit for this URL
      const existingAudits = await auditAPI.getAudits({ limit: 50 });
      const existingAudit = existingAudits.data.audits.find(audit => audit.url === auditUrl);
      
      if (existingAudit) {
        // Use existing audit
        setAudit(existingAudit);
        
        // If it's still processing, poll for completion
        if (existingAudit.status === 'processing') {
          pollForCompletion(existingAudit._id);
        }
      } else {
        // Create new audit with default device type
        const response = await auditAPI.createAudit({ url: auditUrl, deviceType: 'desktop' });
        setAudit(response.data.audit);
        
        // Poll for completion
        if (response.data.audit.status === 'processing') {
          pollForCompletion(response.data.audit._id);
        }
      }
    } catch (error) {
      console.error('Failed to start audit:', error);
      toast.error(error.response?.data?.message || 'Failed to start audit');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const pollForCompletion = async (auditId) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await auditAPI.getAuditById(auditId);
        const updatedAudit = response.data.audit;
        setAudit(updatedAudit);
        
        if (updatedAudit.status === 'completed' || updatedAudit.status === 'failed') {
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Failed to poll audit status:', error);
      }
    };
    
    setTimeout(poll, 5000); // Start polling after 5 seconds
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'processing':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-6 h-6 text-blue-500" />;
      case 'desktop':
      default:
        return <Monitor className="w-6 h-6 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <LoadingSpinner text="Analyzing your website..." />
            <p className="text-muted-foreground mt-4">
              This may take a few minutes. We're analyzing your website's performance, meta tags, and images.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Audit Failed</h2>
            <p className="text-muted-foreground mb-4">
              We encountered an error while analyzing your website. Please try again.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Full SEO Audit Report
          </h1>
          <p className="text-muted-foreground text-lg">
            {audit.url}
          </p>
        </div>

        {/* Status and Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-muted">
                    {getStatusIcon(audit.status)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <p className="text-muted-foreground capitalize">
                  {audit.status}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center mx-auto ${getScoreBgColor(audit.overallScore)}`}>
                    <CheckCircle className={`w-5 h-5 ${getScoreColor(audit.overallScore)} mb-1`} />
                    <span className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}>
                      {audit.overallScore}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-3">Overall Score</h3>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${audit.overallScore >= 80 ? 'bg-green-500' : audit.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${audit.overallScore}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {audit.overallScore >= 80 ? 'Excellent' : audit.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-muted">
                    {getDeviceIcon(audit.deviceType || 'desktop')}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Device Type</h3>
                <p className="text-muted-foreground capitalize mb-2">
                  {audit.deviceType || 'desktop'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Analyzed on {new Date(audit.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processing State */}
        {audit.status === 'processing' && (
          <Card className="mb-8">
            <CardContent className="p-12 text-center">
              <LoadingSpinner text="Analyzing Your Website" />
              <p className="text-muted-foreground mt-4">
                This may take a few minutes. We'll analyze your website's performance, 
                meta tags, and images to provide comprehensive SEO insights.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lighthouse Report */}
        {audit.status === 'completed' && (
          <LighthouseReport audit={audit} />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {audit.status === 'completed' && (
            <Button size="lg">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditReport;
