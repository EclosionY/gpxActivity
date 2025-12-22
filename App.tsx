
import React, { useState, useEffect, useCallback } from 'react';
import Map from './components/Map.tsx';
import Dashboard from './components/Dashboard.tsx';
import TrackList from './components/TrackList.tsx';
import ActivityList from './components/ActivityList.tsx';
import EventGenerator from './components/EventGenerator.tsx';
import ActivityPromotion from './components/ActivityPromotion.tsx';
import { parseGpx } from './services/gpxService.ts';
import { GpxData, GeoPoint, Activity } from './types.ts';

const App: React.FC = () => {
  const [trackSummaries, setTrackSummaries] = useState<GpxData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<GpxData | undefined>();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingTrackData, setEditingTrackData] = useState<GpxData | null>(null);
  const [promotionData, setPromotionData] = useState<{activity: Activity, track: GpxData} | null>(null);
  
  const [userLocation, setUserLocation] = useState<GeoPoint | undefined>();
  const [showDashboard, setShowDashboard] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const [showActivityList, setShowActivityList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const getLocalTracks = useCallback((): GpxData[] => {
    const data = localStorage.getItem('turbotrack_local_tracks');
    return data ? JSON.parse(data) : [];
  }, []);

  const getLocalActivities = useCallback((): Activity[] => {
    const data = localStorage.getItem('turbotrack_activities');
    return data ? JSON.parse(data) : [];
  }, []);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) return await response.json();
      return null;
    } catch (e) {
      console.warn(`API 调用失败:`, e);
      throw e;
    }
  };

  const checkCloudStatus = async () => {
    try {
      await fetch('/api/tracks', { method: 'GET' });
      setIsCloudEnabled(true);
      return true;
    } catch (e) {
      setIsCloudEnabled(false);
      return false;
    }
  };

  const fetchTrackDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const fullData = await safeFetch(`/api/tracks/${id}`);
      if (fullData) {
        const revived = { ...fullData, startTime: fullData.startTime ? new Date(fullData.startTime) : undefined, endTime: fullData.endTime ? new Date(fullData.endTime) : undefined };
        setIsLoading(false);
        return revived;
      }
    } catch (e) {}
    const track = getLocalTracks().find(t => t.id === id);
    setIsLoading(false);
    return track || null;
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const cloudActive = await checkCloudStatus();
    
    if (cloudActive) {
      try {
        const tracks = await safeFetch('/api/tracks');
        if (tracks) setTrackSummaries(tracks.map((t: any) => ({
          ...t,
          startTime: t.startTime ? new Date(t.startTime) : undefined,
          endTime: t.endTime ? new Date(t.endTime) : undefined
        })));
        const acts = await safeFetch('/api/activities');
        if (acts) setActivities(acts);
        setIsLoading(false);
        return;
      } catch (e) {}
    }
    setTrackSummaries(getLocalTracks());
    setActivities(getLocalActivities());
    setIsLoading(false);
  }, [getLocalTracks, getLocalActivities]);

  // 处理 URL 分享参数
  useEffect(() => {
    const handleUrlParams = async () => {
      if (!isInitialLoad) return;
      const params = new URLSearchParams(window.location.search);
      const activityId = params.get('activity');
      const trackId = params.get('track');

      if (activityId) {
        setIsLoading(true);
        try {
          // 尝试从 API 获取活动详情
          let activity = await safeFetch(`/api/activities/${activityId}`);
          if (!activity) activity = getLocalActivities().find(a => a.id === activityId);
          
          if (activity) {
            const track = await fetchTrackDetails(activity.trackId);
            if (track) {
              setPromotionData({ activity, track });
            }
          }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); setIsInitialLoad(false); }
      } else if (trackId) {
        setIsInitialLoad(false);
        const details = await fetchTrackDetails(trackId);
        if (details) {
          setSelectedTrack(details);
          setShowDashboard(true);
        }
      } else {
        setIsInitialLoad(false);
      }
    };
    
    handleUrlParams();
  }, [isInitialLoad]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, ele: pos.coords.altitude || undefined, time: new Date().toISOString() }),
        null, { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = parseGpx(e.target?.result as string);
        setIsLoading(true);
        if (isCloudEnabled) {
          try { await safeFetch('/api/tracks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
          catch (e) {
             const local = getLocalTracks();
             localStorage.setItem('turbotrack_local_tracks', JSON.stringify([data, ...local]));
          }
        } else {
           const local = getLocalTracks();
           localStorage.setItem('turbotrack_local_tracks', JSON.stringify([data, ...local]));
        }
        await fetchData();
        setSelectedTrack(data);
        setShowDashboard(true);
      } catch (err: any) { alert(`解析失败: ${err.message}`); }
      finally { setIsLoading(false); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const deleteActivity = async (id: string) => {
    try {
      if (isCloudEnabled) await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      const local = getLocalActivities().filter(a => a.id !== id);
      localStorage.setItem('turbotrack_activities', JSON.stringify(local));
      await fetchData();
    } catch (e) { alert("删除失败"); }
  };

  const deleteTrack = async (id: string) => {
    if (!confirm("确定要删除这条轨迹吗？")) return;
    try {
      if (isCloudEnabled) await fetch(`/api/tracks/${id}`, { method: 'DELETE' });
      const local = getLocalTracks().filter(t => t.id !== id);
      localStorage.setItem('turbotrack_local_tracks', JSON.stringify(local));
      await fetchData();
      if (selectedTrack?.id === id) { setSelectedTrack(undefined); setShowDashboard(false); }
    } catch (e) { alert("删除失败"); }
  };

  const handleEditActivity = async (activity: Activity) => {
    const trackData = await fetchTrackDetails(activity.trackId);
    if (!trackData) {
      alert("无法加载关联的轨迹数据");
      return;
    }
    setEditingTrackData(trackData);
    setEditingActivity(activity);
    setShowActivityList(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col font-sans overflow-hidden">
      {/* 宣传页模式 */}
      {promotionData && (
        <ActivityPromotion 
          activity={promotionData.activity} 
          trackData={promotionData.track} 
          onClose={() => {
            setPromotionData(null);
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      )}

      <header className="absolute top-0 inset-x-0 z-[1000] p-4 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-2">
          <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg border border-slate-200">
            <span className="font-black text-slate-800 block leading-tight text-lg tracking-tight">轨迹分享x活动发布</span>
            <div className="flex items-center space-x-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${isCloudEnabled ? 'bg-emerald-500' : 'bg-orange-400 animate-pulse'}`}></div>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                {isCloudEnabled ? '云端已连接' : '本地模式'}
               </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex space-x-2">
          <button onClick={() => setShowActivityList(true)} className="bg-slate-900 text-white p-3.5 rounded-full shadow-lg transition-all active:scale-90 border border-slate-800" title="活动档案">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2z"></path></svg>
          </button>
          <button onClick={() => setShowTrackList(true)} className="bg-white/90 backdrop-blur-md p-3.5 rounded-full shadow-lg border border-slate-200 transition-all active:scale-90" title="轨迹库">
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <label className="bg-emerald-500 p-3.5 rounded-full shadow-lg cursor-pointer flex items-center justify-center transition-all active:scale-90 hover:bg-emerald-600">
            <input type="file" accept=".gpx" onChange={handleFileUpload} className="hidden" />
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </label>
        </div>
      </header>

      <main className="flex-1 relative">
        <Map gpxData={selectedTrack} userLocation={userLocation} />
      </main>

      {showDashboard && selectedTrack && (
        <Dashboard 
          data={selectedTrack} 
          onClose={() => {
            setShowDashboard(false);
            window.history.replaceState({}, '', window.location.pathname);
          }} 
          onPublished={fetchData}
        />
      )}
      
      {showTrackList && (
        <TrackList 
          tracks={trackSummaries} 
          selectedTrackId={selectedTrack?.id} 
          onSelectTrack={async (s) => { 
            const details = await fetchTrackDetails(s.id); 
            if(details) setSelectedTrack(details);
            setShowDashboard(true);
            setShowTrackList(false); 
          }} 
          onDeleteTrack={deleteTrack} 
          onClose={() => setShowTrackList(false)} 
        />
      )}

      {showActivityList && (
        <ActivityList 
          activities={activities} 
          onDelete={deleteActivity} 
          onEdit={handleEditActivity}
          onClose={() => setShowActivityList(false)} 
          getTrackDetails={fetchTrackDetails}
        />
      )}

      {editingActivity && editingTrackData && (
        <EventGenerator
          data={editingTrackData}
          activity={editingActivity}
          onClose={() => { setEditingActivity(null); setEditingTrackData(null); }}
          onPublished={fetchData}
        />
      )}

      {trackSummaries.length === 0 && !isLoading && !selectedTrack && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] text-center w-full max-w-xs px-4 animate-in fade-in zoom-in duration-500">
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-slate-200">
            <h1 className="text-xl font-bold text-slate-800 mb-2">上传 GPX 开启活动</h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">分析海拔、里程并一键生成活动推文。</p>
            <label className="block w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl cursor-pointer text-center transition-all hover:bg-emerald-600 active:scale-95 shadow-lg shadow-emerald-100">
              立即上传
              <input type="file" accept=".gpx" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 z-[5000] bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-5 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in zoom-in duration-200">
            <div className="w-5 h-5 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-slate-700">正在处理轨迹数据...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
