import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../i18n';

const OPENAI_API_KEY = "api key dalo";
const API_URL = 'https://api.openai.com/v1/chat/completions';

const ChatScreen = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationSummary, setConversationSummary] = useState('');
  
  const flatListRef = useRef(null);

  // Languages supported
  const languages = [
    { code: 'en-US', name: 'English', label: 'English', ttsCode: 'en-US' },
    { code: 'hi-IN', name: 'हिंदी', label: 'Hindi', ttsCode: 'hi-IN' },
    { code: 'ta-IN', name: 'தமிழ்', label: 'Tamil', ttsCode: 'ta-IN' },
    { code: 'te-IN', name: 'తెలుగు', label: 'Telugu', ttsCode: 'te-IN' },
    { code: 'bn-IN', name: 'বাংলা', label: 'Bengali', ttsCode: 'bn-IN' },
    { code: 'mr-IN', name: 'मराठी', label: 'Marathi', ttsCode: 'mr-IN' },
  ];

  useEffect(() => {
    // Initialize TTS with default language
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);

    // Voice recognition event handlers
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Load initial messages and summary
    const initializeChat = async () => {
      // Load previous conversation summary
      const savedSummary = await AsyncStorage.getItem('conversationSummary');
      if (savedSummary) {
        setConversationSummary(savedSummary);
      }

      // Welcome message with language selection
      setMessages([
        {
          id: '1',
          text: 'Namaste! Main Damodar hoon. Aap kis language mein baat karna chahenge?\n\nनमस्ते! मैं दामोदर हूँ। आप किस भाषा में बात करना चाहेंगे?\n\nHello! I am Damodar. Which language would you like to proceed in?',
          isUser: false,
          timestamp: new Date(),
          showLanguageOptions: true,
        },
      ]);
    };

    initializeChat();

    // Cleanup
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Voice recognition handlers
  const onSpeechStart = () => {
    // console.log('Speech start');
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
    // console.log('Speech end');
  };

  const onSpeechResults = (e) => {
    const text = e.value && e.value[0];
    if (text) {
      setInputText(text);
    }
  };

  const onSpeechError = (e) => {
    console.log('Speech error:', e);
    setIsRecording(false);
  };

  // TTS function
  const speakText = (text) => {
    try {
      Tts.stop();
      
      // Set language for TTS based on selected language
      if (selectedLanguage) {
        Tts.setDefaultLanguage(selectedLanguage.ttsCode || 'en-US');
      }
      
      Tts.speak(text);
    } catch (e) {
      console.log('TTS error:', e);
    }
  };

  // Save conversation summary to storage
  const saveConversationSummary = async (summary) => {
    try {
      await AsyncStorage.setItem('conversationSummary', summary);
      setConversationSummary(summary);
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  };

  // Generate summary from conversation history
  const generateConversationSummary = async () => {
    if (messages.length < 4) return conversationSummary;
    
    try {
      const conversationText = messages
        .filter(msg => !msg.showLanguageOptions)
        .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n\n');
      
      const summaryResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a summarizer. Create a concise summary of the conversation highlighting key topics discussed, user preferences, and important context. Keep it under 150 words.'
            },
            {
              role: 'user',
              content: `Summarize this conversation:\n\n${conversationText}\n\nSummary:`
            }
          ],
          temperature: 0.5,
          max_tokens: 200,
        }),
      });

      const data = await summaryResponse.json();
      if (data.choices && data.choices.length > 0) {
        const summary = data.choices[0].message.content;
        saveConversationSummary(summary);
        return summary;
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    }
    
    return conversationSummary;
  };

  // Select language
  const selectLanguage = (language) => {
    setSelectedLanguage(language);
    
    // Update TTS language
    Tts.setDefaultLanguage(language.ttsCode || 'en-US');
    
    const confirmMessage = {
      id: Date.now().toString(),
      text: `Great! You can now speak or type in ${language.name}. I'm here to help with mining safety questions!\n\nआप अब ${language.name} में बोल या टाइप कर सकते हैं। मैं खनन सुरक्षा प्रश्नों में मदद के लिए यहाँ हूँ!`,
      isUser: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, confirmMessage]);
    speakText(`Language set to ${language.label}. How can I help you with mine safety?`);
  };

  // Send message to OpenAI
  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const languageContext = selectedLanguage 
        ? `Please respond in ${selectedLanguage.label} language. ` 
        : 'Please respond in English.';

      // Get recent conversation context
      const recentMessages = messages
        .filter(msg => !msg.showLanguageOptions)
        .slice(-5)
        .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n\n');

      // Generate or get conversation summary
      const summary = await generateConversationSummary();
      
      // Enhanced system prompt with mining safety context
      const enhancedSystemPrompt = `You are Damodar, a helpful AI assistant specializing in mining safety. ${languageContext}
      
CONTEXT AND MEMORY:
${summary ? `Previous Conversation Summary:\n${summary}\n\n` : ''}
${recentMessages ? `Recent Messages:\n${recentMessages}\n\n` : ''}

INSTRUCTIONS:
1. Be friendly and helpful, focusing on mining safety topics
2. Remember user's preferences from previous conversations
3. Provide practical safety advice for miners
4. If user asks about PPE, hazards, emergencies, or safety procedures, give detailed guidance
5. Keep responses concise and clear
6. Always prioritize safety in your advice

Current conversation:`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: enhancedSystemPrompt,
            },
            {
              role: 'user',
              content: inputText,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: data.choices[0].message.content,
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        speakText(botMessage.text);
        
        // Generate new summary every 4 messages
        if (messages.length % 4 === 0) {
          setTimeout(() => generateConversationSummary(), 1000);
        }
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf kijiye, kuch galat ho gaya. Kripya dobara try karein.\n\nSorry, something went wrong. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      speakText('Sorry, something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Voice recording functions
  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Microphone permission is required for voice input');
        return;
      }
      
      setIsRecording(true);
      
      // Set language for voice recognition
      const langCode = selectedLanguage?.code || 'en-US';
      await Voice.start(langCode);
    } catch (e) {
      console.log('startRecording error:', e);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await Voice.stop();
    } catch (e) {
      console.log('stopRecording error:', e);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Refresh summary
  const refreshSummary = async () => {
    setIsLoading(true);
    await generateConversationSummary();
    setIsLoading(false);
    Alert.alert(
      'Memory Updated',
      'Conversation memory has been refreshed successfully.',
      [{ text: 'OK' }]
    );
  };

  // Render message item
  const renderMessage = ({ item }) => (
    <View>
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}>
        <Text style={styles.messageAuthor}>
          {item.isUser ? 'You' : '🤖 Damodar AI'}
        </Text>
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userMessageText : styles.botMessageText,
          ]}>
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.isUser && styles.userTimestamp,
          ]}>
          {item.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      
      {item.showLanguageOptions && !selectedLanguage && (
        <View style={styles.languageOptions}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.languageButton}
              onPress={() => selectLanguage(lang)}>
              <Text style={styles.languageButtonText}>
                {lang.name}
              </Text>
              <Text style={styles.languageButtonSubText}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>🎙️ Damodar AI Assistant</Text>
          {selectedLanguage && (
            <Text style={styles.headerSubText}>
              Language: {selectedLanguage.name}
            </Text>
          )}
          {conversationSummary && (
            <TouchableOpacity onPress={refreshSummary} style={styles.summaryButton}>
              <Text style={styles.summaryButtonText}>🔄 Update Memory</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Conversation Summary */}
        {conversationSummary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>📝 Conversation Memory</Text>
            <Text style={styles.summaryText} numberOfLines={2}>
              {conversationSummary}
            </Text>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.chatList}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>
              Damodar is thinking... {conversationSummary ? '(with context)' : ''}
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputRow}>
          {/* Mic Button */}
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
            ]}
            onPress={toggleRecording}
            disabled={isLoading}>
            <Text style={styles.micText}>
              {isRecording ? '●' : '🎤'}
            </Text>
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              selectedLanguage 
                ? `Type in ${selectedLanguage.label}...`
                : "Select a language above..."
            }
            placeholderTextColor="#6B7280"
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={inputText.trim() === '' || isLoading}>
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Hint */}
        <View style={styles.voiceHintRow}>
          <Text style={styles.voiceHint}>
            🎤 Press mic to speak • {selectedLanguage?.name || 'Select language'} • Replies spoken aloud
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#050816',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  summaryButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  summaryButtonText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 0,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  chatList: {
    flex: 1,
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageBubble: {
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#111827',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  messageAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#E5E7EB',
  },
  botMessageText: {
    color: '#E5E7EB',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#bfdbfe',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 10,
    justifyContent: 'center',
    gap: 10,
  },
  languageButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  languageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  languageButtonSubText: {
    color: '#bfdbfe',
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 0,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#111827',
  },
  micButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  micText: {
    fontSize: 20,
    color: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#111827',
    color: '#E5E7EB',
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.7,
  },
  sendText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  voiceHintRow: {
    marginBottom: 8,
  },
  voiceHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});