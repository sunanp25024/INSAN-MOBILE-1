"use client";

import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Performance monitoring component
const PerformanceMonitor = () => {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return;

    // Function to send metrics to analytics
    const sendToAnalytics = (metric: any) => {
      // You can replace this with your analytics service
      console.log('Web Vital:', metric);
      
      // Example: Send to Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
    };

    // Measure Core Web Vitals
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);

    // Custom performance measurements
    const measureCustomMetrics = () => {
      if ('performance' in window) {
        // Measure navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.connectEnd - navigation.secureConnectionStart,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
            domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          };

          console.log('Navigation Metrics:', metrics);
        }

        // Measure resource timing
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources.filter((resource: any) => resource.duration > 1000);
        if (slowResources.length > 0) {
          console.log('Slow Resources:', slowResources);
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measureCustomMetrics();
    } else {
      window.addEventListener('load', measureCustomMetrics);
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      });
    }

    // Long task monitoring
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('Long Task:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Layout shift monitoring
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              console.log('Layout Shift:', {
                value: (entry as any).value,
                sources: (entry as any).sources,
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        return () => {
          longTaskObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }, []);

  return null; // This component doesn't render anything
};

// Hook for performance monitoring
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor component mount time
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const mountTime = endTime - startTime;
      
      if (mountTime > 100) { // Log if component takes more than 100ms
        console.log('Slow component mount:', mountTime);
      }
    };
  }, []);
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  if (typeof window === 'undefined') return;

  const budget = {
    maxBundleSize: 250 * 1024, // 250KB
    maxImageSize: 100 * 1024,  // 100KB
    maxFontSize: 50 * 1024,    // 50KB
  };

  const resources = performance.getEntriesByType('resource');
  
  resources.forEach((resource: any) => {
    const size = resource.transferSize || resource.encodedBodySize;
    
    if (resource.name.includes('.js') && size > budget.maxBundleSize) {
      console.warn('Bundle size exceeds budget:', resource.name, size);
    }
    
    if (resource.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && size > budget.maxImageSize) {
      console.warn('Image size exceeds budget:', resource.name, size);
    }
    
    if (resource.name.match(/\.(woff|woff2|ttf|otf)$/i) && size > budget.maxFontSize) {
      console.warn('Font size exceeds budget:', resource.name, size);
    }
  });
};

export default PerformanceMonitor;