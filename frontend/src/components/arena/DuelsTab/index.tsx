'use client';

import React, { useState, useEffect, useCallback } from "react";
import {
  DuelsContainer,
  DuelsListWrapper,
  DuelsSummaryCard,
  SummaryHeader,
  ActiveDuelsCard,
  ActiveDuelsNumber,
  ActiveDuelsLabel,
  ActiveDuelsStatus,
  StatsRow,
  StatItem,
  SummarySection,
  SectionTitle,
  RivalsList,
  RivalItem,
  RivalStats,
  RivalStat,
  WinRateSection,
  WinRateLabel,
  WinRateBar,
  WinRateFill,
  DuelsNote,
  HostName,
  DuelsHistorySection,
  HistoryHeader,
  HistoryTabs,
  HistoryTab,
  HistoryList,
  HistoryItem,
  HistoryStatusBadge,
  HistoryContent,
  HistoryTitle,
  HistoryDetails,
  HistorySide,
  HistoryOpponent,
  HistoryResult,
  HistoryStatus,
} from "./styles";
import UserAvatar from "@/global/common/UserAvatar";
import Pagination from "@/global/Pagintaion";
import { DuelCard } from "./DuelCard";
import UserHoverCard from "../UserHoverCard";
import { HostInfo } from "./DuelCard.styles";
import SwordsIcon from "@/global/Icons/Swords";
import LeaguesTabIcon from "@/global/Icons/LeaguesTabIcon";
import { QuickTipsSection } from "../arena-tab/styles";
import { DuelDetailsModal } from "./DuelDetailsModal";
import { DuelsAPI } from "@/lib/api/arena";
import { useArena } from "@/lib/api/ArenaContext";

interface Duel {
  id: string;
  side: "yes" | "no";
  isHighStakes: boolean;
  title: string;
  hostName: string;
  hostAvatar: string;
  stakePerSide: number;
  totalPot: number;
  timeLeft: string;
  status: "ends-soon" | "slot-free" | "no-slots";
  availableActions: ("join-yes" | "join-no" | "yes" | "no")[];
}

interface DuelHistory {
  id: string;
  status: "won" | "lost" | "active" | "pending" | "declined" | "cancelled";
  title: string;
  yourSide: "yes" | "no";
  opponentName: string;
  opponentAvatar: string;
  stake: number;
  result?: number;
  statusText?: string;
  duelId?: string;
  createdDate?: string;
  startedDate?: string;
  settledDate?: string;
  resolutionText?: string;
  isYouHost?: boolean;
  opponentSide?: "yes" | "no";
}

interface Rival {
  name: string;
  avatar: string;
  streakWins: number;
  losses: number;
}

interface DuelSummary {
  activeDuels: number;
  totalWins: number;
  totalLosses: number;
  bestStreak: number;
  winRate: number;
}

// Helper to calculate time remaining
function getTimeLeft(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return "Expired";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Map API duel to card format
function mapDuelToCard(duel: any): Duel {
  const timeLeft = duel.expiresAt ? getTimeLeft(duel.expiresAt) : "24h";
  const isHighStakes = duel.stakeAmount >= 500;
  
  // Determine status
  let status: "ends-soon" | "slot-free" | "no-slots" = "slot-free";
  if (duel.status === 'active' || duel.status === 'finished') {
    status = "no-slots";
  } else if (timeLeft.includes("m") || (timeLeft.includes("h") && parseInt(timeLeft) < 3)) {
    status = "ends-soon";
  }
  
  // Determine available actions
  let availableActions: ("join-yes" | "join-no" | "yes" | "no")[] = [];
  if (duel.status === 'pending') {
    if (duel.creatorSide === 'yes') {
      availableActions = ["join-no"];
    } else {
      availableActions = ["join-yes"];
    }
  } else if (duel.status === 'active') {
    availableActions = ["yes", "no"];
  }
  
  return {
    id: duel._id || duel.id,
    side: duel.creatorSide || "yes",
    isHighStakes,
    title: duel.predictionTitle || duel.marketTitle || "Market Prediction",
    hostName: duel.creatorUsername || `${duel.creatorWallet?.slice(0, 6)}...${duel.creatorWallet?.slice(-4)}`,
    hostAvatar: duel.creatorAvatar || "/images/default-avatar.png",
    stakePerSide: duel.stakeAmount || 0,
    totalPot: duel.totalPot || (duel.stakeAmount * 2) || 0,
    timeLeft,
    status,
    availableActions,
  };
}

// Map API duel history to history format
function mapDuelToHistory(duel: any, myWallet: string | null): DuelHistory {
  const isCreator = duel.creatorWallet === myWallet;
  const yourSide = isCreator ? duel.creatorSide : duel.opponentSide || (duel.creatorSide === 'yes' ? 'no' : 'yes');
  const opponentWallet = isCreator ? duel.opponentWallet : duel.creatorWallet;
  const opponentName = isCreator 
    ? (duel.opponentUsername || `${opponentWallet?.slice(0, 6)}...${opponentWallet?.slice(-4)}`)
    : (duel.creatorUsername || `${opponentWallet?.slice(0, 6)}...${opponentWallet?.slice(-4)}`);
  
  // Determine status and result
  let status: DuelHistory['status'] = 'pending';
  let result: number | undefined;
  
  if (duel.status === 'finished') {
    const isWinner = duel.winnerWallet === myWallet;
    status = isWinner ? 'won' : 'lost';
    result = isWinner ? duel.stakeAmount : -duel.stakeAmount;
  } else if (duel.status === 'active') {
    status = 'active';
  } else if (duel.status === 'canceled') {
    status = 'cancelled';
  } else if (duel.status === 'declined') {
    status = 'declined';
  }
  
  return {
    id: duel._id || duel.id,
    status,
    title: duel.predictionTitle || duel.marketTitle || "Market Prediction",
    yourSide: yourSide || 'yes',
    opponentName: opponentName || "Unknown",
    opponentAvatar: duel.opponentAvatar || "/images/default-avatar.png",
    stake: duel.stakeAmount || 0,
    result,
    duelId: duel._id || duel.id,
    createdDate: duel.createdAt ? new Date(duel.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined,
    startedDate: duel.startedAt ? new Date(duel.startedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined,
    settledDate: duel.resolvedAt ? new Date(duel.resolvedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : undefined,
    isYouHost: isCreator,
    opponentSide: yourSide === 'yes' ? 'no' : 'yes',
  };
}

export const DuelsTab: React.FC = () => {
  const { currentWallet } = useArena();
  const [historyTab, setHistoryTab] = useState<"all" | "active" | "settled">("all");
  const [selectedDuel, setSelectedDuel] = useState<DuelHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data state
  const [duelsList, setDuelsList] = useState<Duel[]>([]);
  const [duelsHistory, setDuelsHistory] = useState<DuelHistory[]>([]);
  const [topRivals, setTopRivals] = useState<Rival[]>([]);
  const [summary, setSummary] = useState<DuelSummary>({
    activeDuels: 0,
    totalWins: 0,
    totalLosses: 0,
    bestStreak: 0,
    winRate: 0,
  });
  
  // Loading states
  const [loadingDuels, setLoadingDuels] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Pagination
  const [duelsPage, setDuelsPage] = useState(1);
  const [duelsTotal, setDuelsTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  
  const DUELS_PER_PAGE = 6;
  const HISTORY_PER_PAGE = 6;

  // Fetch open duels
  const fetchDuels = useCallback(async () => {
    setLoadingDuels(true);
    try {
      const data = await DuelsAPI.getOpenDuels(20);
      setDuelsList(data.map(mapDuelToCard));
      setDuelsTotal(data.length);
    } catch (e) {
      console.error("Failed to fetch duels:", e);
    } finally {
      setLoadingDuels(false);
    }
  }, []);

  // Fetch duel history
  const fetchHistory = useCallback(async () => {
    if (!currentWallet) {
      setLoadingHistory(false);
      return;
    }
    
    setLoadingHistory(true);
    try {
      const data = await DuelsAPI.getDuelHistory(currentWallet, 20);
      setDuelsHistory(data.map((d: any) => mapDuelToHistory(d, currentWallet)));
      setHistoryTotal(data.length);
    } catch (e) {
      console.error("Failed to fetch duel history:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentWallet]);

  // Fetch summary and rivals
  const fetchSummaryAndRivals = useCallback(async () => {
    if (!currentWallet) return;
    
    try {
      const [summaryData, rivalsData] = await Promise.all([
        DuelsAPI.getDuelSummary(currentWallet),
        DuelsAPI.getTopRivals(currentWallet, 3),
      ]);
      
      setSummary({
        activeDuels: summaryData.activeDuels || 0,
        totalWins: summaryData.wins || 0,
        totalLosses: summaryData.losses || 0,
        bestStreak: summaryData.bestStreak || 0,
        winRate: summaryData.winRate || 0,
      });
      
      setTopRivals(rivalsData.map((r: any) => ({
        name: r.username || `${r.wallet?.slice(0, 6)}...${r.wallet?.slice(-4)}`,
        avatar: r.avatar || "/images/default-avatar.png",
        streakWins: r.wins || 0,
        losses: r.losses || 0,
      })));
    } catch (e) {
      console.error("Failed to fetch summary/rivals:", e);
    }
  }, [currentWallet]);

  // Initial load
  useEffect(() => {
    fetchDuels();
    fetchHistory();
    fetchSummaryAndRivals();
  }, [fetchDuels, fetchHistory, fetchSummaryAndRivals]);

  const handleDuelClick = (duel: DuelHistory) => {
    setSelectedDuel(duel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDuel(null);
  };

  // Filter history by tab
  const filteredHistory = duelsHistory.filter((item) => {
    if (historyTab === "active") return item.status === "active" || item.status === "pending";
    if (historyTab === "settled") return item.status === "won" || item.status === "lost";
    return true;
  });

  // Paginated duels
  const paginatedDuels = duelsList.slice(
    (duelsPage - 1) * DUELS_PER_PAGE,
    duelsPage * DUELS_PER_PAGE
  );
  
  // Paginated history
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * HISTORY_PER_PAGE,
    historyPage * HISTORY_PER_PAGE
  );

  return (
    <DuelsContainer>
      <div className="container">
        <DuelsListWrapper>
          {loadingDuels ? (
            <div style={{ padding: 40, textAlign: "center", color: "#738094" }}>
              Loading duels...
            </div>
          ) : duelsList.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#738094" }}>
              No open duels available. Create one!
            </div>
          ) : (
            paginatedDuels.map((duel) => (
              <DuelCard
                key={duel.id}
                side={duel.side}
                isHighStakes={duel.isHighStakes}
                title={duel.title}
                hostName={duel.hostName}
                hostAvatar={duel.hostAvatar}
                stakePerSide={duel.stakePerSide}
                totalPot={duel.totalPot}
                timeLeft={duel.timeLeft}
                status={duel.status}
                availableActions={duel.availableActions}
              />
            ))
          )}

          {duelsTotal > DUELS_PER_PAGE && (
            <Pagination
              page={duelsPage}
              totalPage={Math.ceil(duelsTotal / DUELS_PER_PAGE)}
              onChange={setDuelsPage}
              limit={DUELS_PER_PAGE}
              total={duelsTotal}
            />
          )}
        </DuelsListWrapper>

        <DuelsHistorySection>
          <HistoryHeader>
            <h2>Duels History</h2>
            <HistoryTabs>
              <HistoryTab
                $active={historyTab === "all"}
                onClick={() => setHistoryTab("all")}
              >
                All
              </HistoryTab>
              <HistoryTab
                $active={historyTab === "active"}
                onClick={() => setHistoryTab("active")}
              >
                Active
              </HistoryTab>
              <HistoryTab
                $active={historyTab === "settled"}
                onClick={() => setHistoryTab("settled")}
              >
                Settled
              </HistoryTab>
            </HistoryTabs>
          </HistoryHeader>

          <HistoryList>
            {loadingHistory ? (
              <div style={{ padding: 20, textAlign: "center", color: "#738094" }}>
                Loading history...
              </div>
            ) : !currentWallet ? (
              <div style={{ padding: 20, textAlign: "center", color: "#738094" }}>
                Connect wallet to see your duel history
              </div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#738094" }}>
                No duel history yet
              </div>
            ) : (
              paginatedHistory.map((item) => (
                <HistoryItem key={item.id} onClick={() => handleDuelClick(item)}>
                  <HistoryStatusBadge $status={item.status}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </HistoryStatusBadge>

                  <HistoryContent>
                    <HistoryTitle>{item.title}</HistoryTitle>
                    <HistoryDetails>
                      <span>
                        You:{" "}
                        <HistorySide $side={item.yourSide}>
                          {item.yourSide.charAt(0).toUpperCase() + item.yourSide.slice(1)}
                        </HistorySide>
                      </span>
                      <span className="divider" />
                      <UserHoverCard
                        userName={item.opponentName}
                        userAvatar={item.opponentAvatar}
                      >
                        <HistoryOpponent>
                          <UserAvatar
                            avatar={item.opponentAvatar}
                            size="xxSmall"
                            variant="default"
                          />
                          <span>{item.opponentName}</span>
                        </HistoryOpponent>
                      </UserHoverCard>
                      <span className="divider" />
                      <span>{item.stake} USDT each</span>
                    </HistoryDetails>
                  </HistoryContent>

                  {item.result !== undefined ? (
                    <HistoryResult $isPositive={item.result > 0}>
                      {item.result > 0 ? "+" : ""}
                      {item.result} USDT
                    </HistoryResult>
                  ) : item.status === "active" ? (
                    <HistoryStatus>In progress</HistoryStatus>
                  ) : null}
                </HistoryItem>
              ))
            )}
          </HistoryList>

          {filteredHistory.length > HISTORY_PER_PAGE && (
            <Pagination
              page={historyPage}
              totalPage={Math.ceil(filteredHistory.length / HISTORY_PER_PAGE)}
              onChange={setHistoryPage}
              limit={HISTORY_PER_PAGE}
              total={filteredHistory.length}
            />
          )}
        </DuelsHistorySection>
      </div>
      
      <div
        style={{
          position: "sticky",
          top: "20px",
          height: "fit-content",
        }}
      >
        <DuelsSummaryCard>
          <SummaryHeader>
            <SwordsIcon />
            <h3>Duels Summary</h3>
          </SummaryHeader>

          <ActiveDuelsCard>
            <ActiveDuelsNumber data-testid="active-duels-count">
              {summary.activeDuels}
            </ActiveDuelsNumber>
            <ActiveDuelsLabel>Active Duels</ActiveDuelsLabel>
            <ActiveDuelsStatus>In Progress</ActiveDuelsStatus>
          </ActiveDuelsCard>

          <StatsRow>
            <StatItem>
              <div className="value" data-testid="total-wins">{summary.totalWins}</div>
              <div className="label">Total Wins</div>
            </StatItem>
            <StatItem className="red">
              <div className="value" data-testid="total-losses">{summary.totalLosses}</div>
              <div className="label">Total Losses</div>
            </StatItem>
            <StatItem>
              <div className="value" data-testid="best-streak">{summary.bestStreak} wins</div>
              <div className="label">Best Streak</div>
            </StatItem>
          </StatsRow>

          <SummarySection>
            <SectionTitle>
              <LeaguesTabIcon size={24} color="#05A584" />
              Top Rivals
            </SectionTitle>
            <RivalsList>
              {topRivals.length === 0 ? (
                <div style={{ padding: 10, textAlign: "center", color: "#738094", fontSize: 14 }}>
                  No rivals yet
                </div>
              ) : (
                topRivals.map((rival, index) => (
                  <RivalItem key={index}>
                    <UserHoverCard
                      userName={rival.name}
                      userAvatar={rival.avatar}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <UserAvatar
                          avatar={rival.avatar}
                          size="otc"
                          variant="default"
                        />
                        <HostInfo>
                          <HostName>{rival.name}</HostName>
                        </HostInfo>
                      </div>
                    </UserHoverCard>
                    <RivalStats>
                      <RivalStat $variant="success">
                        {rival.streakWins}W
                      </RivalStat>
                      <RivalStat $variant="danger">{rival.losses}L</RivalStat>
                    </RivalStats>
                  </RivalItem>
                ))
              )}
            </RivalsList>
          </SummarySection>

          <WinRateSection>
            <WinRateLabel>
              <span className="label">Win Rate</span>
              <span className="value">{summary.winRate}%</span>
            </WinRateLabel>
            <WinRateBar>
              <WinRateFill $percentage={summary.winRate} />
            </WinRateBar>
          </WinRateSection>

          <DuelsNote>
            Only equal-stake, same-market duels count towards your record.
          </DuelsNote>
        </DuelsSummaryCard>
        
        <QuickTipsSection>
          <h4>Quick Tips</h4>
          <ul>
            <li>Higher stakes in duels mean bigger rewards</li>
            <li>Follow top analysts to learn winning strategies</li>
            <li>Consistent accuracy beats high ROI on single bets</li>
            <li>Challenge rivals to climb the leaderboard faster</li>
          </ul>
        </QuickTipsSection>
      </div>

      {selectedDuel && (
        <DuelDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          duel={{
            id: parseInt(selectedDuel.id) || 0,
            status: selectedDuel.status,
            title: selectedDuel.title,
            duelId: selectedDuel.duelId || selectedDuel.id,
            createdDate: selectedDuel.createdDate || "Unknown",
            yourSide: selectedDuel.yourSide,
            yourStake: selectedDuel.stake,
            yourResult: selectedDuel.result,
            opponentName: selectedDuel.opponentName,
            opponentAvatar: selectedDuel.opponentAvatar,
            opponentSide: selectedDuel.opponentSide || (selectedDuel.yourSide === "yes" ? "no" : "yes"),
            opponentStake: selectedDuel.stake,
            opponentResult: selectedDuel.result !== undefined ? -selectedDuel.result : undefined,
            totalPot: selectedDuel.stake * 2,
            startedDate: selectedDuel.startedDate || "Unknown",
            settledDate: selectedDuel.settledDate,
            resolutionText: selectedDuel.resolutionText,
            isYouHost: selectedDuel.isYouHost || false,
          }}
        />
      )}
    </DuelsContainer>
  );
};
