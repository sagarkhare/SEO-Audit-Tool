import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  AlertTriangle, 
  Info, 
  Image as ImageIcon,
  FileText,
  Search,
  Zap
} from 'lucide-react';

const DetailedIssues = ({ audit }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Performance Issues
  const performanceIssues = [
    {
      id: 'lcp-issue',
      title: 'Largest Contentful Paint (LCP) Issues',
      severity: audit?.performance?.lcp > 2500 ? 'high' : audit?.performance?.lcp > 4000 ? 'medium' : 'low',
      issues: [
        {
          title: 'Large images without optimization',
          description: 'Images are not compressed or optimized for web delivery',
          impact: 'High impact on LCP',
          solution: 'Compress images and use modern formats like WebP',
          affectedElements: audit?.performance?.largeImages || ['hero-image.jpg', 'banner.png']
        },
        {
          title: 'Render-blocking resources',
          description: 'CSS and JavaScript files are blocking the initial render',
          impact: 'Medium impact on LCP',
          solution: 'Defer non-critical CSS and JavaScript',
          affectedElements: audit?.performance?.renderBlocking || ['style.css', 'app.js']
        },
        {
          title: 'Server response time',
          description: 'Server is taking too long to respond',
          impact: 'High impact on LCP',
          solution: 'Optimize server performance and use CDN',
          affectedElements: []
        }
      ]
    },
    {
      id: 'fcp-issue',
      title: 'First Contentful Paint (FCP) Issues',
      severity: audit?.performance?.fcp > 1800 ? 'high' : audit?.performance?.fcp > 3000 ? 'medium' : 'low',
      issues: [
        {
          title: 'Unoptimized fonts',
          description: 'Web fonts are not optimized for fast loading',
          impact: 'Medium impact on FCP',
          solution: 'Use font-display: swap and preload critical fonts',
          affectedElements: audit?.performance?.unoptimizedFonts || ['Roboto', 'Open Sans']
        },
        {
          title: 'Large CSS files',
          description: 'CSS files are too large and not minified',
          impact: 'Medium impact on FCP',
          solution: 'Minify CSS and remove unused styles',
          affectedElements: audit?.performance?.largeCSS || ['bootstrap.css', 'custom.css']
        }
      ]
    },
    {
      id: 'tbt-issue',
      title: 'Total Blocking Time (TBT) Issues',
      severity: audit?.performance?.tbt > 200 ? 'high' : audit?.performance?.tbt > 600 ? 'medium' : 'low',
      issues: [
        {
          title: 'Long JavaScript tasks',
          description: 'JavaScript is blocking the main thread for too long',
          impact: 'High impact on TBT',
          solution: 'Break up long tasks and use Web Workers',
          affectedElements: audit?.performance?.longTasks || ['analytics.js', 'tracking.js']
        },
        {
          title: 'Unused JavaScript',
          description: 'JavaScript code is loaded but not used',
          impact: 'Medium impact on TBT',
          solution: 'Remove unused JavaScript and use code splitting',
          affectedElements: audit?.performance?.unusedJS || ['jquery.js', 'lodash.js']
        }
      ]
    },
    {
      id: 'cls-issue',
      title: 'Cumulative Layout Shift (CLS) Issues',
      severity: audit?.performance?.cls > 0.1 ? 'high' : audit?.performance?.cls > 0.25 ? 'medium' : 'low',
      issues: [
        {
          title: 'Images without dimensions',
          description: 'Images are loaded without width and height attributes',
          impact: 'High impact on CLS',
          solution: 'Add width and height attributes to all images',
          affectedElements: audit?.performance?.imagesWithoutDimensions || ['banner.jpg', 'logo.png']
        },
        {
          title: 'Dynamically injected content',
          description: 'Content is added to the page after initial load',
          impact: 'Medium impact on CLS',
          solution: 'Reserve space for dynamic content',
          affectedElements: audit?.performance?.dynamicContent || ['ads', 'social-widgets']
        }
      ]
    }
  ];

  // Image Analysis Issues
  const imageIssues = [
    {
      title: 'Images without alt text',
      count: audit?.images?.imagesWithoutAlt || 0,
      severity: (audit?.images?.imagesWithoutAlt || 0) > 5 ? 'high' : (audit?.images?.imagesWithoutAlt || 0) > 0 ? 'medium' : 'low',
      affectedImages: audit?.images?.imagesWithoutAltList || [
        { src: 'hero-image.jpg', alt: null },
        { src: 'banner.png', alt: '' },
        { src: 'logo.svg', alt: null }
      ],
      solution: 'Add descriptive alt text to all images for accessibility and SEO'
    },
    {
      title: 'Images not optimized',
      count: audit?.images?.unoptimizedImages || 0,
      severity: (audit?.images?.unoptimizedImages || 0) > 3 ? 'high' : (audit?.images?.unoptimizedImages || 0) > 0 ? 'medium' : 'low',
      affectedImages: audit?.images?.unoptimizedImagesList || [
        { src: 'large-photo.jpg', size: '2.5MB', format: 'JPEG' },
        { src: 'banner.png', size: '1.8MB', format: 'PNG' }
      ],
      solution: 'Compress images and convert to modern formats like WebP'
    }
  ];

  // Meta Tags Issues
  const metaTagsIssues = [
    {
      title: 'Missing or poor title tags',
      issues: [
        {
          element: 'title',
          present: audit?.seo?.titleTag?.present || false,
          content: audit?.seo?.titleTag?.content || '',
          length: audit?.seo?.titleTag?.length || 0,
          issues: [
            audit?.seo?.titleTag?.length < 30 ? 'Title too short (less than 30 characters)' : null,
            audit?.seo?.titleTag?.length > 60 ? 'Title too long (more than 60 characters)' : null,
            !audit?.seo?.titleTag?.present ? 'Title tag is missing' : null
          ].filter(Boolean)
        }
      ]
    },
    {
      title: 'Meta description issues',
      issues: [
        {
          element: 'meta description',
          present: audit?.seo?.metaDescription?.present || false,
          content: audit?.seo?.metaDescription?.content || '',
          length: audit?.seo?.metaDescription?.length || 0,
          issues: [
            audit?.seo?.metaDescription?.length < 120 ? 'Description too short (less than 120 characters)' : null,
            audit?.seo?.metaDescription?.length > 160 ? 'Description too long (more than 160 characters)' : null,
            !audit?.seo?.metaDescription?.present ? 'Meta description is missing' : null
          ].filter(Boolean)
        }
      ]
    }
  ];

  // Heading Structure Issues
  const headingIssues = [
    {
      title: 'Heading structure problems',
      issues: [
        {
          type: 'Missing H1',
          present: audit?.seo?.h1Present || false,
          count: audit?.seo?.h1Count || 0,
          issues: [
            !audit?.seo?.h1Present ? 'No H1 tag found on the page' : null,
            (audit?.seo?.h1Count || 0) > 1 ? 'Multiple H1 tags found (should be only one)' : null
          ].filter(Boolean)
        },
        {
          type: 'Heading hierarchy',
          issues: [
            'H2 tags used without H1',
            'H3 tags used without H2',
            'Headings not in logical order'
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Performance Issues */}
      <Card id="performance-details">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Performance Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {performanceIssues.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{category.title}</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getSeverityColor(category.severity)}`}>
                    {getSeverityIcon(category.severity)}
                    <span className="text-sm font-medium capitalize">{category.severity}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {category.issues.map((issue, issueIndex) => (
                    <div key={issueIndex} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{issue.title}</h4>
                        <span className="text-sm text-gray-600">{issue.impact}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{issue.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-600 font-medium">{issue.solution}</p>
                        {issue.affectedElements.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {issue.affectedElements.length} affected elements
                          </div>
                        )}
                      </div>
                      {issue.affectedElements.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Affected elements:</div>
                          <div className="flex flex-wrap gap-1">
                            {issue.affectedElements.map((element, elementIndex) => (
                              <span key={elementIndex} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                {element}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Analysis Issues */}
      <Card id="accessibility-details">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Image Analysis Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imageIssues.map((issue, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{issue.title}</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getSeverityColor(issue.severity)}`}>
                    {getSeverityIcon(issue.severity)}
                    <span className="text-sm font-medium">{issue.count} issues</span>
                  </div>
                </div>
                
                <p className="text-sm text-blue-600 font-medium mb-3">{issue.solution}</p>
                
                {issue.affectedImages.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Affected images:</div>
                    <div className="space-y-2">
                      {issue.affectedImages.map((image, imageIndex) => (
                        <div key={imageIndex} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <span className="text-sm font-mono">{image.src}</span>
                          {image.size && (
                            <span className="text-xs text-gray-500">{image.size}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meta Tags Issues */}
      <Card id="best-practices-details">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Meta Tags Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metaTagsIssues.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">{category.title}</h3>
                <div className="space-y-3">
                  {category.issues.map((issue, issueIndex) => (
                    <div key={issueIndex} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{issue.element}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          issue.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {issue.present ? 'Present' : 'Missing'}
                        </span>
                      </div>
                      {issue.content && (
                        <div className="text-sm text-gray-600 mb-2">
                          Content: "{issue.content}"
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mb-2">
                        Length: {issue.length} characters
                      </div>
                      {issue.issues.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Issues found:</div>
                          <ul className="text-xs text-red-600 space-y-1">
                            {issue.issues.map((issueText, issueTextIndex) => (
                              <li key={issueTextIndex}>• {issueText}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heading Structure Issues */}
      <Card id="seo-details">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Heading Structure Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {headingIssues.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">{category.title}</h3>
                <div className="space-y-3">
                  {category.issues.map((issue, issueIndex) => (
                    <div key={issueIndex} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{issue.type}</span>
                        {issue.present !== undefined && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {issue.present ? 'Present' : 'Missing'}
                          </span>
                        )}
                        {issue.count !== undefined && (
                          <span className="text-xs text-gray-500">Count: {issue.count}</span>
                        )}
                      </div>
                      {issue.issues && issue.issues.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Issues found:</div>
                          <ul className="text-xs text-red-600 space-y-1">
                            {issue.issues.map((issueText, issueTextIndex) => (
                              <li key={issueTextIndex}>• {issueText}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedIssues;
