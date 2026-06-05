import { Language } from "./types";

// ── Domain ────────────────────────────────────────────────────────────────────

export interface IUser {
  username: string;
  email: string;
  password: string;
  partnerEmail?: string;
  assignedTaskId?: string;
  points: number;
}

export interface ITask {
  id: string;
  title: string;
  difficulty: number;
  ownerEmail: string;
  completed: boolean;
  createdAt: number;
}

export interface IPartnerRequest {
  id: string;
  fromEmail: string;
  fromUsername: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface IAppState {
  users: IUser[];
  tasks: ITask[];
  pendingRequests: IPartnerRequest[];
}

export interface IWheelTask {
  id: string;
  title: string;
  difficulty: number;
}

// ── Component props ───────────────────────────────────────────────────────────

export interface ITaskCardProps {
  title: string;
  difficulty: number;
  status: string;
  isSelected?: boolean;
}

export interface ITaskWheelProps {
  tasks: IWheelTask[];
  onSelect: (task: IWheelTask) => void;
}

export interface ISpinWheelSectionProps {
  tasks: IWheelTask[];
  onSelect: (task: IWheelTask) => void;
}

export interface IPartnerSectionProps {
  soloMode: boolean;
  onSoloModeChange: (solo: boolean) => void;
  partner: IUser | null;
  currentUserEmail: string;
  onRequestSent: (toEmail: string) => void;
}

export interface IActiveTaskSectionProps {
  assignedTask: ITask | null;
  onComplete: () => void;
}

export interface ITaskListSectionProps {
  incompleteTasks: ITask[];
  completedTasks: ITask[];
  assignedTaskId?: string;
}

export interface IAppHeaderProps {
  isSignedIn: boolean;
  currentUser: IUser | null;
  partner: IUser | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignOut: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}
