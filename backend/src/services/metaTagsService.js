const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class MetaTagsService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async analyzeMetaTags(url) {
    try {
      logger.info(`Analyzing meta tags for: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      const analysis = {
        title: this.analyzeTitle($),
        description: this.analyzeDescription($),
        openGraph: this.analyzeOpenGraph($),
        twitterCard: this.analyzeTwitterCard($),
        canonical: this.analyzeCanonical($),
        robots: this.analyzeRobots($),
        structuredData: this.analyzeStructuredData($),
        h1Tags: this.analyzeH1Tags($),
        h2Tags: this.analyzeH2Tags($),
        language: this.analyzeLanguage($),
        charset: this.analyzeCharset($),
        viewport: this.analyzeViewport($)
      };

      analysis.overallScore = this.calculateOverallScore(analysis);
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      logger.error('Meta tags analysis failed:', error);
      throw new Error(`Meta tags analysis failed: ${error.message}`);
    }
  }

  analyzeTitle($) {
    const title = $('title').text().trim();
    const length = title.length;
    
    let score = 0;
    if (title) score += 50;
    if (length >= 30 && length <= 60) score += 30;
    if (length > 60) score -= 20;
    if (length < 30) score -= 10;

    return {
      present: !!title,
      content: title,
      length: length,
      score: Math.max(0, Math.min(100, score)),
      issues: this.getTitleIssues(title, length)
    };
  }

  getTitleIssues(title, length) {
    const issues = [];
    
    if (!title) {
      issues.push('Title tag is missing');
    } else {
      if (length < 30) issues.push('Title is too short (less than 30 characters)');
      if (length > 60) issues.push('Title is too long (more than 60 characters)');
      if (title.toLowerCase().includes('untitled')) issues.push('Title contains "Untitled"');
      if (title.toLowerCase().includes('homepage')) issues.push('Title is generic (contains "Homepage")');
    }
    
    return issues;
  }

  analyzeDescription($) {
    const description = $('meta[name="description"]').attr('content') || '';
    const length = description.length;
    
    let score = 0;
    if (description) score += 50;
    if (length >= 120 && length <= 160) score += 30;
    if (length > 160) score -= 20;
    if (length < 120) score -= 10;

    return {
      present: !!description,
      content: description,
      length: length,
      score: Math.max(0, Math.min(100, score)),
      issues: this.getDescriptionIssues(description, length)
    };
  }

  getDescriptionIssues(description, length) {
    const issues = [];
    
    if (!description) {
      issues.push('Meta description is missing');
    } else {
      if (length < 120) issues.push('Description is too short (less than 120 characters)');
      if (length > 160) issues.push('Description is too long (more than 160 characters)');
      if (description.toLowerCase().includes('lorem ipsum')) issues.push('Description contains placeholder text');
    }
    
    return issues;
  }

  analyzeOpenGraph($) {
    const ogTags = {
      title: $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: $('meta[property="og:url"]').attr('content') || '',
      type: $('meta[property="og:type"]').attr('content') || '',
      siteName: $('meta[property="og:site_name"]').attr('content') || ''
    };

    let score = 0;
    if (ogTags.title) score += 20;
    if (ogTags.description) score += 20;
    if (ogTags.image) score += 20;
    if (ogTags.url) score += 15;
    if (ogTags.type) score += 15;
    if (ogTags.siteName) score += 10;

    return {
      ...ogTags,
      score: score,
      issues: this.getOpenGraphIssues(ogTags)
    };
  }

  getOpenGraphIssues(ogTags) {
    const issues = [];
    
    if (!ogTags.title) issues.push('Open Graph title is missing');
    if (!ogTags.description) issues.push('Open Graph description is missing');
    if (!ogTags.image) issues.push('Open Graph image is missing');
    if (!ogTags.url) issues.push('Open Graph URL is missing');
    if (!ogTags.type) issues.push('Open Graph type is missing');
    
    return issues;
  }

  analyzeTwitterCard($) {
    const twitterTags = {
      card: $('meta[name="twitter:card"]').attr('content') || '',
      title: $('meta[name="twitter:title"]').attr('content') || '',
      description: $('meta[name="twitter:description"]').attr('content') || '',
      image: $('meta[name="twitter:image"]').attr('content') || '',
      site: $('meta[name="twitter:site"]').attr('content') || '',
      creator: $('meta[name="twitter:creator"]').attr('content') || ''
    };

    let score = 0;
    if (twitterTags.card) score += 25;
    if (twitterTags.title) score += 20;
    if (twitterTags.description) score += 20;
    if (twitterTags.image) score += 20;
    if (twitterTags.site) score += 10;
    if (twitterTags.creator) score += 5;

    return {
      ...twitterTags,
      score: score,
      issues: this.getTwitterCardIssues(twitterTags)
    };
  }

  getTwitterCardIssues(twitterTags) {
    const issues = [];
    
    if (!twitterTags.card) issues.push('Twitter Card type is missing');
    if (!twitterTags.title) issues.push('Twitter Card title is missing');
    if (!twitterTags.description) issues.push('Twitter Card description is missing');
    if (!twitterTags.image) issues.push('Twitter Card image is missing');
    
    return issues;
  }

  analyzeCanonical($) {
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    
    return {
      present: !!canonical,
      url: canonical,
      score: canonical ? 100 : 0,
      issues: canonical ? [] : ['Canonical URL is missing']
    };
  }

  analyzeRobots($) {
    const robots = $('meta[name="robots"]').attr('content') || '';
    
    return {
      present: !!robots,
      content: robots,
      score: robots ? 100 : 50,
      issues: robots ? [] : ['Robots meta tag is missing']
    };
  }

  analyzeStructuredData($) {
    const structuredData = [];
    
    // Check for JSON-LD
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        structuredData.push(data);
      } catch (e) {
        // Invalid JSON
      }
    });

    // Check for microdata
    const microdataElements = $('[itemscope]').length;
    
    // Check for RDFa
    const rdfaElements = $('[typeof]').length;

    const types = structuredData.map(data => data['@type']).filter(Boolean);
    
    return {
      present: structuredData.length > 0 || microdataElements > 0 || rdfaElements > 0,
      types: types,
      count: structuredData.length,
      score: structuredData.length > 0 ? 100 : 0,
      issues: structuredData.length === 0 ? ['No structured data found'] : []
    };
  }

  analyzeH1Tags($) {
    const h1Tags = [];
    $('h1').each((i, el) => {
      h1Tags.push($(el).text().trim());
    });

    return {
      count: h1Tags.length,
      tags: h1Tags,
      score: h1Tags.length === 1 ? 100 : h1Tags.length === 0 ? 0 : 50,
      issues: this.getH1Issues(h1Tags)
    };
  }

  getH1Issues(h1Tags) {
    const issues = [];
    
    if (h1Tags.length === 0) {
      issues.push('No H1 tag found');
    } else if (h1Tags.length > 1) {
      issues.push('Multiple H1 tags found (should be only one)');
    }
    
    return issues;
  }

  analyzeH2Tags($) {
    const h2Tags = [];
    $('h2').each((i, el) => {
      h2Tags.push($(el).text().trim());
    });

    return {
      count: h2Tags.length,
      tags: h2Tags,
      score: h2Tags.length > 0 ? 100 : 0
    };
  }

  analyzeLanguage($) {
    const language = $('html').attr('lang') || '';
    
    return {
      present: !!language,
      value: language,
      score: language ? 100 : 0,
      issues: language ? [] : ['HTML lang attribute is missing']
    };
  }

  analyzeCharset($) {
    const charset = $('meta[charset]').attr('charset') || 
                   $('meta[http-equiv="Content-Type"]').attr('content') || '';
    
    return {
      present: !!charset,
      value: charset,
      score: charset ? 100 : 0,
      issues: charset ? [] : ['Charset declaration is missing']
    };
  }

  analyzeViewport($) {
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    
    return {
      present: !!viewport,
      value: viewport,
      score: viewport ? 100 : 0,
      issues: viewport ? [] : ['Viewport meta tag is missing']
    };
  }

  calculateOverallScore(analysis) {
    const weights = {
      title: 0.25,
      description: 0.25,
      openGraph: 0.15,
      twitterCard: 0.1,
      canonical: 0.1,
      robots: 0.05,
      structuredData: 0.05,
      h1Tags: 0.05
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(key => {
      if (analysis[key] && analysis[key].score !== undefined) {
        totalScore += analysis[key].score * weights[key];
        totalWeight += weights[key];
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Title recommendations
    if (analysis.title.score < 80) {
      recommendations.push({
        category: 'meta-tags',
        priority: 'high',
        title: 'Optimize Title Tag',
        description: 'Improve your title tag for better SEO',
        impact: 'High impact on search rankings',
        effort: 'Low effort - quick win'
      });
    }

    // Description recommendations
    if (analysis.description.score < 80) {
      recommendations.push({
        category: 'meta-tags',
        priority: 'high',
        title: 'Optimize Meta Description',
        description: 'Improve your meta description for better click-through rates',
        impact: 'High impact on click-through rates',
        effort: 'Low effort - quick win'
      });
    }

    // Open Graph recommendations
    if (analysis.openGraph.score < 60) {
      recommendations.push({
        category: 'meta-tags',
        priority: 'medium',
        title: 'Add Open Graph Tags',
        description: 'Add Open Graph tags for better social media sharing',
        impact: 'Medium impact on social sharing',
        effort: 'Low effort - quick win'
      });
    }

    return recommendations;
  }
}

module.exports = new MetaTagsService();
