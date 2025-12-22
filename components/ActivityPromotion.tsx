
import React, { useEffect, useState } from 'react';
import { Activity, GpxData } from '../types.ts';
import Map from './Map.tsx';

interface ActivityPromotionProps {
  activity: Activity;
  trackData: GpxData;
  onClose?: () => void;
}

const ActivityPromotion: React.FC<ActivityPromotionProps> = ({ activity, trackData, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = `${activity.routeName} - 活动邀请`;
    return () => { document.title = '轨迹分享x活动发布'; };
  }, [activity]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadGpx = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TurboTrack" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${activity.routeName}</name>
    <trkseg>`;
    trackData.points.forEach(p => {
      xml += `\n      <trkpt lat="${p.lat}" lon="${p.lng}">${p.ele !== undefined ? `<ele>${p.ele}</ele>` : ''}${p.time ? `<time>${p.time}</time>` : ''}</trkpt>`;
    });
    xml += `\n    </trkseg>
  </trk>
</gpx>`;
    const blob = new Blob([xml], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activity.routeName}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-50 overflow-y-auto flex flex-col font-sans">
      {/* 顶部页眉 */}
      <div className="relative h-[40vh] min-h-[300px] shrink-0 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <Map gpxData={trackData} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        {onClose && (
          <button onClick={onClose} className="absolute top-6 left-6 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
        )}

        <div className="absolute bottom-10 inset-x-0 px-6 max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 mb-3">
             <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest animate-pulse">活动进行中</span>
             <span className="text-white/60 text-xs font-bold">{activity.date}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">{activity.routeName}</h1>
          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center text-white/80 space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <span className="text-sm font-bold">领队: {activity.leader}</span>
             </div>
             <div className="flex items-center text-white/80 space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                   <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                </div>
                <span className="text-sm font-bold">地点: {activity.meetingPoint}</span>
             </div>
          </div>
        </div>
      </div>

      {/* 内容主体 */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 -mt-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 左侧详情 */}
          <div className="md:col-span-2 space-y-12">
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
               <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
                  活动详情
               </h3>
               <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">
                  {activity.notes}
               </div>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
               <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                  装备建议
               </h3>
               <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">
                  {activity.equipment}
               </div>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
               <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full mr-3"></span>
                  费用说明
               </h3>
               <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">
                  {activity.fees}
               </div>
            </section>

            <section className="bg-slate-100/50 rounded-3xl p-8 border border-slate-200/60">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">免责声明</h3>
               <div className="text-xs text-slate-500 leading-loose whitespace-pre-wrap italic">
                  {activity.disclaimer}
               </div>
            </section>
          </div>

          {/* 右侧侧边栏 */}
          <div className="space-y-6">
            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200">
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-4 opacity-80">核心参数</p>
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-emerald-500/40 pb-4">
                     <div>
                        <p className="text-xs font-bold text-emerald-100">徒步里程</p>
                        <p className="text-2xl font-black">{trackData.distance} <span className="text-xs font-normal">KM</span></p>
                     </div>
                     <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                  <div className="flex justify-between items-end border-b border-emerald-500/40 pb-4">
                     <div>
                        <p className="text-xs font-bold text-emerald-100">累计爬升</p>
                        <p className="text-2xl font-black">{trackData.elevationGain} <span className="text-xs font-normal">M</span></p>
                     </div>
                     <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-xs font-bold text-emerald-100">路线难度</p>
                        <p className="text-xl font-black">{activity.difficulty}</p>
                     </div>
                     <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">其他信息</p>
               <div>
                  <label className="block text-[10px] font-bold text-slate-400">集合时间</label>
                  <p className="text-sm font-bold text-slate-800">{activity.time}</p>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-400">人数上限</label>
                  <p className="text-sm font-bold text-slate-800">{activity.limit} 人</p>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-400">路况参考</label>
                  <p className="text-sm font-bold text-slate-800">{activity.roadType}</p>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-400">天气预报</label>
                  <p className="text-sm font-bold text-slate-800">{activity.weather}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部动作条 */}
      <footer className="sticky bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 flex items-center justify-between z-20">
         <div className="flex space-x-3">
            <button onClick={handleShare} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
               <span>{copied ? '已复制链接' : '分享此活动'}</span>
            </button>
            <button onClick={downloadGpx} className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-50 transition-all">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               <span>获取 GPX</span>
            </button>
         </div>
         <a href="/" className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all">
            我也要发起
         </a>
      </footer>
    </div>
  );
};

export default ActivityPromotion;
