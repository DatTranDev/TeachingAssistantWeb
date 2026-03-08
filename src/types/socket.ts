import type { Discussion, Post, Reaction, User, AttendRecord } from './domain';

export interface OnlineUser {
  userID: string;
  socketID: string;
}

export interface AttendanceMessage {
  subjectID: string;
  cAttendId: string;
  isActive: boolean;
  teacherGPS?: { latitude: number; longitude: number };
  timeExpired?: number;
}

export interface FCMMessage {
  title: string;
  body: string;
  subjectId: string;
}

export interface ServerToClientEvents {
  // Online users
  getOnlineUsers: (users: OnlineUser[]) => void;
  // Subject Q&A
  receiveSubjectMessage: (message: Discussion) => void;
  receiveChannelMessage: (message: Post) => void;
  receiveReply: (message: Discussion) => void;
  receiveVote: (message: Discussion) => void;
  receiveReaction: (data: { messageID: string; reaction: Reaction }) => void;
  receiveUpdateReaction: (data: { messageID: string; reaction: Reaction }) => void;
  // Attendance
  receiveUserAttendance: (data: { student: User; index: number; status: string }) => void;
  receiveUpdateAttendance: (student: User) => void;
  receiveAttendance: (dataMsg: AttendanceMessage) => void;
  // Moderation
  receiveResolve: (messageID: string) => void;
  receiveDeleteMessage: (messageID: string) => void;
  receiveRevokedMessage: (messageID: string) => void;
}

export interface ClientToServerEvents {
  // Presence
  addOnlineUser: (userID: string) => void;
  // Subject rooms
  joinSubject: (data: { userID: string; subjectID: string }) => void;
  leaveSubject: (data: { userID: string; subjectID: string }) => void;
  joinSubjectChannel: (data: { userID: string; subjectID: string; channelID: string }) => void;
  leaveSubjectChannel: (data: { userID: string; subjectID: string; channelID: string }) => void;
  // Messaging
  sendMessageToSubject: (data: {
    subjectID: string;
    message: Partial<Discussion>;
    dataMsg: FCMMessage;
  }) => void;
  sendMessageToChannel: (data: {
    subjectID: string;
    channelID: string;
    message: Partial<Post>;
    dataMsg: FCMMessage;
  }) => void;
  sendReply: (data: { subjectID: string; message: Partial<Discussion> }) => void;
  sendVote: (data: { subjectID: string; message: Partial<Discussion> }) => void;
  sendReaction: (data: {
    subjectID: string;
    messageID: string;
    reaction: Partial<Reaction>;
  }) => void;
  sendUpdateReaction: (data: {
    subjectID: string;
    messageID: string;
    reaction: Partial<Reaction>;
  }) => void;
  // Attendance
  sendAttendance: (data: {
    subjectID: string;
    student: Partial<User>;
    index: number;
    status: string;
  }) => void;
  sendUpdateAttendance: (data: { subjectID: string; student: Partial<User> }) => void;
  attendace: (data: { subjectID: string; dataMsg: AttendanceMessage }) => void;
  // Moderation
  sendResolve: (data: { subjectID: string; messageID: string }) => void;
  sendDeleteMessage: (data: { subjectID: string; messageID: string }) => void;
  sendRevokedMessage: (data: { subjectID: string; messageID: string }) => void;
}
