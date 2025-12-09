/**
 * Hindi translations (hi)
 * हिंदी अनुवाद
 */

export default {
  // Common
  common: {
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    next: 'अगला',
    done: 'हो गया',
    yes: 'हाँ',
    no: 'नहीं',
    ok: 'ठीक है',
    retry: 'पुनः प्रयास करें',
    submit: 'जमा करें',
    search: 'खोजें',
    miner: 'खनिक',
  },

  // Welcome/Onboarding
  welcome: {
    title: 'माइनसेफ में आपका स्वागत है',
    subtitle: 'आपका सुरक्षा साथी',
    description: 'रियल-टाइम निगरानी, आपातकालीन अलर्ट और AI-संचालित सहायता के साथ भूमिगत सुरक्षित रहें।',
    getStarted: 'शुरू करें',
    login: 'लॉगिन',
  },

  // Login
  login: {
    title: 'लॉगिन',
    email: 'ईमेल',
    password: 'पासवर्ड',
    emailPlaceholder: 'अपना ईमेल दर्ज करें',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    loginButton: 'लॉगिन करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    noAccount: 'खाता नहीं है?',
    register: 'पंजीकरण करें',
    invalidCredentials: 'अमान्य ईमेल या पासवर्ड',
    networkError: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।',
  },

  // Home Screen
  home: {
    welcomeBack: 'वापसी पर स्वागत है,',
    preStartChecklist: 'प्री-स्टार्ट\nचेकलिस्ट',
    ppeChecklist: 'पीपीई\nचेकलिस्ट',
    askDamodar: 'दामोदर से पूछें',
    reportEmergency: 'आपातकाल रिपोर्ट करें',
    todaysSafetyVideo: 'आज का सुरक्षा वीडियो',
    recommendedForYou: 'आपके लिए अनुशंसित',
    basedOnInterests: 'आपकी रुचियों के आधार पर: {{interests}}',
    seeAll: 'सभी देखें',
  },

  // Navigation
  nav: {
    home: 'होम',
    video: 'वीडियो',
    training: 'प्रशिक्षण',
    profile: 'प्रोफ़ाइल',
  },

  // Profile
  profile: {
    title: 'खनिक प्रोफ़ाइल',
    email: 'ईमेल',
    phone: 'फ़ोन नंबर',
    supervisor: 'पर्यवेक्षक का नाम',
    miningSite: 'आवंटित खदान स्थल',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    logout: 'लॉग आउट',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    privacy: 'गोपनीयता और सुरक्षा',
    help: 'सहायता और समर्थन',
    uploadVideo: 'वीडियो मॉड्यूल अपलोड करें',
    myInterests: 'मेरी रुचियाँ',
    version: 'माइनसेफ v1.0.0',
    logoutConfirm: 'क्या आप लॉग आउट करना चाहते हैं?',
  },

  // Video Module
  video: {
    title: 'सुरक्षा वीडियो',
    like: 'पसंद',
    dislike: 'नापसंद',
    ask: 'पूछें',
    quiz: 'क्विज़',
    swipeForMore: 'और देखने के लिए स्वाइप करें',
  },

  // Training/Quiz
  training: {
    title: 'सुरक्षा प्रशिक्षण क्विज़',
    question: 'प्रश्न {{current}} / {{total}}',
    correctAnswer: 'सही! शाबाश!',
    wrongAnswer: 'गलत। सही उत्तर था:',
    quizComplete: 'क्विज़ पूर्ण!',
    yourScore: 'आपका स्कोर: {{score}}/{{total}}',
    passed: 'बधाई! आप पास हो गए!',
    failed: 'अभ्यास जारी रखें! आपको और अभ्यास की आवश्यकता है।',
    tryAgain: 'पुनः प्रयास करें',
    backToHome: 'होम पर वापस जाएं',
    tip: 'सुझाव:',
  },

  // Damodar Chat
  chat: {
    title: 'दामोदर से पूछें',
    placeholder: 'सुरक्षा के बारे में कुछ भी पूछें...',
    send: 'भेजें',
    quickActions: {
      emergencyProcedures: 'आपातकालीन प्रक्रियाएं',
      ppeGuidelines: 'पीपीई दिशानिर्देश',
      firstAid: 'प्राथमिक चिकित्सा',
      safetyRegulations: 'सुरक्षा नियम',
    },
    greeting: 'नमस्ते! मैं दामोदर हूं, आपका AI सुरक्षा सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?',
  },

  // Pre-Start Checklist
  preStart: {
    title: 'प्री-स्टार्ट चेकलिस्ट',
    subtitle: 'अपनी शिफ्ट शुरू करने से पहले पूरा करें',
    item1: 'हेलमेट निरीक्षण पूर्ण',
    item2: 'सुरक्षा जूते सही से पहने',
    item3: 'हाई-विजिबिलिटी वेस्ट पहनी',
    item4: 'संचार उपकरण चार्ज',
    item5: 'सेल्फ-रेस्क्यूअर लगा हुआ',
    complete: 'पूर्ण करें',
    allComplete: 'सभी आइटम जाँच लिए गए!',
  },

  // PPE Checklist
  ppe: {
    title: 'पीपीई चेकलिस्ट',
    subtitle: 'अपने सुरक्षा उपकरण सत्यापित करें',
    helmet: 'सुरक्षा हेलमेट',
    boots: 'सुरक्षा जूते',
    vest: 'हाई-विजिबिलिटी वेस्ट',
    gloves: 'सुरक्षा दस्ताने',
    goggles: 'सुरक्षा चश्मे',
    earProtection: 'कान सुरक्षा',
    respirator: 'रेस्पिरेटर/मास्क',
    verify: 'सत्यापित करें',
    verified: 'सत्यापित',
    allVerified: 'सभी पीपीई सत्यापित!',
  },

  // Emergency
  emergency: {
    title: 'आपातकाल रिपोर्ट करें',
    type: 'आपातकाल का प्रकार',
    location: 'आपका स्थान',
    description: 'विवरण',
    submit: 'आपातकालीन रिपोर्ट जमा करें',
    types: {
      fire: 'आग',
      collapse: 'छत गिरना',
      gas: 'गैस रिसाव',
      flood: 'बाढ़',
      injury: 'चोट',
      other: 'अन्य',
    },
    confirmation: 'आपातकाल रिपोर्ट की गई। मदद रास्ते में है!',
  },

  // Upload Video
  upload: {
    title: 'वीडियो अपलोड करें',
    videoTitle: 'वीडियो शीर्षक',
    titlePlaceholder: 'वीडियो शीर्षक दर्ज करें...',
    tags: 'टैग',
    addQuiz: 'वीडियो में वैकल्पिक क्विज़ जोड़ें',
    selectVideo: 'वीडियो चुनें और अपलोड करें',
    shareKnowledge: 'अन्य खनिकों के साथ सुरक्षा ज्ञान साझा करें',
  },

  // Interests/Tags
  interests: {
    title: 'मेरी रुचियाँ',
    subtitle: 'अपनी रुचि के विषय चुनें। आपकी रुचियों के आधार पर वीडियो अनुशंसित किए जाएंगे।',
    saveInterests: 'रुचियाँ सहेजें',
    updated: 'आपकी रुचियाँ अपडेट कर दी गई हैं!',
  },

  // Errors
  errors: {
    networkError: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
    serverError: 'सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।',
    unknownError: 'एक अज्ञात त्रुटि हुई।',
    sessionExpired: 'आपका सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें।',
  },
};
