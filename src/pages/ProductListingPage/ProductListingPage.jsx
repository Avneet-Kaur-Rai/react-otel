import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../../constants/productData';
import { SORT_OPTIONS } from '../../constants/enums';
import { ROUTES } from '../../constants/routes';
import ProductCard from '../../components/features/ProductCard/ProductCard';
import { tracer, businessMetrics, logger } from '../../telemetry/telemetry';
import { isDemoActive, demoDelay, getExperimentGroup, showDemoBanner } from '../../utils/demoHelpers';
import './ProductListingPage.css';

const ProductListingPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // DEMO SCENARIOS: Track page performance and experiments
  // ============================================================================
  useEffect(() => {
    showDemoBanner();
    
    return tracer.startActiveSpan('page.product_listing.load', (span) => {
      const loadStart = performance.now();
      
      span.setAttribute('page.name', 'ProductListingPage');
      span.setAttribute('page.route', '/products');
      span.setAttribute('products.total', PRODUCTS.length);
      
      // 🎬 DEMO SCENARIO 5: A/B Test Experiment
      if (isDemoActive('experiment')) {
        const experimentGroup = getExperimentGroup();
        span.setAttribute('experiment.id', 'ai_recommendations_v1');
        span.setAttribute('experiment.group', experimentGroup);
        span.setAttribute('demo.scenario', 'experiment');
        
        logger.info('A/B Test - User assigned to experiment group', {
          'experiment.id': 'ai_recommendations_v1',
          'experiment.group': experimentGroup
        });
        
        if (experimentGroup === 'treatment') {
          // Simulate AI recommendations loading
          span.addEvent('loading_ai_recommendations');
          const aiStart = performance.now();
          
          logger.info('Loading AI recommendations for treatment group');
          demoDelay(500); // AI takes 500ms
          
          const aiDuration = performance.now() - aiStart;
          span.setAttribute('ai.recommendations.duration_ms', aiDuration);
          span.addEvent('ai_recommendations_loaded', {
            'duration_ms': aiDuration
          });
          
          logger.info('AI recommendations loaded', {
            'duration_ms': aiDuration,
            'recommendations.count': 4
          });
        }
      }
      
      // 🎬 DEMO SCENARIO 2: Slow Page Load
      if (isDemoActive('slow-page')) {
        span.setAttribute('demo.scenario', 'slow-page');
        span.addEvent('simulating_slow_page_load');
        
        logger.warn('DEMO: Simulating slow image loading (2s delay)', {
          'demo.scenario': 'slow-page'
        });
        
        demoDelay(2000); // Simulate slow image loading
        span.addEvent('slow_page_load_completed');
      }
      
      const duration = performance.now() - loadStart;
      span.setAttribute('page.load.duration_ms', duration);
      
      // Track slow page loads
      if (duration > 3000) {
        businessMetrics.productSearches.add(1, {
          'performance': 'slow',
          'duration_ms': Math.round(duration).toString()
        });
        
        logger.warn('Slow page load detected', {
          'duration_ms': duration,
          'threshold_ms': 3000,
          'userAgent': navigator.userAgent,
          'connection': navigator.connection?.effectiveType || 'unknown'
        });
      } else {
        logger.info('Product listing page loaded', {
          'duration_ms': duration,
          'products.count': PRODUCTS.length
        });
      }
      
      span.end();
    });
  }, []);

  const filterProducts = () => {
    let filtered = [...PRODUCTS];

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    if (sortBy === SORT_OPTIONS.PRICE_LOW_HIGH) {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === SORT_OPTIONS.PRICE_HIGH_LOW) {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === SORT_OPTIONS.NAME_A_Z) {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === SORT_OPTIONS.RATING) {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  const filteredProducts = filterProducts();

  return (
    <div className="plp-page">
      <div className="plp-container">
        <div className="plp-header">
          <h1 className="plp-title">Our Collection</h1>
          <p className="plp-subtitle">Discover timeless fashion pieces</p>
        </div>

        <div className="plp-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Category:</label>
            <div className="category-buttons">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`category-btn ${
                    selectedCategory === category ? 'active' : ''
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="">Default</option>
              <option value={SORT_OPTIONS.PRICE_LOW_HIGH}>Price: Low to High</option>
              <option value={SORT_OPTIONS.PRICE_HIGH_LOW}>Price: High to Low</option>
              <option value={SORT_OPTIONS.NAME_A_Z}>Name: A to Z</option>
              <option value={SORT_OPTIONS.RATING}>Rating</option>
            </select>
          </div>
        </div>

        <div className="products-count">
          Showing {filteredProducts.length} products
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="product-link"
            >
              <ProductCard product={product} />
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="no-products">
            <p>No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListingPage;
