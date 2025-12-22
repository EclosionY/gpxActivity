
import { GeoPoint, GpxData } from '../types.ts';

// 兼容性 ID 生成器
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'track-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const parseGpx = (xmlText: string): GpxData => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const trkpts = xmlDoc.getElementsByTagName("trkpt");
  const name = xmlDoc.getElementsByTagName("name")[0]?.textContent || "未命名轨迹";

  const points: GeoPoint[] = [];
  let distance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxEle = -Infinity;
  let minEle = Infinity;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lng = parseFloat(pt.getAttribute("lon") || "0");
    const eleNode = pt.getElementsByTagName("ele")[0];
    const ele = eleNode ? parseFloat(eleNode.textContent || "0") : undefined;
    const time = pt.getElementsByTagName("time")[0]?.textContent || undefined;

    const currentPoint: GeoPoint = { lat, lng, ele, time };
    points.push(currentPoint);

    if (ele !== undefined) {
      if (ele > maxEle) maxEle = ele;
      if (ele < minEle) minEle = ele;
      
      if (i > 0) {
        const prevEle = points[i - 1].ele;
        if (prevEle !== undefined) {
          const diff = ele - prevEle;
          if (diff > 0) elevationGain += diff;
          else elevationLoss += Math.abs(diff);
        }
      }
    }

    if (i > 0) {
      distance += calculateDistance(points[i - 1], currentPoint);
    }
  }

  return {
    id: generateId(),
    name,
    points,
    distance: parseFloat(distance.toFixed(2)),
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    maxElevation: maxEle === -Infinity ? 0 : Math.round(maxEle),
    minElevation: minEle === Infinity ? 0 : Math.round(minEle),
    startTime: points[0]?.time ? new Date(points[0].time) : undefined,
    endTime: points[points.length - 1]?.time ? new Date(points[points.length - 1].time) : undefined,
  };
};

const calculateDistance = (p1: GeoPoint, p2: GeoPoint): number => {
  const R = 6371; // Earth radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
