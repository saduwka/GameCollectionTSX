export interface Review {
  id?: string;
  userId: string; 
  username: string;
  comment: string; 
  rating: number; 
  createdAt?: any;
}
