export interface Campaign {
  id: string;
  title: string;
  description: string;
  areaName: string;
  radiusKm: number;
  center: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  afterImageUrl?: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignRequest {
  title: string;
  description: string;
  areaName: string;
  radiusKm: number;
  center: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  afterImageUrl?: string;
}

export interface UpdateCampaignRequest {
  id: string;
  title?: string;
  description?: string;
  areaName?: string;
  radiusKm?: number;
  center?: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  afterImageUrl?: string;
}

