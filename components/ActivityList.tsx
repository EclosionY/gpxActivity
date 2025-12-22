
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
    <div className="fixed inset-y-0 right-0 z-[2500] w-full max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right">
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            活动档案库
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage Your Outdoor Events</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-20 opacity-30">
             <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             <p className="font-bold">暂无活动记录</p>
          </div>
        ) : activities.map(act => (
          <div key={act.id} className="border border-slate-100 rounded-3xl p-5 bg-slate-50 hover:border-emerald-200 transition-all cursor-pointer group" onClick={() => setSelectedAct(act)}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors truncate pr-2">{act.routeName}</h3>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase shrink-0">{act.date}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="flex items-center"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>{act.leader}</span>
              <span className="flex items-center truncate"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>{act.meetingPoint}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedAct && (
        <div className="absolute inset-0 bg-white z-[2600] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
             <button onClick={() => setSelectedAct(null)} className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                返回列表
             </button>
             <div className="flex space-x-2">
                <button onClick={() => handleShare(selectedAct.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center space-x-1 ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                   <span>{copied ? '已复制链接' : '分享宣传页'}</span>
                </button>
                <button onClick={() => onEdit(selectedAct)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 active:scale-95 flex items-center space-x-1">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                   <span>修改</span>
                </button>
                <button onClick={() => downloadGpx(selectedAct.trackId, selectedAct.routeName)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 active:scale-95 flex items-center space-x-1 shadow-lg shadow-emerald-100">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   <span>下载 GPX</span>
                </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
             <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 mb-2">{selectedAct.routeName}</h1>
                <div className="flex items-center space-x-2 text-sm">
                   <span className="text-emerald-600 font-bold">难度 {selectedAct.difficulty}</span>
                   <span className="text-slate-300">|</span>
                   <span className="text-slate-500">创建于 {new Date(selectedAct.createdAt).toLocaleDateString()}</span>
                </div>
             </div>
             <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 font-mono text-sm leading-relaxed text-slate-600 whitespace-pre-wrap select-all shadow-inner">
                {selectedAct.fullText}
             </div>
             <button onClick={() => { if(confirm("确定要删除此活动档案吗？")) { onDelete(selectedAct.id); setSelectedAct(null); }}} className="mt-10 w-full py-4 text-red-500 font-bold text-xs uppercase tracking-widest border border-red-100 rounded-2xl hover:bg-red-50 transition-colors">
                永久删除档案
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityList;
