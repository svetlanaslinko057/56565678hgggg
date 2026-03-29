'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { useArena } from '@/lib/api/ArenaContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Eye,
  FileText,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #738094;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #05A584;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #048a6e;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 4px;
  background: #f5f7fa;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
  width: fit-content;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${({ $active }) => $active ? `
    background: #fff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  ` : `
    background: transparent;
    color: #738094;
    
    &:hover {
      color: #0f172a;
    }
  `}
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  
  ${({ $status }) => {
    switch ($status) {
      case 'draft':
        return 'background: #EEF1F5; color: #738094;';
      case 'review':
        return 'background: #FEF3C7; color: #D97706;';
      case 'approved':
        return 'background: #D1FAE5; color: #059669;';
      case 'rejected':
        return 'background: #FEE2E2; color: #DC2626;';
      case 'published':
        return 'background: #DBEAFE; color: #2563EB;';
      default:
        return 'background: #EEF1F5; color: #738094;';
    }
  }}
`;

const DraftsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DraftCard = styled.div<{ $status: string }>`
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #eef1f5;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
  
  border-left: 4px solid ${({ $status }) => {
    switch ($status) {
      case 'draft': return '#9CA3AF';
      case 'review': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'published': return '#3B82F6';
      default: return '#9CA3AF';
    }
  }};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
`;

const DraftIcon = styled.div<{ $status: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: ${({ $status }) => {
    switch ($status) {
      case 'draft': return '#F3F4F6';
      case 'review': return '#FEF3C7';
      case 'approved': return '#D1FAE5';
      case 'rejected': return '#FEE2E2';
      case 'published': return '#DBEAFE';
      default: return '#F3F4F6';
    }
  }};
  
  svg {
    color: ${({ $status }) => {
      switch ($status) {
        case 'draft': return '#6B7280';
        case 'review': return '#D97706';
        case 'approved': return '#059669';
        case 'rejected': return '#DC2626';
        case 'published': return '#2563EB';
        default: return '#6B7280';
      }
    }};
  }
`;

const DraftInfo = styled.div`
  flex: 1;
`;

const DraftTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
`;

const DraftMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: 12px;
  color: #738094;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DraftStats = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const Stat = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: #738094;
  margin-bottom: 2px;
`;

const StatValue = styled.div<{ $highlight?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${({ $highlight }) => $highlight ? '#05A584' : '#0f172a'};
`;

const ActionBtn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${({ $primary, $danger }) => $primary ? `
    background: #05A584;
    color: #fff;
    border: none;
    
    &:hover {
      background: #048a6e;
    }
  ` : $danger ? `
    background: #FEE2E2;
    color: #DC2626;
    border: none;
    
    &:hover {
      background: #FECACA;
    }
  ` : `
    background: #fff;
    color: #738094;
    border: 1px solid #eef1f5;
    
    &:hover {
      border-color: #05A584;
      color: #05A584;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 16px;
  border: 1px dashed #e5e7eb;
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
  margin-bottom: 20px;
`;

const RejectionNote = styled.div`
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 13px;
  color: #991B1B;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #738094;
`;

type TabType = 'all' | 'draft' | 'review' | 'approved' | 'rejected';

interface Draft {
  _id: string;
  title: string;
  status: string;
  stakeAmount: number;
  stakeStatus: string;
  closeTime: string;
  createdAt: string;
  rejectionReason?: string;
  publishedMarketId?: string;
}

export default function MyMarketsPage() {
  const router = useRouter();
  const { currentWallet, refreshBalance } = useArena();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    if (!currentWallet) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/my`,
        {
          headers: {
            'X-Wallet-Address': currentWallet,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setDrafts(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch drafts:', e);
    } finally {
      setLoading(false);
    }
  }, [currentWallet]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const filteredDrafts = activeTab === 'all' 
    ? drafts 
    : drafts.filter(d => d.status === activeTab);

  const counts = {
    all: drafts.length,
    draft: drafts.filter(d => d.status === 'draft').length,
    review: drafts.filter(d => d.status === 'review').length,
    approved: drafts.filter(d => d.status === 'approved').length,
    rejected: drafts.filter(d => d.status === 'rejected').length,
  };

  const handleSubmit = async (draftId: string) => {
    setActionLoading(draftId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/${draftId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': currentWallet || '',
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchDrafts();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (draftId: string) => {
    if (!confirm('Cancel this draft? Your stake will be returned.')) return;
    
    setActionLoading(draftId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/${draftId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Wallet-Address': currentWallet || '',
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        await fetchDrafts();
        await refreshBalance();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={22} />;
      case 'review': return <Clock size={22} />;
      case 'approved': return <CheckCircle size={22} />;
      case 'rejected': return <XCircle size={22} />;
      case 'published': return <ExternalLink size={22} />;
      default: return <FileText size={22} />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const crumbs = [
    { title: 'Arena', link: '/' },
    { title: 'My Markets', link: '' },
  ];

  if (!currentWallet) {
    return (
      <PageWrapper>
        <Container>
          <EmptyState>
            <EmptyTitle>Connect to View Markets</EmptyTitle>
            <EmptyText>Start a demo session to create and manage markets</EmptyText>
            <CreateButton onClick={() => router.push('/')}>
              Go to Arena
            </CreateButton>
          </EmptyState>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <Container>
        <Header>
          <TitleSection>
            <Title data-testid="my-markets-title">My Markets</Title>
            <Subtitle>Create, track and manage your prediction markets</Subtitle>
          </TitleSection>
          <CreateButton onClick={() => router.push('/arena/create')} data-testid="create-market-btn">
            <Plus size={18} />
            Create Market
          </CreateButton>
        </Header>

        <TabsContainer>
          {(['all', 'draft', 'review', 'approved', 'rejected'] as const).map((tab) => (
            <Tab
              key={tab}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <StatusBadge $status={tab === 'all' ? 'draft' : tab}>
                {counts[tab]}
              </StatusBadge>
            </Tab>
          ))}
        </TabsContainer>

        {loading ? (
          <LoadingState>Loading your markets...</LoadingState>
        ) : filteredDrafts.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <FileText size={28} color="#738094" />
            </EmptyIcon>
            <EmptyTitle>No {activeTab === 'all' ? '' : activeTab} markets</EmptyTitle>
            <EmptyText>Create your first prediction market to see it here</EmptyText>
            <CreateButton onClick={() => router.push('/arena/create')}>
              <Plus size={18} />
              Create Market
            </CreateButton>
          </EmptyState>
        ) : (
          <DraftsGrid data-testid="drafts-list">
            {filteredDrafts.map((draft) => (
              <DraftCard key={draft._id} $status={draft.status} data-testid={`draft-${draft._id}`}>
                <DraftIcon $status={draft.status}>
                  {getStatusIcon(draft.status)}
                </DraftIcon>
                
                <DraftInfo>
                  <DraftTitle>{draft.title}</DraftTitle>
                  <DraftMeta>
                    <StatusBadge $status={draft.status}>
                      {draft.status.toUpperCase()}
                    </StatusBadge>
                    <MetaItem>
                      <Clock size={12} />
                      Created {formatDate(draft.createdAt)}
                    </MetaItem>
                    <MetaItem>
                      Closes {formatDate(draft.closeTime)}
                    </MetaItem>
                  </DraftMeta>
                  
                  {draft.status === 'rejected' && draft.rejectionReason && (
                    <RejectionNote>
                      <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      {draft.rejectionReason}
                    </RejectionNote>
                  )}
                </DraftInfo>

                <DraftStats>
                  <Stat>
                    <StatLabel>Stake</StatLabel>
                    <StatValue>${draft.stakeAmount}</StatValue>
                  </Stat>
                  <Stat>
                    <StatLabel>Stake Status</StatLabel>
                    <StatValue $highlight={draft.stakeStatus === 'returned'}>
                      {draft.stakeStatus}
                    </StatValue>
                  </Stat>
                </DraftStats>

                {draft.status === 'draft' && (
                  <>
                    <ActionBtn
                      $primary
                      onClick={() => handleSubmit(draft._id)}
                      disabled={actionLoading === draft._id}
                      data-testid={`submit-${draft._id}`}
                    >
                      <Send size={14} />
                      {actionLoading === draft._id ? 'Submitting...' : 'Submit'}
                    </ActionBtn>
                    <ActionBtn
                      $danger
                      onClick={() => handleCancel(draft._id)}
                      disabled={actionLoading === draft._id}
                    >
                      Cancel
                    </ActionBtn>
                  </>
                )}

                {draft.status === 'review' && (
                  <ActionBtn disabled>
                    <Clock size={14} />
                    Pending Review
                  </ActionBtn>
                )}

                {draft.status === 'approved' && draft.publishedMarketId && (
                  <ActionBtn
                    $primary
                    onClick={() => router.push(`/arena/${draft.publishedMarketId}`)}
                  >
                    <Eye size={14} />
                    View Market
                  </ActionBtn>
                )}
              </DraftCard>
            ))}
          </DraftsGrid>
        )}
      </Container>
    </PageWrapper>
  );
}
