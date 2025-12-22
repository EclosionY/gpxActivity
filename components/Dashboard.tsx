
import React, { useState } from 'react';
import { GpxData } from '../types.ts';
import EventGenerator from './EventGenerator.tsx';

interface DashboardProps {
  data: GpxData;
  onClose: () => void;
  onPublished?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onClose, onPublished }) => {
  const [copied, setCopied] = useState(false);
  const [showEventGen, setShowEventGen] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?track=${data.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-[1000] bg-white rounded-t-3xl shadow-2xl p-6 max-h-[75vh] overflow-y-auto transform transition-transform animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{data.name}</h2>
            <p className="text-slate-500 text-sm">轨迹统计数据</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowEventGen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>发布活动</span>
            </button>
            <button 
              onClick={handleShare}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold text-sm shadow-sm border ${
                copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              <span>{copied ? '已复制' : '分享'}</span>
            </button>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
            <p className="text-emerald-600 text-xs font-semibold uppercase mb-1">总距离</p>
            <p className="text-xl font-bold text-emerald-900">{data.distance} <span className="text-sm font-normal">km</span></p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
            <p className="text-blue-600 text-xs font-semibold uppercase mb-1">累计爬升</p>
            <p className="text-xl font-bold text-blue-900">{data.elevationGain} <span className="text-sm font-normal">m</span></p>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-center">
            <p className="text-orange-600 text-xs font-semibold uppercase mb-1">累计下降</p>
            <p className="text-xl font-bold text-orange-900">{data.elevationLoss} <span className="text-sm font-normal">m</span></p>
          </div>
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
            <p className="text-purple-600 text-xs font-semibold uppercase mb-1">最高海拔</p>
            <p className="text-xl font-bold text-purple-900">{data.maxElevation} <span className="text-sm font-normal">m</span></p>
          </div>
        </div>
        
        <div className="text-slate-400 text-xs text-center pt-4 italic">
          记录时间: {data.startTime?.toLocaleString('zh-CN') || '未知'} - {data.endTime?.toLocaleString('zh-CN') || '未知'}
        </div>
      </div>

      {showEventGen && (
        <EventGenerator 
          data={data} 
          onClose={() => setShowEventGen(false)} 
          onPublished={onPublished}
        />
      )}
    </>
  );
};

export default Dashboard;
