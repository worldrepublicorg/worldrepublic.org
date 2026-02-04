export interface Election {
  id: string;
  name: string;
  startsAt: number; // Timestamp in milliseconds
  endsAt: number; // Timestamp in milliseconds
  rewardPool: string; // Decimal string
  createdAt: number; // Timestamp in milliseconds
}
