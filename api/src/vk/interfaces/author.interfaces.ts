export interface IAuthor {
  id: number;
  first_name: string;
  last_name: string;
  is_closed?: boolean;
  can_access_closed?: boolean;
  domain?: string;
  screen_name?: string;
  photo_50?: string;
  photo_100?: string;
  photo_200_orig?: string;
  city?: { id: number; title: string };
  country?: { id: number; title: string };
}
