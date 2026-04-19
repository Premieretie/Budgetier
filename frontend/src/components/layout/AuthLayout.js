import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-ocean-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-2xl shadow-gold-500/40">
            <span className="text-3xl">💀</span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text text-transparent">
          Budgetier
        </h2>
        <p className="mt-2 text-center text-sm text-parchment-300 italic">
          "Dead men tell no tales... but they keep excellent records!"
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-parchment-50 py-8 px-4 shadow-2xl shadow-black/40 rounded-2xl border-2 border-gold-300 sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
