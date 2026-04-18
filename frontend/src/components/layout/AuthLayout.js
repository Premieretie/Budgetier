import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { WalletIcon } from '@heroicons/react/24/outline';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <WalletIcon className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Budgeter
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Take control of your finances
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
