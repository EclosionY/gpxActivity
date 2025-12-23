
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Activity, GpxData } from '../types.ts';
import Map from './Map.tsx';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface ActivityPromotionProps {
  activity: Activity;
  trackData: GpxData;
  onClose?: () => void;
}

const GRADE_MAPPING = [
  { level: 'L1', label: '入门级',特点: '路况清晰，坡度平缓（如城市公园步道、景区栈道），无高差风险。单程<10km。', 适合人群: '亲子家庭、徒步新手', color: 'bg-emerald-500' },
  { level: 'L2', label: '初级', 特点: '轻度爬升（累计300-500米），土路/碎石路为主，无危险路段。单程10-15km。', 适合人群: '有运动习惯的成年人', color: 'bg-blue-500' },
  { level: 'L3', label: '中级', 特点: '明显爬升（500-1000米），部分陡坡/湿滑路段，需基础平衡能力。单程15-20km。', 适合人群: '体能良好、1年以上徒步经验者', color: 'bg-indigo-500' },
  { level: 'L4', label: '高级', 特点: '高海拔（>3000米）/复杂地形（岩壁、冰川边缘），需技术装备，暴露感强。', 适合人群: '专业训练、熟悉野外生存者', color: 'bg-purple-500' },
  { level: 'L5', label: '挑战级', 特点: '极端环境（无人区、冰裂缝区），需绳队协作，高风险救援困难。', 适合人群: '资深登山队（非普通徒步）', color: 'bg-rose-600' },
];

const INTENSITY_MAPPING = [
  { level: 'S1', label: '休闲', 指数: '<15', 描述: '轻松散步，随时可停下拍照，心率无明显上升 (<120bpm)', 适合人群: '老人/儿童/日常缺乏运动者', color: 'text-emerald-600' },
  { level: 'S2', label: '适中', 指数: '15-25', 描述: '持续微喘，需每小时补水200ml，休息5分钟可恢复', 适合人群: '每周运动3次+的健康成年人', color: 'text-blue-600' },
  { level: 'S3', label: '较高', 指数: '25-35', 描述: '持续深喘 (心率140-160bpm)，负重时大腿酸胀，需强制休息防抽筋', 适合人群: '有1年以上徒步经验，体能良好者', color: 'text-indigo-600' },
  { level: 'S4', label: '高强', 指数: '35-45', 描述: '心肺接近极限 (心率>170bpm)，每小时需补电解质，下坡时膝盖发软', 适合人群: '长期越野跑/登山训练者', color: 'text-purple-600' },
  { level: 'S5', label: '极限', 指数: '>45', 描述: '需意志力坚持，脱水风险高，可能引发横纹肌溶解 (尿液变茶色)', 适合人群: '专业运动员 (非普通爱好者)', color: 'text-rose-600' },
];

const ActivityPromotion: React.FC<ActivityPromotionProps> = ({ activity, trackData, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  const posterSourceRef = useRef<HTMLDivElement>(null);

  // 解析难度等级 (1-5)
  const levelIdx = useMemo(() => {
    const stars = (activity.difficulty.match(/★/g) || []).length;
    return Math.min(Math.max(stars, 1), 5) - 1;
  }, [activity.difficulty]);

  const grade = GRADE_MAPPING[levelIdx];
  const intensity = INTENSITY_MAPPING[levelIdx];

  // 计算轨迹的可视化路径 (SVG)
  const trackPath = useMemo(() => {
    if (!trackData.points.length) return '';
    const lats = trackData.points.map(p => p.lat);
    const lngs = trackData.points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const rangeLat = maxLat - minLat || 0.00001;
    const rangeLng = maxLng - minLng || 0.00001;
    
    const width = 300;
    const height = 300;
    
    return trackData.points.map((p, i) => {
      const x = ((p.lng - minLng) / rangeLng) * width;
      const y = height - ((p.lat - minLat) / rangeLat) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [trackData]);

  useEffect(() => {
    document.title = `${activity.routeName} - 活动详情`;
    setShowDisclaimer(true);
    
    // 提前生成海报用的二维码
    QRCode.toDataURL(window.location.href, { width: 300, margin: 1 }).then(setQrCodeUrl);
    
    return () => { document.title = '极速轨迹 - 户外助手'; };
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

  const generatePoster = async () => {
    if (!posterSourceRef.current || isGeneratingPoster) return;
    setIsGeneratingPoster(true);
    
    try {
      const canvas = await html2canvas(posterSourceRef.current, {
        useCORS: true,
        scale: 3, // 超清模式
        backgroundColor: '#ffffff',
        logging: false
      });
      setPosterImage(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('海报生成失败:', err);
      alert('海报生成失败');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const downloadQRCode = async () => {
    if (isGeneratingQR) return;
    setIsGeneratingQR(true);
    try {
      const url = window.location.href;
      const qrDataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2 });
      const link = document.createElement('a');
      link.download = `${activity.routeName}-活动二维码.png`;
      link.href = qrDataUrl;
      link.click();
    } catch (err) {
      alert('二维码生成失败');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-white overflow-y-auto flex flex-col font-sans">
      {/* 隐藏的海报源 DOM */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none">
        <div ref={posterSourceRef} className="w-[375px] bg-slate-900 p-8 text-white font-sans flex flex-col">
          <div className="mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">TurboTrack 极速轨迹</h2>
            <h1 className="text-3xl font-black leading-tight tracking-tight">{activity.routeName}</h1>
          </div>
          
          <div className="flex justify-center items-center py-10">
            <svg width="240" height="240" viewBox="0 0 300 300" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <path d={trackPath} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-[8px] font-black uppercase text-slate-500 mb-1">里程</p>
              <p className="text-2xl font-black text-emerald-400">{activity.distance || trackData.distance}<span className="text-xs ml-1 opacity-50">km</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-[8px] font-black uppercase text-slate-500 mb-1">爬升</p>
              <p className="text-2xl font-black text-blue-400">{activity.elevationGain || trackData.elevationGain}<span className="text-xs ml-1 opacity-50">m</span></p>
            </div>
          </div>

          <div className="space-y-4 mb-10 flex-1">
            <div className="flex items-start">
              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center mr-3 mt-1"><svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg></div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-500">活动日期</p>
                <p className="text-xs font-bold">{activity.date}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center mr-3 mt-1"><svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg></div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-500">集合地点</p>
                <p className="text-xs font-bold">{activity.meetingPoint}</p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex items-center justify-between">
            <div className="max-w-[180px]">
              <p className="text-[9px] font-black text-slate-400 leading-relaxed italic">“ {activity.introText?.slice(0, 50)}... ”</p>
            </div>
            <div className="bg-white p-1 rounded-lg">
              {qrCodeUrl && <img src={qrCodeUrl} className="w-16 h-16" alt="qr" />}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {/* 顶部主图/地图区域 */}
        <div className="relative h-[40vh] md:h-[50vh] min-h-[340px] shrink-0 bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
             <Map gpxData={trackData} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          
          <div className="absolute bottom-10 inset-x-0 px-6 max-w-5xl mx-auto z-20">
            <div className="flex flex-wrap items-center gap-2 mb-4">
               <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-lg shadow-emerald-500/20">正在报名</span>
               <span className="bg-white/10 backdrop-blur-md text-white/90 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest border border-white/10">{activity.date}</span>
               <div className="flex items-center bg-white text-slate-900 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-xl">
                 难度: {grade.level} / {intensity.level}
               </div>
            </div>
            <h1 className="text-2xl md:text-6xl font-black text-white leading-tight mb-6 tracking-tight drop-shadow-2xl text-balance">
              {activity.routeName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-2">
               <div className="flex items-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-white">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center mr-2">
                     <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <span className="text-[11px] font-bold">领队: {activity.leader}</span>
               </div>
               <div className="flex items-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-white">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                     <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  </div>
                  <span className="text-[11px] font-bold truncate max-w-[120px]">{activity.meetingPoint}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 -mt-6 relative z-20">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
            
            {/* 移动端核心卡片 */}
            <div className="grid grid-cols-2 gap-3 lg:hidden mb-4">
              <div className="bg-emerald-600 rounded-[1.5rem] p-5 text-white shadow-xl shadow-emerald-50 flex flex-col justify-between h-28">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100 opacity-80">路线距离</p>
                <div>
                  <p className="text-2xl font-black leading-none">{activity.distance || trackData.distance} <span className="text-[10px] font-bold opacity-60">KM</span></p>
                </div>
              </div>
              <div className="bg-slate-900 rounded-[1.5rem] p-5 text-white shadow-xl shadow-slate-200 flex flex-col justify-between h-28">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-80">累计爬升</p>
                <div>
                  <p className="text-2xl font-black leading-none">{activity.elevationGain || trackData.elevationGain} <span className="text-[10px] font-bold opacity-60">M</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-8">
              {/* 活动详情 */}
              <section className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
                 <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 flex items-center tracking-tight">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
                    活动详情介绍
                 </h3>
                 
                 {activity.introImage && (
                   <div className="mb-6 rounded-[1.2rem] overflow-hidden shadow-md">
                      <img crossOrigin="anonymous" src={activity.introImage} className="w-full h-auto object-cover max-h-[300px]" alt="活动介绍图" />
                   </div>
                 )}

                 {activity.introText && (
                   <div className="bg-slate-50 p-5 rounded-xl text-slate-700 leading-relaxed text-sm md:text-base font-bold mb-6 italic border-l-4 border-emerald-500">
                      “ {activity.introText} ”
                   </div>
                 )}

                 <div className="text-slate-600 leading-relaxed text-sm md:text-base font-medium whitespace-pre-wrap">
                    {activity.notes}
                 </div>
              </section>

              {/* 强度/难度 */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-900 rounded-[1.5rem] p-5 text-white overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-20 h-20 ${grade.color} blur-[50px] opacity-40 -mr-8 -mt-8`}></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">等级说明</span>
                      <span className={`px-2 py-0.5 rounded-md ${grade.color} text-white text-[10px] font-black`}>{grade.level} {grade.label}</span>
                    </div>
                    <p className="text-xs md:text-sm font-bold text-slate-300 mb-4 leading-relaxed">{grade.特点}</p>
                    <p className="text-[11px] font-black text-white pt-3 border-t border-white/10">适合：{grade.适合人群}</p>
                  </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">强度指数</span>
                    <span className={`px-2 py-0.5 rounded-md bg-slate-50 ${intensity.color} text-[10px] font-black border border-slate-100`}>{intensity.level} {intensity.label}</span>
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-600 mb-4 leading-relaxed">{intensity.描述}</p>
                  <p className="text-[11px] font-black text-slate-800 pt-3 border-t border-slate-100">适合：{intensity.适合人群}</p>
                </div>
              </section>

              {/* 二维码进群 */}
              {activity.groupImage && (
                <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 md:p-8 text-white overflow-hidden relative">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                     <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">扫码入群</h3>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">获取集合详细位置及装备建议</p>
                     </div>
                     <div className="bg-white p-2 rounded-2xl shadow-xl shrink-0">
                        <img crossOrigin="anonymous" src={activity.groupImage} className="w-40 h-40 object-cover rounded-xl" alt="群二维码" />
                     </div>
                  </div>
                </section>
              )}

              {/* 装备 */}
              <section className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
                 <h3 className="text-lg md:text-xl font-black text-slate-900 mb-6 flex items-center tracking-tight">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                    推荐准备装备
                 </h3>
                 <div className="text-slate-600 leading-relaxed text-sm md:text-base font-medium whitespace-pre-wrap">{activity.equipment}</div>
              </section>

              {/* 法律声明 */}
              <section className="bg-orange-50/50 rounded-[2rem] p-6 md:p-8 border border-orange-100">
                 <h3 className="text-md font-black text-orange-900 mb-4 tracking-tight uppercase">安全与免责声明</h3>
                 <div className="text-[13px] text-slate-700 leading-relaxed font-bold italic whitespace-pre-wrap">{activity.disclaimer}</div>
              </section>
            </div>

            <aside className="hidden lg:block w-80 shrink-0 space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-10">路线参数</p>
                 <div className="space-y-8">
                    <div className="border-b border-slate-800 pb-6">
                       <p className="text-xs font-bold text-slate-400 mb-2">里程</p>
                       <p className="text-4xl font-black text-emerald-500">{activity.distance || trackData.distance} <span className="text-xs font-bold opacity-60">KM</span></p>
                    </div>
                    <div className="border-b border-slate-800 pb-6">
                       <p className="text-xs font-bold text-slate-400 mb-2">爬升</p>
                       <p className="text-4xl font-black text-blue-400">{activity.elevationGain || trackData.elevationGain} <span className="text-xs font-bold opacity-60">M</span></p>
                    </div>
                    <p className="text-3xl font-black text-orange-400">{grade.level} / {intensity.level}</p>
                 </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* 底部按钮栏 - 均匀排列 */}
      <footer className="sticky bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-3 py-4 md:px-8 md:py-8 flex items-center gap-2 z-50 shadow-[0_-10px_50px_-15px_rgba(0,0,0,0.1)] overflow-x-auto">
         <button onClick={handleShare} className="shrink-0 flex-1 flex flex-col items-center justify-center min-w-[70px] h-14 rounded-2xl bg-slate-900 text-white font-black active:scale-95 transition-all shadow-lg shadow-slate-200">
            <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            <span className="text-[9px] uppercase tracking-widest">{copied ? '已复制' : '分享'}</span>
         </button>

         <button onClick={downloadQRCode} disabled={isGeneratingQR} className="shrink-0 flex-1 flex flex-col items-center justify-center min-w-[70px] h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black active:scale-95 transition-all">
            {isGeneratingQR ? <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div> : <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>}
            <span className="text-[9px] uppercase tracking-widest">二维码</span>
         </button>

         <button onClick={generatePoster} disabled={isGeneratingPoster} className="shrink-0 flex-1 flex flex-col items-center justify-center min-w-[70px] h-14 rounded-2xl bg-emerald-600 text-white font-black active:scale-95 transition-all shadow-lg shadow-emerald-50">
            {isGeneratingPoster ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
            <span className="text-[9px] uppercase tracking-widest">海报</span>
         </button>
         
         <button onClick={downloadGpx} className="shrink-0 flex-1 flex flex-col items-center justify-center min-w-[70px] h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black active:scale-95 transition-all">
            <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="text-[9px] uppercase tracking-widest">轨迹</span>
         </button>
      </footer>

      {/* 免责声明弹窗 */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-xl md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh]">
            <div className="p-6 md:p-8 border-b bg-orange-50/50 shrink-0">
               <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-orange-500/10"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
               <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">安全与风险知晓确认</h2>
               <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">户外运动具有不可预知的风险</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
               <div className="text-[15px] md:text-lg text-slate-800 leading-relaxed font-bold italic">{activity.disclaimer}</div>
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-500">点击下方按钮即代表您已充分阅读并理解以上内容，自愿承担安全风险。</p></div>
            </div>
            <div className="p-6 md:p-8 border-t bg-white shrink-0">
               <button onClick={() => setShowDisclaimer(false)} className="w-full bg-slate-900 text-white h-14 md:h-16 rounded-[1.2rem] font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-[0.98] transition-all">我已知晓并同意</button>
            </div>
          </div>
        </div>
      )}

      {/* 海报预览预览弹窗 - 长按保存 */}
      {posterImage && (
        <div className="fixed inset-0 z-[11000] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="relative max-w-sm w-full group">
             <div className="absolute -top-12 inset-x-0 text-center">
                <span className="bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">长按下方图片保存至相册</span>
             </div>
             
             <button onClick={() => setPosterImage(null)} className="absolute -right-2 -top-14 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/10 active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
             
             <img src={posterImage} className="w-full h-auto rounded-[2rem] shadow-2xl border border-white/10 select-none pointer-events-auto" alt="Activity Poster" />
             
             <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2 text-white/40">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-black uppercase tracking-widest">已为您生成专属海报</span>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPromotion;
