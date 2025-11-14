import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';

const ChatScreen = ({ route, navigation }) => {
  const { tournamentId, tournamentTitle } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);
  const mountedRef = useRef(true);

  // Initialize chat and fetch messages
  useEffect(() => {
    mountedRef.current = true;
    initializeChat();

    return () => {
      mountedRef.current = false;
      socketService.leaveTournamentChat(tournamentId);
    };
  }, [tournamentId]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(scrollToBottom, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Setup socket listeners separately to avoid stale closure
  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (newMessage) => {
      console.log('New message received:', newMessage);
      if (mountedRef.current) {
        setMessages((prevMessages) => {
          // Avoid duplicate messages
          const isDuplicate = prevMessages.some(msg => msg._id === newMessage._id);
          if (isDuplicate) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    // Listen for deleted messages
    const handleMessageDeleted = ({ messageId }) => {
      console.log('Message deleted:', messageId);
      if (mountedRef.current) {
        setMessages((prevMessages) => 
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageDeleted(handleMessageDeleted);

    // Cleanup listeners
    return () => {
      socketService.offNewMessage();
      socketService.offMessageDeleted();
    };
  }, []); // Empty dependency array - listeners use state updater functions

  const initializeChat = async () => {
    try {
      // Connect socket if not connected
      await socketService.connect();

      // Join tournament chat room
      socketService.joinTournamentChat(tournamentId);

      // Fetch existing messages
      await fetchMessages();

      console.log('Chat initialized successfully');
    } catch (error) {
      console.error('Initialize chat error:', error);
      Alert.alert('Error', 'Failed to initialize chat');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await messageAPI.getTournamentMessages(tournamentId);
      if (mountedRef.current) {
        setMessages(response.data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'You must join the tournament to view chat');
        navigation.goBack();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const response = await messageAPI.sendMessage(tournamentId, messageText);
      console.log('Message sent successfully:', response.data);
      
      // The message will be received via socket
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send message');
      setInputMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      try {
        flatListRef.current.scrollToEnd({ animated: true });
      } catch (error) {
        console.log('Scroll error:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.userId === user._id;
    const isAdmin = item.senderRole === 'admin';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.messageHeader}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item.username}</Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#FFD700" />
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
              {!isAdmin && (
                <View style={styles.playerBadge}>
                  <Ionicons name="person" size={9} color="#00BFFF" />
                  <Text style={styles.playerBadgeText}>PLAYER</Text>
                </View>
              )}
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            isAdmin && !isOwnMessage && styles.adminMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isOwnMessage && (
          <View style={styles.ownMessageHeader}>
            <View style={styles.usernameRow}>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={10} color="#FFD700" />
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
              {!isAdmin && (
                <View style={styles.playerBadge}>
                  <Ionicons name="person" size={9} color="#00BFFF" />
                  <Text style={styles.playerBadgeText}>PLAYER</Text>
                </View>
              )}
              <Text style={styles.usernameOwn}>You</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tournament Chat</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {tournamentTitle}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.chatIconContainer}>
            <Text style={styles.chatIcon}>💬</Text>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#888888"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputMessage.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: {
    fontSize: 20,
  },

  // Messages
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageHeader: {
    marginBottom: 6,
  },
  ownMessageHeader: {
    marginTop: 6,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  usernameOwn: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  playerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  playerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00BFFF',
    letterSpacing: 0.5,
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: '#00BFFF',
  },
  otherMessageBubble: {
    backgroundColor: '#1E1E1E',
  },
  adminMessageBubble: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  otherMessageText: {
    color: '#E0E0E0',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#888888',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },

  // Input
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    backgroundColor: '#121212',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A2A',
    opacity: 0.5,
  },
});

export default ChatScreen;