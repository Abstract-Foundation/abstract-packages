export interface PortalPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PortalAppSummary {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  link?: string;
  categories?: string[];
  socials?: {
    twitter?: string;
    discord?: string;
  };
}

export interface PortalAppListResponse {
  items: PortalAppSummary[];
  pagination: PortalPagination;
}

export interface PortalAppContract {
  name: string;
  address: string;
}

export interface PortalAppDetail extends PortalAppSummary {
  contracts?: PortalAppContract[];
}

export interface PortalStreamer {
  id: string;
  name: string;
  description?: string;
  walletAddress: string;
  avatarUrl: string;
  socials?: {
    twitter?: string;
    discord?: string;
  };
}

export interface PortalStreamItem {
  id: string;
  title: string;
  description?: string;
  streamer: PortalStreamer;
  isVerified: boolean;
  thumbnailUrl: string;
  playbackId: string;
}

export interface PortalStreamsResponse {
  items: PortalStreamItem[];
  pagination: PortalPagination;
  app?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    banner?: string;
    link?: string;
  };
}

export interface PortalUserProfile {
  address: string;
  name: string;
  description?: string;
  profilePictureUrl: string;
  tier: string;
}
