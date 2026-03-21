export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    byUser: (userId: string) => ['subjects', 'byUser', userId] as const,
    byId: (id: string) => ['subjects', id] as const,
    students: (subjectId: string) => ['subjects', subjectId, 'students'] as const,
    avgReview: (subjectId: string) => ['subjects', subjectId, 'avgReview'] as const,
  },
  classSessions: {
    byUser: (userId: string) => ['classSessions', 'byUser', userId] as const,
  },
  cAttend: {
    bySubject: (subjectId: string) => ['cAttend', 'bySubject', subjectId] as const,
    byId: (id: string) => ['cAttend', id] as const,
    students: (id: string) => ['cAttend', id, 'students'] as const,
  },
  attendRecords: {
    byCAttend: (cAttendId: string) => ['attendRecords', 'byCAttend', cAttendId] as const,
    byUserAndSubject: (subjectId: string, userId: string) =>
      ['attendRecords', 'byUserAndSubject', subjectId, userId] as const,
  },
  absenceRequests: {
    byStudent: (studentId: string) => ['absenceRequests', 'byStudent', studentId] as const,
    bySubject: (subjectId: string) => ['absenceRequests', 'bySubject', subjectId] as const,
  },
  discussions: {
    byCAttend: (cAttendId: string) => ['discussions', 'byCAttend', cAttendId] as const,
  },
  reviews: {
    byCAttend: (cAttendId: string) => ['reviews', 'byCAttend', cAttendId] as const,
    myBySubject: (subjectId: string, userId: string) =>
      ['reviews', 'myBySubject', subjectId, userId] as const,
  },
  groups: {
    defaultBySubject: (subjectId: string) => ['groups', 'default', 'bySubject', subjectId] as const,
    randomByCAttend: (cAttendId: string) => ['groups', 'random', 'byCAttend', cAttendId] as const,
    myDefault: (subjectId: string) => ['groups', 'myDefault', subjectId] as const,
    myRandom: (subjectId: string) => ['groups', 'myRandom', subjectId] as const,
    bySubject: (subjectId: string) => ['groups', 'bySubject', subjectId] as const,
    byId: (id: string) => ['groups', id] as const,
  },
  groupMessages: {
    byGroup: (groupId: string) => ['groupMessages', 'byGroup', groupId] as const,
  },
  channels: {
    bySubject: (subjectId: string) => ['channels', 'bySubject', subjectId] as const,
  },
  posts: {
    byChannel: (channelId: string) => ['posts', 'byChannel', channelId] as const,
  },
  documents: {
    byCAttend: (cAttendId: string) => ['documents', 'byCAttend', cAttendId] as const,
  },
  notifications: {
    all: ['notifications', 'all'] as const,
  },
  questions: {
    bySubject: (subjectId: string) => ['questions', 'bySubject', subjectId] as const,
  },
  notes: {
    byUser: (userId: string) => ['notes', 'byUser', userId] as const,
  },
  billing: {
    status: (userId: string) => ['billing', 'status', userId] as const,
    paymentMethods: (userId: string) => ['billing', 'payment-methods', userId] as const,
    invoices: (userId: string) => ['billing', 'invoices', userId] as const,
  },
} as const;
