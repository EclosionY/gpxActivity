
export interface GeoPoint {
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
}

export interface GpxData {
  id: string;
  name: string;
  points: GeoPoint[];
  distance: number; // km
  elevationGain: number; // m
  elevationLoss: number; // m
  maxElevation: number; // m
  minElevation: number; // m
  startTime?: Date;
  endTime?: Date;
}

export interface Activity {
  id: string;
  trackId: string;
  routeName: string;
  date: string;
  time: string;
  meetingPoint: string;
  leader: string;
  limit: string;
  difficulty: string;
  weather: string;
  roadType: string;
  distance: string;
  elevationGain: string;
  duration: string;
  groupImage?: string; // 群图片或二维码 Base64
  introText?: string;  // 新增：活动详细介绍文字
  introImage?: string; // 新增：活动详情页主图片 Base64
  
  fullText: string;
  createdAt: string;
  notes: string;
  fees: string;
  equipment: string;
  disclaimer: string;
}
