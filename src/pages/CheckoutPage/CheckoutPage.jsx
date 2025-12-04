import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { validateEmail, validatePhone, validateZipCode } from '../../utils/validators';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Store checkout data in sessionStorage
    sessionStorage.setItem('checkoutData', JSON.stringify(formData));
    navigate(ROUTES.PAYMENT);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2 className="section-title">Contact Information</h2>
              <div className="form-row">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
              <Input
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="(555) 555-5555"
                required
              />
            </div>

            <div className="form-section">
              <h2 className="section-title">Shipping Address</h2>
              <Input
                label="Street Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                required
              />
              <div className="form-row">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  required
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  error={errors.state}
                  required
                />
              </div>
              <div className="form-row">
                <Input
                  label="ZIP Code"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  error={errors.zipCode}
                  placeholder="12345"
                  required
                />
                <Input
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled
                />
              </div>
            </div>

            <div className="form-actions">
              {/* UIFIX AI - BUG - UI/UX
                  Description: Missing "Back to Cart" button - users cannot go back without browser back button
                  Impact: Poor UX - users stuck on checkout page with no back navigation
                  Expected: Should have a "Back to Cart" button using variant="outline" */}
              <Button type="submit" size="large">
                Continue to Payment
              </Button>
            </div>
          </form>

          <div className="checkout-sidebar">
            <div className="order-info">
              <h3>Order Information</h3>
              <p>Complete your shipping information to proceed with payment.</p>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-icon">📦</span>
                  <div>
                    <h4>Free Shipping</h4>
                    <p>On orders over $100</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">🔒</span>
                  <div>
                    <h4>Secure Checkout</h4>
                    <p>Your data is protected</p>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-icon">↩️</span>
                  <div>
                    <h4>Easy Returns</h4>
                    <p>30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
