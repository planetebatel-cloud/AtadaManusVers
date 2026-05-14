export interface ResumeExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface ResumeContact {
  email: string;
  phone: string;
  website: string;
  linkedin: string;
}

export interface ResumeData {
  name: string;
  title: string;
  location: string;
  about: string;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  contact: ResumeContact;
}
