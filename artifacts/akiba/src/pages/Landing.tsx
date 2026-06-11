import { Link } from "wouter";
import { Shield, Users, TrendingUp, Smartphone, ArrowRight, CheckCircle } from "lucide-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80&fit=crop";
const COMMUNITY_IMAGE = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80&fit=crop";
const MPESA_IMAGE = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&fit=crop";

const features = [
  {
    icon: Users,
    title: "Group Savings",
    desc: "Pool funds with your chama members and track every contribution transparently.",
  },
  {
    icon: TrendingUp,
    title: "Loan Management",
    desc: "Issue loans, track repayments, and monitor interest — all in one place.",
  },
  {
    icon: Smartphone,
    title: "M-Pesa Integration",
    desc: "Trigger STK Push payments directly from the app. No cash, no hassle.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Role-based access, real-time balances, and full audit trail for every transaction.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-green-700">AKIBA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/sign-up">
              <button className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/75 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Built for Kenyan Chamas
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Manage Your <span className="text-green-400">Chama</span> the Smart Way
            </h1>
            <p className="text-lg text-green-100/80 mb-8 leading-relaxed">
              Track savings, manage loans, and collect contributions via M-Pesa — all in one secure platform built for community savings groups.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/sign-up">
                <button className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-900/30 text-base">
                  Start for Free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all text-base">
                  Sign In
                </button>
              </Link>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {["No setup fee", "M-Pesa payments built in", "Full loan & contribution tracking"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-green-200 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything your chama needs
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              From tracking monthly contributions to issuing emergency loans — Akiba covers the full lifecycle of a savings group.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split sections */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img src={COMMUNITY_IMAGE} alt="Community savings group" className="w-full h-72 object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for how chamas actually work
            </h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Akiba is designed around the real workflows of Kenyan savings groups — weekly or monthly contributions, rotating loans, member roles, and group governance.
            </p>
            <ul className="space-y-3">
              {["Track contributions per member", "Assign chairperson, treasurer & secretary roles", "Monitor loan repayment progress", "See your group's total pooled savings"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-24 bg-green-950">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              M-Pesa payments, right in the app
            </h2>
            <p className="text-green-200 mb-6 leading-relaxed">
              Send an STK Push to any member's phone and let them pay their contribution or loan repayment without leaving the app. No manual bank transfers, no chasing receipts.
            </p>
            <Link href="/sign-up">
              <button className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-all">
                Get started <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-green-800">
            <img src={MPESA_IMAGE} alt="M-Pesa mobile payment" className="w-full h-72 object-cover" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-green-600">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to modernise your chama?
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            Join chamas already using Akiba to save smarter and lend confidently.
          </p>
          <Link href="/sign-up">
            <button className="px-8 py-4 bg-white text-green-700 font-bold rounded-xl text-lg hover:bg-green-50 transition-all shadow-lg">
              Create your free account
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Akiba. Built for Kenyan savings groups.
      </footer>
    </div>
  );
}
