
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
    leader: activity?.leader || 'Hepo',
    limit: activity?.limit || '20',
    difficulty: activity?.difficulty || '★★☆☆☆',
    weather: activity?.weather || '6～17℃（☀️）',
    roadType: activity?.roadType || '石阶路 / 土路 / 碎石路 / 公路',
    notes: activity?.notes || '• 活动开始前 15 分钟关闭报名，临时报名请联系领队\n• 未购买保险者需自行承担活动风险\n• 已购买户外运动保险者如发生意外，需在 24 小时内报案\n• 请保持团队意识，遵守规则，注意户外礼仪',
    fees: activity?.fees || '• 1 元组：含 10 万元体育运动意外险\n• 0 元组：自行承担活动风险',
    equipment: activity?.equipment || '• 上身：速干内层、保暖层（抓绒）、防风软壳。\n• 下身：速干长裤或加绒软壳裤。\n• 鞋袜：登山鞋、徒步鞋或越野鞋。\n• 防滑装备：建议随身携带轻量冰爪。\n• 其他：帽子、Buff、防风手套、水与补给。',
    disclaimer: activity?.disclaimer || '• 活动为非商业性质自愿组织，并已备案\n• 参与者须遵循“自愿参与，自甘风险”原则，安全责任自行承担\n• 组织方与领队负责路线规划、指引与必要协助，不承担超出意外险范围的责任\n• 报名即视为同意并接受以上全部条款'
  });

  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const isEditMode = !!activity;

  const generatedText = useMemo(() => {
    return `📅 活动日期：${form.date}
⏰ 集合时间：${form.time}
📍 集合地点：${form.meetingPoint}

——————————

活动须知
${form.notes}

——————————

报名费用
${form.fees}

——————————

活动信息
• 徒步线路：${form.routeName}
• 预计时长：4～7 小时
• 活动人数：${form.limit} 人
• 路况类型：${form.roadType}
• 领队：${form.leader}

——————————

装备要求
${form.equipment}

——————————

天气参考
• 白天气温：${form.weather}

——————————

法律关系与免责声明
${form.disclaimer}

——————————

详细参数
• 路线：${form.routeName}
• 集合位置：${form.meetingPoint}
• 徒步距离：${data.distance} km
• 累计爬升：${data.elevationGain} m
• 集合时间：${form.time}
• 活动强度：${form.difficulty}
• 预计用时：4-7小时`;
  }, [form, data]);

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
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{isEditMode ? '修改活动档案' : '编辑并发布活动'}</h2>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">
              {isEditMode ? 'Update existing activity details' : 'Customize Your Activity Details'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-100 bg-white space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">核心信息</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-600 mb-1">路线名称</label>
                  <input 
                    type="text" 
                    value={form.routeName} 
                    onChange={e => setForm({...form, routeName: e.target.value})}
                    className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">活动日期</label>
                    <input type="text" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">集合时间</label>
                    <input type="text" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">集合地点</label>
                  <input type="text" value={form.meetingPoint} onChange={e => setForm({...form, meetingPoint: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">领队</label>
                    <input type="text" value={form.leader} onChange={e => setForm({...form, leader: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">人数</label>
                    <input type="text" value={form.limit} onChange={e => setForm({...form, limit: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">难度</label>
                    <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none">
                      <option>★☆☆☆☆</option>
                      <option>★★☆☆☆</option>
                      <option>★★★☆☆</option>
                      <option>★★★★☆</option>
                      <option>★★★★★</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">天气/气温</label>
                  <input type="text" value={form.weather} onChange={e => setForm({...form, weather: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">文本详情编辑</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">活动须知</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none resize-none font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">报名费用</label>
                  <textarea rows={2} value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none resize-none font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">装备要求</label>
                  <textarea rows={4} value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none resize-none font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">法律声明</label>
                  <textarea rows={3} value={form.disclaimer} onChange={e => setForm({...form, disclaimer: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none resize-none font-sans" />
                </div>
              </div>
            </section>

            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl transition-all hover:bg-slate-800 active:scale-95 flex items-center justify-center space-x-2 shadow-xl shadow-slate-200"
            >
              {isPublishing ? '保存中...' : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                  <span>{isEditMode ? '保存修改并更新档案' : '确认发布活动并存档'}</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full md:w-1/2 p-0 flex flex-col bg-slate-50 relative">
            <div className="p-4 border-b bg-slate-100 flex justify-between items-center">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">推文预览</span>
               <button onClick={handleCopy} className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                 {copied ? '已复制' : '复制文案'}
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] leading-relaxed text-slate-600 whitespace-pre-wrap select-all bg-white/50">
              {generatedText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventGenerator;
