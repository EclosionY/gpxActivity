
import React from 'react';
import { GpxData } from '../types.ts';

interface TrackListProps {
  tracks: GpxData[];
  selectedTrackId?: string;
  onSelectTrack: (track: GpxData) => void;
  onDeleteTrack: (id: string) => void;
  onClose: () => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, selectedTrackId, onSelectTrack, onDeleteTrack, onClose }) => {
  return (
    <div className="fixed inset-y-0 left-0 z-[5000] w-full md:max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-left duration-300">
      <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
        <div>
          <h2 className="text-xl font-black flex items-center tracking-tight">
            <svg className="w-6 h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            云端轨迹库
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">共享轨迹库</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tracks.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <svg className="w-16 h-16 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
            <p className="font-black text-sm uppercase tracking-widest">未发现云端数据</p>
          </div>
        ) : (
          tracks.map((track) => (
            <div 
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`relative group cursor-pointer p-5 rounded-[1.5rem] border-2 transition-all active:scale-[0.98] ${selectedTrackId === track.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-50 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800 truncate text-base">{track.name}</h3>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteTrack(track.id); }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg font-black text-[10px]">{track.distance} 公里</span>
                <span className="flex items-center text-[10px] font-bold text-slate-500">
                  <svg className="w-3 h-3 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  {track.elevationGain}米
                </span>
                <span className="text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-2">
                  {track.startTime ? new Date(track.startTime).toLocaleDateString('zh-CN', {month:'short', day:'numeric'}) : '暂无时间'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-8 border-t bg-slate-50">
        <div className="flex items-center justify-center space-x-3 text-slate-400">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em]">云端同步引擎 v2</span>
        </div>
      </div>
    </div>
  );
};

export default TrackList;
