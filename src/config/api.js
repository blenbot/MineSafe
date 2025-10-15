// API Configuration
// ⚠️ CHANGE THIS TO YOUR ACTUAL BACKEND URL
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:8080/api', // Change to your server IP
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      VERIFY: '/auth/verify',
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
