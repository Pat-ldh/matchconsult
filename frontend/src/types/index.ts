export interface AnalyzeRequest {
  mission_text: string;
  required_availability?: string;
  priority_skills?: string[];
  max_results?: number;
}

export interface RewrittenOffer {
  title: string;
  mission_type: string;
  duration: string;
  technical_skills: string[];
  soft_skills: string[];
  client_context: string;
}

export interface ConsultantMatch {
  id: string;
  name: string;
  title: string;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  available: boolean;
  cv_filename: string;
}

export interface AnalyzeResponse {
  rewritten_offer: RewrittenOffer;
  consultants: ConsultantMatch[];
  total_cvs: number;
}
