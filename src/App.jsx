import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ROUTES } from './constants/routes';
import Header from './components/layout/Header/Header';
import LoginPage from './pages/LoginPage/LoginPage';
import ProductListingPage from './pages/ProductListingPage/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage/ProductDetailPage';
import CartPage from './pages/CartPage/CartPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import PaymentPage from './pages/PaymentPage/PaymentPage';
import OrderSummaryPage from './pages/OrderSummaryPage/OrderSummaryPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.PRODUCTS} element={<ProductListingPage />} />
                <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />
                <Route path={ROUTES.CART} element={<CartPage />} />
                <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
                <Route path={ROUTES.PAYMENT} element={<PaymentPage />} />
                <Route path={ROUTES.ORDER_SUMMARY} element={<OrderSummaryPage />} />
              </Routes>
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
