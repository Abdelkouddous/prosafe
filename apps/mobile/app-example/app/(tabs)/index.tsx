import { Image, StyleSheet, Platform, View, Text, FlatList, ActivityIndicator, Button } from 'react-native'; // Added View, Text, FlatList, ActivityIndicator, Button
import React, { useEffect, useState } from 'react'; // Added React, useEffect, useState

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { fetchMyMessages } from '../services/api'; // Import fetchMyMessages
import { useRouter } from 'expo-router';

interface Message {
  id: number;
  subject: string;
  content: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  created_at: string;
  is_urgent: boolean;
  // Add other message properties if needed
}

export default function HomeScreen() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (user && token) {
      setLoadingMessages(true);
      fetchMyMessages()
        .then(data => {
          setMessages(data || []);
        })
        .catch(error => {
          console.error('Failed to fetch messages for dashboard:', error);
          // Potentially handle token expiry or other errors by logging out
          if (error.response && error.response.status === 401) {
            logout();
          }
        })
        .finally(() => {
          setLoadingMessages(false);
        });
    }
  }, [user, token, logout]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading session...</ThemedText>
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // User is logged in, show dashboard
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }} // Different color for logged-in state
      headerImage={
        <ThemedView style={styles.headerImageView}> 
            <ThemedText type="title" style={styles.headerText}>Dashboard</ThemedText>
        </ThemedView>
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">Welcome, {user.firstName || user.email}!</ThemedText>
        <Button title="Logout" onPress={logout} />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Admin Messages</ThemedText>
        {loadingMessages ? (
          <ActivityIndicator />
        ) : messages.length > 0 ? (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.messageItemContainer}>
                <ThemedText type="defaultSemiBold">{item.subject}</ThemedText>
                <ThemedText>{item.content}</ThemedText>
                <ThemedText style={styles.messageMeta}>
                  From: {item.sender.firstName} {item.sender.lastName} - {new Date(item.created_at).toLocaleString()}
                </ThemedText>
                {item.is_urgent && <ThemedText style={styles.urgentText}>URGENT</ThemedText>}
              </View>
            )}
          />
        ) : (
          <ThemedText>No messages from admin at the moment.</ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Adjusted for logout button
    gap: 8,
    paddingHorizontal: 16, // Added padding
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16, // Added padding
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  centeredContainer: { // For loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageItemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    marginBottom: 5,
    borderRadius: 5,
  },
  messageMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  urgentText: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 3,
  },
  headerImageView: { // Style for the header when logged in
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2', // Example background color
  },
  headerText: {
    color: 'white',
    fontSize: 24,
  }
});
