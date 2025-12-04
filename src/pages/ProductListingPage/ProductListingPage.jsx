import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS, CATEGORIES } from '../../constants/productData';
import { SORT_OPTIONS } from '../../constants/enums';
import { ROUTES } from '../../constants/routes';
import ProductCard from '../../components/features/ProductCard/ProductCard';
import './ProductListingPage.css';

const ProductListingPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
          <h1 className="plp-title">Our Products</h1>
          <p className="plp-subtitle">Discover our amazing collection</p>
        </div>

        <div className="plp-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
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
