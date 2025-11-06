// Database types matching the PostgreSQL schema

export interface Venue {
  id: string;
  name: string;
  city: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface Cyclist {
  id: string;
  uci_id: string | null;
  first_name: string;
  last_name: string;
  club: string | null;
  birth_date: string | null;
  gender: string | null;
  email: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicensedCyclist {
  id: string;
  uci_id: string;
  first_name: string;
  last_name: string;
  club: string | null;
  birth_date: string | null;
  gender: string | null;
  license_year: number;
  license_type: string | null;
  license_class: string | null;
  matched_cyclist_id: string | null;
  import_date: string;
  created_at: string;
}

export type CompetitionFormat = 'DH' | 'ENDURO' | 'XC' | 'OTHER';
export type CompetitionStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Competition {
  id: string;
  name: string;
  date: string;
  competition_format: CompetitionFormat;
  venue_id: string | null;
  description: string | null;
  status: CompetitionStatus;
  published: boolean;
  scoring_template_id: string | null;
  dh_seeding_template_id: string | null;
  dh_final_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitionClass {
  id: string;
  name: string;
  gender: string | null;
  age_group: string | null;
  description: string | null;
  created_at: string;
}

export type SeriesType = 'individual' | 'club';

export interface Series {
  id: string;
  name: string;
  year: number;
  type: SeriesType;
  point_system: number[]; // JSONB array of points
  count_best_results: number | null;
  description: string | null;
  published: boolean;
  club_top_riders_per_class: number | null;
  scoring_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeriesCompetition {
  id: string;
  series_id: string;
  competition_id: string;
  point_multiplier: number;
  weight: number;
  created_at: string;
}

export type ResultStatus = 'FIN' | 'DNF' | 'DNS' | 'DSQ';

export interface StageTime {
  stage: number;
  time: string; // Interval as string (e.g., "00:04:12.345")
}

export interface Result {
  id: string;
  competition_id: string;
  cyclist_id: string;
  class_id: string;
  position: number;
  total_time: string | null; // Interval as string
  stage_times: StageTime[] | null; // JSONB array
  time_behind_leader: string | null; // Interval as string
  status: ResultStatus;
  bib_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeriesResult {
  id: string;
  series_id: string;
  result_id: string;
  cyclist_id: string;
  points: number;
  adjusted_points: number;
  club_name: string | null;
  counts_for_club: boolean;
  created_at: string;
}

export type AdminRole = 'admin' | 'super_admin' | 'editor';

export interface AdminProfile {
  id: string;
  full_name: string | null;
  role: AdminRole;
  permissions: Record<string, any> | null; // JSONB
  created_at: string;
  updated_at: string;
}

export type ScoringTemplateFormat = 'enduro' | 'dh_seeding' | 'dh_final' | 'xc';

export interface ScoringTemplate {
  id: string;
  name: string;
  format_type: ScoringTemplateFormat;
  description: string | null;
  points_map: Record<string, number>; // JSONB: { "1": 500, "2": 450, ... }
  dnf_points: number;
  dns_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// View types

export interface SeriesStanding {
  series_id: string;
  cyclist_id: string;
  first_name: string;
  last_name: string;
  club: string | null;
  class_name: string;
  races_completed: number;
  total_points: number;
  all_points: number[]; // Array of all points ordered descending
}

export interface ClubSeriesStanding {
  series_id: string;
  club_name: string;
  active_cyclists: number;
  total_points: number;
  counting_results: number;
}

// Extended types with relations

export interface CompetitionWithVenue extends Competition {
  venue: Venue | null;
}

export interface ResultWithDetails extends Result {
  cyclist: Cyclist;
  competition: Competition;
  class: CompetitionClass;
}

export interface SeriesWithCompetitions extends Series {
  competitions: (SeriesCompetition & { competition: Competition })[];
}
