import React from 'react';
import Card from '../common/Card';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <Card className="p-4">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-sm text-gray-400">Total Issues</div>
      </Card>
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
  );
};

export default StatsCards;

