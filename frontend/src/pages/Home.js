import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { 
  Search, 
  Zap, 
  Target, 
  Image, 
  BarChart3, 
  Shield, 
  Globe,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  X,
  Download,
  History,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Performance Analysis',
      description: 'Get detailed insights into your website\'s loading speed, Core Web Vitals, and performance metrics using Google Lighthouse.'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Meta Tags Optimization',
      description: 'Analyze your title tags, meta descriptions, Open Graph tags, and structured data for better SEO performance.'
    },
    {
      icon: <Image className="h-6 w-6" />,
      title: 'Image Analysis',
      description: 'Check image optimization, alt text, format recommendations, and lazy loading implementation.'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Detailed Reports',
      description: 'Get comprehensive reports with actionable recommendations to improve your website\'s SEO.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Security & Privacy',
      description: 'Your data is secure with enterprise-grade encryption and privacy protection.'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Global Testing',
      description: 'Test your website performance from multiple locations and devices worldwide.'
    }
  ];

  const benefits = [
    'Comprehensive SEO analysis in minutes',
    'Actionable recommendations for improvement',
    'Professional reports for stakeholders',
    'Regular monitoring and alerts',
    'No technical knowledge required'
  ];

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
      toast.error('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Navigate to free audit results page with URL
      navigate('/free-audit', { state: { url } });
    } catch (error) {
      toast.error('Failed to start audit');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { label: 'Websites Analyzed', value: '10,000+' },
    { label: 'Happy Customers', value: '5,000+' },
    { label: 'Average Score Improvement', value: '85%' }
  ];

  const comparisonFeatures = [
    {
      feature: 'SEO Analysis',
      free: { available: true, description: 'Basic analysis' },
      signup: { available: true, description: 'Comprehensive analysis' }
    },
    {
      feature: 'Performance Metrics',
      free: { available: true, description: 'Core Web Vitals' },
      signup: { available: true, description: 'Detailed performance insights' }
    },
    {
      feature: 'Meta Tags Analysis',
      free: { available: true, description: 'Basic meta tags check' },
      signup: { available: true, description: 'Advanced meta optimization' }
    },
    {
      feature: 'Image Analysis',
      free: { available: true, description: 'Basic image check' },
      signup: { available: true, description: 'Detailed image optimization' }
    },
    {
      feature: 'Audit History',
      free: { available: false, description: 'No history saved' },
      signup: { available: true, description: 'Unlimited audit history' }
    },
    {
      feature: 'Export Reports',
      free: { available: false, description: 'No export options' },
      signup: { available: true, description: 'PDF & CSV export' }
    },
    {
      feature: 'Monthly Audits',
      free: { available: true, description: 'Unlimited free audits' },
      signup: { available: true, description: '10-500+ per month' }
    },
    {
      feature: 'Priority Support',
      free: { available: false, description: 'Community support' },
      signup: { available: true, description: 'Email & chat support' }
    },
    {
      feature: 'Scheduled Audits',
      free: { available: false, description: 'Manual audits only' },
      signup: { available: true, description: 'Automated monitoring' }
    },
    {
      feature: 'Team Collaboration',
      free: { available: false, description: 'Single user' },
      signup: { available: true, description: 'Team sharing & collaboration' }
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                Professional
                <span className="text-primary block">SEO Audit</span>
                Made Simple
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Analyze your website's performance, meta tags, and images with our comprehensive SEO audit tool. 
                Get actionable insights to boost your search rankings.
              </p>
            </div>

            {/* Search Form */}
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input 
                      type="url" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Enter your website URL (e.g., https://example.com)"
                      className="h-12 text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <Button size="lg" className="h-12 px-8" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Analyze Now
                      </>
                    )}
                  </Button>
                </form>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Free analysis • No registration required • Results in seconds
                </p>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything You Need for SEO Success
            </h2>
            <p className="text-xl text-muted-foreground">
              Our comprehensive audit tool analyzes every aspect of your website's SEO performance
            </p>
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Star className="h-4 w-4 mr-2" />
              Try our free audit above to see these features in action
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Why Choose Our SEO Audit Tool?
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Join thousands of website owners who trust our tool to improve their SEO performance
                  </p>
                </div>

                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link to="/register">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/features">Learn More</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Star className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">4.9/5 Rating</div>
                        <div className="text-sm text-muted-foreground">Based on 1,000+ reviews</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">5,000+ Users</div>
                        <div className="text-sm text-muted-foreground">Trust our platform daily</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">85% Improvement</div>
                        <div className="text-sm text-muted-foreground">Average score increase</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Free vs. Sign Up Comparison
            </h2>
            <p className="text-xl text-muted-foreground">
              See what you get with a free account vs. our full features
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-lg shadow-lg">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-6 font-semibold text-foreground">Features</th>
                    <th className="text-center p-6 font-semibold text-foreground">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">Free Audit</span>
                        <span className="text-sm text-muted-foreground">No signup required</span>
                      </div>
                    </th>
                    <th className="text-center p-6 font-semibold text-primary">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">Sign Up</span>
                        <span className="text-sm text-muted-foreground">Full features</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="p-6 font-medium text-foreground">
                        {item.feature}
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          {item.free.available ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {item.free.description}
                          </span>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          {item.signup.available ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {item.signup.description}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">
                  <Users className="h-4 w-4 mr-2" />
                  Sign Up Free
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link to="/pricing">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Plans
                </Link>
              </Button>
            </div>

            {/* Additional Benefits */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <History className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Audit History</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your SEO progress over time with detailed audit history
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Download className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Export Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Download professional PDF and CSV reports for stakeholders
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-6">
                  <Settings className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Advanced Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Scheduled audits, team collaboration, and priority support
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Improve Your SEO?
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Start your free SEO audit today and discover how to boost your website's search rankings
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;