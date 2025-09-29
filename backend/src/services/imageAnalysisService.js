const axios = require('axios');
const cheerio = require('cheerio');
const sharp = require('sharp');
const logger = require('../utils/logger');

class ImageAnalysisService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
  }

  async analyzeImages(url) {
    try {
      logger.info(`Analyzing images for: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const images = this.extractImages($, url);
      
      const analysis = await this.analyzeImageDetails(images);
      
      analysis.overallScore = this.calculateOverallScore(analysis);
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      logger.error('Image analysis failed:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  extractImages($, baseUrl) {
    const images = [];
    
    $('img').each((i, el) => {
      const $img = $(el);
      const src = $img.attr('src');
      const alt = $img.attr('alt');
      const loading = $img.attr('loading');
      const width = $img.attr('width');
      const height = $img.attr('height');
      
      if (src) {
        const absoluteUrl = this.resolveUrl(src, baseUrl);
        images.push({
          src: absoluteUrl,
          alt: alt || '',
          loading: loading || 'eager',
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          hasAlt: !!alt,
          isLazyLoaded: loading === 'lazy'
        });
      }
    });

    // Also check for background images in CSS
    $('*').each((i, el) => {
      const $el = $(el);
      const style = $el.attr('style');
      
      if (style && style.includes('background-image')) {
        const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
        if (match) {
          const absoluteUrl = this.resolveUrl(match[1], baseUrl);
          images.push({
            src: absoluteUrl,
            alt: '',
            loading: 'eager',
            width: null,
            height: null,
            hasAlt: false,
            isLazyLoaded: false,
            isBackgroundImage: true
          });
        }
      }
    });

    return images;
  }

  resolveUrl(src, baseUrl) {
    try {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
      }
      
      if (src.startsWith('//')) {
        return 'https:' + src;
      }
      
      if (src.startsWith('/')) {
        const url = new URL(baseUrl);
        return url.protocol + '//' + url.host + src;
      }
      
      const base = new URL(baseUrl);
      return new URL(src, base).href;
    } catch (error) {
      return src;
    }
  }

  async analyzeImageDetails(images) {
    const analysis = {
      totalImages: images.length,
      imagesWithAlt: 0,
      imagesWithoutAlt: 0,
      webpImages: 0,
      optimizedImages: 0,
      largeImages: 0,
      lazyLoadedImages: 0,
      backgroundImages: 0,
      issues: [],
      imageDetails: []
    };

    for (const image of images) {
      // Count basic metrics
      if (image.hasAlt) {
        analysis.imagesWithAlt++;
      } else {
        analysis.imagesWithoutAlt++;
        if (!image.isBackgroundImage) {
          analysis.issues.push({
            type: 'missing-alt',
            message: `Image missing alt text: ${image.src}`,
            severity: 'high'
          });
        }
      }

      if (image.isLazyLoaded) {
        analysis.lazyLoadedImages++;
      }

      if (image.isBackgroundImage) {
        analysis.backgroundImages++;
      }

      // Analyze image format and size
      try {
        const imageAnalysis = await this.analyzeImageFile(image.src);
        analysis.imageDetails.push(imageAnalysis);
        
        if (imageAnalysis.format === 'webp') {
          analysis.webpImages++;
        }
        
        if (imageAnalysis.isOptimized) {
          analysis.optimizedImages++;
        }
        
        if (imageAnalysis.isLarge) {
          analysis.largeImages++;
          analysis.issues.push({
            type: 'large-image',
            message: `Large image detected: ${image.src} (${imageAnalysis.sizeFormatted})`,
            severity: 'medium'
          });
        }
        
        if (imageAnalysis.format === 'jpeg' || imageAnalysis.format === 'png') {
          analysis.issues.push({
            type: 'format-optimization',
            message: `Consider converting to WebP: ${image.src}`,
            severity: 'low'
          });
        }
        
      } catch (error) {
        logger.warn(`Failed to analyze image: ${image.src}`, error.message);
        analysis.issues.push({
          type: 'analysis-error',
          message: `Failed to analyze image: ${image.src}`,
          severity: 'low'
        });
      }
    }

    return analysis;
  }

  async analyzeImageFile(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
        maxContentLength: this.maxImageSize
      });

      const buffer = Buffer.from(response.data);
      const metadata = await sharp(buffer).metadata();
      
      const sizeInBytes = buffer.length;
      const sizeInKB = Math.round(sizeInBytes / 1024);
      const sizeInMB = Math.round(sizeInBytes / (1024 * 1024) * 100) / 100;
      
      const isLarge = sizeInBytes > 500 * 1024; // 500KB
      const isOptimized = this.isImageOptimized(metadata, sizeInBytes);
      
      return {
        url: imageUrl,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: sizeInBytes,
        sizeFormatted: sizeInMB > 1 ? `${sizeInMB}MB` : `${sizeInKB}KB`,
        isLarge: isLarge,
        isOptimized: isOptimized,
        hasTransparency: metadata.hasAlpha,
        colorSpace: metadata.space,
        density: metadata.density
      };
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  isImageOptimized(metadata, sizeInBytes) {
    const { format, width, height } = metadata;
    
    // WebP is considered optimized
    if (format === 'webp') {
      return true;
    }
    
    // Check if image size is reasonable for its dimensions
    const pixels = width * height;
    const bytesPerPixel = sizeInBytes / pixels;
    
    // Reasonable bytes per pixel thresholds
    const thresholds = {
      jpeg: 0.5,
      png: 1.0,
      gif: 0.3
    };
    
    const threshold = thresholds[format] || 1.0;
    return bytesPerPixel <= threshold;
  }

  calculateOverallScore(analysis) {
    if (analysis.totalImages === 0) {
      return 100; // No images is perfect
    }

    let score = 0;
    let maxScore = 0;

    // Alt text score (40% weight)
    const altScore = (analysis.imagesWithAlt / analysis.totalImages) * 100;
    score += altScore * 0.4;
    maxScore += 100 * 0.4;

    // Format optimization score (30% weight)
    const formatScore = (analysis.webpImages / analysis.totalImages) * 100;
    score += formatScore * 0.3;
    maxScore += 100 * 0.3;

    // Size optimization score (20% weight)
    const sizeScore = Math.max(0, 100 - (analysis.largeImages / analysis.totalImages) * 100);
    score += sizeScore * 0.2;
    maxScore += 100 * 0.2;

    // Lazy loading score (10% weight)
    const lazyScore = (analysis.lazyLoadedImages / analysis.totalImages) * 100;
    score += lazyScore * 0.1;
    maxScore += 100 * 0.1;

    return maxScore > 0 ? Math.round(score / maxScore * 100) : 0;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Alt text recommendations
    if (analysis.imagesWithoutAlt > 0) {
      recommendations.push({
        category: 'images',
        priority: 'high',
        title: 'Add Alt Text to Images',
        description: `${analysis.imagesWithoutAlt} images are missing alt text`,
        impact: 'High impact on accessibility and SEO',
        effort: 'Low effort - quick win',
        resources: [
          'https://web.dev/alt-text/',
          'https://www.w3.org/WAI/tutorials/images/'
        ]
      });
    }

    // Format optimization recommendations
    if (analysis.webpImages < analysis.totalImages * 0.5) {
      recommendations.push({
        category: 'images',
        priority: 'medium',
        title: 'Convert Images to WebP',
        description: 'Consider converting images to WebP format for better compression',
        impact: 'Medium impact on page load speed',
        effort: 'Medium effort - requires development work',
        resources: [
          'https://developers.google.com/speed/webp',
          'https://web.dev/serve-images-webp/'
        ]
      });
    }

    // Size optimization recommendations
    if (analysis.largeImages > 0) {
      recommendations.push({
        category: 'images',
        priority: 'high',
        title: 'Optimize Large Images',
        description: `${analysis.largeImages} images are larger than 500KB`,
        impact: 'High impact on page load speed',
        effort: 'Medium effort - requires image optimization',
        resources: [
          'https://web.dev/fast/#optimize-your-images',
          'https://developers.google.com/speed/docs/insights/OptimizeImages'
        ]
      });
    }

    // Lazy loading recommendations
    if (analysis.lazyLoadedImages < analysis.totalImages * 0.8) {
      recommendations.push({
        category: 'images',
        priority: 'medium',
        title: 'Implement Lazy Loading',
        description: 'Add lazy loading to images below the fold',
        impact: 'Medium impact on initial page load speed',
        effort: 'Low effort - quick win',
        resources: [
          'https://web.dev/lazy-loading-images/',
          'https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading'
        ]
      });
    }

    return recommendations;
  }
}

module.exports = new ImageAnalysisService();
