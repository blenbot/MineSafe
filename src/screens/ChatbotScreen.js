// src/screens/ChatbotScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';

const ChatbotScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi 👋 I'm Damodar! Want to learn a safety tip or report a hazard?",
      isBot: true,
    },
  ]);

  const quickActions = [
    { id: 1, text: 'Learn Tip ⬆️', icon: 'lightbulb-outline' },
    { id: 2, text: 'Report Hazard ⬇️', icon: 'alert' },
    { id: 3, text: 'Ask Question 💬', icon: 'message-question-outline' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Damodar</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="wrench" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Icon name="web" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.chatContainer}>
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageContainer,
              msg.isBot ? styles.botMessage : styles.userMessage
            ]}
          >
            {msg.isBot && (
              <View style={styles.botAvatar}>
                <Icon name="robot" size={20} color={colors.primary} />
              </View>
            )}
            <View style={[
              styles.messageBubble,
              msg.isBot ? styles.botBubble : styles.userBubble
            ]}>
              <Text style={[
                styles.messageText,
                msg.isBot ? styles.botText : styles.userText
              ]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.quickActionButton}
              onPress={() => {
                if (action.id === 2) {
                  navigation.navigate('ReportHazard');
                }
              }}
            >
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.micButton}>
          <Icon name="microphone" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton}>
          <Icon name="send" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  botBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: colors.text.primary,
  },
  userText: {
    color: colors.white,
  },
  quickActionsContainer: {
    marginTop: 20,
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotScreen;