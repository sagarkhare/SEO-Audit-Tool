import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Search, 
  Zap, 
  Target, 
  Image, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Star,
  Download,
  TrendingUp,
  X
} from 'lucide-react';
import { auditAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const FreeAuditResults = () => {
  const [audit, setAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const url = location.state?.url;

  useEffect(() => {
    if (url) {
      startAudit();
    } else {
      navigate('/');
    }
  }, [url, navigate]);

  const startAudit = async () => {
    setIsLoading(true);
    try {
      const response = await auditAPI.createAnonymousAudit({ url });
      setAudit(response.data.audit);
      
      // Poll for completion
      if (response.data.audit.status === 'processing') {
        pollForCompletion(response.data.audit._id);
      }
    } catch (error) {
      console.error('Failed to start audit:', error);
      toast.error(error.response?.data?.message || 'Failed to start audit');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const pollForCompletion = async (auditId) => {
    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await auditAPI.getAnonymousAuditById(auditId);
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
            <Button onClick={() => navigate('/')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Try Another URL
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
            SEO Audit Results
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Device Type</h3>
              </div>
              <p className="text-muted-foreground capitalize">
                {audit.deviceType}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Analyzed on {new Date(audit.createdAt).toLocaleDateString()}
              </p>
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

        {/* Results */}
        {audit.status === 'completed' && (
          <div className="space-y-8">
            {/* Blurred Premium Content */}
            <div className="relative">
              {/* Performance Metrics */}
              {audit.performance && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${getScoreBgColor(audit.performance.score)}`}>
                          <span className={`text-xl font-bold ${getScoreColor(audit.performance.score)}`}>
                            {audit.performance.score}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">Performance Score</h4>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.performance.firstContentfulPaint}ms
                        </div>
                        <h4 className="font-medium mb-1">First Contentful Paint</h4>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.performance.largestContentfulPaint}ms
                        </div>
                        <h4 className="font-medium mb-1">Largest Contentful Paint</h4>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.performance.cumulativeLayoutShift}
                        </div>
                        <h4 className="font-medium mb-1">Cumulative Layout Shift</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meta Tags Analysis */}
              {audit.metaTags && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Meta Tags Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Title Tag</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Present: {audit.metaTags.title?.present ? 'Yes' : 'No'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Length: {audit.metaTags.title?.length || 0} characters
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Score: {audit.metaTags.title?.score || 0}/100
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Meta Description</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Present: {audit.metaTags.description?.present ? 'Yes' : 'No'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Length: {audit.metaTags.description?.length || 0} characters
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Score: {audit.metaTags.description?.score || 0}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Image Analysis */}
              {audit.images && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Image className="h-5 w-5 mr-2" />
                      Image Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.images.totalImages}
                        </div>
                        <h4 className="font-medium mb-1">Total Images</h4>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.images.imagesWithAlt}
                        </div>
                        <h4 className="font-medium mb-1">With Alt Text</h4>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.images.webpImages}
                        </div>
                        <h4 className="font-medium mb-1">WebP Format</h4>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">
                          {audit.images.lazyLoadedImages}
                        </div>
                        <h4 className="font-medium mb-1">Lazy Loaded</h4>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Basic Recommendations */}
              {audit.recommendations && audit.recommendations.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Key Recommendations
                    </CardTitle>
                    <CardDescription>
                      Here are the most important improvements for your website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {audit.recommendations.slice(0, 3).map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">
                              {rec.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-2">
                            {rec.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Impact: {rec.impact} • Effort: {rec.effort}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blur Overlay */}
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Unlock Detailed Report</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Sign up for free to see detailed performance metrics, meta tag analysis, image optimization insights, and personalized recommendations.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => {
                      // Store the current URL in localStorage to redirect back after login
                      localStorage.setItem('auditRedirectUrl', audit.url);
                      navigate('/login');
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Sign Up to View Full Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Comparison */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">Free vs. Sign Up Features</CardTitle>
            <CardDescription className="text-center">
              See what you're missing with a free account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-muted-foreground">Free Audit</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Basic SEO analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Performance metrics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Meta tags analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No audit history</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <X className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No export options</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Sign Up Benefits</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">All free features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Unlimited audit history</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PDF & CSV export</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Scheduled audits</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Prompt */}
        <Card className="mt-8 bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <Star className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">
                Want More Detailed Insights?
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Get comprehensive reports, unlimited audits, export options, and priority support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/register">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Sign Up for Free
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent" asChild>
                  <Link to="/pricing">
                    <Download className="h-4 w-4 mr-2" />
                    View Pricing
                  </Link>
                </Button>
              </div>
              <p className="text-sm mt-4 opacity-75">
                Free account includes 10 audits per month • No credit card required
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Try Another URL */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Search className="h-4 w-4 mr-2" />
            Analyze Another Website
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FreeAuditResults;
