export interface LoginFormModel {
  email: string;
  password: string;
}

export interface SignupFormModel {
  display_name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordFormModel {
  email: string;
}

export interface TeamFormModel {
  team_name: string;
  category: string;
}

export interface AthleteFormModel {
  first_name: string;
  last_name: string;
  sex: 'M' | 'F';
  email: string;
  phone_number: string;
  date_of_birth: string;
  gym_selection: string;
  gym: string;
}

export interface AdminAthleteFormModel {
  first_name: string;
  last_name: string;
  sex: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  waiver: boolean;
  gym: string;
  city: string;
}

export interface AdminTeamFormModel {
  team_name: string;
  category: string;
  paid: boolean;
  verified: boolean;
}

export interface ScoreFormModel {
  reps: number | null;
  time_minutes: number | null;
  time_seconds: number | null;
  tiebreak_minutes: number | null;
  tiebreak_seconds: number | null;
  score_detail: string;
}
