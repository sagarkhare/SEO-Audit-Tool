// const lighthouse = require('lighthouse'); // Will use dynamic import
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class LighthouseService {
  constructor() {
    this.browser = null;
  }

  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async runAudit(url, options = {}) {
    const startTime = Date.now();
    
    try {
      await this.initializeBrowser();
      
      const defaultOptions = {
        port: new URL(await this.browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        emulatedFormFactor: options.deviceType || 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      };

      const config = {
        extends: 'lighthouse:default',
        settings: {
          ...defaultOptions,
          ...options
        }
      };

      logger.info(`Starting Lighthouse audit for: ${url}`);
      
      // Dynamic import of lighthouse
      const lighthouse = await import('lighthouse');
      const result = await lighthouse.default(url, config);
      const processingTime = Date.now() - startTime;
      
      logger.info(`Lighthouse audit completed in ${processingTime}ms`);
      
      return this.parseLighthouseResults(result, processingTime);
      
    } catch (error) {
      logger.error('Lighthouse audit failed:', error);
      throw new Error(`Lighthouse audit failed: ${error.message}`);
    }
  }

  parseLighthouseResults(result, processingTime) {
    const lhr = result.lhr;
    
    // Performance metrics
    const performance = {
      score: Math.round(lhr.categories.performance.score * 100),
      firstContentfulPaint: this.getMetricValue(lhr, 'first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue(lhr, 'largest-contentful-paint'),
      cumulativeLayoutShift: this.getMetricValue(lhr, 'cumulative-layout-shift'),
      timeToInteractive: this.getMetricValue(lhr, 'interactive'),
      speedIndex: this.getMetricValue(lhr, 'speed-index'),
      firstInputDelay: this.getMetricValue(lhr, 'max-potential-fid'),
      totalBlockingTime: this.getMetricValue(lhr, 'total-blocking-time')
    };

    // SEO metrics
    const seo = {
      score: Math.round(lhr.categories.seo.score * 100),
      issues: this.getSEOIssues(lhr)
    };

    // Accessibility metrics
    const accessibility = {
      score: Math.round(lhr.categories.accessibility.score * 100),
      issues: this.getAccessibilityIssues(lhr)
    };

    // Best practices metrics
    const bestPractices = {
      score: Math.round(lhr.categories['best-practices'].score * 100),
      issues: this.getBestPracticesIssues(lhr)
    };

    return {
      performance,
      seo,
      accessibility,
      bestPractices,
      processingTime,
      rawReport: lhr,
      recommendations: this.generateRecommendations(lhr)
    };
  }

  getMetricValue(lhr, metricId) {
    const metric = lhr.audits[metricId];
    return metric ? Math.round(metric.numericValue) : null;
  }

  getSEOIssues(lhr) {
    const seoAudits = lhr.categories.seo.auditRefs;
    const issues = [];

    seoAudits.forEach(auditRef => {
      const audit = lhr.audits[auditRef.id];
      if (audit && audit.score !== null && audit.score < 0.9) {
        issues.push({
          id: auditRef.id,
          title: audit.title,
          description: audit.description,
          score: Math.round(audit.score * 100),
          details: audit.details
        });
      }
    });

    return issues;
  }

  getAccessibilityIssues(lhr) {
    const accessibilityAudits = lhr.categories.accessibility.auditRefs;
    const issues = [];

    accessibilityAudits.forEach(auditRef => {
      const audit = lhr.audits[auditRef.id];
      if (audit && audit.score !== null && audit.score < 0.9) {
        issues.push({
          id: auditRef.id,
          title: audit.title,
          description: audit.description,
          score: Math.round(audit.score * 100),
          details: audit.details
        });
      }
    });

    return issues;
  }

  getBestPracticesIssues(lhr) {
    const bestPracticesAudits = lhr.categories['best-practices'].auditRefs;
    const issues = [];

    bestPracticesAudits.forEach(auditRef => {
      const audit = lhr.audits[auditRef.id];
      if (audit && audit.score !== null && audit.score < 0.9) {
        issues.push({
          id: auditRef.id,
          title: audit.title,
          description: audit.description,
          score: Math.round(audit.score * 100),
          details: audit.details
        });
      }
    });

    return issues;
  }

  generateRecommendations(lhr) {
    const recommendations = [];

    // Performance recommendations
    const performanceAudits = lhr.categories.performance.auditRefs;
    performanceAudits.forEach(auditRef => {
      const audit = lhr.audits[auditRef.id];
      if (audit && audit.score !== null && audit.score < 0.9) {
        recommendations.push({
          category: 'performance',
          priority: audit.score < 0.5 ? 'high' : audit.score < 0.8 ? 'medium' : 'low',
          title: audit.title,
          description: audit.description,
          impact: this.getImpactDescription(audit.score),
          effort: this.getEffortDescription(auditRef.id)
        });
      }
    });

    return recommendations;
  }

  getImpactDescription(score) {
    if (score < 0.3) return 'High impact on user experience';
    if (score < 0.6) return 'Medium impact on user experience';
    if (score < 0.8) return 'Low impact on user experience';
    return 'Minimal impact';
  }

  getEffortDescription(auditId) {
    const highEffortAudits = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'efficient-animated-content'
    ];

    const mediumEffortAudits = [
      'uses-optimized-images',
      'uses-webp-images',
      'uses-text-compression',
      'uses-responsive-images'
    ];

    if (highEffortAudits.includes(auditId)) return 'High effort - requires significant development work';
    if (mediumEffortAudits.includes(auditId)) return 'Medium effort - requires moderate development work';
    return 'Low effort - quick wins available';
  }

  async runBatchAudit(urls, options = {}) {
    const results = [];
    
    for (const url of urls) {
      try {
        const result = await this.runAudit(url, options);
        results.push({ url, success: true, data: result });
      } catch (error) {
        results.push({ url, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new LighthouseService();
