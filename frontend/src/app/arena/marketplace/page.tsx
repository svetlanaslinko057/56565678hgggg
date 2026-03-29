'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { MarketplaceAPI } from '@/lib/api/arena';
import { useArena } from '@/lib/api/ArenaContext';
import { ShoppingCart, Search, Filter, TrendingUp, DollarSign, Users, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #738094;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  padding: 10px 16px;
  width: 320px;
  
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    color: #0f172a;
    
    &::placeholder {
      color: #738094;
    }
  }
`;

const StatsRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f7fa;
  padding: 10px 16px;
  border-radius: 10px;
  
  span {
    font-size: 14px;
    color: #738094;
  }
  
  strong {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active }) => $active ? `
    background: #05A584;
    color: #fff;
    border: none;
  ` : `
    background: #fff;
    color: #738094;
    border: 1px solid #eef1f5;
    
    &:hover {
      border-color: #05A584;
      color: #05A584;
    }
  `}
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: #fff;
  color: #738094;
  border: 1px solid #eef1f5;
  margin-left: auto;
  
  &:hover {
    border-color: #05A584;
    color: #05A584;
  }
`;

const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
`;

const ListingCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #eef1f5;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }
`;

const ListingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const ListingTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  flex: 1;
  margin-right: 12px;
  line-height: 1.4;
`;

const PriceBadge = styled.div`
  background: linear-gradient(135deg, #05A584, #048a6e);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
`;

const ListingMeta = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const MetaTag = styled.span<{ $variant?: string }>`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'yes':
        return 'background: #E6F7F3; color: #05A584;';
      case 'no':
        return 'background: #FEE2E2; color: #FF5858;';
      default:
        return 'background: #EEF1F5; color: #738094;';
    }
  }}
`;

const ListingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #eef1f5;
  border-bottom: 1px solid #eef1f5;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #738094;
  margin-bottom: 4px;
`;

const StatValue = styled.div<{ $highlight?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $highlight }) => $highlight ? '#05A584' : '#0f172a'};
`;

const ListingFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SellerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }
  
  span {
    font-size: 13px;
    color: #738094;
  }
`;

const BuyButton = styled.button`
  background: #05A584;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: #048a6e;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px dashed #e5e7eb;
  grid-column: 1 / -1;
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #eef1f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #738094;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px;
  color: #738094;
  grid-column: 1 / -1;
`;

type SortType = 'price_asc' | 'price_desc' | 'recent' | 'potential';

export default function MarketplacePage() {
  const router = useRouter();
  const { currentWallet, refreshBalance, refreshPositions } = useArena();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [sideFilter, setSideFilter] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await MarketplaceAPI.getListings({ limit: 50 });
      setListings(result.data || []);
    } catch (e) {
      console.error('Failed to fetch listings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleBuy = async (listingId: string) => {
    if (!currentWallet) {
      alert('Please start a demo session first');
      return;
    }
    
    setBuyingId(listingId);
    try {
      const result = await MarketplaceAPI.buyListing(listingId);
      if (result.success) {
        await fetchListings();
        await refreshBalance();
        await refreshPositions();
        alert('Purchase successful!');
      } else {
        alert(`Purchase failed: ${result.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setBuyingId(null);
    }
  };

  // Filter and sort listings
  let filteredListings = listings;
  
  if (searchQuery) {
    filteredListings = filteredListings.filter(l => 
      l.outcomeLabel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.marketTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (sideFilter) {
    filteredListings = filteredListings.filter(l => 
      l.side?.toLowerCase() === sideFilter.toLowerCase()
    );
  }

  // Sort
  filteredListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return (a.price || 0) - (b.price || 0);
      case 'price_desc':
        return (b.price || 0) - (a.price || 0);
      case 'potential':
        return (b.potentialReturn || 0) - (a.potentialReturn || 0);
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Stats
  const totalListings = listings.length;
  const totalVolume = listings.reduce((sum, l) => sum + (l.price || 0), 0);
  const avgPrice = totalListings > 0 ? totalVolume / totalListings : 0;

  const crumbs = [
    { title: 'Arena', link: '/' },
    { title: 'Marketplace', link: '' },
  ];

  const formatWallet = (wallet: string) => {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <Container>
        <Header>
          <TitleSection>
            <Title data-testid="marketplace-title">
              <ShoppingCart size={28} color="#05A584" />
              Marketplace
            </Title>
            <Subtitle>Buy and sell prediction positions from other traders</Subtitle>
          </TitleSection>
          
          <SearchBar>
            <Search size={18} color="#738094" />
            <input
              type="text"
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="marketplace-search"
            />
          </SearchBar>
        </Header>

        <StatsRow>
          <StatBadge>
            <ShoppingCart size={18} color="#05A584" />
            <span>Active Listings:</span>
            <strong data-testid="total-listings">{totalListings}</strong>
          </StatBadge>
          <StatBadge>
            <DollarSign size={18} color="#3B82F6" />
            <span>Total Volume:</span>
            <strong>${totalVolume.toFixed(2)}</strong>
          </StatBadge>
          <StatBadge>
            <TrendingUp size={18} color="#8B5CF6" />
            <span>Avg. Price:</span>
            <strong>${avgPrice.toFixed(2)}</strong>
          </StatBadge>
        </StatsRow>

        <FiltersRow>
          <FilterButton
            $active={sideFilter === null}
            onClick={() => setSideFilter(null)}
            data-testid="filter-all"
          >
            All Positions
          </FilterButton>
          <FilterButton
            $active={sideFilter === 'yes'}
            onClick={() => setSideFilter(sideFilter === 'yes' ? null : 'yes')}
            data-testid="filter-yes"
          >
            Yes Positions
          </FilterButton>
          <FilterButton
            $active={sideFilter === 'no'}
            onClick={() => setSideFilter(sideFilter === 'no' ? null : 'no')}
            data-testid="filter-no"
          >
            No Positions
          </FilterButton>
          
          <SortButton onClick={() => {
            const order: SortType[] = ['recent', 'price_asc', 'price_desc', 'potential'];
            const idx = order.indexOf(sortBy);
            setSortBy(order[(idx + 1) % order.length]);
          }}>
            <ArrowUpDown size={14} />
            Sort: {sortBy === 'recent' ? 'Recent' : sortBy === 'price_asc' ? 'Price ↑' : sortBy === 'price_desc' ? 'Price ↓' : 'Potential'}
          </SortButton>
        </FiltersRow>

        <ListingsGrid data-testid="listings-grid">
          {loading ? (
            <LoadingState>Loading marketplace listings...</LoadingState>
          ) : filteredListings.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <ShoppingCart size={28} color="#738094" />
              </EmptyIcon>
              <EmptyTitle>No listings available</EmptyTitle>
              <EmptyText>
                {searchQuery || sideFilter 
                  ? 'Try adjusting your filters' 
                  : 'Be the first to list a position for sale!'}
              </EmptyText>
            </EmptyState>
          ) : (
            filteredListings.map((listing) => (
              <ListingCard key={listing._id} data-testid={`listing-${listing._id}`}>
                <ListingHeader>
                  <ListingTitle>{listing.outcomeLabel || listing.marketTitle || 'Position'}</ListingTitle>
                  <PriceBadge>${listing.price?.toFixed(2)}</PriceBadge>
                </ListingHeader>
                
                <ListingMeta>
                  <MetaTag $variant={listing.side?.toLowerCase() || 'yes'}>
                    {listing.side || 'Yes'}
                  </MetaTag>
                  <MetaTag>
                    {listing.odds?.toFixed(2)}x Odds
                  </MetaTag>
                </ListingMeta>

                <ListingStats>
                  <StatItem>
                    <StatLabel>Original Stake</StatLabel>
                    <StatValue>${listing.stake?.toFixed(2)}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Potential Return</StatLabel>
                    <StatValue $highlight>${listing.potentialReturn?.toFixed(2)}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>ROI if Win</StatLabel>
                    <StatValue $highlight>
                      {listing.price && listing.potentialReturn
                        ? `${(((listing.potentialReturn - listing.price) / listing.price) * 100).toFixed(0)}%`
                        : '-'}
                    </StatValue>
                  </StatItem>
                </ListingStats>

                <ListingFooter>
                  <SellerInfo>
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.sellerWallet}`}
                      alt="Seller"
                    />
                    <span>{formatWallet(listing.sellerWallet)}</span>
                  </SellerInfo>
                  
                  <BuyButton
                    onClick={() => handleBuy(listing._id)}
                    disabled={buyingId === listing._id || listing.sellerWallet === currentWallet}
                    data-testid={`buy-${listing._id}`}
                  >
                    <ShoppingCart size={16} />
                    {buyingId === listing._id ? 'Buying...' : 
                     listing.sellerWallet === currentWallet ? 'Your Listing' : 'Buy Now'}
                  </BuyButton>
                </ListingFooter>
              </ListingCard>
            ))
          )}
        </ListingsGrid>
      </Container>
    </PageWrapper>
  );
}
