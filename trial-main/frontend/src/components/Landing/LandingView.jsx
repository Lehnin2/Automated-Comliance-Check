import React from 'react';
import { ArrowRight, Shield, FileSearch, Zap, Users, CheckCircle, Sparkles, TrendingUp, Lock, BarChart3 } from 'lucide-react';
import Button from '../common/Button';
import { BRAND, BRAND_COLORS } from '../../utils/constants';

const LandingView = ({ onGetStarted, onViewHistory, onAbout }) => {
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.primary} 50%, ${BRAND_COLORS.dark} 100%)` }}>
      {/* Navigation */}
      <nav className="px-8 py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/images/logos/logo.PNG" 
              alt="VeriDeck" 
              className="h-10 object-contain"
              style={{ filter: 'brightness(0) invert(1)' }} // Rendre le logo blanc
              onError={(e) => {
                // Fallback vers le logo V si l'image n'existe pas
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 rounded-lg hidden items-center justify-center font-bold text-xl text-white" style={{ background: BRAND_COLORS.secondary }}>
              V
            </div>
            <span className="text-2xl font-bold text-white">{BRAND.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onAbout}
              className="px-4 py-2 text-white/80 hover:text-white transition"
            >
              About
            </button>
            <button
              onClick={onViewHistory}
              className="px-4 py-2 text-white/80 hover:text-white transition"
            >
              History
            </button>
            <Button variant="primary" onClick={onGetStarted} size="md" style={{ 
              background: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, #FFA500 100%)`,
              border: 'none'
            }}>
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 text-white/90" style={{ background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
            <Sparkles className="w-4 h-4" style={{ color: BRAND_COLORS.secondary }} />
            Powered by {BRAND.company}
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            {BRAND.name}
          </h1>
          
          <p className="text-2xl md:text-3xl text-white/90 mb-4 font-light">
            {BRAND.slogan}
          </p>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            Automated regulatory compliance validation for financial presentations.
            Ensure your documents meet all regulatory requirements with AI-powered precision.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onGetStarted && onGetStarted('upload')}
              className="px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              style={{ 
                background: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, #FFA500 100%)`,
                border: 'none'
              }}
            >
              Start Compliance Check
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onViewHistory}
              className="px-8 py-4 text-lg border-2 text-white hover:bg-white/10"
            >
              View History
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex justify-center gap-12 mb-20 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: BRAND_COLORS.secondary }} />
            <span>8 Compliance Modules</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: BRAND_COLORS.secondary }} />
            <span>140+ Validation Rules</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" style={{ color: BRAND_COLORS.secondary }} />
            <span>AI-Powered Analysis</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Complete Coverage"
            description="ESG, disclaimers, performance, structure, and more - all checked automatically."
            color={BRAND_COLORS.secondary}
          />
          <FeatureCard
            icon={<FileSearch className="w-8 h-8" />}
            title="Smart Analysis"
            description="Our AI understands context, not just keywords. Fewer false positives, more accuracy."
            color={BRAND_COLORS.accent}
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Save Hours"
            description="What used to take hours of manual review now takes minutes. Time is money."
            color={BRAND_COLORS.secondary}
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Clear Guidance"
            description="Every issue comes with a clear explanation and how to fix it. No guesswork."
            color={BRAND_COLORS.accent}
          />
        </div>

        {/* How it works */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12 mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Upload', desc: 'Drop your PowerPoint and metadata file', icon: <FileSearch /> },
              { step: '2', title: 'Preview', desc: 'See your slides and pick which checks to run', icon: <TrendingUp /> },
              { step: '3', title: 'Analyze', desc: 'Our AI scans every slide for issues', icon: <BarChart3 /> },
              { step: '4', title: 'Fix', desc: 'Get a clear list of what needs attention', icon: <Lock /> }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, #FFA500 100%)` }}
                >
                  {item.step}
                </div>
                <div className="mb-3 flex justify-center" style={{ color: BRAND_COLORS.secondary }}>
                  {item.icon}
                </div>
                <h4 className="font-semibold text-white mb-2 text-lg">{item.title}</h4>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-12">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to ensure compliance?</h3>
          <p className="text-white/70 mb-8 text-lg">Start validating your presentations today</p>
          <Button
            variant="primary"
            size="lg"
            onClick={onGetStarted}
            className="px-10 py-4 text-lg"
            style={{ 
              background: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, #FFA500 100%)`,
              border: 'none'
            }}
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }) => {
  return (
    <div
      className="p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
      style={{ background: 'rgba(255, 255, 255, 0.05)' }}
    >
      <div className="mb-4" style={{ color }}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default LandingView;

