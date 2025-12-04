import { useCart } from '../../../context/CartContext';
import { formatCurrency } from '../../../utils/formatters';
import Button from '../../common/Button/Button';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} className="product-image" />
        {!product.inStock && <div className="out-of-stock-badge">Out of Stock</div>}
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <span className="stars">{'⭐'.repeat(Math.round(product.rating))}</span>
          <span className="reviews">({product.reviews})</span>
        </div>
        <div className="product-footer">
          <span className="product-price">{formatCurrency(product.price)}</span>
          <Button
            size="small"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
