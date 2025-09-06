import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import friendApi from '../api/friendApi';
import websocketService from '../services/websocketService';
import { Friend, FriendRequest, SearchUser, SendFriendRequestRequest, RespondFriendRequestRequest } from '../types/friend';

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Load friends
  const loadFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await friendApi.getFriends();
      setFriends(data);
    } catch (error: any) {
      console.error('Failed to load friends:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load sent requests
  const loadSentRequests = useCallback(async () => {
    try {
      const data = await friendApi.getSentRequests();
      setSentRequests(data);
    } catch (error: any) {
      console.error('Failed to load sent requests:', error);
      setError(error.message);
    }
  }, []);

  // Load received requests
  const loadReceivedRequests = useCallback(async () => {
    try {
      const data = await friendApi.getReceivedRequests();
      setReceivedRequests(data);
    } catch (error: any) {
      console.error('Failed to load received requests:', error);
      setError(error.message);
    }
  }, []);

  // Load pending count
  const loadPendingCount = useCallback(async () => {
    try {
      const count = await friendApi.countPendingRequests();
      setPendingCount(count);
    } catch (error: any) {
      console.error('Failed to load pending count:', error);
    }
  }, []);

  // Search users to add as friends
  const searchUsers = useCallback(async (query: string): Promise<SearchUser[]> => {
    try {
      setIsLoading(true);
      const data = await friendApi.searchUsersToAddAsFriends(query);
      setSearchResults(data);
      return data;
    } catch (error: any) {
      console.error('Failed to search users:', error);
      setError(error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send friend request
  const sendFriendRequest = useCallback(async (request: SendFriendRequestRequest) => {
    try {
      const newRequest = await friendApi.sendFriendRequest(request);
      setSentRequests(prev => [...prev, newRequest]);
      return newRequest;
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  // Respond to friend request
  const respondToFriendRequest = useCallback(async (request: RespondFriendRequestRequest) => {
    try {
      const updatedRequest = await friendApi.respondToFriendRequest(request);
      
      // Remove from received requests (since it's been processed)
      setReceivedRequests(prev => prev.filter(req => req.id !== request.requestId));

      // If accepted, add to friends list and reload to ensure consistency
      if (request.status === 'accepted') {
        const newFriend = updatedRequest.sender;
        setFriends(prev => [...prev, newFriend]);
        // Reload friends list to ensure consistency
        await loadFriends();
      }

      // Reload sent requests to update the other user's view
      await loadSentRequests();
      // Update pending count
      await loadPendingCount();
      
      return updatedRequest;
    } catch (error: any) {
      console.error('Failed to respond to friend request:', error);
      setError(error.message);
      throw error;
    }
  }, [loadPendingCount, loadFriends, loadSentRequests]);

  // Cancel friend request
  const cancelFriendRequest = useCallback(async (requestId: string) => {
    try {
      await friendApi.cancelFriendRequest(requestId);
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      // Reload received requests to update the other user's view
      await loadReceivedRequests();
      // Reload pending count
      await loadPendingCount();
    } catch (error: any) {
      console.error('Failed to cancel friend request:', error);
      setError(error.message);
    }
  }, [loadReceivedRequests, loadPendingCount]);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await friendApi.removeFriend(friendId);
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error: any) {
      console.error('Failed to remove friend:', error);
      setError(error.message);
    }
  }, []);

  // Search friends
  const searchFriends = useCallback(async (query: string) => {
    try {
      const data = await friendApi.searchFriends(query);
      return data;
    } catch (error: any) {
      console.error('Failed to search friends:', error);
      setError(error.message);
      return [];
    }
  }, []);

  // Check if users are friends
  const areFriends = useCallback(async (friendId: string) => {
    try {
      return await friendApi.areFriends(friendId);
    } catch (error: any) {
      console.error('Failed to check friendship:', error);
      return false;
    }
  }, []);

  // Check if has pending request
  const hasPendingRequest = useCallback(async (userId: string) => {
    try {
      return await friendApi.hasPendingRequest(userId);
    } catch (error: any) {
      console.error('Failed to check pending request:', error);
      return false;
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    if (user?.id) {
      loadFriends();
      loadSentRequests();
      loadReceivedRequests();
      loadPendingCount();

      // Subscribe to friend request events
      const friendRequestHandler = (data: any) => {
        console.log('Friend request event received:', data);
        // Reload all data when friend request events occur
        loadFriends();
        loadSentRequests();
        loadReceivedRequests();
        loadPendingCount();
      };

      websocketService.subscribeToFriendRequests(friendRequestHandler).catch(error => {
        console.error('Failed to subscribe to friend requests:', error);
      });

      // Cleanup subscription on unmount
      return () => {
        // Note: We can't easily track subscription ID here, but it's okay for now
        // In a production app, you'd want to track subscription IDs properly
      };
    }
  }, [user?.id, loadFriends, loadSentRequests, loadReceivedRequests, loadPendingCount]);

  return {
    friends,
    sentRequests,
    receivedRequests,
    searchResults,
    isLoading,
    error,
    pendingCount,
    loadFriends,
    loadSentRequests,
    loadReceivedRequests,
    loadPendingCount,
    searchUsers,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchFriends,
    areFriends,
    hasPendingRequest,
    setError
  };
};
