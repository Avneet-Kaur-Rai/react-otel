import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import { CAROUSEL_IMAGES } from '../../constants/productData';
import { validateEmail, validatePassword } from '../../utils/validators';
import Carousel from '../../components/common/Carousel/Carousel';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import './LoginPage.css';

const LoginPage = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState({});
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignup && !formData.name.trim()) {
      newErrors.name = 'Name is required';
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

    if (isSignup) {
      signup(formData.email, formData.password, formData.name);
    } else {
      login(formData.email);
    }

    navigate(ROUTES.PRODUCTS);
  };

  return (
    <div className="login-page">
      <div className="login-carousel">
        <Carousel items={CAROUSEL_IMAGES} />
      </div>

      <div className="login-form-container">
        <div className="login-form-wrapper">
          <h1 className="login-title">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="login-subtitle">
            {isSignup
              ? 'Sign up to start shopping'
              : 'Login to continue your shopping experience'}
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {isSignup && (
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Enter your name"
                required
              />
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your password"
              required
            />

            <Button type="submit" fullWidth size="large">
              {isSignup ? 'Sign Up' : 'Login'}
            </Button>
          </form>

          <div className="login-toggle">
            <p>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="toggle-btn"
              >
                {isSignup ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
