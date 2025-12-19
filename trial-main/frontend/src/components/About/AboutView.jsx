import React from 'react';
import { ArrowLeft, Users, Building2, Target, Award, Code2 } from 'lucide-react';
import Button from '../common/Button';
import { BRAND, BRAND_COLORS } from '../../utils/constants';

const AboutView = ({ onBack }) => {
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.dark} 0%, ${BRAND_COLORS.primary} 100%)` }}>
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
          <Button variant="outline" onClick={onBack} size="md">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">About {BRAND.name}</h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            {BRAND.slogan}
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg" style={{ background: `rgba(255, 215, 0, 0.15)` }}>
              <Target className="w-8 h-8" style={{ color: BRAND_COLORS.secondary }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
              <p className="text-white/80 leading-relaxed">
                {BRAND.name} is designed to revolutionize compliance verification in the financial sector. 
                We provide intelligent automation tools that ensure regulatory compliance with precision and efficiency, 
                specifically tailored for {BRAND.company}. Our platform combines advanced AI technology with 
                comprehensive regulatory knowledge to deliver accurate, actionable compliance insights.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 mb-12">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 rounded-lg" style={{ background: `rgba(255, 215, 0, 0.15)` }}>
              <Users className="w-8 h-8" style={{ color: BRAND_COLORS.secondary }} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-6">Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {BRAND.team.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-white/10 hover:border-white/30 transition-all"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.secondary} 0%, #FFA500 100%)` }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{member.name}</p>
                        <p className="text-sm text-white/60">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Company Section */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg" style={{ background: `rgba(255, 215, 0, 0.15)` }}>
              <Building2 className="w-8 h-8" style={{ color: BRAND_COLORS.secondary }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Designed for {BRAND.company}</h2>
              <p className="text-white/80 leading-relaxed">
                {BRAND.name} is specifically developed to meet the compliance requirements of {BRAND.company}. 
                Our solution integrates seamlessly with {BRAND.company}'s workflow, ensuring that all financial 
                presentations meet the highest regulatory standards. We understand the unique challenges faced 
                by financial institutions and have built a platform that addresses them directly.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-lg" style={{ background: `rgba(255, 215, 0, 0.15)` }}>
              <Code2 className="w-8 h-8" style={{ color: BRAND_COLORS.secondary }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">Technology & Innovation</h2>
              <p className="text-white/80 leading-relaxed mb-4">
                {BRAND.name} leverages cutting-edge AI and machine learning technologies to provide 
                intelligent compliance verification. Our platform uses advanced natural language processing 
                to understand context and meaning, not just keywords, resulting in more accurate and 
                actionable compliance insights.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-lg border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <Award className="w-6 h-6 mb-2" style={{ color: BRAND_COLORS.secondary }} />
                  <h3 className="font-semibold text-white mb-1">8 Compliance Modules</h3>
                  <p className="text-sm text-white/70">Comprehensive coverage of all regulatory requirements</p>
                </div>
                <div className="p-4 rounded-lg border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <Award className="w-6 h-6 mb-2" style={{ color: BRAND_COLORS.secondary }} />
                  <h3 className="font-semibold text-white mb-1">140+ Validation Rules</h3>
                  <p className="text-sm text-white/70">Extensive rule set for thorough compliance checking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Button variant="primary" onClick={onBack} size="lg">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AboutView;

