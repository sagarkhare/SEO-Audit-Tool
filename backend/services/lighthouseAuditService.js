const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const sharp = require('sharp');

class LighthouseAuditService {
  constructor() {
    this.defaultConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'cumulative-layout-shift',
          'speed-index',
          'interactive',
          'total-blocking-time',
          'meta-description',
          'document-title',
          'image-alt',
          'image-redundant-alt',
          'link-text',
          'crawlable-anchors',
          'is-crawlable',
          'robots-txt',
          'viewport',
          'color-contrast',
          'tap-targets',
          'hreflang',
          'canonical',
          'font-display',
          'unused-css-rules',
          'unused-javascript',
          'render-blocking-resources',
          'uses-optimized-images',
          'uses-webp-images',
          'uses-text-compression',
          'uses-responsive-images',
          'efficient-animated-content',
          'preload-lcp-image',
          'uses-rel-preconnect',
          'uses-rel-preload',
          'critical-request-chains',
          'uses-http2',
          'uses-long-cache-ttl',
          'total-byte-weight',
          'uses-compression',
          'dom-size',
          'no-document-write',
          'no-vulnerable-libraries',
          'js-libraries',
          'notification-on-start',
          'deprecations',
          'errors-in-console',
          'image-aspect-ratio',
          'offscreen-images',
          'uses-passive-event-listeners',
          'no-unload-listeners',
          'redirects-http',
          'uses-https',
          'is-on-https',
          'service-worker',
          'works-offline',
          'viewport',
          'content-width',
          'color-contrast',
          'image-alt',
          'label',
          'link-name',
          'list',
          'listitem',
          'meta-refresh',
          'object-alt',
          'tabindex',
          'td-headers-attr',
          'th-has-data-cells',
          'valid-lang',
          'video-caption',
          'video-description',
          'bypass',
          'focus-traps',
          'focusable-controls',
          'interactive-element-affordance',
          'logical-tab-order',
          'managed-focus',
          'offscreen-content-hidden',
          'use-landmarks',
          'visual-order-follows-dom',
          'custom-controls-labels',
          'custom-controls-roles',
          'focus-traps',
          'heading-order',
          'hreflang',
          'html-has-lang',
          'html-lang-valid',
          'image-alt',
          'input-image-alt',
          'label',
          'link-name',
          'list',
          'listitem',
          'meta-description',
          'meta-refresh',
          'object-alt',
          'tabindex',
          'td-headers-attr',
          'th-has-data-cells',
          'valid-lang',
          'video-caption',
          'video-description'
        ]
      }
    };
  }

  async runAudit(url, options = {}) {
    const { deviceType = 'desktop', location = 'us' } = options;
    
    try {
      console.log(`Starting Lighthouse audit for: ${url}`);
      
      // Launch Chrome
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
      });

      const config = {
        ...this.defaultConfig,
        settings: {
          ...this.defaultConfig.settings,
          emulatedFormFactor: deviceType === 'mobile' ? 'mobile' : 'desktop',
          throttlingMethod: 'simulate',
          throttling: {
            rttMs: deviceType === 'mobile' ? 150 : 40,
            throughputKbps: deviceType === 'mobile' ? 1638.4 : 10240,
            cpuSlowdownMultiplier: deviceType === 'mobile' ? 4 : 1
          }
        }
      };

      // Run Lighthouse
      const result = await lighthouse(url, {
        port: chrome.port,
        output: 'json',
        logLevel: 'info'
      }, config);

      await chrome.kill();

      if (!result || !result.lhr) {
        throw new Error('Lighthouse audit failed to generate results');
      }

      // Process the results
      const auditResults = this.processLighthouseResults(result.lhr, url);
      
      console.log(`Lighthouse audit completed for: ${url}`);
      return auditResults;

    } catch (error) {
      console.error('Lighthouse audit error:', error);
      throw new Error(`Audit failed: ${error.message}`);
    }
  }

  processLighthouseResults(lhr, url) {
    const audits = lhr.audits;
    const categories = lhr.categories;

    // Performance metrics
    const performance = {
      score: Math.round((audits['performance']?.score || 0) * 100),
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      interactive: audits['interactive']?.numericValue || 0,
      totalBlockingTime: audits['total-blocking-time']?.numericValue || 0
    };

    // SEO metrics
    const seo = {
      score: Math.round((categories['seo']?.score || 0) * 100),
      metaDescription: {
        present: audits['meta-description']?.score === 1,
        length: audits['meta-description']?.details?.items?.[0]?.length || 0,
        score: Math.round((audits['meta-description']?.score || 0) * 100)
      },
      documentTitle: {
        present: audits['document-title']?.score === 1,
        length: audits['document-title']?.details?.items?.[0]?.length || 0,
        score: Math.round((audits['document-title']?.score || 0) * 100)
      },
      viewport: audits['viewport']?.score === 1,
      isCrawlable: audits['is-crawlable']?.score === 1,
      robotsTxt: audits['robots-txt']?.score === 1,
      canonical: audits['canonical']?.score === 1,
      hreflang: audits['hreflang']?.score === 1
    };

    // Accessibility metrics
    const accessibility = {
      score: Math.round((categories['accessibility']?.score || 0) * 100),
      colorContrast: audits['color-contrast']?.score === 1,
      imageAlt: audits['image-alt']?.score === 1,
      linkText: audits['link-text']?.score === 1,
      tapTargets: audits['tap-targets']?.score === 1,
      headingOrder: audits['heading-order']?.score === 1,
      htmlLang: audits['html-has-lang']?.score === 1
    };

    // Best Practices
    const bestPractices = {
      score: Math.round((categories['best-practices']?.score || 0) * 100),
      usesHttps: audits['uses-https']?.score === 1,
      noVulnerableLibraries: audits['no-vulnerable-libraries']?.score === 1,
      noConsoleErrors: audits['errors-in-console']?.score === 1,
      usesPassiveEventListeners: audits['uses-passive-event-listeners']?.score === 1,
      noUnloadListeners: audits['no-unload-listeners']?.score === 1
    };

    // Image analysis
    const images = {
      totalImages: audits['uses-optimized-images']?.details?.items?.length || 0,
      imagesWithAlt: audits['image-alt']?.details?.items?.filter(item => item.node?.alt)?.length || 0,
      webpImages: audits['uses-webp-images']?.details?.items?.length || 0,
      lazyLoadedImages: audits['offscreen-images']?.details?.items?.length || 0,
      usesOptimizedImages: audits['uses-optimized-images']?.score === 1,
      usesWebpImages: audits['uses-webp-images']?.score === 1,
      usesResponsiveImages: audits['uses-responsive-images']?.score === 1
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(audits, categories);

    // Calculate overall score
    const overallScore = Math.round(
      (performance.score + seo.score + accessibility.score + bestPractices.score) / 4
    );

    return {
      url,
      domain: new URL(url).hostname,
      status: 'completed',
      createdAt: new Date(),
      overallScore,
      performance,
      seo,
      accessibility,
      bestPractices,
      images,
      recommendations,
      lighthouseVersion: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
      fetchTime: lhr.fetchTime
    };
  }

  generateRecommendations(audits, categories) {
    const recommendations = [];

    // Performance recommendations
    if (audits['first-contentful-paint']?.score < 0.9) {
      recommendations.push({
        title: 'Improve First Contentful Paint',
        description: 'Optimize critical rendering path to reduce FCP time',
        priority: 'high',
        impact: 'High impact on user experience',
        effort: 'Medium effort - requires code optimization'
      });
    }

    if (audits['largest-contentful-paint']?.score < 0.9) {
      recommendations.push({
        title: 'Optimize Largest Contentful Paint',
        description: 'Optimize the largest content element for faster loading',
        priority: 'high',
        impact: 'High impact on perceived performance',
        effort: 'Medium effort - requires image/content optimization'
      });
    }

    if (audits['cumulative-layout-shift']?.score < 0.9) {
      recommendations.push({
        title: 'Reduce Cumulative Layout Shift',
        description: 'Prevent unexpected layout shifts during page load',
        priority: 'medium',
        impact: 'Medium impact on user experience',
        effort: 'Low effort - add size attributes to images'
      });
    }

    // SEO recommendations
    if (audits['meta-description']?.score < 1) {
      recommendations.push({
        title: 'Add Meta Description',
        description: 'Add a meta description tag to improve search engine visibility',
        priority: 'high',
        impact: 'High impact on SEO',
        effort: 'Low effort - simple HTML addition'
      });
    }

    if (audits['document-title']?.score < 1) {
      recommendations.push({
        title: 'Optimize Page Title',
        description: 'Add or improve the page title for better SEO',
        priority: 'high',
        impact: 'High impact on SEO',
        effort: 'Low effort - simple HTML addition'
      });
    }

    if (audits['viewport']?.score < 1) {
      recommendations.push({
        title: 'Add Viewport Meta Tag',
        description: 'Add viewport meta tag for mobile responsiveness',
        priority: 'high',
        impact: 'High impact on mobile SEO',
        effort: 'Low effort - simple HTML addition'
      });
    }

    // Image optimization recommendations
    if (audits['uses-optimized-images']?.score < 1) {
      recommendations.push({
        title: 'Optimize Images',
        description: 'Compress and optimize images for better performance',
        priority: 'medium',
        impact: 'Medium impact on page load speed',
        effort: 'Medium effort - requires image optimization'
      });
    }

    if (audits['uses-webp-images']?.score < 1) {
      recommendations.push({
        title: 'Use WebP Images',
        description: 'Convert images to WebP format for better compression',
        priority: 'medium',
        impact: 'Medium impact on page load speed',
        effort: 'Medium effort - requires image conversion'
      });
    }

    // Accessibility recommendations
    if (audits['image-alt']?.score < 1) {
      recommendations.push({
        title: 'Add Alt Text to Images',
        description: 'Add descriptive alt text to all images for accessibility',
        priority: 'high',
        impact: 'High impact on accessibility',
        effort: 'Low effort - simple HTML addition'
      });
    }

    if (audits['color-contrast']?.score < 1) {
      recommendations.push({
        title: 'Improve Color Contrast',
        description: 'Increase color contrast for better readability',
        priority: 'high',
        impact: 'High impact on accessibility',
        effort: 'Medium effort - requires design changes'
      });
    }

    return recommendations;
  }

  async analyzeImages(url) {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      const imageData = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loading: img.loading
        }));
      });

      await browser.close();

      // Analyze images with Sharp
      const analysis = await Promise.all(
        imageData.map(async (img) => {
          try {
            const response = await fetch(img.src);
            const buffer = await response.arrayBuffer();
            const metadata = await sharp(Buffer.from(buffer)).metadata();
            
            return {
              ...img,
              format: metadata.format,
              size: metadata.size,
              hasAlpha: metadata.hasAlpha,
              density: metadata.density,
              isOptimized: metadata.format === 'webp' || metadata.size < 100000
            };
          } catch (error) {
            return {
              ...img,
              error: 'Could not analyze image'
            };
          }
        })
      );

      return analysis;
    } catch (error) {
      console.error('Image analysis error:', error);
      return [];
    }
  }
}

module.exports = LighthouseAuditService;


