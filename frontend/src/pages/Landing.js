import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎁',
    title: 'Treasure Chest Savings',
    desc: 'Watch your chest fill as you save. Every dollar adds a coin. Hit milestones, unlock rewards.',
    color: 'from-amber-50 to-yellow-100',
    border: 'border-amber-200',
  },
  {
    icon: '🪙',
    title: 'Gold Rewards System',
    desc: 'Earn gold for every expense logged. Spend it to repair your ship. Stay on course.',
    color: 'from-yellow-50 to-amber-100',
    border: 'border-yellow-200',
  },
  {
    icon: '🔥',
    title: 'Daily Streaks',
    desc: 'Log every day, build your streak. 7 days earns a bonus. 30 days? Legendary status.',
    color: 'from-orange-50 to-red-50',
    border: 'border-orange-200',
  },
  {
    icon: '🚢',
    title: 'Storm Recovery',
    desc: "Overspent? Your ship takes damage — but it's never game over. Repair, recover, sail on.",
    color: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
  },
];

const TESTIMONIALS = [
  {
    quote: "I've tried 6 budgeting apps. This is the first one I actually open every day.",
    name: 'Sarah M.',
    role: 'Designer, Sydney',
    avatar: '👩‍🎨',
  },
  {
    quote: "The pirate theme sounds gimmicky — it isn't. It genuinely makes tracking less painful.",
    name: 'James T.',
    role: 'Developer, Melbourne',
    avatar: '👨‍💻',
  },
  {
    quote: "As someone with ADHD, the gamification actually keeps me engaged. Finally.",
    name: 'Alex K.',
    role: 'Teacher, Brisbane',
    avatar: '🧑‍🏫',
  },
];

const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    const increment = end / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    const el = document.getElementById(`counter-${end}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span id={`counter-${end}`}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};

const Landing = () => {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ─── NAV ─── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏴‍☠️</span>
            <span className="text-xl font-bold text-gray-900">Budgetier</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-gray-900 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 text-8xl rotate-12 select-none">🏴‍☠️</div>
          <div className="absolute top-40 right-16 text-6xl -rotate-6 select-none">⚓</div>
          <div className="absolute bottom-20 left-1/4 text-5xl rotate-3 select-none">🪙</div>
          <div className="absolute bottom-10 right-1/3 text-4xl -rotate-12 select-none">🗺️</div>
        </div>
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-300 text-sm font-medium mb-8">
            <span>⚡</span>
            <span>Built for ADHD-friendly money tracking</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Budgeting for people<br />
            <span className="text-amber-400">who hate budgeting</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track money, earn gold, and stay on course. Turn your finances into an adventure
            with streaks, rewards, and a ship that needs you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95"
            >
              Start your journey →
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all border border-white/20"
            >
              See how it works
            </a>
          </div>

          <p className="text-slate-400 text-sm">Free forever plan • No credit card required</p>

          {/* App preview mockup */}
          <div className="mt-16 relative max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-4 shadow-2xl">
              <div className="bg-gradient-to-b from-blue-950 to-slate-900 rounded-2xl overflow-hidden">
                {/* Mock header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-sm">🏴‍☠️</div>
                    <div>
                      <p className="text-white text-xs font-semibold">Ahoy, Captain!</p>
                      <p className="text-slate-400 text-xs">7 day streak 🔥</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-500/20 rounded-full px-3 py-1">
                    <span className="text-xs">🪙</span>
                    <span className="text-amber-300 text-xs font-bold">2,450</span>
                  </div>
                </div>
                {/* Mock quick-add buttons */}
                <div className="p-4 grid grid-cols-4 gap-2">
                  {[['☕','$5'],['🍔','$15'],['⛽','$60'],['🛒','$80']].map(([icon, price]) => (
                    <div key={price} className="bg-white/10 rounded-xl p-2 text-center">
                      <div className="text-xl mb-1">{icon}</div>
                      <div className="text-white text-xs font-medium">{price}</div>
                    </div>
                  ))}
                </div>
                {/* Mock stats */}
                <div className="p-4 grid grid-cols-3 gap-2">
                  <div className="bg-amber-500/20 rounded-xl p-3 text-center">
                    <div className="text-amber-300 text-lg font-bold">Lv.8</div>
                    <div className="text-slate-400 text-xs">Captain</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-blue-300 text-lg font-bold">84%</div>
                    <div className="text-slate-400 text-xs">Ship health</div>
                  </div>
                  <div className="bg-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-green-300 text-lg font-bold">🔥7</div>
                    <div className="text-slate-400 text-xs">Streak</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -left-4 top-1/3 bg-white rounded-2xl shadow-xl px-4 py-3 text-sm font-medium text-gray-800 animate-bounce">
              🎉 +50 gold earned!
            </div>
            <div className="absolute -right-4 bottom-1/4 bg-amber-50 border border-amber-200 rounded-2xl shadow-xl px-4 py-3 text-sm font-medium text-amber-800">
              🏆 Achievement unlocked!
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 40 960 60 720 50C480 40 240 10 0 30L0 60Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-extrabold text-gray-900">
              <AnimatedCounter end={5200} suffix="+" />
            </p>
            <p className="text-sm text-gray-500 mt-1">Expenses tracked</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-500">
              <AnimatedCounter end={1200000} suffix="+" />
            </p>
            <p className="text-sm text-gray-500 mt-1">Gold coins earned</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-gray-900">
              <AnimatedCounter end={98} suffix="%" />
            </p>
            <p className="text-sm text-gray-500 mt-1">Would recommend</p>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Your finances, but actually fun
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Everything you need to stay on top of money, wrapped in a system that rewards you for trying.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-3xl bg-gradient-to-br ${f.color} border ${f.border} p-8 hover:shadow-lg transition-all hover:-translate-y-1`}
              >
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Up and sailing in 60 seconds
            </h2>
            <p className="text-gray-500 text-lg">No spreadsheets. No complicated setup.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '⚓', title: 'Create your account', desc: 'Sign up free. Your ship is ready to sail immediately.' },
              { step: '02', icon: '💰', title: 'Log your first expense', desc: 'Tap a quick-add button. That\'s it. You just earned gold.' },
              { step: '03', icon: '🏆', title: 'Watch the rewards roll in', desc: 'Streaks, loot drops, level-ups. Every session feels like progress.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-3xl mx-auto mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-2">Step {s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Real people, real results
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              "Built for ADHD-friendly money tracking" — because one size doesn't fit all.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:shadow-md transition-all">
                <div className="text-4xl mb-4">{t.avatar}</div>
                <p className="text-gray-700 text-base leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-gray-500 text-lg">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-3xl border-2 border-gray-200 p-8 bg-white">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Free</h3>
                <p className="text-gray-500 text-sm">Everything you need to start</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$0</span>
                  <span className="text-gray-400 text-sm"> / forever</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '✅ Expense tracking',
                  '✅ 3 active goals',
                  '✅ Gold & streak system',
                  '✅ Quick-add buttons',
                  '✅ Basic achievements',
                  '❌ Custom themes',
                  '❌ Unlimited goals',
                  '❌ Advanced stats',
                ].map((item) => (
                  <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-3xl border-2 border-amber-400 p-8 bg-gradient-to-b from-amber-50 to-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
                <p className="text-gray-500 text-sm">For serious treasure hunters</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$7</span>
                  <span className="text-gray-400 text-sm"> / month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '✅ Everything in Free',
                  '✅ Unlimited goals',
                  '✅ Advanced charts & stats',
                  '✅ Custom ship themes',
                  '✅ Rare loot drops',
                  '✅ Premium achievements',
                  '✅ Priority support',
                  '✅ Early access to AI insights',
                ].map((item) => (
                  <li key={item} className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register?plan=premium"
                className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-amber-300"
              >
                Start free trial
              </Link>
              <p className="text-center text-xs text-gray-400 mt-3">7-day free trial • Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center select-none pointer-events-none">
          🏴‍☠️
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Take control of your money today
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of captains who turned financial chaos into a winning voyage.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full sm:w-72 px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-base"
            />
            <Link
              to={`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Start your journey →
            </Link>
          </div>
          <p className="text-slate-400 text-sm">Free forever • No credit card • Cancel anytime</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏴‍☠️</span>
              <span className="text-white font-bold">Budgetier</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <a href="mailto:hello@budgetier.ink" className="hover:text-white transition-colors">Contact</a>
              <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
            </div>
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} Budgetier. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
