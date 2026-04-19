import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuthStore();
  const { error: showError, success: showSuccess } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (authError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      showSuccess('Login successful!');
      navigate('/dashboard');
    } else {
      showError(result.error || 'Login failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome aboard, matey!</h2>
      <p className="text-slate-500 text-sm mb-6">Present yer credentials to access the treasure ledger</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="label">
            Parrot Address (Email)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input"
            placeholder="yer.parrot@pirate.sea"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Secret Code (Password)
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input pr-10"
              placeholder="X marks the spot..."
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-gold-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
              Remember this ship
            </label>
          </div>

          <div className="text-sm">
            <button type="button" className="font-medium text-gold-600 hover:text-gold-700">
              Lost yer code?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          {isLoading ? 'Hoisting the sails...' : 'Board the Ship!'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to the crew?{' '}
        <Link to="/register" className="font-medium text-gold-600 hover:text-gold-700 underline decoration-gold-400">
          Join the Pirate Council
        </Link>
      </p>
    </div>
  );
};

export default Login;
