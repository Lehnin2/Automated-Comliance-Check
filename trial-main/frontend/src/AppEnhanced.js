import { useState, useEffect, useRef } from 'react';
import {
    Upload, CheckCircle, AlertCircle, Info, Download,
    Loader, FileText, Clock, XCircle, Trash2,
    Eye, Play, CheckSquare, Square, Home, Code, RefreshCw,
    History, ClipboardCheck, AlertTriangle, Send
} from 'lucide-react';
import axios from 'axios';
import './App.css';
import { EXTRACTION_METHODS, MODULES, VIEWS } from './utils/constants';
import { ODDO_COLORS } from './utils/oddoColors';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import UploadView from './components/Upload/UploadView';
import HistoryView from './components/History/HistoryView';

const API_BASE_URL = 'http://localhost:8000';

function AppEnhanced({ initialView = 'upload', onNavigate }) {
    const [view, setView] = useState(initialView);
    const [showAbout, setShowAbout] = useState(false);
    
    // Update view when initialView prop changes
    useEffect(() => {
        if (initialView) {
            setView(initialView);
        }
    }, [initialView]);
    const [pptxFile, setPptxFile] = useState(null);
    const [metadataFile, setMetadataFile] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [slides, setSlides] = useState([]);
    const [selectedSlide, setSelectedSlide] = useState(0);
    const [selectedModules, setSelectedModules] = useState(MODULES.map(m => m.id));
    const [violations, setViolations] = useState([]);
    const [error, setError] = useState(null);
    const [extractionMethod, setExtractionMethod] = useState('MO');
    const [parallelWorkers, setParallelWorkers] = useState(4);
    const [extractedJson, setExtractedJson] = useState(null);
    const [decisionTrace, setDecisionTrace] = useState(null);
    const [showModuleSelector, setShowModuleSelector] = useState(false);
    const eventSourceRef = useRef(null);
    // History state
    const [historyData, setHistoryData] = useState([]);
    const [historyStats, setHistoryStats] = useState(null);
    const [selectedHistoryJob, setSelectedHistoryJob] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (jobId && view === 'processing') {
            const interval = setInterval(async () => {
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/status/${jobId}`);
                    setJobStatus(response.data);
                    if (response.data.status === 'completed') {
                        clearInterval(interval);
                        await loadResults(jobId);
                    } else if (response.data.status === 'failed') {
                        clearInterval(interval);
                        setError(response.data.message || 'Processing failed');
                        setView('preview');
                    }
                } catch (err) {
                    console.error('Status check error:', err);
                }
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [jobId, view]);

    // Auto-load history data when entering history view
    useEffect(() => {
        if (view === 'history' || view === VIEWS.HISTORY) {
            console.log('Loading history data automatically...');
            // Call loadHistory function when it's available
            const loadHistoryData = async () => {
                try {
                    const [historyRes, statsRes] = await Promise.all([
                        axios.get(`${API_BASE_URL}/api/history`),
                        axios.get(`${API_BASE_URL}/api/history/stats`)
                    ]);
                    console.log('History loaded:', historyRes.data.jobs?.length || 0, 'jobs');
                    setHistoryData(historyRes.data.jobs || []);
                    setHistoryStats(statsRes.data);
                } catch (err) {
                    console.error('Failed to load history:', err);
                    setError('Failed to load history');
                }
            };
            loadHistoryData();
        }
    }, [view]);

    const loadResults = async (jId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/download/${jId}/violations`);
            setViolations(response.data.all_violations || []);
            setView('results');
        } catch (err) {
            setError('Failed to load compliance results');
        }
    };

    const [jsonLoading, setJsonLoading] = useState(false);
    const loadExtractedJson = async () => {
        if (!jobId) { setError('No job ID found'); return; }
        setJsonLoading(true);
        // Navigate to JSON viewer immediately so the user sees a loading state
        setView('json-viewer');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/extracted-json`);
            setExtractedJson(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load extracted JSON');
        } finally {
            setJsonLoading(false);
        }
    };

    const fallbackFetchDecisionTrace = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/extracted-json`);
            setDecisionTrace(response.data?.decision_trace || []);
        } catch (err) {
            setError('Failed to load decision trace');
        }
    };

    const loadDecisionTrace = async () => {
        if (!jobId) { setError('No job ID found'); return; }
        // Close any existing stream
        if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
        // Initialize trace container
        setDecisionTrace([]);
        try {
            if ('EventSource' in window) {
                const es = new EventSource(`${API_BASE_URL}/api/stream/${jobId}/decision-trace`);
                eventSourceRef.current = es;
                es.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        if (data.type === 'sse_start') { return; }
                        if (data.type === 'sse_end') {
                            es.close();
                            eventSourceRef.current = null;
                            return;
                        }
                        setDecisionTrace(prev => Array.isArray(prev) ? [...prev, data] : [data]);
                    } catch (parseErr) {
                        console.error('SSE parse error:', parseErr);
                    }
                };
                es.onerror = (err) => {
                    console.error('SSE error:', err);
                    es.close();
                    eventSourceRef.current = null;
                    // Fallback to single fetch
                    fallbackFetchDecisionTrace();
                };
            } else {
                // Browser does not support SSE
                fallbackFetchDecisionTrace();
            }
        } catch (err) {
            console.error('Trace start failed:', err);
            fallbackFetchDecisionTrace();
        }
    };

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [view, jobId]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            console.log('Loading history from API...');
            const [historyRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/history`),
                axios.get(`${API_BASE_URL}/api/history/stats`)
            ]);
            console.log('History loaded:', historyRes.data.jobs?.length || 0, 'jobs');
            setHistoryData(historyRes.data.jobs || []);
            setHistoryStats(statsRes.data);
        } catch (err) {
            console.error('Failed to load history:', err);
            setError('Failed to load history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const updateReviewStatus = async (jobIdToUpdate, newStatus) => {
        try {
            const formData = new FormData();
            formData.append('review_status', newStatus);
            if (reviewNotes) formData.append('reviewer_notes', reviewNotes);
            await axios.put(`${API_BASE_URL}/api/history/${jobIdToUpdate}/review`, formData);
            setReviewNotes('');
            await loadHistory();
        } catch (err) {
            setError('Failed to update review status');
        }
    };

    const deleteHistoryJob = async (jobIdToDelete) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/history/${jobIdToDelete}`);
            await loadHistory();
        } catch (err) {
            setError('Failed to delete job');
        }
    };

    const viewHistoryJob = async (historyJob) => {
        setSelectedHistoryJob(historyJob);
        setJobId(historyJob.job_id);
        try {
            // Load slides
            const slidesRes = await axios.get(`${API_BASE_URL}/api/slides/${historyJob.job_id}`);
            setSlides(slidesRes.data.slides || []);
            // Load violations if completed
            if (historyJob.status === 'completed') {
                const violRes = await axios.get(`${API_BASE_URL}/api/download/${historyJob.job_id}/violations`);
                setViolations(violRes.data.all_violations || []);
            }
            setView('history-detail');
        } catch (err) {
            setError('Failed to load job details');
        }
    };

    const handleUploadForPreview = async () => {
        if (!pptxFile || !metadataFile) {
            setError('Please upload both PowerPoint and metadata files');
            return;
        }
        setError(null);
        const formData = new FormData();
        formData.append('pptx_file', pptxFile);
        formData.append('metadata_file', metadataFile);
        formData.append('extraction_method', extractionMethod);
        if (extractionMethod === 'SL') {
            formData.append('parallel_workers', parallelWorkers);
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/upload-preview`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setJobId(response.data.job_id);
            setSlides(response.data.slides || []);
            setView('preview');
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed');
        }
    };

    const handleStartCheck = async () => {
        if (!jobId) { setError('No job ID found'); return; }
        setError(null);
        setView('processing');
        const modulesStr = selectedModules.length === MODULES.length ? 'all' : selectedModules.join(',');
        const formData = new FormData();
        formData.append('job_id', jobId);
        formData.append('modules', modulesStr);
        try {
            await axios.post(`${API_BASE_URL}/api/check-modules`, formData);
        } catch (err) {
            setError(err.response?.data?.detail || 'Check failed');
            setView('preview');
        }
    };

    const handleRerunCheck = async () => { setShowModuleSelector(false); await handleStartCheck(); };
    const toggleModule = (moduleId) => { setSelectedModules(prev => prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]); };
    const toggleAllModules = () => { setSelectedModules(prev => prev.length === MODULES.length ? [] : MODULES.map(m => m.id)); };
    const handleReset = () => { setView('upload'); setPptxFile(null); setMetadataFile(null); setJobId(null); setJobStatus(null); setSlides([]); setViolations([]); setError(null); setSelectedSlide(0); setSelectedModules(MODULES.map(m => m.id)); setExtractedJson(null); setShowModuleSelector(false); if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; } };

    const downloadReport = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/report`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'compliance_report.txt');
            document.body.appendChild(link); link.click(); link.remove();
        } catch (err) { setError('Failed to download report'); }
    };

    const downloadJSON = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/download/${jobId}/violations`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'violations.json');
            document.body.appendChild(link); link.click(); link.remove();
        } catch (err) { setError('Failed to download JSON'); }
    };

    const slideViolations = violations.filter(v => v.page_number === selectedSlide + 1);
    const stats = { total: violations.length, critical: violations.filter(v => v.severity === 'critical').length, major: violations.filter(v => v.severity === 'major').length, minor: violations.filter(v => v.severity === 'minor').length };

    // LANDING PAGE - Redirect to AppProfessional
    // Note: Landing and About views are now handled by AppProfessional.jsx
    // This component only handles functional views (upload, processing, results, etc.)
    
    // If view is landing, redirect to upload immediately
    useEffect(() => {
        if (view === 'landing' || view === VIEWS.LANDING) {
            if (onNavigate) {
                onNavigate('landing');
            } else {
                setView('upload');
            }
        }
    }, [view, onNavigate]);
    
    // If view is landing, show nothing (will redirect)
    if (view === 'landing' || view === VIEWS.LANDING) {
        return null;
    }

    // UPLOAD VIEW - Premium Material UI Theme
    if (view === 'upload' || view === VIEWS.UPLOAD) {
        return (
            <UploadView
                onUploadSuccess={(response) => {
                    setJobId(response.job_id);
                    setSlides(response.slides || []);
                    setView('preview');
                }}
                onNavigate={(targetView) => {
                    setView(targetView);
                    if (onNavigate) onNavigate(targetView);
                }}
                onLoadHistory={async () => {
                    try {
                        // Load history first, then navigate
                        await loadHistory();
                        setView('history');
                        if (onNavigate) {
                            onNavigate('history');
                        }
                    } catch (err) {
                        console.error('Failed to load history:', err);
                        setError('Failed to load history');
                    }
                }}
            />
        );
    }

    // PREVIEW VIEW - ODDO BHF Theme
    if (view === 'preview' || view === VIEWS.PREVIEW) {
        return (
            <div className="min-h-screen p-4" style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.dark} 0%, ${ODDO_COLORS.primary} 100%)` }}>
                <div className="max-w-[1600px] mx-auto">
                    <div className="mb-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Preview & Select Modules</h1>
                        <div className="flex gap-2">
                            <button onClick={loadExtractedJson} disabled={jsonLoading} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2">
                                {jsonLoading ? (<Loader className="w-4 h-4 animate-spin" />) : (<Code className="w-4 h-4" />)} {jsonLoading ? 'Loading…' : 'View JSON'}
                            </button>
                            <button onClick={() => { 
                                // Navigate first, then load history asynchronously
                                setView('history');
                                if (onNavigate) { 
                                    onNavigate('history'); 
                                }
                                loadHistory().catch((err) => {
                                    console.error('Failed to load history:', err);
                                    setError('Failed to load history');
                                });
                            }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-2">
                                <History className="w-4 h-4" /> History
                            </button>
                            <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">New File</button>
                        </div>
                    </div>
                    {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400" /><span className="text-red-300">{error}</span></div>}

                    {/* Main layout: Slide thumbnails on left, large preview in center, modules on right */}
                    <div className="flex gap-4">
                        {/* Slide Thumbnails - Narrow column */}
                        <div className="w-48 flex-shrink-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-3">
                            <h2 className="font-semibold text-white mb-3 text-sm">Slides ({slides.length})</h2>
                            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {slides.map((slide, idx) => (
                                    <div key={idx} onClick={() => setSelectedSlide(idx)}
                                        className="p-2 border-2 rounded-lg cursor-pointer transition"
                                        style={selectedSlide === idx ? {
                                            borderColor: ODDO_COLORS.secondary,
                                            background: `${ODDO_COLORS.secondary}15`
                                        } : {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.03)'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-6 h-6 text-white rounded flex items-center justify-center font-bold text-xs"
                                                style={{ background: ODDO_COLORS.secondary }}
                                            >
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-white truncate">{slide.title || `Slide ${idx + 1}`}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Large Slide Preview - Takes most space */}
                        <div className="flex-1 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="font-semibold text-white">Slide {selectedSlide + 1} of {slides.length}</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedSlide(Math.max(0, selectedSlide - 1))} disabled={selectedSlide === 0}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded text-sm">← Prev</button>
                                    <button onClick={() => setSelectedSlide(Math.min(slides.length - 1, selectedSlide + 1))} disabled={selectedSlide === slides.length - 1}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded text-sm">Next →</button>
                                </div>
                            </div>
                            {slides[selectedSlide] && (
                                <div className="border-2 border-gray-700 rounded-lg bg-gray-900 overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 400px)' }}>
                                    {slides[selectedSlide].image ? (
                                        <img src={slides[selectedSlide].image} alt={`Slide ${selectedSlide + 1}`} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="p-8 w-full h-full overflow-auto">
                                            {slides[selectedSlide].title && <h3 className="text-2xl font-bold text-white mb-6">{slides[selectedSlide].title}</h3>}
                                            <div className="space-y-3">{slides[selectedSlide].content?.map((item, idx) => (!item.is_title && <p key={idx} className="text-base text-gray-300">{item.text}</p>))}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Modules - Compact column on right */}
                        <div className="w-64 flex-shrink-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="font-semibold text-white text-sm">Modules</h2>
                                <button 
                                    onClick={toggleAllModules} 
                                    className="text-xs font-medium transition hover:opacity-80"
                                    style={{ color: ODDO_COLORS.secondary }}
                                >
                                    {selectedModules.length === MODULES.length ? 'None' : 'All'}
                                </button>
                            </div>
                            <div className="space-y-1 mb-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                                {MODULES.map(module => (
                                    <div key={module.id} onClick={() => toggleModule(module.id)}
                                        className="p-2 border rounded-lg cursor-pointer transition"
                                        style={selectedModules.includes(module.id) ? {
                                            borderColor: ODDO_COLORS.secondary,
                                            background: `${ODDO_COLORS.secondary}15`
                                        } : {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.03)'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedModules.includes(module.id) ? (
                                                <CheckSquare className="w-4 h-4" style={{ color: ODDO_COLORS.secondary }} />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-500" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-white">{module.name}</p>
                                                <p className="text-xs text-gray-500">{module.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={handleStartCheck} 
                                disabled={selectedModules.length === 0}
                                className="w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-sm hover:opacity-90"
                                style={{ 
                                    background: selectedModules.length === 0 
                                        ? '#666' 
                                        : `linear-gradient(135deg, ${ODDO_COLORS.secondary} 0%, #FFA500 100%)`
                                }}
                            >
                                <Play className="w-4 h-4" /> Run ({selectedModules.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // PROCESSING VIEW - ODDO BHF Theme
    if (view === 'processing' || view === VIEWS.PROCESSING) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.dark} 0%, ${ODDO_COLORS.primary} 100%)` }}>
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 max-w-md w-full text-center">
                    <Loader className="w-16 h-16 mx-auto animate-spin mb-6" style={{ color: ODDO_COLORS.secondary }} />
                    <h2 className="text-2xl font-bold text-white mb-4">{jobStatus?.status === 'pending' ? 'Starting up...' : 'Analyzing your presentation'}</h2>
                    <p className="text-white/70 mb-4">{jobStatus?.message || 'This usually takes a minute or two...'}</p>
                    {jobStatus?.progress !== undefined && (
                        <div className="w-full bg-white/10 rounded-full h-2 mt-6">
                            <div 
                                className="h-2 rounded-full transition-all duration-500" 
                                style={{ 
                                    width: `${jobStatus.progress}%`,
                                    background: `linear-gradient(135deg, ${ODDO_COLORS.secondary} 0%, #FFA500 100%)`
                                }}
                            />
                        </div>
                    )}
                    <div className="mt-6 text-sm text-gray-500">
                        <div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /><span>Running {selectedModules.length} module(s)</span></div>
                    </div>
                </div>
            </div>
        );
    }

    // JSON VIEWER - ODDO BHF Theme
    if (view === 'json-viewer') {
        return (
            <div className="min-h-screen p-4" style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.dark} 0%, ${ODDO_COLORS.primary} 100%)` }}>
                <div className="max-w-[1600px] mx-auto">
                    <div className="mb-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Extracted JSON Data</h1>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setView('preview')} 
                                className="px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.secondary} 0%, #FFA500 100%)` }}
                            >
                                Back to Preview
                            </button>
                            <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">New File</button>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[70vh]">
                            <pre className="text-sm font-mono whitespace-pre-wrap text-green-300">{JSON.stringify(extractedJson, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // RESULTS VIEW - ODDO BHF Theme
    if (view === 'results' || view === VIEWS.RESULTS) {
        const getSeverityColor = (severity) => {
            switch (severity) {
                case 'critical': return 'bg-red-500/10 text-red-300 border-red-500/30';
                case 'major': return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
                case 'minor': return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
                default: return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
            }
        };
        const getSeverityIcon = (severity) => {
            switch (severity) {
                case 'critical': return <XCircle className="w-5 h-5" />;
                case 'major': return <AlertCircle className="w-5 h-5" />;
                case 'minor': return <Info className="w-5 h-5" />;
                default: return <CheckCircle className="w-5 h-5" />;
            }
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-4">
                <div className="max-w-[1600px] mx-auto">
                    <div className="mb-4 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Compliance Report</h1>
                            <p className="text-gray-400">{violations.length} issues found across {slides.length} slides</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={loadExtractedJson} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition flex items-center gap-2"><Code className="w-4 h-4" /> JSON</button>
                            <button onClick={loadDecisionTrace} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition flex items-center gap-2"><Eye className="w-4 h-4" /> Trace</button>
                            <button 
                                onClick={() => setShowModuleSelector(!showModuleSelector)} 
                                className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2 hover:opacity-90"
                                style={{ background: ODDO_COLORS.accent }}
                            >
                                <RefreshCw className="w-4 h-4" /> Re-run
                            </button>
                            <button onClick={async () => { 
                                try {
                                    await loadHistory(); 
                                    if (onNavigate) { 
                                        onNavigate('history'); 
                                    } else { 
                                        setView('history'); 
                                    } 
                                } catch (err) {
                                    console.error('Failed to load history:', err);
                                    setError('Failed to load history');
                                }
                            }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-2"><History className="w-4 h-4" /> History</button>
                            <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">New Check</button>
                        </div>
                    </div>

                    {showModuleSelector && (
                        <div className="mb-4 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-white">Select Modules to Re-run</h3>
                                <button 
                                    onClick={toggleAllModules} 
                                    className="text-sm transition hover:opacity-80"
                                    style={{ color: ODDO_COLORS.secondary }}
                                >
                                    {selectedModules.length === MODULES.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                {MODULES.map(module => (
                                    <div key={module.id} onClick={() => toggleModule(module.id)}
                                        className="p-2 border-2 rounded-lg cursor-pointer transition text-center"
                                        style={selectedModules.includes(module.id) ? {
                                            borderColor: ODDO_COLORS.secondary,
                                            background: `${ODDO_COLORS.secondary}15`
                                        } : {
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.03)'
                                        }}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            {selectedModules.includes(module.id) ? (
                                                <CheckSquare className="w-4 h-4" style={{ color: ODDO_COLORS.secondary }} />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span className="text-sm font-medium text-white">{module.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleRerunCheck} disabled={selectedModules.length === 0}
                                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2">
                                <Play className="w-4 h-4" /> Run ({selectedModules.length})
                            </button>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                            <div className="text-sm text-gray-400">Total Issues</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
                            <div className="text-sm text-red-300">Critical</div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                            <div className="text-2xl font-bold text-orange-400">{stats.major}</div>
                            <div className="text-sm text-orange-300">Major</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                            <div className="text-2xl font-bold text-yellow-400">{stats.minor}</div>
                            <div className="text-sm text-yellow-300">Minor</div>
                        </div>
                    </div>

                    {/* Results layout: Slides list | Large Preview | Violations */}
                    <div className="flex gap-4">
                        {/* Slides - Narrow column */}
                        <div className="w-48 flex-shrink-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-3">
                            <h2 className="font-semibold text-white mb-3 text-sm">Slides</h2>
                            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                                {slides.map((slide, idx) => {
                                    const slideViols = violations.filter(v => v.page_number === idx + 1);
                                    const hasCritical = slideViols.some(v => v.severity === 'critical');
                                    const hasMajor = slideViols.some(v => v.severity === 'major');
                                    const hasMinor = slideViols.some(v => v.severity === 'minor');
                                    return (
                                        <div key={idx} onClick={() => setSelectedSlide(idx)}
                                            className={`p-2 border-2 rounded-lg cursor-pointer transition ${selectedSlide === idx ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs text-white ${hasCritical ? 'bg-red-600' : hasMajor ? 'bg-orange-600' : hasMinor ? 'bg-yellow-600' : 'bg-emerald-600'}`}>{idx + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">{slide.title || `Slide ${idx + 1}`}</p>
                                                    <p className="text-xs text-gray-500">{slideViols.length} issue{slideViols.length !== 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Large Preview - Takes most space */}
                        <div className="flex-1 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="font-semibold text-white">Slide {selectedSlide + 1} of {slides.length}</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedSlide(Math.max(0, selectedSlide - 1))} disabled={selectedSlide === 0}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded text-sm">← Prev</button>
                                    <button onClick={() => setSelectedSlide(Math.min(slides.length - 1, selectedSlide + 1))} disabled={selectedSlide === slides.length - 1}
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded text-sm">Next →</button>
                                </div>
                            </div>
                            {slides[selectedSlide] && (
                                <div className="border-2 border-gray-700 rounded-lg bg-gray-900 overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 400px)' }}>
                                    {slides[selectedSlide].image ? (
                                        <img src={slides[selectedSlide].image} alt={`Slide ${selectedSlide + 1}`} className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="p-8 w-full h-full overflow-auto">
                                            {slides[selectedSlide].title && <h3 className="text-2xl font-bold text-white mb-6">{slides[selectedSlide].title}</h3>}
                                            <div className="space-y-3">{slides[selectedSlide].content?.map((item, idx) => (!item.is_title && <p key={idx} className="text-base text-gray-300">{item.text}</p>))}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Violations - Right column */}
                        <div className="w-80 flex-shrink-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-3">
                            <h2 className="font-semibold text-white mb-3 text-sm">Issues ({slideViolations.length})</h2>
                            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                                {slideViolations.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                                        <p className="text-sm">No issues on this slide</p>
                                    </div>
                                ) : (
                                    slideViolations.map((violation, idx) => (
                                        <div key={idx} className={`border-2 rounded-lg p-3 ${getSeverityColor(violation.severity)}`}>
                                            <div className="flex items-start gap-2">
                                                {getSeverityIcon(violation.severity)}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="text-xs font-bold px-2 py-0.5 bg-black/20 rounded">{violation.rule_id}</span>
                                                        <span className="text-xs font-semibold px-2 py-0.5 bg-black/20 rounded">{violation.module}</span>
                                                    </div>
                                                    <p className="text-sm font-medium mb-1">{violation.violation_comment}</p>
                                                    {violation.exact_phrase && <p className="text-xs italic bg-black/10 p-2 rounded mt-2">"{violation.exact_phrase}"</p>}
                                                    {violation.required_action && <p className="text-xs mt-2 opacity-80"><strong>Fix:</strong> {violation.required_action}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Decision Trace */}
                    {decisionTrace && (
                        <div className="mt-4 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                            <h2 className="font-semibold text-white mb-3">Agent Decision Trace</h2>
                            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[400px]">
                                <pre className="text-sm font-mono whitespace-pre-wrap text-cyan-300">{JSON.stringify(decisionTrace, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* Downloads */}
                    <div className="mt-4 flex gap-4 justify-center">
                            <button 
                                onClick={downloadReport} 
                                className="px-6 py-3 text-white font-semibold rounded-lg flex items-center gap-2 transition hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.secondary} 0%, #FFA500 100%)` }}
                            >
                            <Download className="w-5 h-5" /> Download Report
                        </button>
                            <button 
                                onClick={downloadJSON} 
                                className="px-6 py-3 text-white font-semibold rounded-lg flex items-center gap-2 transition hover:opacity-90"
                                style={{ background: ODDO_COLORS.accent }}
                            >
                            <Download className="w-5 h-5" /> Download JSON
                        </button>
                    </div>
                </div>
            </div>
        );
    }



    // HISTORY VIEW - Premium Material UI Theme
    if (view === 'history' || view === VIEWS.HISTORY) {
        return (
            <HistoryView
                historyData={historyData}
                historyStats={historyStats}
                loading={historyLoading}
                onViewJob={viewHistoryJob}
                onUpdateReview={updateReviewStatus}
                onDeleteJob={deleteHistoryJob}
                onNavigate={(targetView) => {
                    setView(targetView);
                    if (onNavigate) onNavigate(targetView);
                }}
                onLoadHistory={loadHistory}
            />
        );
    }

    // HISTORY DETAIL VIEW - ODDO BHF Theme
    if (view === 'history-detail' || view === VIEWS.HISTORY_DETAIL) {
        if (!selectedHistoryJob) return null;
        
        const reviewBadge = (() => {
            switch (selectedHistoryJob.review_status) {
                case 'validated': return { bg: `${ODDO_COLORS.secondary}20`, text: ODDO_COLORS.secondary, border: `${ODDO_COLORS.secondary}40`, label: 'Validated' };
                case 'needs_revision': return { bg: 'rgba(251, 146, 60, 0.2)', text: '#FB923C', border: 'rgba(251, 146, 60, 0.4)', label: 'Needs Revision' };
                default: return { bg: 'rgba(234, 179, 8, 0.2)', text: '#EAB308', border: 'rgba(234, 179, 8, 0.4)', label: 'Pending Review' };
            }
        })();

        return (
            <div className="min-h-screen p-4" style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.dark} 0%, ${ODDO_COLORS.primary} 100%)` }}>
                <div className="max-w-[1600px] mx-auto">
                    <div className="mb-4 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">{selectedHistoryJob.filename}</h1>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm">{new Date(selectedHistoryJob.created_at).toLocaleString()}</span>
                                <span 
                                    className="px-2 py-1 text-xs font-medium rounded border"
                                    style={{ 
                                        background: reviewBadge.bg,
                                        color: reviewBadge.text,
                                        borderColor: reviewBadge.border
                                    }}
                                >
                                    {reviewBadge.label}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selectedHistoryJob.review_status === 'pending_review' && (
                                <>
                                    <button 
                                        onClick={() => { updateReviewStatus(selectedHistoryJob.job_id, 'validated'); setSelectedHistoryJob({ ...selectedHistoryJob, review_status: 'validated' }); }}
                                        className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2 hover:opacity-90"
                                        style={{ background: `linear-gradient(135deg, ${ODDO_COLORS.secondary} 0%, #FFA500 100%)` }}
                                    >
                                        <ClipboardCheck className="w-4 h-4" /> Validate
                                    </button>
                                    <button 
                                        onClick={() => { updateReviewStatus(selectedHistoryJob.job_id, 'needs_revision'); setSelectedHistoryJob({ ...selectedHistoryJob, review_status: 'needs_revision' }); }}
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition flex items-center gap-2"
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Needs Revision
                                    </button>
                                </>
                            )}
                            <button onClick={async () => { 
                                try {
                                    await loadHistory(); 
                                    setView('history'); 
                                } catch (err) {
                                    console.error('Failed to load history:', err);
                                    setError('Failed to load history');
                                }
                            }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center gap-2">
                                <History className="w-4 h-4" /> Back to History
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                            <div className="text-2xl font-bold text-white">{violations.length}</div>
                            <div className="text-sm text-gray-400">Total Issues</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <div className="text-2xl font-bold text-red-400">{violations.filter(v => v.severity === 'critical').length}</div>
                            <div className="text-sm text-red-300">Critical</div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                            <div className="text-2xl font-bold text-orange-400">{violations.filter(v => v.severity === 'major').length}</div>
                            <div className="text-sm text-orange-300">Major</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                            <div className="text-2xl font-bold text-yellow-400">{violations.filter(v => v.severity === 'minor').length}</div>
                            <div className="text-sm text-yellow-300">Minor</div>
                        </div>
                    </div>

                    {/* Slide Preview and Violations */}
                    <div className="flex gap-4">
                        <div className="w-48 flex-shrink-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-3">
                            <h2 className="font-semibold text-white mb-3 text-sm">Slides</h2>
                            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                                {slides.map((slide, idx) => {
                                    const slideViols = violations.filter(v => v.page_number === idx + 1);
                                    const hasCritical = slideViols.some(v => v.severity === 'critical');
                                    const hasMajor = slideViols.some(v => v.severity === 'major');
                                    const hasMinor = slideViols.some(v => v.severity === 'minor');
                                    return (
                                        <div key={idx} onClick={() => setSelectedSlide(idx)}
                                            className={`p-2 border-2 rounded-lg cursor-pointer transition ${selectedSlide === idx ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs text-white ${hasCritical ? 'bg-red-600' : hasMajor ? 'bg-orange-600' : hasMinor ? 'bg-yellow-600' : 'bg-emerald-600'}`}>{idx + 1}</div>
                                                <span className="text-xs text-gray-400">{slideViols.length} issues</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-4">
                            <h2 className="font-semibold text-white mb-3">Slide {selectedSlide + 1}</h2>
                            {slides[selectedSlide] && (
                                <div className="border-2 border-gray-700 rounded-lg bg-gray-900 overflow-hidden">
                                    {slides[selectedSlide].image ? (
                                        <img src={slides[selectedSlide].image} alt={`Slide ${selectedSlide + 1}`} className="w-full h-auto max-h-[calc(100vh - 400px)] object-contain mx-auto" />
                                    ) : (
                                        <div className="p-8 min-h-[400px]">
                                            {slides[selectedSlide].title && <h3 className="text-2xl font-bold text-white mb-6">{slides[selectedSlide].title}</h3>}
                                            <div className="space-y-3">{slides[selectedSlide].content?.map((item, idx) => (!item.is_title && <p key={idx} className="text-base text-gray-300">{item.text}</p>))}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="w-80 flex-shrink-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-3">
                            <h2 className="font-semibold text-white mb-3 text-sm">Issues on Slide {selectedSlide + 1}</h2>
                            <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto">
                                {violations.filter(v => v.page_number === selectedSlide + 1).length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                                        <p className="text-sm">No issues</p>
                                    </div>
                                ) : (
                                    violations.filter(v => v.page_number === selectedSlide + 1).map((violation, idx) => (
                                        <div key={idx} className={`border rounded-lg p-2 ${violation.severity === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-300' : violation.severity === 'major' ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'}`}>
                                            <div className="flex items-center gap-1 mb-1">
                                                <span className="text-xs font-bold px-1.5 py-0.5 bg-black/20 rounded">{violation.rule_id}</span>
                                                <span className="text-xs px-1.5 py-0.5 bg-black/20 rounded">{violation.severity}</span>
                                            </div>
                                            <p className="text-xs">{violation.violation_comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default AppEnhanced;
