import React from 'react';
import { Clock } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';

const ProcessingView = ({ jobStatus, selectedModulesCount }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8 flex items-center justify-center">
      <Card className="p-12 max-w-md w-full text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">
          {jobStatus?.status === 'pending' ? 'Starting up...' : 'Analyzing your presentation'}
        </h2>
        <p className="text-gray-400 mb-4">
          {jobStatus?.message || 'This usually takes a minute or two...'}
        </p>
        {jobStatus?.progress !== undefined && (
          <div className="w-full bg-gray-700 rounded-full h-2 mt-6">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${jobStatus.progress}%` }}
            />
          </div>
        )}
        <div className="mt-6 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Running {selectedModulesCount} module(s)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProcessingView;

