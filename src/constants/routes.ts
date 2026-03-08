export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  TEACHER: {
    HOME: '/teacher/timetable',
    CLASSES: '/teacher/classes',
    CLASS: (id: string) => `/teacher/classes/${id}`,
    NOTIFICATIONS: '/teacher/notifications',
    PROFILE: '/teacher/profile',
  },
  STUDENT: {
    HOME: '/student/timetable',
    CLASSES: '/student/classes',
    CLASS: (id: string) => `/student/classes/${id}`,
    NOTIFICATIONS: '/student/notifications',
    PROFILE: '/student/profile',
  },
} as const;
