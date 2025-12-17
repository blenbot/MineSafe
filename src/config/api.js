// API Configuration
// Backend: MineSafeBackend (Go)
export const API_CONFIG = {
  BASE_URL: 'https://minesafego.onrender.com',
  ENDPOINTS: {
    // ==================== PUBLIC AUTH ====================
    AUTH: {
      LOGIN: '/api/auth/login', // POST - General login
      SIGNUP: '/api/auth/signup', // POST - Supervisor signup
      REGISTER_ADMIN: '/api/auth/register-admin', // POST - Register admin
      MINER_LOGIN: '/api/app/miner/login', // POST - Miner app login
    },
    // ==================== ADMIN AUTH ====================
    ADMIN: {
      LOGIN: '/api/admin/login', // POST - Admin login
      SIGNUP: '/api/admin/signup', // POST - Admin signup
      // Supervisor management by admin
      SUPERVISORS: {
        LIST: '/api/admin/supervisors', // GET
        CREATE: '/api/admin/supervisors', // POST
        GET: '/api/admin/supervisors/:id', // GET
        UPDATE: '/api/admin/supervisors/:id', // PUT
        DELETE: '/api/admin/supervisors/:id', // DELETE
      },
      // Miner management by admin
      MINERS: {
        LIST: '/api/admin/miners', // GET
        CREATE: '/api/admin/miners', // POST
        GET: '/api/admin/miners/:id', // GET
        UPDATE: '/api/admin/miners/:id', // PUT
        DELETE: '/api/admin/miners/:id', // DELETE
      },
    },
    // ==================== USER ====================
    USER: {
      ME: '/api/me', // GET - Get current user info
    },
    // ==================== USER TAGS ====================
    USER_TAGS: {
      GET: '/api/user/tags', // GET - Get user's interest tags
      UPDATE: '/api/user/tags', // PUT - Update user's interest tags
    },
    // ==================== APP PROFILE (MINER) ====================
    PROFILE: {
      GET: '/api/app/profile', // GET - Get full user profile with tags
      UPDATE: '/api/app/profile', // PUT - Update user profile
      PICTURE: '/api/app/profile/picture', // POST - Upload profile picture
    },
    // ==================== APP ROUTES (MINER) ====================
    APP: {
      QUIZ_CALENDAR: '/api/app/quiz-calendar', // GET - Quiz calendar and streak
      CHECKLISTS: {
        PRE_START: '/api/app/checklists/pre-start', // GET
        PRE_START_COMPLETE: '/api/app/checklists/pre-start/complete', // PUT
        PPE: '/api/app/checklists/ppe', // GET
        PPE_COMPLETE: '/api/app/checklists/ppe/complete', // PUT
      },
    },
    // ==================== PPE STATISTICS ====================
    PPE_STAT: {
      SUBMIT: '/api/ppestat', // POST - Submit PPE verification from app
      MY_STATS: '/api/ppestat/me', // GET - Get my PPE history
    },
    // ==================== VIDEO FEED & RECOMMENDATIONS ====================
    VIDEOS: {
      FEED: '/api/videos/feed', // GET ?page=1&limit=10&tags=PPE,safety
      RECOMMENDED: '/api/videos/recommended', // GET ?tags=PPE,safety
      LIKE: '/api/videos/:id/like', // POST - Like a video
      DISLIKE: '/api/videos/:id/dislike', // POST - Dislike a video
      UPLOAD: '/api/videos/upload', // POST - Upload video with optional quiz (multipart)
      SUBMIT_LINK: '/api/videos/submit-link', // POST - Submit video link for approval
      MY_SUBMISSIONS: '/api/videos/my-submissions', // GET - Get videos submitted by current user
    },
    // ==================== TRAINING & QUIZ ====================
    TRAINING: {
      QUIZ_BY_TITLE: '/api/training/quiz', // GET ?title={videoTitle}
      QUIZ_LIST: '/api/training/quizzes', // GET - List all quizzes
      MODULES_WITH_QUIZZES: '/api/training/modules', // GET - All video modules with quiz info
    },
    // ==================== VIDEO MODULES ====================
    MODULES: {
      LIST: '/api/modules', // GET - Get all video modules
      GET: '/api/modules/:id', // GET - Get single module
      QUESTIONS: '/api/modules/:id/questions', // GET - Get questions for module
      SUBMIT: '/api/modules/submit', // POST - Submit module answers
      STAR: '/api/modules/star', // GET - Get starred video
      CREATE: '/api/modules', // POST (supervisor only)
      SET_STAR: '/api/modules/:id/star', // POST (supervisor only)
      CREATE_QUESTION: '/api/modules/questions', // POST (supervisor only)
    },
    // ==================== LEARNING STREAK ====================
    STREAK: {
      ALL: '/api/streaks', // GET - All streaks
      ME: '/api/streak/me', // GET - My streak
      COMPLETIONS: '/api/completions/me', // GET - My completions
    },
    // ==================== EMERGENCY ====================
    EMERGENCY: {
      CREATE: '/api/emergencies', // POST
      LIST: '/api/emergencies', // GET
      GET: '/api/emergencies/:id', // GET
      UPDATE_MEDIA: '/api/emergencies/:id/media', // PUT
      UPDATE_STATUS: '/api/emergencies/:id/status', // PUT
    },
    // ==================== SUPERVISOR ROUTES ====================
    SUPERVISOR: {
      // Miner management (supervisor)
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
        PRE_START_COMPLETE: '/api/checklists/pre-start/complete', // PUT
        PPE_CREATE: '/api/checklists/ppe', // POST
        PPE_LIST: '/api/checklists/ppe', // GET
        PPE_DELETE: '/api/checklists/ppe/:id', // DELETE
        PPE_COMPLETE: '/api/checklists/ppe/complete', // PUT
      },
      // Dashboard
      DASHBOARD_STATS: '/api/dashboard/stats', // GET
      // Module management
      MODULES_PENDING: '/api/supervisor/modules/pending', // GET - Pending modules
      MODULES_REVIEW: '/api/supervisor/modules/review/:id', // POST - Review module
      MODULES_UPLOADED: '/api/supervisor/modules/uploaded', // GET - Uploaded modules
      // Zone management
      ZONES_LIST: '/api/supervisor/zones', // GET
      ZONES_CREATE: '/api/supervisor/zones', // POST
      ALLOCATE_MINER: '/api/supervisor/allocate', // POST - Allocate miner to zone
      // Supervisor miners view
      SUPERVISOR_MINERS: '/api/supervisor/miners', // GET - Miners with zone info
      // Emergency reports
      EMERGENCY_DOWNLOAD: '/api/supervisor/emergencies/:id/download', // GET
      EMERGENCY_FORWARD: '/api/supervisor/emergencies/:id/forward', // POST
      // PPE Stats view
      PPE_STATS: '/api/supervisor/ppestats', // GET
    },
    // ==================== STATIC FILES ====================
    UPLOADS: '/uploads', // Serve uploaded files (videos, profile pictures)
    ASSETS: '/assets', // Serve database assets (seeded videos)
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
