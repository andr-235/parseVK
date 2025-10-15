export interface IAuthorCity {
  id?: number;
  title?: string;
}

export interface IAuthorCountry {
  id?: number;
  title?: string;
}

export interface IAuthorCareerItem {
  group_id?: number;
  company?: string;
  country_id?: number;
  city_id?: number;
  city_name?: string;
  from?: number;
  until?: number;
  position?: string;
}

export interface IAuthorContacts {
  mobile_phone?: string;
  home_phone?: string;
}

export interface IAuthorCounters {
  albums?: number;
  videos?: number;
  audios?: number;
  photos?: number;
  notes?: number;
  friends?: number;
  gifts?: number;
  groups?: number;
  online_friends?: number;
  mutual_friends?: number;
  user_videos?: number;
  user_photos?: number;
  followers?: number;
  pages?: number;
  subscriptions?: number;
}

export interface IAuthorEducation {
  university?: number;
  university_name?: string;
  faculty?: number;
  faculty_name?: string;
  graduation?: number;
}

export interface IAuthorLastSeen {
  time?: number;
  platform?: number;
}

export interface IAuthorMilitary {
  unit?: string;
  unit_id?: number;
  country_id?: number;
  from?: number;
  until?: number;
}

export interface IAuthorOccupation {
  type?: string;
  id?: number;
  name?: string;
}

export interface IAuthorPersonal {
  political?: number;
  langs?: string[];
  religion?: string;
  inspired_by?: string;
  people_main?: number;
  life_main?: number;
}

export interface IAuthorRelative {
  id?: number;
  name?: string;
  type?: string;
}

export interface IAuthorSchool {
  id?: string;
  country?: number;
  city?: number;
  name?: string;
  year_from?: number;
  year_to?: number;
  year_graduated?: number;
  class?: string;
  speciality?: string;
  type?: number;
  type_str?: string;
}

export interface IAuthorUniversity {
  id?: number;
  country?: number;
  city?: number;
  name?: string;
  faculty?: number;
  faculty_name?: string;
  chair?: number;
  chair_name?: string;
  graduation?: number;
  education_form?: string;
  education_status?: string;
}

export interface IAuthor {
  id: number;
  first_name: string;
  last_name: string;
  deactivated?: string;
  is_closed?: boolean;
  can_access_closed?: boolean;
  domain?: string;
  screen_name?: string;
  photo_50?: string;
  photo_100?: string;
  photo_200?: string;
  photo_200_orig?: string;
  photo_400_orig?: string;
  photo_max?: string;
  photo_max_orig?: string;
  photo_id?: string;
  city?: IAuthorCity;
  country?: IAuthorCountry;
  about?: string;
  activities?: string;
  bdate?: string;
  books?: string;
  career?: IAuthorCareerItem[];
  connections?: Record<string, string>;
  contacts?: IAuthorContacts;
  counters?: IAuthorCounters;
  education?: IAuthorEducation;
  followers_count?: number;
  home_town?: string;
  interests?: string;
  last_seen?: IAuthorLastSeen;
  maiden_name?: string;
  military?: IAuthorMilitary[];
  movies?: string;
  music?: string;
  nickname?: string;
  occupation?: IAuthorOccupation;
  personal?: IAuthorPersonal;
  relatives?: IAuthorRelative[];
  relation?: number;
  schools?: IAuthorSchool[];
  sex?: number;
  site?: string;
  status?: string;
  timezone?: number;
  tv?: string;
  universities?: IAuthorUniversity[];
}
