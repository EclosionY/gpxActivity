
import React, { useState } from 'react';
import { Activity, GpxData } from '../types.ts';

interface ActivityListProps {
  activities: Activity[];
  onDelete: (id: string) => void;
  onEdit: (activity: Activity) => void;
  onClose: () => void;
  getTrackDetails: (id: string) => Promise<GpxData | null>;
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onDelete, onEdit, onClose, getTrackDetails }) => {
  const [selectedAct, setSelectedAct] = useState<Activity | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = (activityId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?activity=${activityId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadGpx = async (trackId: string, routeName: string) => {
    const data = await getTrackDetails(trackId);
    if (!data) return alert("获取轨迹数据失败");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TurboTrack" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${routeName}</name>
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
    a.download = `${routeName}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[5000] w-full md:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white shrink-0">
        <div>
          <h2 className="text-xl font-black flex items-center tracking-tight">
            <svg className="w-6 h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            活动档案库
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">活动历史存档</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-24 text-slate-300">
             <svg className="w-20 h-20 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             <p className="font-black text-sm uppercase tracking-widest">暂无记录</p>
          </div>
        ) : activities.map(act => (
          <div key={act.id} className="border-2 border-slate-50 rounded-[2rem] p-6 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-200 transition-all cursor-pointer group active:scale-[0.98]" onClick={() => setSelectedAct(act)}>
            <div className="flex justify-between items-start mb-3 gap-2">
              <h3 className="font-black text-slate-800 text-lg group-hover:text-emerald-600 transition-colors truncate">{act.routeName}</h3>
              <span className="text-[10px] font-black bg-white border border-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase shrink-0 shadow-sm">{act.date}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center"><svg className="w-3.5 h-3.5 mr-1.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>{act.leader}</span>
              <span className="flex items-center max-w-[150px] truncate"><svg className="w-3.5 h-3.5 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>{act.meetingPoint}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedAct && (
        <div className="absolute inset-0 bg-white z-[5100] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
             <button onClick={() => setSelectedAct(null)} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-800 transition-all active:scale-95 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
             </button>
             <div className="flex space-x-2">
                <button onClick={() => handleShare(selectedAct.id)} className={`p-3 rounded-2xl transition-all active:scale-95 shadow-sm border ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-700 border-slate-200'}`}>
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                </button>
                <button onClick={() => onEdit(selectedAct)} className="p-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm active:scale-95">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onClick={() => downloadGpx(selectedAct.trackId, selectedAct.routeName)} className="px-6 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-100">
                   下载
                </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
             <div className="mb-8">
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-[0.2em] mb-3 inline-block">活动档案</span>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">{selectedAct.routeName}</h1>
                <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                   <span className="text-emerald-600 font-black">难度系数 {selectedAct.difficulty}</span>
                   <span>•</span>
                   <span>创建于 {new Date(selectedAct.createdAt).toLocaleDateString()}</span>
                </div>
             </div>
             <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 md:p-8 font-mono text-xs md:text-sm leading-relaxed text-slate-600 whitespace-pre-wrap select-all shadow-inner">
                {selectedAct.fullText}
             </div>
             <button onClick={() => { if(confirm("确定要删除此活动档案吗？")) { onDelete(selectedAct.id); setSelectedAct(null); }}} className="mt-12 w-full py-5 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] border-2 border-red-50 rounded-3xl hover:bg-red-50 transition-all active:scale-95">
                永久删除此档案
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
