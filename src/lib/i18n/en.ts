export interface Translations {
  common: {
    appName: string;
    loading: string;
    processing: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    search: string;
    back: string;
    next: string;
    submit: string;
    retry: string;
    noData: string;
    or: string;
  };
  nav: {
    timetable: string;
    classes: string;
    notifications: string;
    profile: string;
    dashboard: string;
    classDetail: string;
  };
  auth: {
    login: string;
    logout: string;
    welcome: string;
    loginSubtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    forgotPassword: string;
    rememberMe: string;
    signingIn: string;
    orLoginWith: string;
    noAccount: string;
    register: string;
    showPassword: string;
    hidePassword: string;
    errors: { notFound: string; wrongPassword: string; generic: string; network: string };
    forgotPasswordTitle: string;
    forgotPasswordSubtitle: string;
    sendOtpBtn: string;
    sendOtpError: string;
    backToLogin: string;
    enterOtpTitle: string;
    enterOtpSubtitle: string;
    enterOtpEmailFallback: string;
    verifyBtn: string;
    resendOtpSuccess: string;
    resendOtpError: string;
    otpRequired: string;
    otpInvalid: string;
    noOtpReceived: string;
    resendOtp: string;
    resendAfter: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    newPasswordLabel: string;
    newPasswordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    resetPasswordBtn: string;
    resetPasswordSuccess: string;
    resetPasswordError: string;
  };
  user: { userOptions: string; viewProfile: string; role: { teacher: string; student: string } };
  sidebar: { expand: string; collapse: string; openMenu: string };
  notifications: {
    title: string;
    unread: string;
    viewAll: string;
    markAllRead: string;
    filterAll: string;
    filterUnread: string;
    emptyUnread: string;
    empty: string;
    deleteAriaLabel: string;
  };
  student: {
    classes: {
      title: string;
      subtitle: string;
      join: string;
      leave: string;
      searchPlaceholder: string;
      empty: string;
      emptyDesc: string;
      confirmLeaveTitle: string;
      confirmLeaveDesc: string;
    };
    timetable: {
      title: string;
      classesCount: string;
      joinBtn: string;
      empty: string;
      emptyDesc: string;
    };
    profile: { title: string };
  };
  teacher: {
    classes: {
      title: string;
      subtitle: string;
      create: string;
      searchPlaceholder: string;
      empty: string;
      emptyDesc: string;
      noResults: string;
    };
    timetable: {
      title: string;
      classesCount: string;
      create: string;
      empty: string;
      emptyDesc: string;
    };
    profile: { title: string };
  };
  language: { select: string; en: string; vi: string };
  colorMode: { select: string; light: string; dark: string; system: string };
  days: {
    short: { d1: string; d2: string; d3: string; d4: string; d5: string; d6: string; d7: string };
    long: { d1: string; d2: string; d3: string; d4: string; d5: string; d6: string; d7: string };
  };
  weekCalendar: {
    today: string;
    weekView: string;
    noSessions: string;
    noSessionsDesc: string;
    room: string;
  };
  sessions: {
    createBtn: string;
    empty: string;
    emptyDesc: string;
    table: { date: string; room: string; attendance: string; status: string; actions: string };
    actions: { openAttendance: string; view: string; review: string; cancel: string };
    cancelSuccess: string;
    create: {
      title: string;
      scheduleLabel: string;
      schedulePlaceholder: string;
      dateLabel: string;
      attendanceTimeLabel: string;
      enableGpsLabel: string;
      cancelBtn: string;
      createBtn: string;
      successToast: string;
      errorToast: string;
    };
    review: {
      title: string;
      noReviews: string;
      reviewedCount: string;
      avgUnderstand: string;
      avgUseful: string;
      commentsTitle: string;
    };
    detail: {
      title: string;
      backToSessions: string;
      ended: string;
      liveStatus: string;
      viewLive: string;
      endAttendanceBtn: string;
      startAttendanceBtn: string;
      completeBtn: string;
      attendanceListTitle: string;
      markAllAbsentBtn: string;
      noStudents: string;
      studentCol: string;
      codeCol: string;
      statusCol: string;
      editAttendanceTitle: string;
      sessionNotFound: string;
      completeDialog: { title: string; description: string; confirmBtn: string; cancelBtn: string };
      bulkAbsentDialog: {
        title: string;
        description: string;
        confirmBtn: string;
        cancelBtn: string;
      };
      activateSuccess: string;
      deactivateSuccess: string;
      closeSuccess: string;
      bulkAbsentSuccess: string;
    };
    live: {
      back: string;
      recording: string;
      endAttendanceBtn: string;
      completeBtn: string;
      attendanceLabel: string;
      noStudents: string;
      completeDialog: { title: string; description: string; confirmBtn: string; cancelBtn: string };
      deactivateSuccess: string;
      closeSuccess: string;
    };
  };
  attendance: {
    searchPlaceholder: string;
    sortName: string;
    sortAbsent: string;
    exportBtn: string;
    exportFailed: string;
    studentsCount: string;
    studentNameCol: string;
    studentCodeCol: string;
    absenceWarningLabel: string;
    warningLabel: string;
    notFoundMsg: string;
    override: {
      title: string;
      statusLabel: string;
      saveBtn: string;
      successToast: string;
      errorToast: string;
    };
  };
  absenceRequests: {
    request: {
      title: string;
      sessionLabel: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      reasonMinLength: string;
      attachmentLabel: string;
      dropText: string;
      chooseFile: string;
      fileTypes: string;
      fileTooLarge: string;
      invalidType: string;
      cancelBtn: string;
      submitBtn: string;
      successToast: string;
      errorToast: string;
    };
    reject: {
      title: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      cancelBtn: string;
      rejectBtn: string;
    };
    review: {
      title: string;
      pendingCount: string;
      pendingTab: string;
      processedTab: string;
      noPending: string;
      noProcessed: string;
      studentCol: string;
      sessionCol: string;
      reasonCol: string;
      docCol: string;
      statusCol: string;
      viewProof: string;
      approveTitle: string;
      rejectTitle: string;
      approveSuccess: string;
      rejectSuccess: string;
      errorToast: string;
      statusPending: string;
      statusApproved: string;
      statusRejected: string;
    };
  };
  subjectTabs: {
    sessions: string;
    attendance: string;
    discussion: string;
    channel: string;
    documents: string;
    groups: string;
    statistics: string;
    settings: string;
  };
  subjects: {
    card: {
      maxAbsences: string;
      joinCode: string;
      copy: string;
      copied: string;
      viewDetail: string;
    };
    header: {
      back: string;
      subjectCodeLabel: string;
      teacherLabel: string;
      joinCodeLabel: string;
      maxAbsencesLabel: string;
    };
    create: {
      title: string;
      nameLabel: string;
      codeLabel: string;
      maxAbsencesLabel: string;
      createBtn: string;
      cancelBtn: string;
      successToast: string;
      errorToast: string;
    };
    join: {
      title: string;
      description: string;
      codeLabel: string;
      codePlaceholder: string;
      codeRequired: string;
      invalidCode: string;
      alreadyJoined: string;
      joinBtn: string;
      cancelBtn: string;
      successToast: string;
    };
    settings: {
      sectionInfo: string;
      sectionNotifications: string;
      cancelClassTitle: string;
      cancelClassDesc: string;
      cancelClassBtn: string;
      rescheduleTitle: string;
      rescheduleDesc: string;
      rescheduleBtn: string;
      dangerZone: string;
      deleteClassTitle: string;
      deleteClassDesc: string;
      deleteClassBtn: string;
    };
    settingsForm: {
      nameLabel: string;
      codeLabel: string;
      maxAbsencesLabel: string;
      saveBtn: string;
      saveSuccess: string;
      saveError: string;
    };
    cancelModal: {
      title: string;
      description: string;
      dayOffLabel: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      sendBtn: string;
      cancelBtn: string;
      dateRequired: string;
      successToast: string;
      errorToast: string;
    };
    rescheduleModal: {
      title: string;
      dateLabel: string;
      sendBtn: string;
      cancelBtn: string;
      dateRequired: string;
      successToast: string;
      errorToast: string;
    };
    deleteDialog: {
      title: string;
      description: string;
      inputLabel: string;
      deleteBtn: string;
      cancelBtn: string;
      successToast: string;
      errorToast: string;
    };
  };
  timetableCard: {
    nextSession: string;
    noSessions: string;
    at: string;
    joinCodeLabel: string;
    teacherLabel: string;
    roomLabel: string;
    viewDetail: string;
    maxAbsencesLabel: string;
  };
  profile: {
    title: string;
    changeAvatar: string;
    emailLabel: string;
    codeLabel: string;
    displayNameLabel: string;
    schoolLabel: string;
    updateSuccess: string;
    updateFailed: string;
    saveBtn: string;
    changePasswordTitle: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    passwordMinLength: string;
    passwordMismatch: string;
    passwordSuccess: string;
    showPassword: string;
    hidePassword: string;
  };
  statistics: {
    overallAttendance: string;
    avgRating: string;
    atRisk: string;
    totalSessions: string;
    attendanceChartTitle: string;
    reviewChartTitle: string;
    noSessionsEnded: string;
    noReviews: string;
    atRiskTitle: string;
    sessionPrefix: string;
    attendanceRateTooltip: string;
    atRiskAbsences: string;
    reviewCategories: {
      teachingMethod: string;
      atmosphere: string;
      document: string;
      understanding: string;
      usefulness: string;
    };
  };
  documents: {
    uploadBtn: string;
    uploading: string;
    noDocuments: string;
    uploadSuccess: string;
    uploadFailed: string;
    deleteSuccess: string;
    deleteFailed: string;
    sessionLabel: string;
    deleteConfirmTitle: string;
    deleteConfirmDesc: string;
    downloadBtn: string;
    noSessions: string;
  };
  groups: {
    defaultTab: string;
    randomTab: string;
    createGroupBtn: string;
    createGroupTitle: string;
    createGroupNamePlaceholder: string;
    createGroupSuccess: string;
    createGroupError: string;
    renameSuccess: string;
    renameError: string;
    removeMemberError: string;
    addMembersSuccess: string;
    noMembers: string;
    membersCount: string;
    addMemberBtn: string;
    addMemberTitle: string;
    searchPlaceholder: string;
    noStudentsFound: string;
    cancelBtn: string;
    addBtn: string;
    ungroupedTitle: string;
    noGroups: string;
    noGroupsDesc: string;
    groupsCount: string;
    studentsCount: string;
    regenerateBtn: string;
    generateBtn: string;
    generating: string;
    sessionLabel: string;
    groupCountMode: string;
    memberCountMode: string;
    groupCountLabel: string;
    memberCountLabel: string;
    previewLabel: string;
    noGroupsForSession: string;
    noGroupsForSessionDesc: string;
    noSessions: string;
    memberCount: string;
    regenerateDialog: { title: string; description: string; confirmBtn: string; cancelBtn: string };
    generateSuccess: string;
    generateError: string;
    sessionItem: string;
    randomSummary: string;
    previewGroupCount: string;
  };
  discussion: {
    unansweredAlert: string;
    sortRecent: string;
    sortVotes: string;
    filterAll: string;
    filterUnanswered: string;
    filterMine: string;
    emptyAllAnswered: string;
    emptyNoQuestions: string;
    emptyMine: string;
    emptyHint: string;
    resolved: string;
    anonymous: string;
    anonymousN: string;
    youLabel: string;
    studentInfo: string;
    studentCode: string;
    email: string;
    school: string;
    removeFromClass: string;
    removeConfirmTitle: string;
    removeConfirmDesc: string;
    removeSuccess: string;
    removeError: string;
    roleStudent: string;
    roleTeacher: string;
    resolvedToast: string;
    unresolvedToast: string;
    resolveError: string;
    deleteSuccess: string;
    deleteError: string;
    deleteConfirmTitle: string;
    deleteConfirmDesc: string;
    inputPlaceholder: string;
    askTitle: string;
    askPlaceholder: string;
    askBtn: string;
    sendBtn: string;
    sending: string;
    revokeAction: string;
    revokeSuccess: string;
    revokeError: string;
    revokedQuestion: string;
    replyBtn: string;
    commentCount: string;
    replyPlaceholder: string;
    sessionSubtitle: string;
    sessionSubtitleTeacher: string;
    emptyNoPosts: string;
    emptyPostHint: string;
    createPostDialogTitle: string;
    postTitleLabel: string;
    titleOptional: string;
    postTitlePlaceholder: string;
    contentLabel: string;
    postContentPlaceholder: string;
    addImageBtn: string;
    uploadingImages: string;
    postBtn: string;
    posting: string;
  };
  discussionHub: {
    generalLabel: string;
    generalTitle: string;
    generalDesc: string;
    enterGeneral: string;
    groupLabel: string;
    fixedGroupTitle: string;
    fixedGroupDesc: string;
    viewGroups: string;
    myGroup: string;
    sessionQATitle: string;
    sessionGroupsTitle: string;
    noSessionsForSubject: string;
    sessionN: string;
    enterDiscussion: string;
    enterGroup: string;
    noRandomGroups: string;
    sessionRef: string;
    noLinkedSession: string;
  };
  groupChat: {
    today: string;
    yesterday: string;
    noMessages: string;
    revokedMessage: string;
    revokeAction: string;
    revokeSuccess: string;
    revokeError: string;
    sendError: string;
    messagePlaceholder: string;
    groupFallbackName: string;
  };
  sessionStatus: {
    live: string;
    upcoming: string;
    ended: string;
    cancelled: string;
  };
  studentStatistics: {
    overallTitle: string;
    breakdownTitle: string;
    historyTitle: string;
    sessionsAttended: string;
    ratingGood: string;
    ratingAverage: string;
    ratingAttention: string;
    statusPresent: string;
    statusAbsent: string;
    statusExcused: string;
    statusNotRecorded: string;
  };
  studentGroups: {
    myGroupTitle: string;
    enterChat: string;
    youLabel: string;
    notAssigned: string;
    allGroupsTitle: string;
    myGroupBadge: string;
  };
  studentAttendance: {
    attendanceOpen: string;
    sessionLabel: string;
    checkInDone: string;
    locating: string;
    processing: string;
    checkInBtn: string;
    locationNote: string;
    locationDenied: string;
    noActive: string;
    waitTeacher: string;
    historyTitle: string;
    colDate: string;
    colSession: string;
    colStatus: string;
    statusNotRecorded: string;
    requestAbsenceBtn: string;
    statusPresent: string;
    statusAbsent: string;
    statusExcused: string;
    absenceTitle: string;
    absenceColSession: string;
    absenceColReason: string;
    absenceColDoc: string;
    absenceColStatus: string;
    viewFile: string;
    checkInSuccess: string;
    checkInExpired: string;
    checkInAlready: string;
    checkInOutOfRange: string;
    locationError: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
  };
  channel: {
    noChannel: string;
    noChannelDesc: string;
    createChannelBtn: string;
    createPostTitle: string;
    titlePlaceholder: string;
    contentPlaceholder: string;
    postBtn: string;
    posting: string;
    noPosts: string;
    noPostsDesc: string;
    deleteSuccess: string;
    deleteError: string;
    deleteConfirmTitle: string;
    deleteConfirmDesc: string;
    createChannelError: string;
    teacherFallback: string;
    postSuccess: string;
    postError: string;
    noAnnouncements: string;
    noAnnouncementsDesc: string;
    timeJustNow: string;
    timeMinsAgo: string;
    timeHoursAgo: string;
  };
  register: {
    title: string;
    stepIndicator: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    userCodeLabel: string;
    userCodePlaceholder: string;
    schoolLabel: string;
    schoolPlaceholder: string;
    nextBtn: string;
    backBtn: string;
    roleTitle: string;
    teacherLabel: string;
    teacherDesc: string;
    studentLabel: string;
    studentDesc: string;
    registerBtn: string;
    processingBtn: string;
    alreadyAccount: string;
    signIn: string;
    emailExists: string;
    registerFailed: string;
    networkError: string;
    showPassword: string;
    hidePassword: string;
  };
  studentSessions: {
    empty: string;
    emptyDesc: string;
    table: { date: string; room: string; status: string; attendance: string; review: string };
    attendStatus: { present: string; absent: string; excused: string; notMarked: string };
    reviewedBadge: string;
    reviewBtn: string;
    reviewModal: {
      title: string;
      alreadyReviewed: string;
      teachingMethodLabel: string;
      atmosphereLabel: string;
      documentLabel: string;
      understandLabel: string;
      usefulLabel: string;
      thinkingLabel: string;
      thinkingPlaceholder: string;
      cancelBtn: string;
      submitBtn: string;
      submitting: string;
      successToast: string;
      alreadyReviewedToast: string;
      errorToast: string;
    };
  };
  timeAgo: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string };
}

const en: Translations = {
  common: {
    appName: 'Teaching Assistant',
    loading: 'Loading...',
    processing: 'Processing...',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    retry: 'Retry',
    noData: 'No data',
    or: 'or',
  },
  nav: {
    timetable: 'Timetable',
    classes: 'Classes',
    notifications: 'Notifications',
    profile: 'Profile',
    dashboard: 'Dashboard',
    classDetail: 'Class Detail',
  },
  auth: {
    login: 'Sign In',
    logout: 'Sign Out',
    welcome: 'Welcome back',
    loginSubtitle: 'Sign in to continue',
    email: 'Email',
    emailPlaceholder: 'email@example.com',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me',
    signingIn: 'Signing in...',
    orLoginWith: 'or sign in with',
    noAccount: "Don't have an account?",
    register: 'Register',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    errors: {
      notFound: 'Account not found',
      wrongPassword: 'Incorrect password',
      generic: 'An error occurred. Please try again.',
      network: 'Connection error. Please try again.',
    },
    forgotPasswordTitle: 'Forgot password?',
    forgotPasswordSubtitle: 'Enter your email to receive a verification code',
    sendOtpBtn: 'Send verification code',
    sendOtpError: 'Failed to send code. Please try again.',
    backToLogin: '\u2190 Back to sign in',
    enterOtpTitle: 'Enter verification code',
    enterOtpSubtitle: 'A 6-digit code was sent to {{email}}',
    enterOtpEmailFallback: 'your email',
    verifyBtn: 'Verify',
    resendOtpSuccess: 'Verification code resent',
    resendOtpError: 'Failed to resend code. Please try again.',
    otpRequired: 'Please enter all 6 digits',
    otpInvalid: 'Incorrect verification code. Please try again.',
    noOtpReceived: "Didn't receive the code?",
    resendOtp: 'Resend',
    resendAfter: 'Resend after {{s}}',
    resetPasswordTitle: 'Reset password',
    resetPasswordSubtitle: 'Enter a new password for your account',
    newPasswordLabel: 'New password',
    newPasswordPlaceholder: 'Minimum 6 characters',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPlaceholder: 'Re-enter password',
    resetPasswordBtn: 'Reset password',
    resetPasswordSuccess: 'Password changed successfully!',
    resetPasswordError: 'Failed to reset password. Please try again.',
  },
  user: {
    userOptions: 'User options',
    viewProfile: 'Profile',
    role: {
      teacher: 'Teacher',
      student: 'Student',
    },
  },
  sidebar: {
    expand: 'Expand menu',
    collapse: 'Collapse menu',
    openMenu: 'Open menu',
  },
  notifications: {
    title: 'Notifications',
    unread: '{{count}} unread',
    viewAll: 'View all',
    markAllRead: 'Mark all as read',
    filterAll: 'All',
    filterUnread: 'Unread',
    emptyUnread: 'No unread notifications.',
    empty: 'No notifications yet.',
    deleteAriaLabel: 'Delete notification',
  },
  student: {
    classes: {
      title: 'My Classes',
      subtitle: '{{count}} classes',
      join: 'Join Class',
      leave: 'Leave Class',
      searchPlaceholder: 'Search classes...',
      empty: 'No Classes Yet',
      emptyDesc: 'Join your first class to get started.',
      confirmLeaveTitle: 'Leave Class',
      confirmLeaveDesc: 'Are you sure you want to leave "{{name}}"? This action cannot be undone.',
    },
    timetable: {
      title: 'Timetable',
      classesCount: '{{count}} classes',
      joinBtn: 'Join Class',
      empty: 'No Classes Yet',
      emptyDesc: "Join a class using your teacher's code to get started",
    },
    profile: { title: 'My Profile' },
  },
  teacher: {
    classes: {
      title: 'My Classes',
      subtitle: '{{count}} classes',
      create: 'Create Class',
      searchPlaceholder: 'Search classes...',
      empty: 'No Classes Yet',
      emptyDesc: 'Create your first class to get started.',
      noResults: 'No classes found matching "{{query}}"',
    },
    timetable: {
      title: 'Timetable',
      classesCount: '{{count}} classes',
      create: 'Create Class',
      empty: 'No Classes Yet',
      emptyDesc: 'Create your first class to start managing teaching',
    },
    profile: { title: 'Profile' },
  },
  language: {
    select: 'Language',
    en: 'English',
    vi: 'Tiếng Việt',
  },
  colorMode: {
    select: 'Color mode',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
  days: {
    short: { d1: 'Mon', d2: 'Tue', d3: 'Wed', d4: 'Thu', d5: 'Fri', d6: 'Sat', d7: 'Sun' },
    long: {
      d1: 'Monday',
      d2: 'Tuesday',
      d3: 'Wednesday',
      d4: 'Thursday',
      d5: 'Friday',
      d6: 'Saturday',
      d7: 'Sunday',
    },
  },
  weekCalendar: {
    today: 'Today',
    weekView: 'Week',
    noSessions: 'No scheduled sessions',
    noSessionsDesc: 'Once class sessions are configured, your weekly schedule will appear here.',
    room: 'Room',
  },
  sessions: {
    createBtn: 'Create session',
    empty: 'No sessions yet',
    emptyDesc: 'Create the first session to start attendance',
    table: {
      date: 'Date',
      room: 'Room',
      attendance: 'Attendance',
      status: 'Status',
      actions: 'Actions',
    },
    actions: {
      openAttendance: 'Open attendance',
      view: 'View',
      review: 'Review',
      cancel: 'Cancel',
    },
    cancelSuccess: 'Session cancelled',
    create: {
      title: 'New session',
      scheduleLabel: 'Schedule *',
      schedulePlaceholder: 'Select schedule...',
      dateLabel: 'Date *',
      attendanceTimeLabel: 'Attendance window (minutes)',
      enableGpsLabel: 'Enable GPS attendance',
      cancelBtn: 'Cancel',
      createBtn: 'Create session',
      successToast: 'Session created',
      errorToast: 'An error occurred, please try again',
    },
    review: {
      title: 'Session review',
      noReviews: 'No reviews for this session yet.',
      reviewedCount: '{{count}} students reviewed',
      avgUnderstand: 'Avg. understanding',
      avgUseful: 'Avg. usefulness',
      commentsTitle: 'Comments ({{count}})',
    },
    detail: {
      title: 'Session #{{n}}',
      backToSessions: 'Back to sessions',
      ended: 'Session ended.',
      liveStatus: 'Attendance open',
      viewLive: 'View live →',
      endAttendanceBtn: 'End attendance',
      startAttendanceBtn: 'Start attendance',
      completeBtn: 'Complete session',
      attendanceListTitle: 'Attendance list ({{checked}}/{{total}})',
      markAllAbsentBtn: 'Mark all absent',
      noStudents: 'No students enrolled yet',
      studentCol: 'Student',
      codeCol: 'Code',
      statusCol: 'Status',
      editAttendanceTitle: 'Edit attendance',
      sessionNotFound: 'Session not found',
      completeDialog: {
        title: 'Complete session?',
        description:
          'The session will be marked complete. Students who did not check in will be marked absent.',
        confirmBtn: 'Complete',
        cancelBtn: 'Cancel',
      },
      bulkAbsentDialog: {
        title: 'Mark all absent?',
        description: 'Students who have not checked in will be marked as absent without excuse.',
        confirmBtn: 'Mark absent',
        cancelBtn: 'Cancel',
      },
      activateSuccess: 'Attendance opened',
      deactivateSuccess: 'Attendance ended',
      closeSuccess: 'Session completed',
      bulkAbsentSuccess: 'All unmarked students marked absent',
    },
    live: {
      back: 'Back',
      recording: 'Attendance open',
      endAttendanceBtn: 'End attendance',
      completeBtn: 'Complete session',
      attendanceLabel: 'Attendance',
      noStudents: 'No students in class',
      completeDialog: {
        title: 'Complete session?',
        description:
          'The session will be marked complete. Students who did not check in will be marked absent.',
        confirmBtn: 'Complete',
        cancelBtn: 'Cancel',
      },
      deactivateSuccess: 'Attendance ended',
      closeSuccess: 'Session completed',
    },
  },
  attendance: {
    searchPlaceholder: 'Search students...',
    sortName: 'Name A–Z',
    sortAbsent: 'Most absent',
    exportBtn: 'Export Excel',
    exportFailed: 'Export failed',
    studentsCount: '{{count}} students',
    studentNameCol: 'Student name',
    studentCodeCol: 'Student ID',
    absenceWarningLabel: 'Absence warning',
    warningLabel: 'Warning',
    notFoundMsg: 'No students found',
    override: {
      title: 'Edit attendance',
      statusLabel: 'Status *',
      saveBtn: 'Save',
      successToast: 'Attendance updated',
      errorToast: 'Update failed',
    },
  },
  absenceRequests: {
    request: {
      title: 'Submit absence request',
      sessionLabel: 'Session: {{date}}',
      reasonLabel: 'Reason *',
      reasonPlaceholder: 'Describe your reason (minimum 10 characters)...',
      reasonMinLength: 'Reason must be at least 10 characters',
      attachmentLabel: 'Attachment',
      dropText: 'Drag & drop or',
      chooseFile: 'choose file',
      fileTypes: 'PDF, JPG, PNG — max 5 MB',
      fileTooLarge: 'File too large (max 5 MB)',
      invalidType: 'Only PDF, JPG, PNG accepted',
      cancelBtn: 'Cancel',
      submitBtn: 'Submit request',
      successToast: 'Request submitted',
      errorToast: 'Submission failed, try again later',
    },
    reject: {
      title: 'Reject absence request',
      reasonLabel: 'Reason for rejection (optional)',
      reasonPlaceholder: 'Enter reason (student will be notified)',
      cancelBtn: 'Cancel',
      rejectBtn: 'Reject',
    },
    review: {
      title: 'Absence requests',
      pendingCount: '{{count}} pending',
      pendingTab: 'Pending',
      processedTab: 'Processed',
      noPending: 'No pending requests',
      noProcessed: 'No processed requests yet',
      studentCol: 'Student',
      sessionCol: 'Session',
      reasonCol: 'Reason',
      docCol: 'Document',
      statusCol: 'Status',
      viewProof: 'View',
      approveTitle: 'Approve',
      rejectTitle: 'Reject',
      approveSuccess: 'Request approved',
      rejectSuccess: 'Request rejected',
      errorToast: 'An error occurred. Please try again.',
      statusPending: 'Pending',
      statusApproved: 'Approved',
      statusRejected: 'Rejected',
    },
  },
  subjectTabs: {
    sessions: 'Sessions',
    attendance: 'Attendance',
    discussion: 'Discussion',
    channel: 'Channel',
    documents: 'Documents',
    groups: 'Groups',
    statistics: 'Statistics',
    settings: 'Settings',
  },
  subjects: {
    card: {
      maxAbsences: 'Max absences: {{count}} sessions',
      joinCode: 'Join code: ',
      copy: 'Copy',
      copied: 'Copied',
      viewDetail: 'View detail',
    },
    header: {
      back: 'Back',
      subjectCodeLabel: 'Code: ',
      teacherLabel: 'Teacher: ',
      joinCodeLabel: 'Join code: ',
      maxAbsencesLabel: 'Max absences: {{count}} sessions',
    },
    create: {
      title: 'New class',
      nameLabel: 'Subject name',
      codeLabel: 'Subject code',
      maxAbsencesLabel: 'Max absences',
      createBtn: 'Create class',
      cancelBtn: 'Cancel',
      successToast: 'Class created',
      errorToast: 'An error occurred, please try again',
    },
    join: {
      title: 'Join class',
      description: 'Enter the join code provided by your teacher',
      codeLabel: 'Join code',
      codePlaceholder: 'e.g. ABCD1234',
      codeRequired: 'Join code is required',
      invalidCode: 'Invalid join code',
      alreadyJoined: 'You have already joined this class',
      joinBtn: 'Join',
      cancelBtn: 'Cancel',
      successToast: 'Joined class successfully',
    },
    settings: {
      sectionInfo: 'Class information',
      sectionNotifications: 'Class notifications',
      cancelClassTitle: 'Notify class cancellation',
      cancelClassDesc: 'Send a cancellation notice to all students in the class',
      cancelClassBtn: 'Cancel class',
      rescheduleTitle: 'Notify makeup class',
      rescheduleDesc: 'Notify all students of a makeup class schedule',
      rescheduleBtn: 'Makeup class',
      dangerZone: 'Danger zone',
      deleteClassTitle: 'Delete class',
      deleteClassDesc: 'Delete all class data. This action cannot be undone.',
      deleteClassBtn: 'Delete class',
    },
    settingsForm: {
      nameLabel: 'Subject name *',
      codeLabel: 'Subject code',
      maxAbsencesLabel: 'Max absences',
      saveBtn: 'Save changes',
      saveSuccess: 'Saved successfully',
      saveError: 'An error occurred, please try again',
    },
    cancelModal: {
      title: 'Notify class cancellation',
      description: 'All students will receive a class cancellation notice.',
      dayOffLabel: 'Cancellation date *',
      reasonLabel: 'Reason (optional)',
      reasonPlaceholder: 'Additional note for students...',
      sendBtn: 'Send notification',
      cancelBtn: 'Cancel',
      dateRequired: 'Date is required',
      successToast: 'Class cancellation notice sent',
      errorToast: 'An error occurred, please try again',
    },
    rescheduleModal: {
      title: 'Notify makeup class',
      dateLabel: 'Makeup date *',
      sendBtn: 'Send notification',
      cancelBtn: 'Cancel',
      dateRequired: 'Date is required',
      successToast: 'Makeup class notice sent',
      errorToast: 'An error occurred, please try again',
    },
    deleteDialog: {
      title: 'Delete class?',
      description: 'This action cannot be undone. Enter the class name to confirm:',
      inputLabel: 'Enter "{{name}}" to confirm',
      deleteBtn: 'Delete class',
      cancelBtn: 'Cancel',
      successToast: 'Class deleted successfully',
      errorToast: 'An error occurred, please try again',
    },
  },
  timetableCard: {
    nextSession: 'Next session:',
    noSessions: 'No sessions yet',
    at: 'at',
    joinCodeLabel: 'Join code: ',
    teacherLabel: 'Teacher: ',
    roomLabel: 'Room: ',
    viewDetail: 'View detail',
    maxAbsencesLabel: 'Max absences: ',
  },
  profile: {
    title: 'My Profile',
    changeAvatar: 'Change avatar',
    emailLabel: 'Email',
    codeLabel: 'ID',
    displayNameLabel: 'Display name',
    schoolLabel: 'School / Organization',
    updateSuccess: 'Profile updated!',
    updateFailed: 'Update failed. Please try again.',
    saveBtn: 'Save changes',
    changePasswordTitle: 'Change password',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm new password',
    passwordMinLength: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    passwordSuccess: 'Password changed!',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  statistics: {
    overallAttendance: 'Overall attendance',
    avgRating: 'Avg. rating',
    atRisk: 'At-risk students',
    totalSessions: 'Total sessions',
    attendanceChartTitle: 'Attendance rate per session',
    reviewChartTitle: 'Avg. review scores by category',
    noSessionsEnded: 'No completed sessions yet.',
    noReviews: 'No reviews yet.',
    atRiskTitle: 'At-risk students ({{count}})',
    sessionPrefix: 'Session {{n}}',
    attendanceRateTooltip: 'Attendance rate',
    atRiskAbsences: '{{absences}} absences / {{limit}} allowed',
    reviewCategories: {
      teachingMethod: 'Teaching',
      atmosphere: 'Atmosphere',
      document: 'Materials',
      understanding: 'Understanding %',
      usefulness: 'Usefulness %',
    },
  },
  documents: {
    uploadBtn: 'Upload',
    uploading: 'Uploading',
    noDocuments: 'No documents for this session',
    uploadSuccess: 'Uploaded successfully',
    uploadFailed: 'Upload failed',
    deleteSuccess: 'Document deleted',
    deleteFailed: 'Cannot delete document',
    sessionLabel: 'Session #{{n}}',
    deleteConfirmTitle: 'Delete document?',
    deleteConfirmDesc: 'This will permanently delete the document.',
    downloadBtn: 'Download',
    noSessions: 'No sessions yet',
  },
  groups: {
    defaultTab: 'Manual groups',
    randomTab: 'Random groups',
    createGroupBtn: 'Create group',
    createGroupTitle: 'New group',
    createGroupNamePlaceholder: 'Group name...',
    createGroupSuccess: 'Group created',
    createGroupError: 'Cannot create group',
    renameSuccess: 'Group renamed',
    renameError: 'Cannot rename group',
    removeMemberError: 'Cannot remove member',
    addMembersSuccess: 'Members added',
    noMembers: 'No members yet',
    membersCount: '{{count}} members',
    addMemberBtn: 'Add',
    addMemberTitle: 'Add members to {{name}}',
    searchPlaceholder: 'Search students...',
    noStudentsFound: 'No students found',
    cancelBtn: 'Cancel',
    addBtn: 'Add ({{count}})',
    ungroupedTitle: 'Ungrouped students ({{count}})',
    noGroups: 'No groups yet',
    noGroupsDesc: 'Create groups manually to assign students',
    groupsCount: '{{count}} groups',
    studentsCount: '{{count}} students',
    regenerateBtn: 'Regenerate',
    generateBtn: 'Generate random groups',
    generating: 'Generating...',
    sessionLabel: 'Session:',
    groupCountMode: 'Number of groups',
    memberCountMode: 'Members per group',
    groupCountLabel: 'Groups:',
    memberCountLabel: 'Members/group:',
    previewLabel: 'Preview: {{text}}',
    noGroupsForSession: 'No groups for this session',
    noGroupsForSessionDesc: 'Students must check in (present) first',
    noSessions: 'No sessions yet',
    memberCount: '{{count}} members',
    regenerateDialog: {
      title: 'Regenerate groups?',
      description: 'Existing groups for this session will be deleted and regenerated.',
      confirmBtn: 'Regenerate',
      cancelBtn: 'Cancel',
    },
    generateSuccess: '{{count}} groups created',
    generateError: 'Cannot create groups. Students must have present attendance first.',
    sessionItem: 'Session #{{n}} \u2014 {{date}}',
    randomSummary: '{{groups}} groups \u2014 {{students}} students \u2014 ~{{avg}} per group',
    previewGroupCount: '~{{groups}} groups (~{{avg}} members/group)',
  },
  discussion: {
    unansweredAlert: '{{count}} unanswered questions',
    sortRecent: 'Recent',
    sortVotes: 'Most voted',
    filterAll: 'All',
    filterUnanswered: 'Unanswered',
    filterMine: 'Mine',
    emptyAllAnswered: 'All questions have been answered',
    emptyNoQuestions: 'No questions yet',
    emptyMine: "You haven't posted any questions",
    emptyHint: 'Be the first to ask!',
    resolved: 'Answered',
    anonymous: 'Anonymous',
    anonymousN: 'Anonymous {{n}}',
    youLabel: '(you)',
    studentInfo: 'Student Info',
    studentCode: 'Student code',
    email: 'Email',
    school: 'School',
    removeFromClass: 'Remove from class',
    removeConfirmTitle: 'Remove student?',
    removeConfirmDesc: 'Are you sure you want to remove this student from the class?',
    removeSuccess: 'Student removed from class',
    removeError: 'Cannot remove student. Try again later.',
    roleStudent: 'Student',
    roleTeacher: 'Lecturer',
    resolvedToast: 'Marked as answered',
    unresolvedToast: 'Marked as unanswered',
    resolveError: 'An error occurred. Try again later.',
    deleteSuccess: 'Question deleted',
    deleteError: 'Cannot delete question. Try again later.',
    deleteConfirmTitle: 'Delete question?',
    deleteConfirmDesc: 'This action cannot be undone.',
    inputPlaceholder: 'Ask a question...',
    askTitle: 'Ask a question',
    askPlaceholder: 'What do you want to ask?',
    askBtn: 'Post question',
    sendBtn: 'Send',
    sending: 'Sending...',
    revokeAction: 'Revoke question',
    revokeSuccess: 'Question recalled',
    revokeError: 'Cannot revoke question. Try again later.',
    revokedQuestion: 'Question was recalled',
    replyBtn: 'Reply',
    commentCount: '{{n}} comments',
    replyPlaceholder: 'Write a reply...',
    sessionSubtitle: 'Session discussion',
    sessionSubtitleTeacher: 'Session discussion — Management',
    emptyNoPosts: 'No posts yet',
    emptyPostHint: 'Be the first to post!',
    createPostDialogTitle: 'Create discussion post',
    postTitleLabel: 'Title',
    titleOptional: '(optional)',
    postTitlePlaceholder: 'Post title...',
    contentLabel: 'Content',
    postContentPlaceholder: 'What do you want to discuss?',
    addImageBtn: 'Add images (max 3)',
    uploadingImages: 'Uploading...',
    postBtn: 'Post',
    posting: 'Posting...',
  },
  discussionHub: {
    generalLabel: 'Discussion',
    generalTitle: 'General Channel',
    generalDesc: 'Ask anonymous questions in class.',
    enterGeneral: 'Enter general channel',
    groupLabel: 'Groups',
    fixedGroupTitle: 'Fixed Group',
    fixedGroupDesc: 'Study group assigned for this subject.',
    viewGroups: 'View groups',
    myGroup: 'My group',
    sessionQATitle: 'Ask a question',
    sessionGroupsTitle: 'Session groups',
    noSessionsForSubject: 'No sessions found for this subject.',
    sessionN: 'Session {{n}}',
    enterDiscussion: 'Enter discussion',
    enterGroup: 'Enter group',
    noRandomGroups: 'No random groups have been assigned yet.',
    sessionRef: 'Session {{n}} — {{date}}',
    noLinkedSession: 'No linked session',
  },
  groupChat: {
    today: 'Today',
    yesterday: 'Yesterday',
    noMessages: 'No messages yet. Start the conversation!',
    revokedMessage: 'Message was recalled',
    revokeAction: 'Revoke message',
    revokeSuccess: 'Message revoked',
    revokeError: 'Cannot revoke message. Try again.',
    sendError: 'Cannot send message. Please try again.',
    messagePlaceholder: 'Type a message...',
    groupFallbackName: 'Group chat',
  },
  sessionStatus: {
    live: 'Live',
    upcoming: 'Upcoming',
    ended: 'Ended',
    cancelled: 'Cancelled',
  },
  studentAttendance: {
    attendanceOpen: 'Attendance is open',
    sessionLabel: 'Session #{{n}} — {{date}}',
    checkInDone: 'Checked in successfully',
    locating: 'Getting location...',
    processing: 'Processing...',
    checkInBtn: 'Check in',
    locationNote: 'Your location will be used to confirm presence in class.',
    locationDenied: 'Browser denied location access. Go to browser settings to allow it.',
    noActive: 'No active attendance',
    waitTeacher: 'Waiting for teacher to open attendance.',
    historyTitle: 'Attendance history',
    colDate: 'Date',
    colSession: 'Session',
    colStatus: 'Status',
    statusNotRecorded: 'Not recorded',
    requestAbsenceBtn: 'Request',
    statusPresent: 'Present',
    statusAbsent: 'Absent',
    statusExcused: 'Excused',
    absenceTitle: 'Absence requests',
    absenceColSession: 'Session',
    absenceColReason: 'Reason',
    absenceColDoc: 'Document',
    absenceColStatus: 'Status',
    viewFile: 'View file',
    checkInSuccess: 'Checked in successfully!',
    checkInExpired: 'Attendance round has ended',
    checkInAlready: 'You have already checked in for this round',
    checkInOutOfRange: 'You are outside the attendance area',
    locationError: 'Cannot get location. Try again later.',
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
  },
  studentStatistics: {
    overallTitle: 'Overall attendance',
    breakdownTitle: 'Attendance details',
    historyTitle: 'Attendance history',
    sessionsAttended: '{{attended}} / {{total}} sessions attended',
    ratingGood: 'Good',
    ratingAverage: 'Average',
    ratingAttention: 'Needs attention',
    statusPresent: 'Present',
    statusAbsent: 'Absent',
    statusExcused: 'Excused',
    statusNotRecorded: 'Not recorded',
  },
  studentGroups: {
    myGroupTitle: 'Your group',
    enterChat: 'Enter group chat',
    youLabel: 'You',
    notAssigned: "You haven't been assigned to a group",
    allGroupsTitle: 'All groups ({{count}})',
    myGroupBadge: '— your group',
  },
  channel: {
    noChannel: 'No channel yet',
    noChannelDesc: 'Create an announcement channel to start posting',
    createChannelBtn: 'Create announcement channel',
    createPostTitle: 'Create post',
    titlePlaceholder: 'Title (optional)',
    contentPlaceholder: 'Post content...',
    postBtn: 'Post',
    posting: 'Posting...',
    noPosts: 'No posts yet',
    noPostsDesc: 'Create the first post to announce to your class',
    deleteSuccess: 'Post deleted',
    deleteError: 'Cannot delete post',
    deleteConfirmTitle: 'Delete post?',
    deleteConfirmDesc: 'This action cannot be undone.',
    createChannelError: 'Cannot create channel',
    teacherFallback: 'Teacher',
    postSuccess: 'Post published',
    postError: 'Cannot post. Please try again.',
    noAnnouncements: 'No announcements yet',
    noAnnouncementsDesc: 'Your teacher will post announcements here',
    timeJustNow: 'just now',
    timeMinsAgo: '{{n}} min ago',
    timeHoursAgo: '{{n}} hr ago',
  },
  register: {
    title: 'Create account',
    stepIndicator: 'Step {{step}}/2',
    nameLabel: 'Full name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Min. 6 characters',
    userCodeLabel: 'Student/Staff ID',
    userCodePlaceholder: 'Your ID number',
    schoolLabel: 'School',
    schoolPlaceholder: 'Your university name',
    nextBtn: 'Next →',
    backBtn: '← Back',
    roleTitle: 'You are?',
    teacherLabel: 'Teacher',
    teacherDesc: 'Manage classes & attendance',
    studentLabel: 'Student',
    studentDesc: 'Track courses & schedule',
    registerBtn: 'Register',
    processingBtn: 'Processing...',
    alreadyAccount: 'Already have an account?',
    signIn: 'Sign in',
    emailExists: 'Email already in use',
    registerFailed: 'Registration failed. Please try again.',
    networkError: 'Connection error. Please try again.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  studentSessions: {
    empty: 'No sessions yet',
    emptyDesc: 'The teacher has not created any sessions for this course',
    table: {
      date: 'Date',
      room: 'Room',
      status: 'Status',
      attendance: 'Attendance',
      review: 'Review',
    },
    attendStatus: {
      present: 'Present',
      absent: 'Absent',
      excused: 'Excused',
      notMarked: 'Not marked',
    },
    reviewedBadge: 'Reviewed',
    reviewBtn: 'Review',
    reviewModal: {
      title: 'Review session',
      alreadyReviewed: 'You have already reviewed this session',
      teachingMethodLabel: 'Teaching method',
      atmosphereLabel: 'Class atmosphere',
      documentLabel: 'Material quality',
      understandLabel: 'Understanding level',
      usefulLabel: 'Usefulness level',
      thinkingLabel: 'Comment (optional)',
      thinkingPlaceholder: 'Share your thoughts...',
      cancelBtn: 'Cancel',
      submitBtn: 'Submit review',
      submitting: 'Submitting...',
      successToast: 'Review submitted!',
      alreadyReviewedToast: 'You have already reviewed this session.',
      errorToast: 'Cannot submit review. Please try again.',
    },
  },
  timeAgo: {
    justNow: 'just now',
    minutesAgo: '{{count}} minutes ago',
    hoursAgo: '{{count}} hours ago',
    daysAgo: '{{count}} days ago',
  },
};

export default en;
