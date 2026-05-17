// Party Types for Redis-based parties system

export interface Party {
	id: string;
	name: string;
	description?: string;
	websiteUrl?: string;
	foundedBy: string;
	leaderUsername: string;
	createdAt: number;
	updatedAt: number;
}

export interface CreatePartyData {
	name: string;
	description?: string;
	websiteUrl?: string;
}

export interface UpdatePartyData {
	name?: string;
	description?: string;
	websiteUrl?: string;
}

export interface PartyFilters {
	search?: string;
	limit?: number;
	offset?: number;
	order?: "newest" | "random";
}
