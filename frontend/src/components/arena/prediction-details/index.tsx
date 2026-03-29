'use client';

import React, { useCallback, useState, useEffect } from "react";
import BreadCrumbs from "@/global/BreadCrumbs";
import { PageWrapper } from "@/projects/Connection/styles";
import {
  LeftColumn,
  PredictionDetailsWrapper,
  RightColumn,
  PredictionHeader,
  HeaderTop,
  LogoSection,
  Logo,
  TitleSection,
  Title,
  Creator,
  HeaderBottom,
  CountdownTimer,
  TimeUnit,
  TimeValue,
  TimeLabel,
  VolumeRiskRow,
  VolumeInfo,
  RiskInfo,
  OutcomesSection,
  OutcomesHeader,
  OutcomesTable,
  ChartTooltipLabel,
  OutcomeRow,
  OutcomeLabel,
  ChanceValue,
  BetButton,
  Multiplier,
  BettingCard,
  BettingCardHeader,
  BettingOptions,
  BetOptionButton,
  AmountSection,
  AmountLabel,
  AmountInput,
  AmountSpinnerButtons,
  QuickAmountButtons,
  QuickAmountButton,
  BettingDetails,
  DetailRow,
  PlaceBetButton,
  BettingDisclaimer,
  SentimentSection,
  SentimentTopBox,
  SentimentBadge,
  SentimentDescription,
  SentimentMetrics,
  SentimentMetricRow,
  SentimentFullDescription,
  SentimentBox,
  PredictionChartWrapper,
  ChartHeader,
  ChartTitle,
  ChartSubtitle,
  ChartLegend,
  LegendItem,
  LegendDot,
  ChartControls,
  ChartPeriodButtons,
  ChartPeriodButton,
  ChartCameraButton,
  ChartContainer,
  ChartTooltip,
  TooltipDate,
  TooltipRow,
  TooltipDot,
  TooltipValue,
  CountdownTooltip,
  TooltipContent,
  TooltipHeader,
  TooltipTime,
  TooltipLabel as StyledTooltipLabel,
} from "./styles";
import CommentBlock from "@/global/CommentBlock";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AISentiment } from "../prediction-card/styles";
import AiSentimentIcon from "@/global/Icons/AiSentimentIcon";
import BullIcon from "@/global/Icons/BullIcon";
import {
  LeaderboardList,
  LeaderboardName,
  LeaderboardProfit,
  LeaderboardRank,
  LeaderboardRow,
  LeaderboardSearch,
  LeaderboardSection,
  LeaderboardTabs,
  LeaderboardUser,
  LiveBetCard,
  LiveBetInfo,
  LiveBetLeft,
  LiveBetOdds,
  LiveBetRight,
  LiveBetsHeader,
  LiveBetsList,
  LiveBetsSection,
  LiveBetSubtitle,
  LiveBetText,
  LiveBetTitle,
  LiveBetUserRow,
} from "../arena-tab/styles";
import { TimeButton } from "@/global/common/PriceChart/styles";
import UserHoverCard from "../UserHoverCard";
import UserAvatar from "@/global/common/UserAvatar";
import Pagination from "@/global/Pagintaion";
import { filterOptions } from "../arena-tab";
import CustomDropdown from "@/UI/CustomDropdown";
import { useRouter } from "next/navigation";
import { MarketsAPI, ActivityAPI, LeaderboardAPI } from "@/lib/api/arena";
import { OnchainMarketsAPI } from "@/lib/api/onchainApi";
import { mapActivityToLiveBet, mapLeaderboardEntry } from "@/lib/api/mappers";
import { env } from "@/lib/web3/env";
import { ProfileDropdown } from "@/components/wallet/ProfileDropdown";
import { Plus, Bell } from "lucide-react";
import Image from "next/image";
import {
  MainHeader,
  CreateButton,
  StatusPill,
} from "../styles";
import { CreatePredictionModal } from "../create-prediction-modal/CreatePredictionModal";
import { VotingPanel } from "../VotingPanel";

interface PredictionDetailsProps {
  predictionId: string;
}

const CHART_COLORS = ["#05A584", "#9333EA", "#3B82F6", "#F59E0B", "#EF4444", "#6366F1"];

// Custom tick component for two-row axis
const CustomAxisTick = ({ x, y, payload }: any) => {
  const data = payload.value;
  if (!data) return null;
  const [year, month] = data.split("|");
  return (
    <g transform={`translate(${x},${y})`}>
      {month && (
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#738094" fontSize={12} fontWeight={600}>
          {month}
        </text>
      )}
      {year && (
        <text x={0} y={0} dy={34} textAnchor="middle" fill="#738094" fontSize={12} fontWeight={600}>
          {year}
        </text>
      )}
    </g>
  );
};

const CustomLabel = ({ viewBox, value, color, index, dataLength }: any) => {
  if (index !== dataLength - 1) return null;
  const { x, y } = viewBox;
  const change = ((Math.random() - 0.5) * 10).toFixed(2);
  const isPositive = parseFloat(change) > 0;
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} />
      <foreignObject x={x + 10} y={y - 12} width={80} height={24}>
        <div style={{ background: color, color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" }}>
          {isPositive ? "+" : ""}{change}%
        </div>
      </foreignObject>
    </g>
  );
};

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <ChartTooltip>
        <TooltipDate>{payload[0].payload.tooltipDate}</TooltipDate>
        {payload.map((entry: any, index: number) => (
          <TooltipRow key={index}>
            <TooltipDot color={entry.color} />
            <ChartTooltipLabel>{entry.name}</ChartTooltipLabel>
            <TooltipValue>{entry.value.toFixed(1)}%</TooltipValue>
          </TooltipRow>
        ))}
      </ChartTooltip>
    );
  }
  return null;
};

// Countdown hook
function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
}

export const PredictionDetails: React.FC<PredictionDetailsProps> = ({
  predictionId,
}) => {
  const router = useRouter();

  // Market data from API
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number>(0);
  const [betAmount, setBetAmount] = useState(100);
  const [betType, setBetType] = useState<"yes" | "no">("yes");
  const [betLoading, setBetLoading] = useState(false);
  const [betPreview, setBetPreview] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<"24H" | "7D" | "30D" | "ALL">("30D");
  const [leaderboardTab, setLeaderboardTab] = useState<"24H" | "7D" | "30D" | "All">("24H");
  const [betFilter, setBetFilter] = useState<string>("100");
  const [showTooltip, setShowTooltip] = useState(false);
  const [leaderboardSort, setLeaderboardSort] = useState<"profit" | "volume">("profit");

  // Live data
  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Create market modal
  const [isCreateMarketOpen, setIsCreateMarketOpen] = useState(false);
  
  // Get wallet address for voting
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  useEffect(() => {
    // Get wallet from localStorage (set by wallet connect)
    const wallet = localStorage.getItem('walletAddress') || localStorage.getItem('currentWallet');
    setWalletAddress(wallet);
  }, []);
  // Fetch market data
  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(true);
      try {
        let result = null;
        
        // Try onchain API first when enabled
        if (env.ONCHAIN_ENABLED) {
          // Check if predictionId is numeric (onchain market)
          const marketIdNum = parseInt(predictionId);
          if (!isNaN(marketIdNum)) {
            const onchainMarket = await OnchainMarketsAPI.getMarket(marketIdNum);
            if (onchainMarket) {
              // Map onchain market to expected format
              result = {
                id: String(onchainMarket.marketId),
                title: onchainMarket.question || `Market #${onchainMarket.marketId}`,
                subtitle: onchainMarket.status,
                status: onchainMarket.status === 'active' ? 'published' : onchainMarket.status,
                type: 'yes-no',
                outcomes: [
                  { id: '1', name: 'YES', probability: 50 },
                  { id: '2', name: 'NO', probability: 50 },
                ],
                totalVolume: onchainMarket.totalStaked ? Number(BigInt(onchainMarket.totalStaked) / BigInt(10**18)) : 0,
                totalBets: 0,
                closeTime: onchainMarket.endTime ? new Date(onchainMarket.endTime * 1000).toISOString() : null,
                category: 'Crypto',
                riskLevel: 'Medium',
                creator: { username: 'Arena', avatar: '/images/default-avatar.png' },
                sentiment: {
                  type: 'neutral',
                  description: 'Market sentiment data',
                  momentumIndicator: 'Stable',
                  attentionIndex: 'Medium',
                  consensusStrength: 'Moderate',
                  volatilityPressure: 'Low',
                  narrativeDirection: 'Neutral',
                  fullDescription: 'This market is currently active for predictions.',
                },
              };
            }
          }
        }
        
        // Fallback to off-chain API
        if (!result) {
          result = await MarketsAPI.getMarket(predictionId);
        }
        
        if (result) {
          setMarket(result);
        } else {
          setError("Market not found");
        }
      } catch (e) {
        console.error("Failed to fetch market:", e);
        setError("Failed to load market");
      } finally {
        setLoading(false);
      }
    };
    if (predictionId) fetchMarket();
  }, [predictionId]);

  // Fetch live bets and leaderboard
  useEffect(() => {
    ActivityAPI.getLiveActivity(8).then((data) =>
      setLiveBets(data.map(mapActivityToLiveBet))
    ).catch(console.error);

    LeaderboardAPI.getProfitLeaderboard({ limit: 10 }).then((data) =>
      setLeaderboard(data.map(mapLeaderboardEntry))
    ).catch(console.error);
  }, []);

  // Check if market is disputed or in voting
  const isDisputed = market?.status === 'disputed';
  const isVoting = market?.voting?.status === 'active';

  // Derived values from market
  const outcomes = market?.outcomes || [];
  const marketTitle = market?.question || market?.title || "Loading...";
  const closeTime = market?.closeTime || null;
  const totalVolume = market?.totalVolume || 0;
  const riskLevel = market?.riskLevel || "medium";
  const category = market?.category || "";
  const createdBy = market?.createdBy || "";

  const countdown = useCountdown(closeTime);

  // Fetch bet preview when amount or selection changes
  useEffect(() => {
    if (!market?._id || betAmount <= 0) return;
    const outcomeId = outcomes[selectedOutcomeIndex]?.id;
    if (!outcomeId) return;
    const timer = setTimeout(async () => {
      try {
        const preview = await MarketsAPI.betPreview(market._id, betAmount, outcomeId);
        setBetPreview(preview);
      } catch (e) {
        console.error("Bet preview failed:", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [market?._id, betAmount, selectedOutcomeIndex, betType]);

  // Place bet handler
  const handlePlaceBet = async () => {
    if (!market?._id) return;
    const outcomeId = outcomes[selectedOutcomeIndex]?.id;
    if (!outcomeId) return;
    setBetLoading(true);
    try {
      const result = await MarketsAPI.placeBet(market._id, betAmount, outcomeId);
      if (result.success) {
        alert("Bet placed successfully!");
        // Refresh market data
        const updated = await MarketsAPI.getMarket(predictionId);
        if (updated) setMarket(updated);
      } else {
        alert(`Bet failed: ${result.error || "Unknown error"}`);
      }
    } catch (e: any) {
      alert(`Bet error: ${e.message}`);
    } finally {
      setBetLoading(false);
    }
  };

  // Generate chart data (simulated - will be replaced with real odds_snapshots API later)
  const generateChartData = useCallback(
    (period: "24H" | "7D" | "30D" | "ALL") => {
      const dataPoints = period === "24H" ? 24 : period === "7D" ? 14 : period === "30D" ? 30 : 60;
      const data = [];
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date();
        if (period === "24H") date.setHours(date.getHours() - (dataPoints - i));
        else date.setDate(date.getDate() - (dataPoints - i));
        const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const year = date.getFullYear();
        const showYear = i % 8 === 0;
        const showMonth = i % 8 === 4;
        const tooltipDate =
          date.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
          " • " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        const entry: any = {
          date: period === "24H" ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : monthDay,
          tooltipDate,
          year: showYear ? year.toString() : "",
          month: showMonth ? monthDay : "",
        };
        // Generate a line for each outcome based on its probability
        outcomes.forEach((o: any, idx: number) => {
          const base = o.probability || 50;
          entry[`outcome_${idx}`] = Math.max(1, Math.min(99, base + (Math.random() - 0.5) * 30 - i * 0.1));
        });
        data.push(entry);
      }
      return data;
    },
    [outcomes]
  );

  const crumbs = [
    { title: "Arena", link: "/" },
    { title: marketTitle.length > 40 ? marketTitle.slice(0, 40) + "..." : marketTitle, link: "" },
  ];

  const riskColorMap: Record<string, string> = { low: "#05A584", medium: "#FFB800", high: "#FF5858" };
  const riskColor = riskColorMap[riskLevel] || "#738094";

  // Multipliers
  const selectedOutcome = outcomes[selectedOutcomeIndex];
  const yesMultiplier = selectedOutcome?.yesMultiplier || 2.0;
  const noMultiplier = selectedOutcome?.noMultiplier || 2.0;
  const currentMultiplier = betType === "yes" ? yesMultiplier : noMultiplier;

  // Loading state
  if (loading) {
    return (
      <PageWrapper>
        <MainHeader data-testid="main-header">
          <Image 
            src="/images/logo.svg" 
            alt="Logo" 
            width={100} 
            height={28}
            priority
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/')}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <StatusPill><span className="dot" /> Q1 2026 Live</StatusPill>
            <ProfileDropdown />
          </div>
        </MainHeader>
        <div style={{ padding: 40, textAlign: "center", color: "#738094" }}>Loading market data...</div>
      </PageWrapper>
    );
  }

  if (error || !market) {
    return (
      <PageWrapper>
        <MainHeader data-testid="main-header">
          <Image 
            src="/images/logo.svg" 
            alt="Logo" 
            width={100} 
            height={28}
            priority
            style={{ cursor: 'pointer' }}
            onClick={() => router.push('/')}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <StatusPill><span className="dot" /> Q1 2026 Live</StatusPill>
            <ProfileDropdown />
          </div>
        </MainHeader>
        <div style={{ padding: 40, textAlign: "center", color: "#FF5858" }}>{error || "Market not found"}</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* ========== HEADER ========== */}
      <MainHeader data-testid="main-header">
        {/* Left: Logo */}
        <Image 
          src="/images/logo.svg" 
          alt="Logo" 
          width={100} 
          height={28}
          priority
          style={{ cursor: 'pointer' }}
          onClick={() => router.push('/')}
        />

        {/* Right: Create + Season + Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <CreateButton onClick={() => setIsCreateMarketOpen(true)} data-testid="create-market-btn">
            <Plus size={16} />
            Create Market
          </CreateButton>
          
          <StatusPill data-testid="season-status">
            <span className="dot" /> Q1 2026 Live
          </StatusPill>
          
          <ProfileDropdown />
        </div>
      </MainHeader>

      <BreadCrumbs items={crumbs} />
      <PredictionDetailsWrapper>
        <LeftColumn>
          <PredictionHeader>
            <HeaderTop>
              <LogoSection>
                <Logo
                  src={market.logo || `https://api.dicebear.com/7.x/icons/svg?seed=${category}`}
                  alt={category}
                />
                <TitleSection>
                  <Title data-testid="market-title">{marketTitle}</Title>
                </TitleSection>
              </LogoSection>
            </HeaderTop>
            <HeaderBottom>
              <Creator>
                <Logo
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${createdBy}`}
                  alt="Creator"
                  width={20}
                  height={20}
                />
                <span className="name">
                  {createdBy ? `${createdBy.slice(0, 6)}...${createdBy.slice(-4)}` : "FOMO"}
                </span>
              </Creator>
              <CountdownTimer
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                data-testid="countdown-timer"
              >
                <CountdownTooltip visible={showTooltip}>
                  <TooltipContent>
                    <TooltipHeader>
                      <span className="live-dot"></span>
                      <span className="live-text">{market.status === "published" ? "Live" : market.status}</span>
                      <span className="time-left">
                        {countdown.days}d {countdown.hours}h {countdown.minutes}m <span>left</span>
                      </span>
                    </TooltipHeader>
                    <StyledTooltipLabel>Resolution Time</StyledTooltipLabel>
                    <TooltipTime>
                      <span className="date">
                        {closeTime ? new Date(closeTime).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric"
                        }) : "TBD"}
                      </span>
                      <span className="time">
                        {closeTime ? new Date(closeTime).toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short"
                        }) : ""}
                      </span>
                    </TooltipTime>
                  </TooltipContent>
                </CountdownTooltip>
                <TimeUnit>
                  <TimeValue>{String(countdown.days).padStart(2, "0")}</TimeValue>
                  <TimeLabel>days</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>{String(countdown.hours).padStart(2, "0")}</TimeValue>
                  <TimeLabel>hrs</TimeLabel>
                </TimeUnit>
                <TimeUnit>
                  <TimeValue>{String(countdown.minutes).padStart(2, "0")}</TimeValue>
                  <TimeLabel>mins</TimeLabel>
                </TimeUnit>
              </CountdownTimer>
              <VolumeRiskRow>
                <VolumeInfo>
                  <span className="value" data-testid="market-volume">
                    ${totalVolume.toLocaleString()} Vol.
                  </span>
                </VolumeInfo>
                <RiskInfo>
                  <span className="label">Risks:</span>
                  <span className={`value ${riskLevel}`} style={{ color: riskColor }}>
                    {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                  </span>
                </RiskInfo>
              </VolumeRiskRow>
            </HeaderBottom>
            <OutcomesSection data-testid="outcomes-section">
              <OutcomesHeader>
                <span>Outcome</span>
                <span className="chance">% Chance</span>
                <span></span>
              </OutcomesHeader>
              <OutcomesTable>
                {outcomes.map((outcome: any, index: number) => (
                  <OutcomeRow key={outcome.id || index} selected={selectedOutcomeIndex === index}>
                    <OutcomeLabel>{outcome.label}</OutcomeLabel>
                    <ChanceValue>{outcome.probability || 0}%</ChanceValue>
                    <div className="bet-buttons">
                      <BetButton
                        variant="yes"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOutcomeIndex(index);
                          setBetType("yes");
                        }}
                      >
                        Yes <Multiplier>• {(outcome.yesMultiplier || 2.0).toFixed(1)}x</Multiplier>
                      </BetButton>
                      <BetButton
                        variant="no"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOutcomeIndex(index);
                          setBetType("no");
                        }}
                      >
                        No <Multiplier>• {(outcome.noMultiplier || 2.0).toFixed(1)}x</Multiplier>
                      </BetButton>
                    </div>
                  </OutcomeRow>
                ))}
              </OutcomesTable>
            </OutcomesSection>
          </PredictionHeader>

          <PredictionChartWrapper>
            <ChartHeader>
              <div>
                <ChartTitle>
                  {selectedOutcome?.label || "Outcome"}
                  <span className="percentage">
                    <ArrowUpRight size={16} color="#05A584" /> {selectedOutcome?.probability || 0}%
                  </span>
                </ChartTitle>
                <ChartSubtitle>{selectedOutcome?.probability || 0}% Chance</ChartSubtitle>
              </div>
              <ChartControls>
                <ChartPeriodButtons>
                  {(["24H", "7D", "30D", "ALL"] as const).map((period) => (
                    <ChartPeriodButton key={period} active={chartPeriod === period} onClick={() => setChartPeriod(period)}>
                      {period}
                    </ChartPeriodButton>
                  ))}
                </ChartPeriodButtons>
                <ChartCameraButton>
                  <Camera color="#738094" size={18} />
                </ChartCameraButton>
              </ChartControls>
            </ChartHeader>
            <ChartLegend>
              {outcomes.map((o: any, i: number) => (
                <LegendItem key={o.id || i}>
                  <LegendDot color={CHART_COLORS[i % CHART_COLORS.length]} />
                  <span>{o.label}</span>
                </LegendItem>
              ))}
            </ChartLegend>
            <ChartContainer>
              <ResponsiveContainer width="100%" height={460}>
                <LineChart data={generateChartData(chartPeriod).map((item) => ({ ...item, axisLabel: `${item.year}|${item.month}` }))}>
                  <CartesianGrid strokeDasharray="0" stroke="#E5E9F2" vertical={false} />
                  <XAxis dataKey="axisLabel" axisLine={false} tickLine={false} tick={<CustomAxisTick />} interval={0} height={60} />
                  <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#070b35", fontSize: 12, fontWeight: 600 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<CustomChartTooltip />} />
                  {outcomes.map((o: any, i: number) => (
                    <Line
                      key={o.id || i}
                      type="monotone"
                      dataKey={`outcome_${i}`}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      name={o.label}
                      label={(props: any) => (
                        <CustomLabel {...props} color={CHART_COLORS[i % CHART_COLORS.length]} dataLength={generateChartData(chartPeriod).length} />
                      )}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </PredictionChartWrapper>

          <LiveBetsSection>
            <LiveBetsHeader>
              <h2><span></span> Live Bets</h2>
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
            <LiveBetsList data-testid="details-live-bets">
              {liveBets.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#738094" }}>No recent activity</div>
              ) : (
                liveBets
                  .filter((bet) => bet.amount >= parseInt(betFilter))
                  .map((bet) => (
                    <LiveBetCard key={bet.id}>
                      <LiveBetLeft>
                        <UserAvatar avatar={bet.icon} size="medium" variant="default" className="image" />
                        <LiveBetInfo>
                          <div className="title">
                            <LiveBetTitle>{bet.project}</LiveBetTitle>
                            {bet.subtitle && <LiveBetSubtitle>{bet.subtitle}</LiveBetSubtitle>}
                          </div>
                          <LiveBetUserRow>
                            <UserHoverCard userName={bet.user} userAvatar={bet.icon}>
                              <div className="user">
                                <UserAvatar avatar={bet.icon} size="xxSmall" variant="default" />
                                <p>{bet.user}</p>
                              </div>
                            </UserHoverCard>
                            <LiveBetText>
                              placed ${bet.amount} at{" "}
                              <LiveBetOdds accent={bet.accent as "green" | "red"}>{bet.betLabel}</LiveBetOdds>{" "}
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
        </LeftColumn>

        <RightColumn>
          {/* Voting Mode for Disputed Markets */}
          {isDisputed && (
            <VotingPanel
              marketId={predictionId}
              outcomes={outcomes}
              walletAddress={walletAddress || undefined}
              onVoteSuccess={() => {
                // Refresh market data after vote
                MarketsAPI.getMarket(predictionId).then(setMarket);
              }}
            />
          )}

          {/* Normal Betting Card - Hidden during dispute */}
          {!isDisputed && (
          <BettingCard data-testid="betting-card">
            <BettingCardHeader>
              <Logo
                src={market.logo || `https://api.dicebear.com/7.x/icons/svg?seed=${category}`}
                alt={category}
              />
              <span className="outcome-value">{selectedOutcome?.label || "Outcome"}</span>
            </BettingCardHeader>

            <BettingOptions>
              <BetOptionButton variant="yes" active={betType === "yes"} onClick={() => setBetType("yes")}>
                Yes • {yesMultiplier.toFixed(1)}x
              </BetOptionButton>
              <BetOptionButton variant="no" active={betType === "no"} onClick={() => setBetType("no")}>
                No • {noMultiplier.toFixed(1)}x
              </BetOptionButton>
            </BettingOptions>

            <AmountSection>
              <AmountLabel>Amount</AmountLabel>
              <AmountInput>
                <span className="currency">USDT</span>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  min="0"
                  data-testid="bet-amount-input"
                />
                <AmountSpinnerButtons>
                  <button onClick={() => setBetAmount(betAmount + 1)}><ChevronUp size={12} /></button>
                  <button onClick={() => setBetAmount(Math.max(0, betAmount - 1))}><ChevronDown size={12} /></button>
                </AmountSpinnerButtons>
              </AmountInput>
              <QuickAmountButtons>
                <QuickAmountButton onClick={() => setBetAmount(betAmount + 1)}>+1</QuickAmountButton>
                <QuickAmountButton onClick={() => setBetAmount(betAmount + 10)}>+10</QuickAmountButton>
                <QuickAmountButton onClick={() => setBetAmount(betAmount + 100)}>+100</QuickAmountButton>
                <QuickAmountButton onClick={() => setBetAmount(10000)}>Max</QuickAmountButton>
              </QuickAmountButtons>
            </AmountSection>

            <BettingDetails>
              <DetailRow>
                <span className="label">To potentially return</span>
                <span className="value highlight" data-testid="potential-return">
                  {betPreview
                    ? `${(betPreview.potentialReturn || betPreview.payout || betAmount * currentMultiplier).toFixed(0)} USDT`
                    : `${(betAmount * currentMultiplier).toFixed(0)} USDT`}
                </span>
              </DetailRow>
              <DetailRow>
                <span className="label">Avg. Price</span>
                <span className="value">
                  {(1 / currentMultiplier).toFixed(2)} USDT
                </span>
              </DetailRow>
              <DetailRow>
                <span className="label">Platform Fee</span>
                <span className="value">{betPreview?.feePercent || 3}%</span>
              </DetailRow>
            </BettingDetails>

            <PlaceBetButton
              onClick={handlePlaceBet}
              style={{ opacity: betLoading ? 0.6 : 1 }}
              data-testid="place-bet-button"
            >
              {betLoading ? "Placing..." : "Place a Bet"}
            </PlaceBetButton>
          </BettingCard>
          )}

          {!isDisputed && (
          <>
          <BettingDisclaimer>
            By trading you confirm that you have read and agree to the <span className="link">Terms of Use</span>.<br />
            Always do your own research.
          </BettingDisclaimer>

          <AISentiment style={{ margin: "20px 0", fontSize: "14px", padding: "8px 12px" }}>
            <AiSentimentIcon />
            AI Sentiment
          </AISentiment>

          <SentimentSection>
            <SentimentTopBox sentiment="Bullish">
              <SentimentBadge sentiment="Bullish">
                <BullIcon />
                Bullish
              </SentimentBadge>
              <SentimentDescription>Strong upward momentum with growing attention.</SentimentDescription>
            </SentimentTopBox>
            <SentimentMetrics>
              <SentimentMetricRow>
                <span>Momentum indicator</span>
                <span style={{ color: "#05A584", fontWeight: 600 }}>+0.62</span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Attention index</span>
                <span style={{ color: "#05A584", fontWeight: 600 }}>78/100</span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Consensus strength</span>
                <span style={{ color: "#FFB800", fontWeight: 600 }}>Moderate</span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Volatility pressure</span>
                <span style={{ color: "#FFB800", fontWeight: 600 }}>Medium</span>
              </SentimentMetricRow>
              <SentimentMetricRow>
                <span>Narrative direction</span>
                <span style={{ color: "#05A584", fontWeight: 600 }}>Expanding</span>
              </SentimentMetricRow>
            </SentimentMetrics>
            <SentimentFullDescription>
              AI-generated market context based on on-chain and off-chain signals.
              Different price levels involve distinct risk profiles.
              <br />
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                (AI — analytical layer, no impact on payout).
              </span>
            </SentimentFullDescription>
            <SentimentBox>
              <p>AI Sentiment is provided for informational purposes only and does not constitute financial or investment advice.</p>
            </SentimentBox>
          </SentimentSection>

          <LeaderboardSection style={{ marginTop: "40px" }}>
            <LiveBetsHeader>
              <h2>Leaderboard</h2>
              <LeaderboardTabs>
                <TimeButton active={leaderboardTab === "24H"} onClick={() => setLeaderboardTab("24H")}>24H</TimeButton>
                <TimeButton active={leaderboardTab === "7D"} onClick={() => setLeaderboardTab("7D")}>7D</TimeButton>
                <TimeButton active={leaderboardTab === "30D"} onClick={() => setLeaderboardTab("30D")}>30D</TimeButton>
                <TimeButton active={leaderboardTab === "All"} onClick={() => setLeaderboardTab("All")}>All</TimeButton>
              </LeaderboardTabs>
            </LiveBetsHeader>

            <div className="row">
              <LeaderboardSearch>
                <Search size={16} color="#738094" />
                <input placeholder="Search by name" />
              </LeaderboardSearch>
              <button
                onClick={() => setLeaderboardSort(prev => prev === "profit" ? "volume" : "profit")}
                style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: "6px", transition: "color 0.2s ease", background: "none", border: "none", color: "#728094", fontWeight: 600, fontSize: "14px", padding: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#728094")}
              >
                {leaderboardSort === "profit" ? "Profit/Loss" : "Volume"}
                <ArrowUpDown size={14} />
              </button>
            </div>

            <LeaderboardList data-testid="details-leaderboard">
              {leaderboard.map((item) => (
                <LeaderboardRow key={item.id}>
                  <LeaderboardRank>{item.id}</LeaderboardRank>
                  <UserHoverCard userName={item.name} userAvatar={item.avatar}>
                    <LeaderboardUser>
                      <UserAvatar avatar={item.avatar} size="otc" variant="success" rating={item.score} />
                      <LeaderboardName>{item.name}</LeaderboardName>
                    </LeaderboardUser>
                  </UserHoverCard>
                  <LeaderboardProfit>
                    {leaderboardSort === "profit"
                      ? `${item.profit >= 0 ? "+" : ""}$${Math.abs(item.profit).toLocaleString()}`
                      : `$${item.volume.toLocaleString()}`}
                  </LeaderboardProfit>
                </LeaderboardRow>
              ))}
            </LeaderboardList>
          </LeaderboardSection>
          </>
          )}
        </RightColumn>
      </PredictionDetailsWrapper>

      <CommentBlock marketId={predictionId} />
      
      {/* Create Prediction Modal */}
      <CreatePredictionModal
        isOpen={isCreateMarketOpen}
        onClose={() => setIsCreateMarketOpen(false)}
        onSuccess={() => {
          router.push('/');
        }}
      />
    </PageWrapper>
  );
};
