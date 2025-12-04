import { useParams, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../../constants/productData';
import { ROUTES } from '../../constants/routes';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button/Button';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const product = PRODUCTS.find((p) => p.id === parseInt(id));

  if (!product) {
    return (
      <div className="pdp-page">
        <div className="pdp-container">
          <div className="product-not-found">
            <h2>Product Not Found</h2>
            <Button onClick={() => navigate(ROUTES.PRODUCTS)}>
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    alert('Product added to cart!');
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate(ROUTES.CART);
  };

  return (
    <div className="pdp-page">
      <div className="pdp-container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <div className="product-detail">
          <div className="product-image-section">
            <img
              src={product.image}
              alt={product.name}
              className="product-detail-image"
            />
          </div>

          <div className="product-info-section">
            <span className="product-category-badge">{product.category}</span>
            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-rating-section">
              <div className="rating-stars">
                {'⭐'.repeat(Math.round(product.rating))}
              </div>
              <span className="rating-text">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            <div className="product-price-section">
              <span className="product-detail-price">
                {formatCurrency(product.price)}
              </span>
              {product.inStock ? (
                <span className="stock-status in-stock">In Stock</span>
              ) : (
                <span className="stock-status out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-features">
              <h3>Features</h3>
              <ul>
                <li>High-quality materials</li>
                <li>30-day money-back guarantee</li>
                <li>Free shipping on orders over $100</li>
                <li>1-year warranty included</li>
              </ul>
            </div>

            <div className="product-actions">
              <Button
                size="large"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                fullWidth
              >
                Add to Cart
              </Button>
              {/* UIFIX AI - BUG - STYLE
                  Description: Buy Now button using 'danger' variant instead of 'secondary'
                  Impact: Button appears red/error color instead of neutral secondary style
                  Expected: variant="secondary" for proper CTA styling */}
              <Button
                size="large"
                variant="danger"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                fullWidth
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
