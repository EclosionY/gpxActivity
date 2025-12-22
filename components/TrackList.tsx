
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
    <div className="absolute inset-y-0 left-0 z-[2000] w-full max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-left duration-300">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            云端轨迹库
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shared with everyone</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tracks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
            <p>云端暂无轨迹，快去分享吧</p>
          </div>
        ) : (
          tracks.map((track) => (
            <div 
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`relative group cursor-pointer p-4 rounded-2xl border-2 transition-all hover:shadow-md ${selectedTrackId === track.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 truncate max-w-[200px]">{track.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTrack(track.id); }}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold">{track.distance} km</span>
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  {track.elevationGain}m
                </span>
                <span className="truncate opacity-60">
                  {track.startTime ? track.startTime.toLocaleDateString() : '未知日期'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-6 border-t bg-slate-50">
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Live Cloud Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default TrackList;
