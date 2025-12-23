
import React, { useState, useMemo, useEffect } from 'react';
import { GpxData, Activity } from '../types.ts';

interface EventGeneratorProps {
  data: GpxData;
  activity?: Activity | null;
  onClose: () => void;
  onPublished?: () => void;
}

const EventGenerator: React.FC<EventGeneratorProps> = ({ data, activity, onClose, onPublished }) => {
  const [form, setForm] = useState({
    routeName: activity?.routeName || data.name,
    date: activity?.date || new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) + '（周日）',
    time: activity?.time || '上午 9:00',
    meetingPoint: activity?.meetingPoint || '某某驿站',
    leader: activity?.leader || '领队昵称',
    limit: activity?.limit || '20',
    difficulty: activity?.difficulty || '★★☆☆☆',
    weather: activity?.weather || '6～17℃（☀️）',
    roadType: activity?.roadType || '石阶路 / 土路 / 碎石路 / 公路',
    distance: activity?.distance || data.distance.toString(),
    elevationGain: activity?.elevationGain || data.elevationGain.toString(),
    duration: activity?.duration || '4～7 小时',
    groupImage: activity?.groupImage || '',
    introImage: activity?.introImage || '',
    introText: activity?.introText || '这是一条精心规划的徒步路线，沿途风景优美，适合户外爱好者探索。我们将穿过丛林与小径，感受大自然的魅力。',
    
    notes: activity?.notes || '• 活动开始前 15 分钟关闭报名，临时报名请联系领队\n• 未购买保险者需自行承担活动风险\n• 已购买户外运动保险者如发生意外，需在 24 小时内报案\n• 请保持团队意识，遵守规则，注意户外礼仪',
    fees: activity?.fees || '• 1 元组：含 10 万元体育运动意外险\n• 0 元组：自行承担活动风险',
    equipment: activity?.equipment || '• 上身：速干内层、保暖层（抓绒）、防风软壳。\n• 下身：速干长裤或加绒软壳裤。\n• 鞋袜：登山鞋、徒步鞋或越野鞋。\n• 防滑装备：建议随身携带轻量冰爪。\n• 其他：帽子、Buff、防风手套、水与补给。',
    disclaimer: activity?.disclaimer || '• 活动为非商业性质自愿组织，并已备案\n• 参与者须遵循“自愿参与，自甘风险”原则，安全责任自行承担\n• 组织方与领队负责路线规划、指引与必要协助，不承担超出意外险范围的责任\n• 报名即视为同意并接受以上全部条款'
  });

  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isEditMode = !!activity;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'groupImage' | 'introImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm({ ...form, [field]: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const generatedText = useMemo(() => {
    return `🌟 【${form.routeName}】活动邀约

${form.introText}

📅 活动日期：${form.date}
⏰ 集合时间：${form.time}
📍 集合地点：${form.meetingPoint}
🌤️ 天气情况：${form.weather}

——————————

详细参数
• 徒步距离：${form.distance} 公里
• 累计爬升：${form.elevationGain} 米
• 预计用时：${form.duration}
• 活动强度：${form.difficulty}

——————————

活动须知
${form.notes}

——————————

报名费用
${form.fees}

——————————

装备要求
${form.equipment}

——————————

法律关系与免责声明
${form.disclaimer}

🔗 详情与导航：见活动邀请页`;
  }, [form]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const activityData: Activity = {
      id: activity?.id || 'act-' + Math.random().toString(36).substr(2, 9),
      trackId: data.id,
      ...form,
      fullText: generatedText,
      createdAt: activity?.createdAt || new Date().toISOString()
    };

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });
      if (response.ok) {
        onPublished?.();
        onClose();
      } else {
        const local = JSON.parse(localStorage.getItem('turbotrack_activities') || '[]');
        if (isEditMode) {
          const index = local.findIndex((a: any) => a.id === activityData.id);
          if (index !== -1) local[index] = activityData;
          else local.unshift(activityData);
        } else {
          local.unshift(activityData);
        }
        localStorage.setItem('turbotrack_activities', JSON.stringify(local));
        onPublished?.();
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert(isEditMode ? "更新失败" : "发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-white md:bg-slate-900/60 md:backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white w-full h-full md:max-w-6xl md:h-[95vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div className="pr-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{isEditMode ? '修改活动档案' : '发布新活动'}</h2>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1 hidden md:block">
              活动生成引擎 v3.5
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setShowPreview(!showPreview)} className="md:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 active:scale-95 shadow-sm">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 active:scale-95 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className={`w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-100 bg-white space-y-10 pb-32 ${showPreview ? 'hidden md:block' : 'block'}`}>
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">核心信息 / 关键数据</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">路线名称</label>
                  <input 
                    type="text" 
                    value={form.routeName} 
                    onChange={e => setForm({...form, routeName: e.target.value})}
                    className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl px-5 py-3 text-sm font-black text-slate-800 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* 新增：活动主图上传 */}
                <div className="bg-blue-50/50 p-6 rounded-[2.2rem] border border-blue-100">
                  <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">活动封面图 / 介绍图 (详情页展示)</label>
                  <div className="flex items-center space-x-6">
                    {form.introImage ? (
                      <div className="relative w-40 h-24 shrink-0">
                        <img src={form.introImage} className="w-full h-full object-cover rounded-xl shadow-lg" alt="预览" />
                        <button onClick={() => setForm({...form, introImage: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ) : (
                      <label className="w-40 h-24 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all text-blue-400 hover:text-blue-500 hover:border-blue-300">
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'introImage')} className="hidden" />
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        <span className="text-[9px] font-black uppercase">上传详情封面</span>
                      </label>
                    )}
                    <div className="text-[10px] text-blue-500/70 font-medium leading-relaxed italic">
                      该图片将展示在活动详情页的介绍部分。
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">活动介绍文字 (详情展示)</label>
                  <textarea rows={3} value={form.introText} onChange={e => setForm({...form, introText: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-200 resize-none" placeholder="简要描述活动亮点..." />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">里程 (KM)</label>
                    <input type="text" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">爬升 (M)</label>
                    <input type="text" value={form.elevationGain} onChange={e => setForm({...form, elevationGain: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">预计时长</label>
                    <input type="text" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">活动日期</label>
                    <input type="text" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">集合时间</label>
                    <input type="text" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-200" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">集合地点</label>
                    <input type="text" value={form.meetingPoint} onChange={e => setForm({...form, meetingPoint: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">天气情况</label>
                    <input type="text" value={form.weather} onChange={e => setForm({...form, weather: e.target.value})} className="w-full bg-orange-50/50 border-2 border-orange-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-300 transition-all" />
                  </div>
                </div>

                {/* 群图片上传 */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">群二维码 / 报名图片 (扫描进群)</label>
                  <div className="flex items-center space-x-6">
                    {form.groupImage ? (
                      <div className="relative w-32 h-32 shrink-0">
                        <img src={form.groupImage} className="w-full h-full object-cover rounded-2xl shadow-lg" alt="预览" />
                        <button onClick={() => setForm({...form, groupImage: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all text-slate-400 hover:text-emerald-500 hover:border-emerald-200">
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'groupImage')} className="hidden" />
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">上传二维码</span>
                      </label>
                    )}
                    <div className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                      上传微信群二维码，方便队员快速加入。
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">领队</label>
                    <input type="text" value={form.leader} onChange={e => setForm({...form, leader: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-200" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">人数限制</label>
                    <input type="text" value={form.limit} onChange={e => setForm({...form, limit: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-200" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">强度星级</label>
                    <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none appearance-none focus:border-slate-200">
                      <option>★☆☆☆☆</option>
                      <option>★★☆☆☆</option>
                      <option>★★★☆☆</option>
                      <option>★★★★☆</option>
                      <option>★★★★★</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">详情说明</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">活动须知</label>
                  <textarea rows={4} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-600 outline-none focus:border-slate-200 resize-none font-sans" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">路况类型</label>
                  <input type="text" value={form.roadType} onChange={e => setForm({...form, roadType: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">报名费用</label>
                  <textarea rows={3} value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-600 outline-none focus:border-slate-200 resize-none font-sans" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">装备要求</label>
                  <textarea rows={5} value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] px-5 py-4 text-sm font-medium text-slate-600 outline-none focus:border-slate-200 resize-none font-sans" />
                </div>
              </div>
            </section>
          </div>

          <div className={`w-full md:w-1/2 p-0 flex flex-col bg-slate-50 relative ${showPreview ? 'block' : 'hidden md:block'}`}>
            <div className="p-4 border-b bg-slate-100 flex justify-between items-center shrink-0">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">邀约推文文案预览</span>
               <button onClick={handleCopy} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all shadow-sm ${copied ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-200'}`}>
                 {copied ? '复制成功!' : '复制文本'}
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 font-mono text-xs md:text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap select-all bg-white/50">
              {generatedText}
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-white border-t border-slate-100 shrink-0">
          <button 
            onClick={handlePublish}
            disabled={isPublishing}
            className="w-full bg-slate-900 text-white font-black text-sm uppercase tracking-widest py-5 rounded-[1.5rem] transition-all hover:bg-slate-800 active:scale-[0.98] flex items-center justify-center space-x-3 shadow-2xl shadow-slate-300"
          >
            {isPublishing ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                <span>{isEditMode ? '更新档案' : '保存并公开活动'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventGenerator;
