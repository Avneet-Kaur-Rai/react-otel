import { Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../constants/routes';
import './Header.css';

const Header = () => {
  const { getCartCount } = useCart();
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to={ROUTES.HOME} className="logo">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">ShopHub</span>
        </Link>

        <nav className="nav">
          <Link to={ROUTES.PRODUCTS} className="nav-link">
            Products
          </Link>
          <Link to={ROUTES.CART} className="nav-link cart-link">
            🛒 Cart
            {getCartCount() > 0 && (
              <span className="cart-badge">{getCartCount()}</span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">👤 {user?.name}</span>
              <button onClick={logout} className="nav-link logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <Link to={ROUTES.LOGIN} className="nav-link">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
