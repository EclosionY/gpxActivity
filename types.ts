
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
  fullText: string;
  createdAt: string;
  // Added missing fields used in EventGenerator
  notes: string;
  fees: string;
  equipment: string;
  disclaimer: string;
}
