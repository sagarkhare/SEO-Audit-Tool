import React from 'react';
import RadialProgressChart from './RadialProgressChart';

const PerformanceMetrics = ({ metrics }) => {
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

  const formatValue = (value, unit) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    }
    if (unit === 's') {
      return `${value.toFixed(2)}s`;
    }
    return value;
  };

  const metricsData = [
    {
      name: 'Largest Contentful Paint',
      value: metrics?.lcp || 0,
      unit: 'ms',
      score: metrics?.lcpScore || 0,
      description: 'LCP measures loading performance',
      good: 2500,
      poor: 4000,
      bestRange: '≤ 2.5s',
      targetRange: '2.5s - 4.0s',
      needsImprovement: '> 4.0s'
    },
    {
      name: 'First Contentful Paint',
      value: metrics?.fcp || 0,
      unit: 'ms',
      score: metrics?.fcpScore || 0,
      description: 'FCP measures perceived loading speed',
      good: 1800,
      poor: 3000,
      bestRange: '≤ 1.8s',
      targetRange: '1.8s - 3.0s',
      needsImprovement: '> 3.0s'
    },
    {
      name: 'Total Blocking Time',
      value: metrics?.tbt || 0,
      unit: 'ms',
      score: metrics?.tbtScore || 0,
      description: 'TBT measures interactivity',
      good: 200,
      poor: 600,
      bestRange: '≤ 200ms',
      targetRange: '200ms - 600ms',
      needsImprovement: '> 600ms'
    },
    {
      name: 'Cumulative Layout Shift',
      value: metrics?.cls || 0,
      unit: '',
      score: metrics?.clsScore || 0,
      description: 'CLS measures visual stability',
      good: 0.1,
      poor: 0.25,
      bestRange: '≤ 0.1',
      targetRange: '0.1 - 0.25',
      needsImprovement: '> 0.25'
    },
    {
      name: 'Speed Index',
      value: metrics?.si || 0,
      unit: 's',
      score: metrics?.siScore || 0,
      description: 'SI measures how quickly content loads',
      good: 3.4,
      poor: 5.8,
      bestRange: '≤ 3.4s',
      targetRange: '3.4s - 5.8s',
      needsImprovement: '> 5.8s'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricsData.map((metric, index) => (
          <div key={index} className="bg-card rounded-lg p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {metric.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getScoreColor(metric.score) }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: getScoreColor(metric.score) }}
                >
                  {getScoreLabel(metric.score)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <RadialProgressChart
                score={metric.score}
                size={80}
                strokeWidth={6}
                color="auto"
                showScore={true}
              />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {formatValue(metric.value, metric.unit)}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {metric.description}
              </p>
              
              {/* Performance Ranges */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-green-600 font-medium">Good:</span>
                  <span className="text-green-600">{metric.bestRange}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-600 font-medium">Needs Improvement:</span>
                  <span className="text-yellow-600">{metric.targetRange}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-medium">Poor:</span>
                  <span className="text-red-600">{metric.needsImprovement}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetrics;
