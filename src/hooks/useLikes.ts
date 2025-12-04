import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { LikeTargetType } from '@/types';

interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

export function useLikes() {
  const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});

  /**
   * Toggle like on a target (optimistic update)
   */
  const toggleLike = useCallback(
    async (
      targetType: LikeTargetType,
      targetId: string,
      currentState?: LikeState
    ): Promise<LikeState> => {
      // Prevent double-clicking
      if (isToggling[targetId]) {
        return currentState || { isLiked: false, likeCount: 0 };
      }

      setIsToggling((prev) => ({ ...prev, [targetId]: true }));

      // Optimistic update
      const previousState = currentState || likeStates[targetId] || {
        isLiked: false,
        likeCount: 0,
      };
      const optimisticState: LikeState = {
        isLiked: !previousState.isLiked,
        likeCount: previousState.isLiked
          ? Math.max(0, previousState.likeCount - 1)
          : previousState.likeCount + 1,
      };

      setLikeStates((prev) => ({ ...prev, [targetId]: optimisticState }));

      try {
        const response = await api.post('/likes/toggle', {
          targetType,
          targetId,
        });

        const newState: LikeState = {
          isLiked: response.data.isLiked,
          likeCount: response.data.likeCount,
        };

        setLikeStates((prev) => ({ ...prev, [targetId]: newState }));
        return newState;
      } catch (error) {
        // Revert on error
        setLikeStates((prev) => ({ ...prev, [targetId]: previousState }));
        console.error('Failed to toggle like:', error);
        return previousState;
      } finally {
        setIsToggling((prev) => ({ ...prev, [targetId]: false }));
      }
    },
    [isToggling, likeStates]
  );

  /**
   * Check if user liked a single target
   */
  const checkLiked = useCallback(
    async (
      targetType: LikeTargetType,
      targetId: string
    ): Promise<boolean> => {
      try {
        const response = await api.get(
          `/likes/check/${targetType}/${targetId}`
        );
        return response.data.isLiked;
      } catch (error) {
        console.error('Failed to check liked status:', error);
        return false;
      }
    },
    []
  );

  /**
   * Check multiple targets at once (batch)
   */
  const checkLikedBatch = useCallback(
    async (
      targetType: LikeTargetType,
      targetIds: string[]
    ): Promise<Record<string, LikeState>> => {
      if (targetIds.length === 0) return {};

      try {
        const response = await api.post('/likes/check-batch', {
          targetType,
          targetIds,
        });

        // Update local state
        setLikeStates((prev) => ({ ...prev, ...response.data }));

        return response.data;
      } catch (error) {
        console.error('Failed to check liked batch:', error);
        return {};
      }
    },
    []
  );

  /**
   * Get like count for a target
   */
  const getLikeCount = useCallback(
    async (targetType: LikeTargetType, targetId: string): Promise<number> => {
      try {
        const response = await api.get(
          `/likes/count/${targetType}/${targetId}`
        );
        return response.data.count;
      } catch (error) {
        console.error('Failed to get like count:', error);
        return 0;
      }
    },
    []
  );

  /**
   * Get current like state from local cache
   */
  const getLikeState = useCallback(
    (targetId: string): LikeState | undefined => {
      return likeStates[targetId];
    },
    [likeStates]
  );

  /**
   * Initialize like states from server data
   */
  const initializeLikeStates = useCallback(
    (states: Record<string, LikeState>) => {
      setLikeStates((prev) => ({ ...prev, ...states }));
    },
    []
  );

  return {
    toggleLike,
    checkLiked,
    checkLikedBatch,
    getLikeCount,
    getLikeState,
    initializeLikeStates,
    likeStates,
    isToggling,
  };
}
