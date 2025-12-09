// API Configuration
// Backend: MineSafeBackend (Go)
export const API_CONFIG = {
  BASE_URL: 'https://minesafego.onrender.com',
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/app/miner/login', // POST - { email, password, role }
      LOGOUT: '/auth/logout',
    },
    // User profile
    USER: {
      ME: '/api/me', // GET - Get current user info
      PROFILE: '/api/user/profile',
      UPDATE: '/api/user/profile',
    },
    // User tags for personalized recommendations
    USER_TAGS: {
      GET: '/api/user/tags', // GET - Get user's tags
      UPDATE: '/api/user/tags', // PUT - { tags: string[] }
    },
    // App profile (for MINER/OPERATOR)
    PROFILE: {
      GET: '/api/app/profile', // GET - Get app profile
      UPDATE: '/api/app/profile', // PUT - Update profile
      PICTURE: '/api/app/profile/picture', // POST - Upload profile picture
    },
    // App-specific routes (for MINER/OPERATOR)
    APP: {
      QUIZ_CALENDAR: '/api/app/quiz-calendar', // GET
      CHECKLISTS: {
        PRE_START: '/api/app/checklists/pre-start', // GET
        PRE_START_COMPLETE: '/api/app/checklists/pre-start/complete', // PUT
        PPE: '/api/app/checklists/ppe', // GET
        PPE_COMPLETE: '/api/app/checklists/ppe/complete', // PUT
      },
    },
    // Video feed and interactions
    VIDEOS: {
      FEED: '/api/modules', // GET ?page=1&limit=10&tags=PPE,safety - Response: { videos: [], has_more: bool, total: int }
      RECOMMENDED: '/api/videos/recommended', // GET ?tags=PPE,safety - Tag-based recommendations
      LIKE: '/api/videos/:id/like', // POST - Like a video
      DISLIKE: '/api/videos/:id/dislike', // POST - Dislike a video
      UPLOAD: '/api/videos/upload', // POST (FormData) - { mp4: file, title: string, tags: string[], quiz?: object }
    },
    // Training/Quiz endpoints
    TRAINING: {
      QUIZ_BY_TITLE: '/api/training/quiz', // GET ?title={videoTitle} - Get quiz by video title
      QUIZ_LIST: '/api/training/quizzes', // GET - List all available quizzes
      QUIZ_SUBMIT: '/api/training/quiz/submit', // POST - Submit quiz answers
    },
    // Video modules (legacy)
    MODULES: {
      LIST: '/api/modules', // GET
      GET: '/api/modules/:id', // GET
      QUESTIONS: '/api/modules/:id/questions', // GET
      SUBMIT: '/api/modules/submit', // POST
      STAR: '/api/modules/star', // GET - Get starred video
    },
    // Learning streak
    STREAK: {
      ALL: '/api/streaks', // GET
      ME: '/api/streak/me', // GET
      COMPLETIONS: '/api/completions/me', // GET
    },
    // Emergency management
    EMERGENCY: {
      CREATE: '/api/emergencies', // POST
      LIST: '/api/emergencies', // GET
      GET: '/api/emergencies/:id', // GET
      UPDATE_MEDIA: '/api/emergencies/:id/media', // PUT
      UPDATE_STATUS: '/api/emergencies/:id/status', // PUT
    },
    // Supervisor-only routes
    SUPERVISOR: {
      // Miner management
      MINERS: {
        CREATE: '/api/miners', // POST
        LIST: '/api/miners', // GET
        GET: '/api/miners/:id', // GET
        UPDATE: '/api/miners/:id', // PUT
        DELETE: '/api/miners/:id', // DELETE
      },
      // Checklist management
      CHECKLISTS: {
        PRE_START_CREATE: '/api/checklists/pre-start', // POST
        PRE_START_LIST: '/api/checklists/pre-start', // GET
        PRE_START_DELETE: '/api/checklists/pre-start/:id', // DELETE
        PPE_CREATE: '/api/checklists/ppe', // POST
        PPE_LIST: '/api/checklists/ppe', // GET
        PPE_DELETE: '/api/checklists/ppe/:id', // DELETE
      },
      // Dashboard
      DASHBOARD_STATS: '/api/dashboard/stats', // GET
      // Video module management
      MODULE_CREATE: '/api/modules', // POST
      MODULE_SET_STAR: '/api/modules/:id/star', // POST
      QUESTION_CREATE: '/api/modules/questions', // POST
    },
    // Legacy/Unused
    HAZARD: {
      CREATE: '/hazards',
      LIST: '/hazards',
      UPDATE: '/hazards/:id',
      DELETE: '/hazards/:id',
    },
    UPLOAD: {
      MEDIA: '/upload',
    },
  },
  TIMEOUT: 30000, // 30 seconds
};

// Helper function to replace path parameters
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return `${API_CONFIG.BASE_URL}${url}`;
};

export default API_CONFIG;
