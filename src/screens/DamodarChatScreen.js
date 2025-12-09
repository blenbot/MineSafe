import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef(null);

  // OpenAI API configuration
  const OPENAI_API_KEY = '****jkhgfdxzsnbhb';
  const API_URL = 'https://api.openai.com/v1/chat/completions';

  const languages = [
    { code: 'hi', name: 'हिंदी', label: 'Hindi' },
    { code: 'en', name: 'English', label: 'English' },
    { code: 'ta', name: 'தமிழ்', label: 'Tamil' },
    { code: 'te', name: 'తెలుగు', label: 'Telugu' },
  ];

  useEffect(() => {
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
  }, []);

  const selectLanguage = (language) => {
    setSelectedLanguage(language);
    const confirmMessage = {
      id: Date.now().toString(),
      text: `Great! Aap ${language.name} mein baat kar sakte hain. Main aapki madad ke liye yahan hoon!\n\nYou can speak or type your message. Press the microphone button to record audio.`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

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
        : '';

      const response = await fetch(API_URL, {
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
              content: `You are Damodar, a helpful AI assistant. ${languageContext}Be friendly and helpful.`,
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
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    // Note: React Native requires expo-av or react-native-audio packages
    // This is a placeholder that shows the UI interaction
    setIsRecording(true);
    Alert.alert(
      'Audio Recording',
      'Audio recording feature requires expo-av package. Install it with:\nnpm install expo-av\n\nThen implement Audio.Recording API.',
      [
        {
          text: 'OK',
          onPress: () => {
            setIsRecording(false);
            // Simulated audio input
            setInputText('Voice message recorded (implement audio API)');
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }) => (
    <View>
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🙏 Damodar AI Assistant</Text>
        {selectedLanguage && (
          <Text style={styles.headerSubText}>
            Language: {selectedLanguage.name}
          </Text>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF6B35" />
            <Text style={styles.loadingText}>Damodar is typing...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
            ]}
            onPress={startRecording}
            disabled={isLoading}>
            <Text style={styles.micButtonText}>🎤</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={inputText.trim() === '' || isLoading}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E55A2B',
  },
  headerText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B35',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#FFE5DC',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 10,
    gap: 10,
  },
  languageButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: '45%',
    alignItems: 'center',
  },
  languageButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageButtonSubText: {
    color: '#FFE5DC',
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingLeft: 15,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  micButtonActive: {
    backgroundColor: '#FF6B35',
  },
  micButtonText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatScreen;