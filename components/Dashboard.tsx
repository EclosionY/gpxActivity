
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

  const handleDownload = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TurboTrack" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${data.name}</name>
    <trkseg>`;
    
    data.points.forEach(p => {
      xml += `\n      <trkpt lat="${p.lat}" lon="${p.lng}">${p.ele !== undefined ? `<ele>${p.ele}</ele>` : ''}${p.time ? `<time>${p.time}</time>` : ''}</trkpt>`;
    });

    xml += `\n    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([xml], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-[1000] bg-white rounded-t-[3rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.15)] p-6 pb-12 md:pb-8 max-h-[95vh] overflow-y-auto transform transition-transform animate-in slide-in-from-bottom duration-500 border-t border-slate-100">
        {/* 移动端拖动手柄 */}
        <div className="w-14 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 md:hidden"></div>
        
        <div className="flex flex-col space-y-6 mb-8">
          <div className="flex justify-between items-start">
            <div className="pr-4 min-w-0">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight truncate">{data.name}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className="w-6 h-0.5 bg-emerald-500 rounded-full"></span>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">轨迹智能分析</p>
              </div>
            </div>
          </div>

          {/* 优化后的操作按钮组 */}
          <div className="flex items-stretch space-x-2 h-14 md:h-16">
            <button 
              onClick={() => setShowEventGen(true)}
              className="flex-[2] flex items-center justify-center space-x-2 bg-emerald-600 text-white rounded-[1.2rem] md:rounded-2xl transition-all font-black text-sm md:text-base shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>发布活动</span>
            </button>
            
            <button 
              onClick={handleShare}
              title="分享轨迹"
              className={`flex-1 flex items-center justify-center rounded-[1.2rem] md:rounded-2xl transition-all border-2 ${
                copied 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
              } active:scale-95`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            </button>

            <button 
              onClick={handleDownload}
              title="下载轨迹"
              className="flex-1 flex items-center justify-center rounded-[1.2rem] md:rounded-2xl bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </button>

            <button 
              onClick={onClose} 
              title="关闭"
              className="flex-1 flex items-center justify-center bg-slate-900 text-white rounded-[1.2rem] md:rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-50/40 p-6 rounded-[2.2rem] border border-emerald-100/50 group hover:bg-emerald-50 transition-all">
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">总距离</p>
            <p className="text-3xl font-black text-emerald-900 leading-none">{data.distance} <span className="text-xs font-bold opacity-40 ml-1 tracking-normal">公里</span></p>
          </div>
          <div className="bg-blue-50/40 p-6 rounded-[2.2rem] border border-blue-100/50 group hover:bg-blue-50 transition-all">
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">累计爬升</p>
            <p className="text-3xl font-black text-blue-900 leading-none">{data.elevationGain} <span className="text-xs font-bold opacity-40 ml-1 tracking-normal">米</span></p>
          </div>
          <div className="bg-orange-50/40 p-6 rounded-[2.2rem] border border-orange-100/50 group hover:bg-orange-50 transition-all">
            <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">累计下降</p>
            <p className="text-3xl font-black text-orange-900 leading-none">{data.elevationLoss} <span className="text-xs font-bold opacity-40 ml-1 tracking-normal">米</span></p>
          </div>
          <div className="bg-purple-50/40 p-6 rounded-[2.2rem] border border-purple-100/50 group hover:bg-purple-50 transition-all">
            <p className="text-purple-600 text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">最高海拔</p>
            <p className="text-3xl font-black text-purple-900 leading-none">{data.maxElevation} <span className="text-xs font-bold opacity-40 ml-1 tracking-normal">米</span></p>
          </div>
        </div>
        
        <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl p-5 text-slate-400 text-[10px] font-black text-center uppercase tracking-[0.2em] border border-slate-100 mb-4">
          记录时段：{data.startTime?.toLocaleString('zh-CN', {month:'short', day:'numeric', hour:'numeric', minute:'numeric'}) || '未知'} — {data.endTime?.toLocaleString('zh-CN', {hour:'numeric', minute:'numeric'}) || '未知'}
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
