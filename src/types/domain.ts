// ─── Base ────────────────────────────────────────────────────────────────────

export type UserLanguage = 'en' | 'vi';
export type ColorMode = 'light' | 'dark' | 'system';

export interface User {
  _id: string;
  name: string;
  userCode: string;
  school: string;
  email: string;
  role: 'student' | 'teacher';
  avatar: string;
  language?: UserLanguage;
  colorMode?: ColorMode;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Subject / Class ─────────────────────────────────────────────────────────

export interface Subject {
  _id: string;
  code: string;
  name: string;
  hostId: string | User;
  startDay: string;
  endDay: string;
  currentSession: number;
  maxAbsences: number;
  joinCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSubject {
  _id: string;
  userId: string | User;
  subjectId: string | Subject;
  role: 'student' | 'teacher';
}

// ─── Class Sessions ───────────────────────────────────────────────────────────

export interface ClassSession {
  _id: string;
  subjectId: string | Subject;
  room: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  start: string; // HH:mm
  end: string; // HH:mm
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = 'CM' | 'KP' | 'CP';

export interface CAttend {
  _id: string;
  classSessionId: string | ClassSession;
  date: string;
  sessionNumber: number;
  teacherGPS: {
    latitude: number;
    longitude: number;
  } | null;
  isActive: boolean;
  timeExpired: number; // minutes
  numberOfAttend: number;
  acceptedNumber: number;
  isClosed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendRecord {
  _id: string;
  cAttendId: string | CAttend;
  studentId: string | User;
  listStatus: AttendanceStatus[];
  numberOfAbsence: number;
  status: AttendanceStatus;
  FCMToken?: string;
  studentGPS?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Student with attendance status for a specific cAttend (from attendStudents endpoint)
export interface StudentCAttendEntry extends User {
  status: AttendanceStatus;
  listStatus: { index: number; status: AttendanceStatus }[];
}

// ─── Discussion (In-Session Q&A) ──────────────────────────────────────────────

export interface Discussion {
  _id: string;
  cAttendId: string | CAttend;
  creator: string | User;
  title?: string;
  content: string;
  images: string[];
  replyOf?: string | Discussion | null;
  isResolved: boolean;
  upvotes: string[];
  downvotes: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Reaction {
  _id: string;
  discussionId: string | Discussion;
  userId: string | User;
  emoji: string;
  createdAt?: string;
}

// ─── Review / Feedback ────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  cAttendId: string | CAttend;
  studentId: string | User;
  understandPercent: number;
  usefulPercent: number;
  teachingMethodScore: string;
  atmosphereScore: string;
  documentScore: string;
  thinking: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export type GroupType = 'RANDOM' | 'DEFAULT';

export interface Group {
  _id: string;
  name: string;
  members: (string | User)[];
  admin: string | User;
  type: GroupType;
  cAttendId?: string | CAttend | null;
  subjectId: string | Subject;
  reviewedBy?: string | Group | null;
  autoAccept: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupMessage {
  _id: string;
  groupId: string | Group;
  senderId: string | User;
  content: string;
  images: string[];
  isRevoked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Channel / Posts ─────────────────────────────────────────────────────────

export interface Channel {
  _id: string;
  subjectId: string | Subject;
  name: string;
  createdAt?: string;
}

export interface Post {
  _id: string;
  channelId: string | Channel;
  creator: string | User;
  title: string;
  content: string;
  images: string[];
  isResolved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export interface Document {
  _id: string;
  name: string;
  type: string;
  dowloadUrl: string; // typo preserved from backend model
  cAttendId: string | CAttend;
  createdAt?: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'absence_warning'
  | 'absence_request'
  | 'class_cancel'
  | 'class_reschedule'
  | 'new_discussion'
  | 'group_assigned'
  | string;

export interface Notification {
  _id: string;
  senderId?: string | User | null;
  title: string;
  content: string;
  type: NotificationType;
  referenceModel?: string;
  referenceId?: string;
  createdAt?: string;
}

export interface NotificationRecipient {
  _id: string;
  notificationId: string | Notification;
  userId: string | User;
  isRead: boolean;
  createdAt?: string;
}

// ─── Absence Requests ─────────────────────────────────────────────────────────

export type AbsenceRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AbsenceRequest {
  _id: string;
  studentId: string | User;
  subjectId: string | Subject;
  proof: string[];
  date: string;
  reason: string;
  status: AbsenceRequestStatus;
  reviewedBy?: string | User | null;
  comment?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Questions ────────────────────────────────────────────────────────────────

export interface Question {
  _id: string;
  subjectId: string | Subject;
  studentId: string | User;
  type: 'text' | 'image';
  content: string;
  isResolved: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
}
