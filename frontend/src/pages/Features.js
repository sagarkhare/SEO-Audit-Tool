import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Zap, 
  Target, 
  Image, 
  BarChart3, 
  Shield, 
  Globe,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Performance Analysis',
      description: 'Comprehensive performance metrics using Google Lighthouse API',
      details: [
        'Core Web Vitals analysis',
        'Loading speed optimization',
        'Performance scoring',
        'Mobile performance testing'
      ]
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Meta Tags Optimization',
      description: 'Complete meta tags analysis and optimization recommendations',
      details: [
        'Title tag optimization',
        'Meta description analysis',
        'Open Graph tags review',
        'Structured data validation'
      ]
    },
    {
      icon: <Image className="h-8 w-8" />,
      title: 'Image Analysis',
      description: 'Image optimization and SEO analysis',
      details: [
        'Alt text analysis',
        'Image format recommendations',
        'Compression suggestions',
        'Lazy loading detection'
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Detailed Reports',
      description: 'Professional reports with actionable insights',
      details: [
        'PDF and CSV export',
        'Historical tracking',
        'Competitor analysis',
        'Custom recommendations'
      ]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Security & Privacy',
      description: 'Enterprise-grade security and privacy protection',
      details: [
        'Data encryption',
        'Privacy compliance',
        'Secure data handling',
        'Regular security audits'
      ]
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Global Testing',
      description: 'Test from multiple locations worldwide',
      details: [
        'Multi-location testing',
        'Device compatibility',
        'Network condition simulation',
        'Regional performance insights'
      ]
    }
  ];

  const benefits = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Fast Results',
      description: 'Get comprehensive SEO analysis in under 60 seconds'
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Actionable Insights',
      description: 'Clear, implementable recommendations for improvement'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Proven Results',
      description: 'Average 85% improvement in SEO scores'
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: 'Priority Issues',
      description: 'Focus on the most critical SEO problems first'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Powerful SEO Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to analyze, optimize, and improve your website's SEO performance
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-muted-foreground">
                Built for professionals who need reliable, actionable SEO insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
