/**
 * Data mappers: Backend API → Frontend component props
 */

// Map backend risk level to frontend display
function mapRisk(riskLevel: string): "Low" | "Medium" | "High" {
  const map: Record<string, "Low" | "Medium" | "High"> = {
    low: "Low",
    medium: "Medium",
    high: "High",
  };
  return map[riskLevel?.toLowerCase()] || "Medium";
}

// Map backend status to frontend display
function mapStatus(status: string): "Active" | "Live" | "Pending" | "Resolved" {
  const map: Record<string, "Active" | "Live" | "Pending" | "Resolved"> = {
    published: "Active",
    active: "Live",
    live: "Live",
    locked: "Live",
    draft: "Pending",
    review: "Pending",
    pending: "Pending",
    resolved: "Resolved",
    canceled: "Resolved",
  };
  return map[status?.toLowerCase()] || "Active";
}

// Map backend prediction type to frontend card type
function mapCardType(
  backendType: string,
  outcomes: any[]
): "percentage" | "yes-no" | "conditional" | "chance" {
  if (backendType === "conditional") return "conditional";
  if (backendType === "multilevel" && outcomes?.length > 2) return "yes-no";
  // Binary single markets
  if (outcomes?.length === 2) {
    const yesOutcome = outcomes.find((o: any) => o.id === "yes" || o.label?.toLowerCase() === "yes");
    if (yesOutcome) return "percentage";
  }
  return "chance";
}

// Format wallet address
function formatWallet(wallet: string): string {
  if (!wallet || wallet.length < 10) return wallet || "FOMO";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

// Default avatar by wallet
function avatarFromWallet(wallet: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${wallet || "default"}`;
}

// Category icon/logo
function categoryLogo(category: string): string {
  const logos: Record<string, string> = {
    crypto: "https://api.dicebear.com/7.x/icons/svg?seed=crypto",
    nft: "https://api.dicebear.com/7.x/icons/svg?seed=nft",
    defi: "https://api.dicebear.com/7.x/icons/svg?seed=defi",
    gaming: "https://api.dicebear.com/7.x/icons/svg?seed=gaming",
    sports: "https://api.dicebear.com/7.x/icons/svg?seed=sports",
    politics: "https://api.dicebear.com/7.x/icons/svg?seed=politics",
    entertainment: "https://api.dicebear.com/7.x/icons/svg?seed=entertainment",
  };
  return logos[category?.toLowerCase()] || logos.crypto;
}

/**
 * Map backend prediction to PredictionCard props
 */
export function mapPredictionToCard(prediction: any) {
  const outcomes = prediction.outcomes || [];
  const cardType = mapCardType(prediction.type, outcomes);

  const base = {
    id: prediction._id,
    type: cardType,
    title: prediction.question || prediction.title || "Unknown",
    subtitle: prediction.subtitle || prediction.description?.slice(0, 60),
    logo: prediction.logo || categoryLogo(prediction.category),
    status: mapStatus(prediction.status),
    risk: mapRisk(prediction.riskLevel),
    author: {
      name: prediction.creatorUsername || formatWallet(prediction.createdBy),
      avatar: prediction.creatorAvatar || avatarFromWallet(prediction.createdBy),
    },
    // Raw data for API calls
    _raw: {
      marketId: prediction._id,
      outcomes,
      totalVolume: prediction.totalVolume || 0,
      totalBets: prediction.totalBets || 0,
      closeTime: prediction.closeTime,
      category: prediction.category,
    },
  };

  // Add type-specific fields
  if (cardType === "percentage") {
    const yes = outcomes.find((o: any) => o.id === "yes" || o.label?.toLowerCase() === "yes");
    const no = outcomes.find((o: any) => o.id === "no" || o.label?.toLowerCase() === "no");
    return {
      ...base,
      percentages: {
        positive: yes?.probability || 50,
        negative: no?.probability || 50,
      },
    };
  }

  if (cardType === "yes-no") {
    return {
      ...base,
      yesNoOptions: outcomes.map((o: any) => ({
        threshold: o.label || o.id,
        percentage: `${o.probability || 0}%`,
        outcomeId: o.id,
        yesMultiplier: o.yesMultiplier?.toFixed(1) || "2.0",
        noMultiplier: o.noMultiplier?.toFixed(1) || "2.0",
      })),
    };
  }

  if (cardType === "conditional") {
    const condition = prediction.condition;
    return {
      ...base,
      conditional: {
        condition: condition?.if
          ? `${condition.if.asset} ${condition.if.operator} $${condition.if.value?.toLocaleString()}`
          : outcomes[0]?.label || "Condition",
        result: condition?.then
          ? `${condition.then.asset} ${condition.then.operator} $${condition.then.value?.toLocaleString()}`
          : outcomes[1]?.label || "Result",
      },
    };
  }

  // chance type
  const mainOutcome = outcomes[0];
  return {
    ...base,
    chance: {
      percentage: mainOutcome?.probability || 50,
      label: "Chance",
    },
  };
}

/**
 * Map live activity from API to LiveBet display format
 */
export function mapActivityToLiveBet(activity: any, index: number) {
  const isGreen = activity.side?.toLowerCase() === "yes" || activity.type === "bet";
  return {
    id: index + 1,
    project: activity.market || "Unknown Market",
    subtitle: "",
    user: activity.user || "Anonymous",
    amount: Math.round(activity.stake || 0),
    betLabel: activity.side || "Yes",
    odds: `${(activity.odds || 2.0).toFixed(1)}x`,
    time: formatTimeAgo(activity.createdAt),
    accent: isGreen ? "green" : "red",
    icon: avatarFromWallet(activity.user || ""),
  };
}

/**
 * Map leaderboard entry to display format
 */
export function mapLeaderboardEntry(entry: any) {
  return {
    id: entry.rank || 0,
    name: entry.username || formatWallet(entry.wallet),
    score: entry.accuracy || 0,
    profit: entry.profit || entry.totalProfit || 0,
    volume: entry.volume || entry.totalStake || 0,
    avatar: entry.avatar || avatarFromWallet(entry.wallet),
    roi: entry.roi || 0,
    leaguePoints: entry.leaguePoints || 0,
    wallet: entry.wallet,
  };
}

function formatTimeAgo(dateStr: string | Date): string {
  if (!dateStr) return "now";
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mth ago`;
}
