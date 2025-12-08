// API Configuration
// ⚠️ CHANGE THIS TO YOUR ACTUAL BACKEND URL
export const API_CONFIG = {
  BASE_URL: 'https://minesafego.onrender.com',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/app/miner/login',
      LOGOUT: '/auth/logout',
    },
    EMERGENCY: {
      CREATE: '/emergencies',
      LIST: '/emergencies',
      UPDATE: '/emergencies/:id',
      DELETE: '/emergencies/:id',
    },
    HAZARD: {
      CREATE: '/hazards',
      LIST: '/hazards',
      UPDATE: '/hazards/:id',
      DELETE: '/hazards/:id',
    },
    UPLOAD: {
      MEDIA: '/upload',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE: '/user/profile',
    },
  },
  TIMEOUT: 30000, // 30 seconds
};

export default API_CONFIG;
