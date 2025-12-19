// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Polling Configuration
export const POLLING_INTERVAL = 2000; // milliseconds

// View States
export const VIEWS = {
  LANDING: 'landing',
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  PROCESSING: 'processing',
  RESULTS: 'results',
  HISTORY: 'history',
  JSON_VIEWER: 'json-viewer',
  HISTORY_DETAIL: 'history-detail'
};

// Compliance Modules
export const MODULES = [
  { id: 'Structure', name: 'Structure', description: 'Document format and layout' },
  { id: 'Registration', name: 'Registration', description: 'Fund registration requirements' },
  { id: 'ESG', name: 'ESG', description: 'ESG compliance' },
  { id: 'Disclaimers', name: 'Disclaimers', description: 'Required disclaimers' },
  { id: 'Performance', name: 'Performance', description: 'Performance rules' },
  { id: 'Values', name: 'Values', description: 'Securities mentions' },
  { id: 'Prospectus', name: 'Prospectus', description: 'Prospectus alignment' },
  { id: 'General', name: 'General', description: 'General rules' }
];

// Extraction Methods
export const EXTRACTION_METHODS = [
  { id: 'MO', name: 'Standard Extraction', description: 'Fast extraction using python-pptx library' },
  { id: 'FD', name: 'AI Multi-Agent', description: 'Advanced AI-powered extraction with LangGraph (Gemini Multi-Agent system)' },
  { id: 'SF', name: 'Exhaustive Analysis', description: 'Comprehensive extraction with Groq for detailed analysis' },
  { id: 'SL', name: 'Parallel Processing', description: 'High-performance parallel extraction with TokenFactory' }
];

// Brand Information
export const BRAND = {
  name: 'VeriDeck',
  slogan: 'Smarter automation for compliance verification',
  company: 'ODDO BHF',
  team: [
    { name: 'Fida Naimi', role: 'Project Lead & AI Specialist' },
    { name: 'Mohamed Sillini', role: 'Backend Developer' },
    { name: 'Ghassen Bousselm', role: 'Frontend Developer' },
    { name: 'Cyrine Maalel', role: 'UI/UX Designer' },
    { name: 'Safa Bachagha', role: 'Compliance Analyst' },
    { name: 'Selim Manai', role: 'Full Stack Developer' }
  ]
};

// ODDO BHF Brand Colors (Legacy - use ODDO_COLORS from oddoColors.js instead)
export const BRAND_COLORS = {
  primary: '#C41E3A',      // Rouge bordeaux ODDO BHF
  secondary: '#FFFFFF',    // Blanc
  accent: '#DC143C',        // Crimson accent
  dark: '#1A1A1A',          // Noir
  light: '#F8F9FA',         // Fond clair
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

// Severity Levels
export const SEVERITY = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor'
};

// Severity Colors (for Tailwind)
export const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    border: 'border-red-500/30',
    icon: 'text-red-400'
  },
  major: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
    border: 'border-orange-500/30',
    icon: 'text-orange-400'
  },
  minor: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-300',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-400'
  }
};

// Job Status
export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PREVIEW: 'preview'
};

// Review Status
export const REVIEW_STATUS = {
  PENDING_REVIEW: 'pending_review',
  VALIDATED: 'validated',
  NEEDS_REVISION: 'needs_revision'
};

