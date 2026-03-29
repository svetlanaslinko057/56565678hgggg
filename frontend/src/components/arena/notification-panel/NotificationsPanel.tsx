'use client';

import React, { useEffect, useState, useCallback } from "react";
import {
  NotificationsOverlay,
  NotificationsPanel,
  NotificationsHeader,
  NotificationsTitle,
  MarkAllReadButton,
  NotificationsList,
  NotificationItem,
  NotificationIcon,
  NotificationContent,
  NotificationTitle,
  NotificationDescription,
  NotificationMeta,
  NotificationStatus,
  NotificationTime,
  NotificationActions,
  ActionButton,
  ViewDetailsButton,
  CloseNotificationButton,
  ClearAllButton,
  NotificationStats,
  StatItem,
} from "./NotificationsPanel.styles";
import { X, Check } from "lucide-react";
import SwordsIcon from "@/global/Icons/Swords";
import ArenaTabIcon from "@/global/Icons/ArenaTabIcon";
import { DuelChallengeModal } from "../duel-challenge-modal/DuelChallengeModal";
import { PredictionDetailsModal } from "../prediction-details-modal/PredictionDetailsModal";
import { NotificationsAPI } from "@/lib/api/arena";
import { useArena } from "@/lib/api/ArenaContext";

interface Notification {
  id: string;
  type: "duel_request" | "prediction_lost" | "prediction_won" | "position_update" | "system";
  title: string;
  description: string | React.ReactNode;
  status: string;
  time: string;
  isUnread: boolean;
  stats?: {
    loss?: string;
    payout?: string;
    xp: string;
  };
  details?: string;
  challenge?: {
    challengerName: string;
    challengerAvatar: string;
    market: string;
    challengerSide: "yes" | "no";
    yourSide: "yes" | "no";
    stake: number;
    expiresIn: string;
  };
  predictionDetails?: {
    title: string;
    betId: string;
    placedDate: string;
    status: "won" | "lost";
    position: string;
    side: "yes" | "no";
    stakeAmount: number;
    odds: string;
    profit?: number;
    loss?: number;
    payout?: number;
    xpEarned: string;
    totalVolume: string;
    yourShare: string;
    yesVotes?: string;
    noVotes?: string;
    marketResolvedDate: string;
    resolutionText: string;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to format time ago
function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Map API notification to component format
function mapNotification(n: any): Notification {
  const type = n.type || 'system';
  let mappedType: Notification['type'] = 'system';
  let status = 'Info';
  let stats: Notification['stats'] | undefined;
  let description: string | React.ReactNode = n.message || n.body || '';
  
  // Determine type and status
  if (type.includes('duel') || type.includes('challenge')) {
    mappedType = 'duel_request';
    status = 'Pending';
  } else if (type.includes('won') || type.includes('win')) {
    mappedType = 'prediction_won';
    status = 'Won';
    stats = {
      payout: n.amount ? `+${n.amount} USDT` : undefined,
      xp: n.xp ? `+${n.xp}` : '+10',
    };
  } else if (type.includes('lost') || type.includes('loss')) {
    mappedType = 'prediction_lost';
    status = 'Lost';
    stats = {
      loss: n.amount ? `-${n.amount} USDT` : undefined,
      xp: '+1',
    };
  } else if (type.includes('position')) {
    mappedType = 'position_update';
    status = 'Update';
  }
  
  // Build description with strong tags
  if (n.marketTitle) {
    description = (
      <>
        {n.message || 'Update on'} <strong>"{n.marketTitle}"</strong>
      </>
    );
  }
  
  return {
    id: n._id || n.id || String(Date.now()),
    type: mappedType,
    title: n.title || (mappedType === 'duel_request' ? 'New duel request' : 
                       mappedType === 'prediction_won' ? 'Prediction won' :
                       mappedType === 'prediction_lost' ? 'Prediction lost' : 'Notification'),
    description,
    status,
    time: timeAgo(n.createdAt || n.timestamp || new Date()),
    isUnread: !n.read,
    stats,
    details: n.details,
    challenge: n.duelData ? {
      challengerName: n.duelData.challengerName || 'Unknown',
      challengerAvatar: n.duelData.challengerAvatar || '/images/default-avatar.png',
      market: n.duelData.market || n.marketTitle || 'Market',
      challengerSide: n.duelData.challengerSide || 'yes',
      yourSide: n.duelData.yourSide || 'no',
      stake: n.duelData.stake || 0,
      expiresIn: n.duelData.expiresIn || '24 hours',
    } : undefined,
    predictionDetails: n.positionData ? {
      title: n.marketTitle || 'Prediction',
      betId: n.positionId || '#000',
      placedDate: n.positionData.placedDate || 'Unknown',
      status: mappedType === 'prediction_won' ? 'won' : 'lost',
      position: n.positionData.position || '',
      side: n.positionData.side || 'yes',
      stakeAmount: n.positionData.stake || 0,
      odds: n.positionData.odds || '2.0x',
      profit: mappedType === 'prediction_won' ? n.amount : undefined,
      loss: mappedType === 'prediction_lost' ? n.amount : undefined,
      payout: n.positionData.payout,
      xpEarned: stats?.xp || '+1 XP',
      totalVolume: n.positionData.totalVolume || '0 USDT',
      yourShare: n.positionData.yourShare || '0%',
      marketResolvedDate: n.positionData.resolvedDate || 'Unknown',
      resolutionText: n.positionData.resolutionText || 'Market resolved',
    } : undefined,
  };
}

export const NotificationsPanelComponent: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { refreshNotifications, isConnected } = useArena();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Notification["challenge"] | null>(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Notification["predictionDetails"] | null>(null);

  // Fetch notifications for any authenticated user (demo or wallet)
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await NotificationsAPI.getNotifications({ limit: 20 });
      setNotifications(result.data.map(mapNotification));
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
    
    // API call
    try {
      await NotificationsAPI.markAsRead(id);
      refreshNotifications();
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    
    // API call
    try {
      await NotificationsAPI.markAllAsRead();
      refreshNotifications();
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  }, [refreshNotifications]);

  const handleViewChallengeDetails = (challenge: Notification["challenge"]) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setIsChallengeModalOpen(true);
    }
  };

  const handleViewPredictionDetails = (predictionDetails: Notification["predictionDetails"]) => {
    if (predictionDetails) {
      setSelectedPrediction(predictionDetails);
      setIsPredictionModalOpen(true);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "duel_request":
        return (
          <NotificationIcon $variant="info">
            <SwordsIcon size={20} color="#0ea5e9" />
          </NotificationIcon>
        );
      case "prediction_lost":
        return (
          <NotificationIcon $variant="danger">
            <X size={20} />
          </NotificationIcon>
        );
      case "prediction_won":
        return (
          <NotificationIcon $variant="success">
            <Check size={20} />
          </NotificationIcon>
        );
      default:
        return (
          <NotificationIcon $variant="info">
            <Check size={20} />
          </NotificationIcon>
        );
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("#notifications-panel") === null &&
        target.closest("#notifications-button") === null
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Mobile: mark notifications as read when they scroll into view
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth <= 640;
    if (!isMobile) return;

    const items = document.querySelectorAll("[data-notification-id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-notification-id");
            if (id) markAsRead(id);
          }
        });
      },
      { threshold: 0.6 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [isOpen, markAsRead]);

  return (
    <>
      {isOpen && (
        <>
          <NotificationsOverlay onClick={onClose} />
          <NotificationsPanel id="notifications-panel">
            <NotificationsHeader>
              <NotificationsTitle>Notifications</NotificationsTitle>
              <MarkAllReadButton onClick={markAllAsRead}>Mark all read</MarkAllReadButton>
            </NotificationsHeader>

            <NotificationsList>
              {loading ? (
                <div style={{ padding: 20, textAlign: "center", color: "#738094" }}>
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#738094" }}>
                  {isConnected ? "No notifications yet" : "Connect wallet to see notifications"}
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    $isUnread={notification.isUnread}
                    data-notification-id={notification.id}
                    onMouseEnter={() =>
                      notification.isUnread && markAsRead(notification.id)
                    }
                  >
                    <CloseNotificationButton>
                      <X size={20} color="#738094" />
                    </CloseNotificationButton>

                    {getNotificationIcon(notification.type)}

                    <NotificationContent>
                      <NotificationTitle>{notification.title}</NotificationTitle>
                      <NotificationDescription>
                        {notification.description}
                      </NotificationDescription>

                      {notification.stats && (
                        <NotificationStats>
                          {notification.stats.loss && (
                            <StatItem $variant="danger">
                              Loss: <strong>{notification.stats.loss}</strong>
                            </StatItem>
                          )}
                          {notification.stats.payout && (
                            <StatItem $variant="success">
                              Payout: <strong>{notification.stats.payout}</strong>
                            </StatItem>
                          )}
                          <StatItem $variant="success">
                            XP earned: <strong>{notification.stats.xp}</strong>
                          </StatItem>
                        </NotificationStats>
                      )}

                      {notification.details && (
                        <NotificationDescription style={{ marginTop: "8px" }}>
                          {notification.details}
                        </NotificationDescription>
                      )}

                      <NotificationMeta>
                        <NotificationStatus
                          $variant={notification.status.toLowerCase()}
                        >
                          {notification.status}
                        </NotificationStatus>
                        <NotificationTime>{notification.time}</NotificationTime>
                      </NotificationMeta>

                      <NotificationActions>
                        {notification.type === "duel_request" ? (
                          <>
                            <ActionButton>
                              <Check size={12} />
                              Accept
                            </ActionButton>
                            <ActionButton className="decline">
                              <X size={12} />
                              Decline
                            </ActionButton>
                            <ViewDetailsButton
                              onClick={() => {
                                onClose();
                                handleViewChallengeDetails(notification.challenge);
                              }}
                            >
                              View details
                            </ViewDetailsButton>
                          </>
                        ) : (
                          <>
                            <ActionButton>
                              <ArenaTabIcon color="#ffffff" />
                              Try again
                            </ActionButton>
                            <ViewDetailsButton
                              onClick={() => {
                                onClose();
                                handleViewPredictionDetails(notification.predictionDetails);
                              }}
                            >
                              View details
                            </ViewDetailsButton>
                          </>
                        )}
                      </NotificationActions>
                    </NotificationContent>
                  </NotificationItem>
                ))
              )}
            </NotificationsList>

            <ClearAllButton>Clear all notifications</ClearAllButton>
          </NotificationsPanel>
        </>
      )}

      {selectedChallenge && (
        <DuelChallengeModal
          isOpen={isChallengeModalOpen}
          onClose={() => {
            setIsChallengeModalOpen(false);
            setSelectedChallenge(null);
          }}
          challenge={selectedChallenge}
        />
      )}

      {selectedPrediction && (
        <PredictionDetailsModal
          isOpen={isPredictionModalOpen}
          onClose={() => {
            setIsPredictionModalOpen(false);
            setSelectedPrediction(null);
          }}
          prediction={selectedPrediction}
        />
      )}
    </>
  );
};
