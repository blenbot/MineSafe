/**
 * English translations (en)
 * Default language for MineSafe app
 */

export default {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    retry: 'Retry',
    submit: 'Submit',
    search: 'Search',
    miner: 'Miner',
  },

  // Welcome/Onboarding
  welcome: {
    title: 'Welcome to MineSafe',
    subtitle: 'Your Safety Companion',
    description: 'Stay safe underground with real-time monitoring, emergency alerts, and AI-powered assistance.',
    getStarted: 'Get Started',
    login: 'Login',
  },

  // Login
  login: {
    title: 'Login',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Login',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    register: 'Register',
    invalidCredentials: 'Invalid email or password',
    networkError: 'Network error. Please try again.',
  },

  // Home Screen
  home: {
    welcomeBack: 'Welcome back,',
    preStartChecklist: 'Pre-Start\nChecklist',
    ppeChecklist: 'PPE\nChecklist',
    askDamodar: 'Ask Damodar',
    reportEmergency: 'Report Emergency',
    todaysSafetyVideo: "Today's Safety Video",
    recommendedForYou: 'Recommended for you',
    basedOnInterests: 'Based on your interests: {{interests}}',
    seeAll: 'See All',
  },

  // Navigation
  nav: {
    home: 'Home',
    video: 'Video',
    training: 'Training',
    profile: 'Profile',
  },

  // Profile
  profile: {
    title: 'Miner Profile',
    email: 'Email',
    phone: 'Phone Number',
    supervisor: 'Supervisor Name',
    miningSite: 'Allocated Mine Site',
    editProfile: 'Edit Profile',
    logout: 'Logout',
    settings: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy & Security',
    help: 'Help & Support',
    uploadVideo: 'Upload Video Module',
    myInterests: 'My Interests',
    version: 'MineSafe v1.0.0',
    logoutConfirm: 'Are you sure you want to logout?',
  },

  // Video Module
  video: {
    title: 'Safety Videos',
    like: 'Like',
    dislike: 'Dislike',
    ask: 'Ask',
    quiz: 'Quiz',
    swipeForMore: 'Swipe for more',
  },

  // Training/Quiz
  training: {
    title: 'Safety Training Quiz',
    question: 'Question {{current}} of {{total}}',
    correctAnswer: 'Correct! Well done!',
    wrongAnswer: 'Incorrect. The correct answer was:',
    quizComplete: 'Quiz Complete!',
    yourScore: 'Your Score: {{score}}/{{total}}',
    passed: 'Congratulations! You passed!',
    failed: 'Keep practicing! You need more practice.',
    tryAgain: 'Try Again',
    backToHome: 'Back to Home',
    tip: 'Tip:',
  },

  // Damodar Chat
  chat: {
    title: 'Ask Damodar',
    placeholder: 'Ask me anything about safety...',
    send: 'Send',
    quickActions: {
      emergencyProcedures: 'Emergency Procedures',
      ppeGuidelines: 'PPE Guidelines',
      firstAid: 'First Aid Tips',
      safetyRegulations: 'Safety Regulations',
    },
    greeting: 'Hello! I\'m Damodar, your AI safety assistant. How can I help you today?',
  },

  // Pre-Start Checklist
  preStart: {
    title: 'Pre-Start Checklist',
    subtitle: 'Complete before starting your shift',
    item1: 'Helmet inspection completed',
    item2: 'Safety boots worn properly',
    item3: 'High-visibility vest on',
    item4: 'Communication device charged',
    item5: 'Self-rescuer attached',
    complete: 'Mark Complete',
    allComplete: 'All items checked!',
  },

  // PPE Checklist
  ppe: {
    title: 'PPE Checklist',
    subtitle: 'Verify your safety equipment',
    helmet: 'Safety Helmet',
    boots: 'Safety Boots',
    vest: 'High-Visibility Vest',
    gloves: 'Safety Gloves',
    goggles: 'Safety Goggles',
    earProtection: 'Ear Protection',
    respirator: 'Respirator/Mask',
    verify: 'Verify',
    verified: 'Verified',
    allVerified: 'All PPE verified!',
  },

  // Emergency
  emergency: {
    title: 'Report Emergency',
    type: 'Emergency Type',
    location: 'Your Location',
    description: 'Description',
    submit: 'Submit Emergency Report',
    types: {
      fire: 'Fire',
      collapse: 'Roof Collapse',
      gas: 'Gas Leak',
      flood: 'Flooding',
      injury: 'Injury',
      other: 'Other',
    },
    confirmation: 'Emergency reported. Help is on the way!',
  },

  // Upload Video
  upload: {
    title: 'Upload Video',
    videoTitle: 'Video Title',
    titlePlaceholder: 'Enter video title...',
    tags: 'Tags',
    addQuiz: 'Add optional quiz to video',
    selectVideo: 'Select & Upload Video',
    shareKnowledge: 'Share safety knowledge with other miners',
  },

  // Interests/Tags
  interests: {
    title: 'My Interests',
    subtitle: 'Select topics you\'re interested in. Videos will be recommended based on your interests.',
    saveInterests: 'Save Interests',
    updated: 'Your interests have been updated!',
  },

  // Errors
  errors: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unknownError: 'An unknown error occurred.',
    sessionExpired: 'Your session has expired. Please login again.',
  },
};
