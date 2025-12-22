
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GpxData, GeoPoint } from '../types.ts';

interface MapProps {
  gpxData?: GpxData;
  userLocation?: GeoPoint;
}

const Map: React.FC<MapProps> = ({ gpxData, userLocation }) => {
  const mapRef = useRef<L.Map | null>(null);
  const trackLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  // 悬停交互相关的图层引用
  const highlightPointRef = useRef<L.CircleMarker | null>(null);
  const highlightSegmentRef = useRef<L.Polyline | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map-container', {
        zoomControl: false,
        attributionControl: true
      }).setView([39.9, 116.4], 13);
      
      L.tileLayer('https://tiles.windy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.windy.com/">Windy.com</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      const timer = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);

      return () => clearTimeout(timer);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 更新 GPX 轨迹显示及交互
  useEffect(() => {
    if (mapRef.current && gpxData && gpxData.points.length > 0) {
      const map = mapRef.current;
      
      // 清除旧图层
      if (trackLayerRef.current) map.removeLayer(trackLayerRef.current);
      if (highlightPointRef.current) map.removeLayer(highlightPointRef.current);
      if (highlightSegmentRef.current) map.removeLayer(highlightSegmentRef.current);

      const latlngs = gpxData.points.map(p => [p.lat, p.lng] as L.LatLngExpression);
      
      // 创建主轨迹线
      const track = L.polyline(latlngs, { 
        color: '#2563eb', 
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round'
      }).addTo(map);
      
      trackLayerRef.current = track;

      // 准备高亮图层（初始不显示）
      highlightPointRef.current = L.circleMarker([0, 0], {
        radius: 6,
        fillColor: '#ffffff',
        fillOpacity: 1,
        color: '#ef4444',
        weight: 3
      });

      highlightSegmentRef.current = L.polyline([], {
        color: '#ef4444',
        weight: 10,
        opacity: 0.4,
        lineCap: 'round'
      });

      // 交互逻辑：寻找最近点
      const findNearestPoint = (latlng: L.LatLng) => {
        let minDist = Infinity;
        let nearestIdx = -1;
        
        for (let i = 0; i < gpxData.points.length; i++) {
          const p = gpxData.points[i];
          const dist = latlng.distanceTo([p.lat, p.lng]);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }
        return nearestIdx;
      };

      track.on('mousemove', (e: L.LeafletMouseEvent) => {
        const idx = findNearestPoint(e.latlng);
        if (idx === -1) return;

        const point = gpxData.points[idx];
        const pos = L.latLng(point.lat, point.lng);

        // 更新高亮圆点
        highlightPointRef.current?.setLatLng(pos).addTo(map);

        // 更新高亮片段（显示前后各5个点）
        const start = Math.max(0, idx - 5);
        const end = Math.min(gpxData.points.length - 1, idx + 5);
        const segmentCoords = gpxData.points.slice(start, end + 1).map(p => [p.lat, p.lng] as L.LatLngExpression);
        highlightSegmentRef.current?.setLatLngs(segmentCoords).addTo(map);

        // 更新 Tooltip
        const timeStr = point.time ? new Date(point.time).toLocaleTimeString('zh-CN', { hour12: false }) : '无时间';
        const eleStr = point.ele !== undefined ? `${point.ele.toFixed(1)}m` : '无海拔';
        
        const content = `
          <div class="p-1 text-xs font-sans leading-relaxed">
            <div class="font-bold text-slate-800 border-b border-slate-100 mb-1 pb-1">位置详情</div>
            <div class="flex justify-between space-x-4">
              <span class="text-slate-400">经纬度:</span>
              <span class="font-mono text-slate-700">${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</span>
            </div>
            <div class="flex justify-between space-x-4">
              <span class="text-slate-400">海拔:</span>
              <span class="font-mono text-slate-700">${eleStr}</span>
            </div>
            <div class="flex justify-between space-x-4">
              <span class="text-slate-400">时间:</span>
              <span class="font-mono text-slate-700">${timeStr}</span>
            </div>
          </div>
        `;

        if (!tooltipRef.current) {
          tooltipRef.current = L.tooltip({
            sticky: true,
            className: 'custom-track-tooltip',
            direction: 'top',
            offset: [0, -10]
          });
        }
        
        track.bindTooltip(content).openTooltip(e.latlng);
      });

      track.on('mouseout', () => {
        if (highlightPointRef.current) map.removeLayer(highlightPointRef.current);
        if (highlightSegmentRef.current) map.removeLayer(highlightSegmentRef.current);
        track.unbindTooltip();
      });

      map.fitBounds(track.getBounds(), { padding: [40, 40] });
    }
  }, [gpxData]);

  // 更新用户当前位置标记
  useEffect(() => {
    if (mapRef.current && userLocation) {
      const pos = [userLocation.lat, userLocation.lng] as L.LatLngExpression;
      
      if (!userMarkerRef.current) {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center">
                   <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        userMarkerRef.current = L.marker(pos, { icon: customIcon }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng(pos);
      }
    }
  }, [userLocation]);

  return (
    <>
      <style>{`
        .custom-track-tooltip {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          padding: 4px;
        }
        .custom-track-tooltip:before {
          border-top-color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
      <div id="map-container" className="w-full h-full absolute inset-0 bg-slate-200" />
    </>
  );
};

export default Map;
