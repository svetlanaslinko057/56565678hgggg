'use client';

import React, { useState, useEffect, useCallback } from "react";
import {
  SnapshotHeader,
  RankBadge,
  SnapshotStats,
  SnapshotStat,
  QuickTipsSection,
  LeaderboardSearch,
  LeaderboardUser,
  LeaderboardName,
  HowItWorks,
  Note,
} from "../arena-tab/styles";
import {
  LeaguesContainer,
  LeaguesTableWrapper,
  LeaguesTable,
  LeaguesTableHead,
  LeaguesTableBody,
  LeaguesRank,
  LeaguesUserCell,
  LeaguesMetric,
  LeaguesAccuracyBar,
  LeaguesActionsCell,
  LeaguesActionButton,
  LeaguesSnapshotCard,
  LeaguesSnapshotCardSection,
} from "./styles";
import Pagination from "@/global/Pagintaion";
import { Info, Search } from "lucide-react";
import UserHoverCard from "../UserHoverCard";
import UserAvatar from "@/global/common/UserAvatar";
import Trophy from "@/global/Icons/Trophy";
import Arrow from "@/global/Icons/Arrow";
import League from "@/global/Icons/League";
import Accuracy from "@/global/Icons/Accuracy";
import { LeagueScoringModal } from "./LeagueScoringModal";
import { CreateDuelModal } from "./CreateDuelModal";
import { UserProfileModal } from "./UserProfileModal";
import { LeaderboardAPI, SeasonsAPI } from "@/lib/api/arena";
import { useArena } from "@/lib/api/ArenaContext";

interface LeagueUser {
  id: string;
  wallet: string;
  name: string;
  avatar: string;
  roi: number;
  accuracy: number;
  leaguePoints: number;
  totalPredictions: number;
}

// Map API leaderboard entry to LeagueUser
function mapLeaderboardEntry(entry: any, index: number): LeagueUser {
  return {
    id: entry._id || entry.wallet || String(index + 1),
    wallet: entry.wallet || '',
    name: entry.username || `${entry.wallet?.slice(0, 6)}...${entry.wallet?.slice(-4)}` || `Analyst #${index + 1}`,
    avatar: entry.avatar || "/images/default-avatar.png",
    roi: entry.performance?.roi || entry.roi || 0,
    accuracy: entry.performance?.accuracy || entry.accuracy || 0,
    leaguePoints: entry.leaguePoints || entry.seasonPoints || 0,
    totalPredictions: entry.stats?.totalPredictions || entry.totalPredictions || 0,
  };
}

export const LeaguesTab: React.FC = () => {
  const { currentWallet } = useArena();
  const [searchTerm, setSearchTerm] = useState("");
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeagueUser | null>(null);
  
  // Data state
  const [leagueUsers, setLeagueUsers] = useState<LeagueUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // User's own stats
  const [myStats, setMyStats] = useState({
    rank: 0,
    total: 0,
    topPercent: "N/A",
    roi: 0,
    accuracy: 0,
    leaguePoints: 0,
  });
  
  const USERS_PER_PAGE = 10;

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const result = await LeaderboardAPI.getLeaderboard({
        page: pageNum,
        limit: USERS_PER_PAGE,
        sortBy: 'leaguePoints',
      });
      
      setLeagueUsers(result.data.map((entry: any, idx: number) => 
        mapLeaderboardEntry(entry, (pageNum - 1) * USERS_PER_PAGE + idx)
      ));
      setTotal(result.total);
      setHasMore(result.hasMore || false);
      
      // Find user's own position if connected
      if (currentWallet) {
        const userEntry = result.data.find((e: any) => e.wallet === currentWallet);
        if (userEntry) {
          const userIndex = result.data.indexOf(userEntry);
          const rank = (pageNum - 1) * USERS_PER_PAGE + userIndex + 1;
          const topPercent = result.total > 0 ? Math.round((rank / result.total) * 100) : 0;
          
          setMyStats({
            rank,
            total: result.total,
            topPercent: `Top ${topPercent}%`,
            roi: userEntry.performance?.roi || 0,
            accuracy: userEntry.performance?.accuracy || 0,
            leaguePoints: userEntry.leaguePoints || 0,
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setLoading(false);
    }
  }, [currentWallet]);

  // Fetch user's own stats
  const fetchMyStats = useCallback(async () => {
    if (!currentWallet) return;
    
    try {
      const analyst = await LeaderboardAPI.getAnalyst(currentWallet);
      if (analyst) {
        // Get rank from leaderboard position
        const result = await LeaderboardAPI.getLeaderboard({ limit: 100, sortBy: 'leaguePoints' });
        const myIndex = result.data.findIndex((e: any) => e.wallet === currentWallet);
        const rank = myIndex >= 0 ? myIndex + 1 : 0;
        const topPercent = result.total > 0 && rank > 0 ? Math.round((rank / result.total) * 100) : 0;
        
        setMyStats({
          rank,
          total: result.total,
          topPercent: rank > 0 ? `Top ${topPercent}%` : "N/A",
          roi: analyst.performance?.roi || 0,
          accuracy: analyst.performance?.accuracy || 0,
          leaguePoints: analyst.leaguePoints || 0,
        });
      }
    } catch (e) {
      console.error("Failed to fetch my stats:", e);
    }
  }, [currentWallet]);

  // Initial load
  useEffect(() => {
    fetchLeaderboard(1);
    fetchMyStats();
  }, [fetchLeaderboard, fetchMyStats]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLeaderboard(newPage);
  };

  // Filter users by search
  const filteredUsers = leagueUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.wallet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChallengeClick = (userName: string) => {
    setSelectedOpponent(userName);
    setIsDuelModalOpen(true);
  };

  const handleViewProfile = (user: LeagueUser) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  return (
    <LeaguesContainer>
      <LeaguesTableWrapper>
        <div style={{ overflowX: "auto" }}>
          <LeaguesTable>
            <LeaguesTableHead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th style={{ width: "200px" }}>
                  <LeaderboardSearch
                    style={{
                      padding: 0,
                      position: "relative",
                      width: "calc(100% + 60px)",
                      marginLeft: "-40px",
                    }}
                  >
                    <Search color="#738094" />
                    <input 
                      placeholder="Search by name" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </LeaderboardSearch>
                </th>
                <th>ROI %</th>
                <th>Accuracy</th>
                <th>League Points</th>
                <th style={{ width: "181px", textAlign: "right" }}>Actions</th>
              </tr>
            </LeaguesTableHead>
            <LeaguesTableBody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#738094" }}>
                    Loading leaderboard...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#738094" }}>
                    {searchTerm ? "No users found" : "No leaderboard data"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} data-testid={`league-user-${user.id}`}>
                    <LeaguesRank>
                      <span>{(page - 1) * USERS_PER_PAGE + index + 1}</span>
                    </LeaguesRank>
                    <LeaguesUserCell>
                      <div>
                        <UserHoverCard
                          userName={user.name}
                          userAvatar={user.avatar}
                        >
                          <LeaderboardUser>
                            <UserAvatar
                              avatar={user.avatar}
                              size="otc"
                              variant="success"
                              rating={Math.round(user.accuracy)}
                            />
                            <LeaderboardName>{user.name}</LeaderboardName>
                          </LeaderboardUser>
                        </UserHoverCard>
                      </div>
                    </LeaguesUserCell>
                    <LeaguesMetric positive={user.roi > 0}>
                      {user.roi > 0 ? "+" : ""}{user.roi.toFixed(1)}%
                    </LeaguesMetric>
                    <LeaguesMetric>
                      <LeaguesAccuracyBar>
                        <div className="bar">
                          <div
                            className="fill"
                            style={{ width: `${Math.min(user.accuracy, 100)}%` }}
                          />
                        </div>
                        <div className="percent">{user.accuracy.toFixed(0)}%</div>
                      </LeaguesAccuracyBar>
                    </LeaguesMetric>
                    <LeaguesMetric>
                      {user.leaguePoints.toLocaleString()}
                    </LeaguesMetric>
                    <LeaguesActionsCell>
                      <LeaguesActionButton
                        onClick={() => handleViewProfile(user)}
                        data-testid={`view-profile-${user.id}`}
                      >
                        View Profile
                      </LeaguesActionButton>
                      <LeaguesActionButton
                        className="challenge"
                        onClick={() => handleChallengeClick(user.name)}
                        data-testid={`challenge-${user.id}`}
                      >
                        Challenge
                      </LeaguesActionButton>
                    </LeaguesActionsCell>
                  </tr>
                ))
              )}
            </LeaguesTableBody>
          </LeaguesTable>
        </div>

        {total > USERS_PER_PAGE && (
          <Pagination
            page={page}
            totalPage={Math.ceil(total / USERS_PER_PAGE)}
            onChange={handlePageChange}
            limit={USERS_PER_PAGE}
            total={total}
          />
        )}
      </LeaguesTableWrapper>

      <LeaguesSnapshotCardSection>
        <LeaguesSnapshotCard>
          <SnapshotHeader>
            <h3>
              <Trophy />
              Season Snapshot
            </h3>
            <HowItWorks onClick={() => setIsScoringModalOpen(true)}>
              <Info size={16} color="#738094" />
              <span>How it works</span>
            </HowItWorks>
          </SnapshotHeader>

          <RankBadge>
            <div className="rank" data-testid="my-rank">
              {myStats.rank > 0 ? `#${myStats.rank} / ${myStats.total}` : "Not ranked"}
            </div>
            <div className="label">Current Rank</div>
            <div className="tier" data-testid="my-tier">{myStats.topPercent}</div>
          </RankBadge>

          <SnapshotStats>
            <SnapshotStat>
              <div className="label">
                <Arrow />
                <span>Season ROI</span>
                <button className="tooltip-button">
                  <Info size={16} color="#738094" />
                  <span
                    className="tooltip-text right"
                    style={{ width: 200, whiteSpace: "normal" }}
                  >
                    Your total return on investment this season
                  </span>
                </button>
              </div>
              <div className="value" data-testid="my-roi">
                {myStats.roi > 0 ? "+" : ""}{myStats.roi.toFixed(1)}%
              </div>
            </SnapshotStat>
            <SnapshotStat>
              <div className="label">
                <Accuracy /> Accuracy
              </div>
              <div className="value" data-testid="my-accuracy">{myStats.accuracy.toFixed(0)}%</div>
            </SnapshotStat>
            <SnapshotStat>
              <div className="label">
                <League /> League Points
              </div>
              <div className="value" data-testid="my-points">{myStats.leaguePoints.toLocaleString()}</div>
            </SnapshotStat>
          </SnapshotStats>

          <Note>
            {currentWallet 
              ? "Keep predicting to climb the ranks! Top 10 analysts win NFT trophies at season end."
              : "Connect wallet to see your season stats and ranking."
            }
          </Note>
        </LeaguesSnapshotCard>
        
        <QuickTipsSection>
          <h4>Quick Tips</h4>
          <ul>
            <li>Higher stakes in duels mean bigger rewards</li>
            <li>Follow top analysts to learn winning strategies</li>
            <li>Consistent accuracy beats high ROI on single bets</li>
            <li>Challenge rivals to climb the leaderboard faster</li>
          </ul>
        </QuickTipsSection>
      </LeaguesSnapshotCardSection>

      <LeagueScoringModal
        isOpen={isScoringModalOpen}
        onClose={() => setIsScoringModalOpen(false)}
      />
      <CreateDuelModal
        isOpen={isDuelModalOpen}
        onClose={() => setIsDuelModalOpen(false)}
        opponentName={selectedOpponent}
      />
      {selectedUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={{
            name: selectedUser.name,
            avatar: selectedUser.avatar,
            rank: leagueUsers.findIndex((u) => u.id === selectedUser.id) + 1 + (page - 1) * USERS_PER_PAGE,
            topPercent: `Top ${Math.round(((leagueUsers.findIndex((u) => u.id === selectedUser.id) + 1 + (page - 1) * USERS_PER_PAGE) / total) * 100)}%`,
            points: selectedUser.leaguePoints,
            totalPredictions: selectedUser.totalPredictions,
            currentStreak: 0,
            winRate: selectedUser.accuracy,
            roi: selectedUser.roi,
            roiDescription: `Performance over ${selectedUser.totalPredictions} predictions`,
            topPredictions: [],
          }}
        />
      )}
    </LeaguesContainer>
  );
};
