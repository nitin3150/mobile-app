import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

interface TicketMessage {
  _id: string;
  message: string;
  sender_type: 'user' | 'admin';
  sender_name: string;
  created_at: string;
  attachments?: string[];
}

interface TicketDetail {
  _id: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_to?: string;
  admin_response?: string;
  messages: TicketMessage[];
  order_id?: string;
}

const SUPPORT_CATEGORIES = {
  'order_inquiry': 'Order Inquiry',
  'delivery_issue': 'Delivery Issue',
  'payment_issue': 'Payment Issue',
  'product_feedback': 'Product Feedback',
  'app_feedback': 'App Feedback',
  'technical_issue': 'Technical Issue',
  'account_issue': 'Account Issue',
  'other': 'Other',
};

const STATUS_COLORS = {
  'open': '#FF9500',
  'in_progress': '#007AFF',
  'resolved': '#34C759',
  'closed': '#8E8E93',
};

const PRIORITY_COLORS = {
  'low': '#34C759',
  'medium': '#FF9500',
  'high': '#FF6B35',
  'urgent': '#FF3B30',
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const { token, user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const whatsappNumber = '+911234567890'; // Replace with your actual WhatsApp support number

  useEffect(() => {
    if (id) {
      fetchTicketDetail();
      // Set up polling for real-time updates
      const interval = setInterval(fetchTicketDetail, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchTicketDetail = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        console.error('Failed to fetch ticket details');
        Alert.alert('Error', 'Failed to load ticket details');
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetail();
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/support/tickets/${ticket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchTicketDetail(); // Refresh to show new message
        
        // Scroll to bottom to show new message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const openWhatsApp = () => {
    const message = `Hi SmartBag Support, I need help with my support ticket #${ticket?._id.slice(-8).toUpperCase()}. 

Subject: ${ticket?.subject}
Category: ${SUPPORT_CATEGORIES[ticket?.category as keyof typeof SUPPORT_CATEGORIES]}

Please assist me with this issue.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          const webWhatsAppUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
          return Linking.openURL(webWhatsAppUrl);
        }
      })
      .catch((error) => {
        console.error('WhatsApp opening error:', error);
        Alert.alert(
          'WhatsApp Not Available',
          'WhatsApp is not installed on your device. Would you like to call our support instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Call Support', 
              onPress: () => Linking.openURL(`tel:${whatsappNumber}`)
            }
          ]
        );
      });
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPriorityText = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const renderMessage = (message: TicketMessage, index: number) => {
    const isUserMessage = message.sender_type === 'user';
    
    return (
      <View
        key={message._id || index}
        style={[
          styles.messageContainer,
          isUserMessage ? styles.userMessage : styles.adminMessage
        ]}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageSender}>
            {isUserMessage ? 'You' : message.sender_name || 'Support Team'}
          </Text>
          <Text style={styles.messageTime}>
            {formatDate(message.created_at)}
          </Text>
        </View>
        <Text style={styles.messageText}>{message.message}</Text>
        {!isUserMessage && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#007AFF" />
            <Text style={styles.adminBadgeText}>Official Response</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.errorTitle}>Ticket Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The requested ticket could not be found or you don't have permission to view it.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Ticket Details</Text>
            <Text style={styles.ticketId}>#{ticket._id.slice(-8).toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </TouchableOpacity>
        </View>

        {/* Ticket Info Card */}
        <View style={styles.ticketInfoCard}>
          <View style={styles.ticketInfoHeader}>
            <Text style={styles.ticketSubject} numberOfLines={2}>{ticket.subject}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ticket.status] }]}>
                <Text style={styles.badgeText}>{getStatusText(ticket.status)}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[ticket.priority] }]}>
                <Text style={styles.badgeText}>{getPriorityText(ticket.priority)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.ticketMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="folder-outline" size={16} color="#666" />
              <Text style={styles.metaText}>
                {SUPPORT_CATEGORIES[ticket.category as keyof typeof SUPPORT_CATEGORIES]}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>Created {formatDate(ticket.created_at)}</Text>
            </View>
            {ticket.order_id && (
              <View style={styles.metaItem}>
                <Ionicons name="receipt-outline" size={16} color="#666" />
                <Text style={styles.metaText}>Order: {ticket.order_id}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.messagesContent}
        >
          {/* Original Message */}
          <View style={[styles.messageContainer, styles.userMessage, styles.originalMessage]}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>You</Text>
              <Text style={styles.messageTime}>{formatDate(ticket.created_at)}</Text>
            </View>
            <Text style={styles.messageText}>{ticket.message}</Text>
            <View style={styles.originalMessageBadge}>
              <Text style={styles.originalMessageText}>Original Request</Text>
            </View>
          </View>

          {/* Additional Messages */}
          {ticket.messages && ticket.messages.length > 0 ? (
            ticket.messages.map((message, index) => renderMessage(message, index))
          ) : (
            <View style={styles.noMessagesContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.noMessagesText}>No additional messages yet</Text>
              <Text style={styles.noMessagesSubtext}>
                Our support team will respond to your ticket soon
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.whatsappActionButton} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappActionText}>Chat on WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.callActionButton}
            onPress={() => Linking.openURL(`tel:${whatsappNumber}`)}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callActionText}>Call Support</Text>
          </TouchableOpacity>
        </View>

        {/* Message Input (only if ticket is open or in progress) */}
        {(ticket.status === 'open' || ticket.status === 'in_progress') && (
          <View style={styles.messageInputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
                editable={!sendingMessage}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.inputCounter}>
              {newMessage.length}/1000
            </Text>
          </View>
        )}

        {/* Closed Ticket Notice */}
        {(ticket.status === 'resolved' || ticket.status === 'closed') && (
          <View style={styles.closedNoticeContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <View style={styles.closedNoticeText}>
              <Text style={styles.closedNoticeTitle}>
                Ticket {ticket.status === 'resolved' ? 'Resolved' : 'Closed'}
              </Text>
              <Text style={styles.closedNoticeSubtitle}>
                {ticket.status === 'resolved' 
                  ? 'This ticket has been marked as resolved. If you need further assistance, please contact support.'
                  : 'This ticket has been closed. For new issues, please create a new ticket.'
                }
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  ticketId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  whatsappButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ticketInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  ticketMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginLeft: 20,
  },
  adminMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    marginRight: 20,
    backgroundColor: '#f0fff0',
  },
  originalMessage: {
    borderLeftColor: '#FF9500',
    backgroundColor: '#fff8f0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  originalMessageBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  originalMessageText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  noMessagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMessagesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  noMessagesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  whatsappActionButton: {
    flex: 1,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  whatsappActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  callActionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  callActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  inputCounter: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  closedNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff0',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  closedNoticeText: {
    flex: 1,
    marginLeft: 12,
  },
  closedNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  closedNoticeSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});