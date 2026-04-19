import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { isValidEmail, validatePassword } from '../../utils/helpers';

const Register = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuthStore();
  const { error: showError, success: showSuccess } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    consentGiven: false,
    dataRetentionAgreement: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (authError) clearError();

    // Validate password in real-time
    if (name === 'password') {
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      showError('Please fill in all required fields');
      return;
    }

    if (!isValidEmail(formData.email)) {
      showError('Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      showError('Please fix password requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (!formData.consentGiven) {
      showError('You must accept the Privacy Policy to continue');
      return;
    }

    setIsLoading(true);
    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      consentGiven: formData.consentGiven,
      dataRetentionAgreement: formData.dataRetentionAgreement,
    });
    setIsLoading(false);

    if (result.success) {
      showSuccess('Account created successfully!');
      navigate('/dashboard');
    } else {
      showError(result.error || 'Registration failed');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Join the Crew!</h2>
      <p className="text-slate-500 text-sm mb-6">Swear allegiance to the Pirate Code and start yer treasure tracking</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label">
              Pirate Name <span className="text-crimson-500">*</span>
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="input"
              placeholder="Blackbeard"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="label">
              Family Name <span className="text-crimson-500">*</span>
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="input"
              placeholder="the Fearsome"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Parrot Address (Email) <span className="text-crimson-500">*</span>
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
            placeholder="captain@pirate.sea"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Secret Code (Password) <span className="text-crimson-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input pr-10"
              placeholder="Make it harder than Davy Jones' locker..."
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
          
          {/* Password requirements */}
          {passwordErrors.length > 0 && (
            <ul className="mt-2 text-xs text-red-600 space-y-1">
              {passwordErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirm Secret Code <span className="text-crimson-500">*</span>
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
            placeholder="X marks the spot..."
          />
          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
        </div>

        {/* Privacy consent */}
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  id="consentGiven"
                  name="consentGiven"
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="consentGiven" className="text-sm font-medium text-gray-700">
                  I agree to the Privacy Policy <span className="text-red-500">*</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                We collect and store your financial data securely. You can view and delete your data at any time.{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Read full policy
                </button>
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          {isLoading ? 'Hoisting the Jolly Roger...' : 'Take the Oath & Join!'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already part of the crew?{' '}
        <Link to="/login" className="font-medium text-gold-600 hover:text-gold-700 underline decoration-gold-400">
          Board the Ship
        </Link>
      </p>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        size="lg"
      >
        <div className="prose prose-sm max-w-none">
          <h4>Information We Collect</h4>
          <p>
            We collect your email address, name, and financial data (income, expenses, budgets, goals)
            to provide our budgeting services.
          </p>
          
          <h4>How We Use Your Data</h4>
          <p>
            Your data is used solely to provide you with budgeting features, generate financial reports,
            and send you notifications about your financial goals and budget alerts.
          </p>
          
          <h4>Data Security</h4>
          <p>
            We use industry-standard security practices including:
          </p>
          <ul>
            <li>Password hashing with bcrypt</li>
            <li>JWT-based authentication</li>
            <li>Input validation and sanitization</li>
            <li>Rate limiting to prevent abuse</li>
          </ul>
          
          <h4>Your Rights</h4>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access all your stored data</li>
            <li>Export your data in a portable format</li>
            <li>Delete your account and all associated data</li>
            <li>Withdraw consent at any time</li>
          </ul>
          
          <h4>Data Retention</h4>
          <p>
            We retain your data as long as your account is active. When you delete your account,
            all your data is permanently removed from our systems within 30 days.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
