import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import RadialProgressChart from './RadialProgressChart';
import PerformanceMetrics from './PerformanceMetrics';
import DetailedIssues from './DetailedIssues';
import { 
  Zap, 
  Shield, 
  Target, 
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Smartphone,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const LighthouseReport = ({ audit }) => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e'; // green-500
    if (score >= 50) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'desktop':
      default:
        return <Monitor className="w-5 h-5 text-blue-500" />;
    }
  };

  // Lighthouse categories data
  const categories = [
    {
      name: 'Performance',
      score: audit?.performance?.score || 0,
      icon: <Zap className="w-6 h-6" />,
      color: getScoreColor(audit?.performance?.score || 0),
      description: 'How fast your page loads and responds to user interaction',
      bestRange: '90-100',
      targetRange: '50-89',
      needsImprovement: '0-49'
    },
    {
      name: 'Accessibility',
      score: audit?.accessibility?.score || 0,
      icon: <Shield className="w-6 h-6" />,
      color: getScoreColor(audit?.accessibility?.score || 0),
      description: 'How accessible your page is to all users',
      bestRange: '90-100',
      targetRange: '50-89',
      needsImprovement: '0-49'
    },
    {
      name: 'Best Practices',
      score: audit?.bestPractices?.score || 0,
      icon: <Target className="w-6 h-6" />,
      color: getScoreColor(audit?.bestPractices?.score || 0),
      description: 'How well your page follows web development best practices',
      bestRange: '90-100',
      targetRange: '50-89',
      needsImprovement: '0-49'
    },
    {
      name: 'SEO',
      score: audit?.seo?.score || 0,
      icon: <Search className="w-6 h-6" />,
      color: getScoreColor(audit?.seo?.score || 0),
      description: 'How well your page is optimized for search engines',
      bestRange: '90-100',
      targetRange: '50-89',
      needsImprovement: '0-49'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Lighthouse Report</h2>
        <div className="flex items-center justify-center space-x-4 text-muted-foreground">
          <div className="flex items-center space-x-2">
            {getDeviceIcon(audit?.deviceType)}
            <span className="capitalize">{audit?.deviceType || 'desktop'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{new Date(audit?.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <Card className="sticky top-4 z-10 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => scrollToSection('performance-details')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Performance</span>
            </button>
            <button
              onClick={() => scrollToSection('accessibility-details')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Accessibility</span>
            </button>
            <button
              onClick={() => scrollToSection('best-practices-details')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>Best Practices</span>
            </button>
            <button
              onClick={() => scrollToSection('seo-details')}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>SEO</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Overall Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <RadialProgressChart
              score={audit?.overallScore || 0}
              size={150}
              strokeWidth={12}
              color="auto"
              showScore={true}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              {getScoreLabel(audit?.overallScore || 0)}
            </p>
            <p className="text-muted-foreground">
              Your website's overall performance score
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lighthouse Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6">
              <div className="flex justify-center mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <div style={{ color: category.color }}>
                    {category.icon}
                  </div>
                </div>
              </div>
              
              <h3 className="font-semibold mb-2">{category.name}</h3>
              
              <div className="flex justify-center mb-4">
                <RadialProgressChart
                  score={category.score}
                  size={80}
                  strokeWidth={6}
                  color={category.color}
                  showScore={true}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ color: category.color }}
                  >
                    {getScoreLabel(category.score)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {category.description}
                </p>
                
                {/* Score Ranges */}
                <div className="space-y-1 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 font-medium">Good:</span>
                    <span className="text-green-600">{category.bestRange}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-600 font-medium">Needs Improvement:</span>
                    <span className="text-yellow-600">{category.targetRange}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-medium">Poor:</span>
                    <span className="text-red-600">{category.needsImprovement}</span>
                  </div>
                </div>
                
                {/* Navigation Link */}
                <button
                  onClick={() => scrollToSection(`${category.name.toLowerCase()}-details`)}
                  className="w-full flex items-center justify-center space-x-2 text-xs text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Performance Metrics */}
      {audit?.performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceMetrics metrics={audit.performance} />
          </CardContent>
        </Card>
      )}

      {/* Accessibility Details */}
      {audit?.accessibility && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Accessibility Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audit.accessibility.issues?.map((issue, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Details */}
      {audit?.seo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              SEO Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Meta Tags</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Title Tag</span>
                    <div className="flex items-center space-x-2">
                      {audit.seo.titleTag?.present ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {audit.seo.titleTag?.length || 0} chars
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Meta Description</span>
                    <div className="flex items-center space-x-2">
                      {audit.seo.metaDescription?.present ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {audit.seo.metaDescription?.length || 0} chars
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Technical SEO</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HTTPS</span>
                    {audit.seo.https ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mobile Friendly</span>
                    {audit.seo.mobileFriendly ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Issues Analysis */}
      <DetailedIssues audit={audit} />

      {/* Back to Top Button */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-90" />
          <span>Back to Top</span>
        </button>
      </div>
    </div>
  );
};

export default LighthouseReport;
