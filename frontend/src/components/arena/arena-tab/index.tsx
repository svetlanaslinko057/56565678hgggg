'use client';

import React, { useState, useEffect, useCallback } from "react";
import {
  PredictionsGrid,
  SortBar,
  SortLabel,
  SortButton,
  LiveBetsSection,
  LiveBetsHeader,
  LiveBetsList,
  LiveBetCard,
  LiveBetLeft,
  LiveBetInfo,
  LiveBetTitle,
  LiveBetSubtitle,
  LiveBetUserRow,
  LiveBetText,
  LiveBetOdds,
  LiveBetRight,
  InfoBlock,
  LeaderboardSection,
  LeaderboardTabs,
  LeaderboardSearch,
  LeaderboardList,
  LeaderboardRow,
  LeaderboardRank,
  LeaderboardUser,
  LeaderboardName,
  LeaderboardProfit,
  EmptyStateContainer,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateText,
  EmptyStateButton,
  EmptyPredictionsContainer,
} from "./styles";
import PredictionCard from "../prediction-card/PredictionCard";
import Pagination from "@/global/Pagintaion";
import { ArrowRight, Search, ArrowUpDown, Flame, TrendingUp, Clock, BarChart3, Activity, Trophy, Target } from "lucide-react";
import CustomDropdown from "@/UI/CustomDropdown";
import UserAvatar from "@/global/common/UserAvatar";
import UserHoverCard from "../UserHoverCard";
import DiscussionsBlock from "@/global/DiscussionsBlock";
import { TimeButton } from "@/global/common/PriceChart/styles";
import { useRouter } from "next/navigation";
import { MarketsAPI, ActivityAPI, LeaderboardAPI } from "@/lib/api/arena";
import { OnchainMarketsAPI, OnchainMarket, FomoData } from "@/lib/api/onchainApi";
import {
  mapPredictionToCard,
  mapActivityToLiveBet,
  mapLeaderboardEntry,
} from "@/lib/api/mappers";
import { env } from "@/lib/web3/env";

export const filterOptions = [
  { value: "100", label: "$100+" },
  { value: "500", label: "$500+" },
  { value: "1000", label: "$1000+" },
  { value: "5000", label: "$5000+" },
];

export const ArenaTab: React.FC<{
  searchValue?: string;
  sortBy?: string;
  filters?: any;
}> = ({ searchValue, sortBy, filters }) => {
  const router = useRouter();
  const [betFilter, setBetFilter] = React.useState<string>("100");
  const [leaderboardTab, setLeaderboardTab] = React.useState<string>("7D");
  const [leaderboardSort, setLeaderboardSort] = React.useState<"profit" | "volume">("profit");

  // Real data state
  const [predictions, setPredictions] = useState<any[]>([]);
  const [predictionsTotal, setPredictionsTotal] = useState(0);
  const [predictionsPage, setPredictionsPage] = useState(1);
  const [predictionsLoading, setPredictionsLoading] = useState(true);

  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [liveBetsLoading, setLiveBetsLoading] = useState(true);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [lbPage, setLbPage] = useState(1);
  const [lbTotal, setLbTotal] = useState(0);

  const PREDICTIONS_PER_PAGE = 12;

  // Map sort to backend params
  const getSortParams = useCallback(() => {
    const map: Record<string, { sortBy?: string; sortOrder?: 'asc' | 'desc'; status?: string }> = {
      live: { status: 'published' },
      new: { sortBy: 'createdAt', sortOrder: 'desc', status: 'published' },
      trending: { sortBy: 'totalVolume', sortOrder: 'desc', status: 'published' },
      ends_soon: { sortBy: 'closeTime', sortOrder: 'asc', status: 'published' },
      resolved: { status: 'resolved' },
    };
    return map[sortBy || 'live'] || { status: 'published' };
  }, [sortBy]);

  // Map onchain market to prediction card format
  const mapOnchainMarketToCard = (market: OnchainMarket) => ({
    id: String(market.marketId),
    type: "yes-no" as const,
    title: market.question || `Market #${market.marketId}`,
    subtitle: market.status,
    logo: "/images/default-market.png",
    status: market.status === 'active' ? 'Active' : 
            market.status === 'resolved' ? 'Resolved' : 
            market.status === 'locked' ? 'Live' : 'Pending',
    risk: "Medium" as const,
    author: {
      name: "Arena",
      avatar: "/images/default-avatar.png",
    },
    yesNoOptions: [
      { threshold: "YES", percentage: "50%", outcomeId: "1" },
      { threshold: "NO", percentage: "50%", outcomeId: "2" },
    ],
    _raw: {
      marketId: String(market.marketId),
      outcomes: [],
      totalVolume: Number(BigInt(market.totalStaked || '0') / BigInt(10**18)),
      totalBets: market.fomoData?.activity?.totalBets || 0,
      closeTime: market.endTime ? new Date(market.endTime * 1000).toISOString() : '',
      category: 'Crypto',
    },
    fomoData: market.fomoData || null,
  });

  // Current sort mode for onchain markets
  const [onchainSortBy, setOnchainSortBy] = useState<'createdAt' | 'trending' | 'volume' | 'bets'>('trending');

  // Fetch predictions - uses onchain API when enabled
  const fetchPredictions = useCallback(async (page: number) => {
    setPredictionsLoading(true);
    try {
      // Use onchain API when enabled
      if (env.ONCHAIN_ENABLED) {
        const result = await OnchainMarketsAPI.getMarkets({
          page,
          limit: PREDICTIONS_PER_PAGE,
          status: 'active',
          sortBy: onchainSortBy,
          sortOrder: 'desc',
        });
        setPredictions(result.data.map(mapOnchainMarketToCard));
        setPredictionsTotal(result.meta?.total || result.data.length);
      } else {
        // Fallback to off-chain API
        const sortParams = getSortParams();
        const result = await MarketsAPI.getMarkets({
          page,
          limit: PREDICTIONS_PER_PAGE,
          status: sortParams.status || "published",
          search: searchValue || undefined,
          sortBy: sortParams.sortBy,
          sortOrder: sortParams.sortOrder,
          category: filters?.category || undefined,
          riskLevel: filters?.riskLevel || undefined,
          type: filters?.type || undefined,
        });
        setPredictions(result.data.map(mapPredictionToCard));
        setPredictionsTotal(result.total);
      }
    } catch (e) {
      console.error("Failed to fetch predictions:", e);
    } finally {
      setPredictionsLoading(false);
    }
  }, [searchValue, getSortParams, filters, onchainSortBy]);

  // Fetch live bets
  const fetchLiveBets = useCallback(async () => {
    setLiveBetsLoading(true);
    try {
      const data = await ActivityAPI.getLiveActivity(8);
      setLiveBets(data.map(mapActivityToLiveBet));
    } catch (e) {
      console.error("Failed to fetch live bets:", e);
    } finally {
      setLiveBetsLoading(false);
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const result = await LeaderboardAPI.getProfitLeaderboard({ limit: 10 });
      setLeaderboard(result.map(mapLeaderboardEntry));
      setLbTotal(result.length);
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Initial load + refetch on search/sort/filter change
  useEffect(() => {
    setPredictionsPage(1);
    fetchPredictions(1);
    fetchLiveBets();
    fetchLeaderboard();
  }, [fetchPredictions, fetchLiveBets, fetchLeaderboard]);

  // Pagination handlers
  const handlePredictionsPageChange = (page: number) => {
    setPredictionsPage(page);
    fetchPredictions(page);
  };

  const totalPredictionPages = Math.ceil(predictionsTotal / PREDICTIONS_PER_PAGE);

  // Sort options for onchain markets
  const sortOptions = [
    { key: 'trending' as const, label: 'Trending', icon: Flame },
    { key: 'createdAt' as const, label: 'Newest', icon: Clock },
    { key: 'volume' as const, label: 'Volume', icon: BarChart3 },
    { key: 'bets' as const, label: 'Most Bets', icon: TrendingUp },
  ];

  return (
    <>
      {/* Sort Bar - only for onchain mode */}
      {env.ONCHAIN_ENABLED && (
        <SortBar data-testid="sort-bar">
          <SortLabel>Sort by:</SortLabel>
          {sortOptions.map(({ key, label, icon: Icon }) => (
            <SortButton
              key={key}
              $active={onchainSortBy === key}
              onClick={() => setOnchainSortBy(key)}
              data-testid={`sort-${key}`}
            >
              <Icon size={14} />
              {label}
            </SortButton>
          ))}
        </SortBar>
      )}

      {predictionsLoading && predictions.length === 0 ? (
        <PredictionsGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              data-testid={`prediction-skeleton-${i}`}
              style={{
                background: "#f0f2f5",
                borderRadius: 16,
                height: 280,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </PredictionsGrid>
      ) : predictions.length === 0 ? (
        <EmptyPredictionsContainer data-testid="predictions-empty">
          <EmptyStateIcon>
            <Target size={56} strokeWidth={1.5} />
          </EmptyStateIcon>
          <EmptyStateTitle>No Prediction Markets Yet</EmptyStateTitle>
          <EmptyStateText>
            Be a pioneer! Create the first prediction market and let others bet on outcomes.
            <br />
            Markets can cover crypto prices, project launches, events, and more.
          </EmptyStateText>
          <EmptyStateButton onClick={() => {
            const createBtn = document.querySelector('[data-testid="create-market-btn"]') as HTMLButtonElement;
            if (createBtn) createBtn.click();
          }}>
            + Create First Market
          </EmptyStateButton>
        </EmptyPredictionsContainer>
      ) : (
        <PredictionsGrid data-testid="predictions-grid">
          {predictions.map((prediction) => (
            <PredictionCard key={prediction.id} {...prediction} />
          ))}
        </PredictionsGrid>
      )}

      {totalPredictionPages > 1 && (
        <Pagination
          page={predictionsPage}
          totalPage={totalPredictionPages}
          onChange={handlePredictionsPageChange}
          limit={PREDICTIONS_PER_PAGE}
          total={predictionsTotal}
          style={{ marginTop: 20 }}
        />
      )}

      <InfoBlock>
        <LiveBetsSection>
          <LiveBetsHeader>
            <h2>
              <span></span> Live Bets
            </h2>
            <CustomDropdown
              options={filterOptions}
              value={betFilter}
              onChange={(value) => setBetFilter(value as string)}
              placeholder="100+"
              isShowSuccess={false}
              searchable={false}
              className="bet-filter-dropdown"
            />
          </LiveBetsHeader>

          <LiveBetsList data-testid="live-bets-list">
            {liveBetsLoading && liveBets.length === 0 ? (
              <EmptyStateContainer>
                <EmptyStateIcon>
                  <Activity size={48} strokeWidth={1.5} />
                </EmptyStateIcon>
                <EmptyStateTitle>Loading live bets...</EmptyStateTitle>
              </EmptyStateContainer>
            ) : liveBets.length === 0 ? (
              <EmptyStateContainer data-testid="live-bets-empty">
                <EmptyStateIcon>
                  <Activity size={48} strokeWidth={1.5} />
                </EmptyStateIcon>
                <EmptyStateTitle>No Live Bets Yet</EmptyStateTitle>
                <EmptyStateText>
                  Be the first to place a bet on a prediction market!
                  <br />
                  Live bets will appear here in real-time.
                </EmptyStateText>
                <EmptyStateButton onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Explore Markets
                </EmptyStateButton>
              </EmptyStateContainer>
            ) : (
              liveBets
                .filter((bet) => bet.amount >= parseInt(betFilter))
                .map((bet) => (
                  <LiveBetCard key={bet.id} data-testid={`live-bet-${bet.id}`}>
                    <LiveBetLeft>
                      <UserAvatar
                        avatar={bet.icon}
                        size="medium"
                        variant="default"
                        className="image"
                      />
                      <LiveBetInfo>
                        <div className="title">
                          <LiveBetTitle>{bet.project}</LiveBetTitle>
                          {bet.subtitle && (
                            <LiveBetSubtitle>{bet.subtitle}</LiveBetSubtitle>
                          )}
                        </div>
                        <LiveBetUserRow>
                          <UserHoverCard userName={bet.user} userAvatar={bet.icon}>
                            <div className="user">
                              <UserAvatar
                                avatar={bet.icon}
                                size="xxSmall"
                                variant="default"
                              />
                              <p>{bet.user}</p>
                            </div>
                          </UserHoverCard>
                          <LiveBetText>
                            placed ${bet.amount} at{" "}
                            <LiveBetOdds accent={bet.accent as "green" | "red"}>
                              {bet.betLabel}
                            </LiveBetOdds>{" "}
                            (prediction odds {bet.odds})
                          </LiveBetText>
                        </LiveBetUserRow>
                      </LiveBetInfo>
                    </LiveBetLeft>

                    <LiveBetRight>
                      <span className="time">{bet.time}</span>
                      <button onClick={(e) => e.stopPropagation()}>
                        <ArrowRight size={18} color="#738094" />
                      </button>
                    </LiveBetRight>
                  </LiveBetCard>
                ))
            )}
          </LiveBetsList>
        </LiveBetsSection>

        <LeaderboardSection>
          <LiveBetsHeader>
            <h2>Leaderboard</h2>
            <LeaderboardTabs>
              <TimeButton
                active={leaderboardTab === "24H"}
                onClick={() => setLeaderboardTab("24H")}
              >
                24H
              </TimeButton>
              <TimeButton
                active={leaderboardTab === "7D"}
                onClick={() => setLeaderboardTab("7D")}
              >
                7D
              </TimeButton>
              <TimeButton
                active={leaderboardTab === "30D"}
                onClick={() => setLeaderboardTab("30D")}
              >
                30D
              </TimeButton>
              <TimeButton
                active={leaderboardTab === "All"}
                onClick={() => setLeaderboardTab("All")}
              >
                All
              </TimeButton>
            </LeaderboardTabs>
          </LiveBetsHeader>

          <div className="row">
            <LeaderboardSearch>
              <Search color="#738094" />
              <input placeholder="Search by name" />
            </LeaderboardSearch>
            <button
              onClick={() =>
                setLeaderboardSort((prev) =>
                  prev === "profit" ? "volume" : "profit"
                )
              }
              style={{
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "color 0.2s ease",
                background: "none",
                border: "none",
                color: "#728094",
                fontWeight: 600,
                fontSize: "14px",
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#728094")}
            >
              {leaderboardSort === "profit" ? "Profit/Loss" : "Volume"}
              <ArrowUpDown size={14} />
            </button>
          </div>

          <LeaderboardList data-testid="leaderboard-list">
            {leaderboardLoading && leaderboard.length === 0 ? (
              <EmptyStateContainer $small>
                <EmptyStateIcon $small>
                  <Trophy size={36} strokeWidth={1.5} />
                </EmptyStateIcon>
                <EmptyStateTitle $small>Loading leaderboard...</EmptyStateTitle>
              </EmptyStateContainer>
            ) : leaderboard.length === 0 ? (
              <EmptyStateContainer $small data-testid="leaderboard-empty">
                <EmptyStateIcon $small>
                  <Trophy size={36} strokeWidth={1.5} />
                </EmptyStateIcon>
                <EmptyStateTitle $small>No Leaders Yet</EmptyStateTitle>
                <EmptyStateText $small>
                  Start trading to climb the ranks!
                </EmptyStateText>
              </EmptyStateContainer>
            ) : (
              leaderboard.map((item) => (
                <LeaderboardRow key={item.id} data-testid={`leaderboard-row-${item.id}`}>
                  <LeaderboardRank>{item.id}</LeaderboardRank>
                  <UserHoverCard userName={item.name} userAvatar={item.avatar}>
                    <LeaderboardUser>
                      <UserAvatar
                        avatar={item.avatar}
                        size="otc"
                        variant="success"
                        rating={item.score}
                      />
                      <LeaderboardName>{item.name}</LeaderboardName>
                    </LeaderboardUser>
                  </UserHoverCard>
                  <LeaderboardProfit>
                    {leaderboardSort === "profit"
                      ? `${item.profit >= 0 ? "+" : ""}$${Math.abs(item.profit).toLocaleString()}`
                      : `$${item.volume.toLocaleString()}`}
                  </LeaderboardProfit>
                </LeaderboardRow>
              ))
            )}
          </LeaderboardList>

          {lbTotal > 10 && (
            <Pagination
              page={lbPage}
              totalPage={Math.ceil(lbTotal / 10)}
              onChange={(p) => setLbPage(p)}
              limit={10}
              total={lbTotal}
              style={{ marginTop: 20 }}
            />
          )}
        </LeaderboardSection>
      </InfoBlock>
      <DiscussionsBlock marketId="general" />
    </>
  );
};
