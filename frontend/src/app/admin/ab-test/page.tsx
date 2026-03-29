'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { BarChart3, Users, Trophy, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: #0a0a0f;
  min-height: 100vh;
  color: #fff;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`;

const TestsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TestCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
`;

const TestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const TestInfo = styled.div``;

const TestName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const TestStatus = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $status }) => 
    $status === 'running' ? 'rgba(0, 255, 136, 0.15)' :
    $status === 'completed' ? 'rgba(59, 130, 246, 0.15)' :
    'rgba(255, 255, 255, 0.1)'
  };
  color: ${({ $status }) => 
    $status === 'running' ? '#00FF88' :
    $status === 'completed' ? '#3B82F6' :
    'rgba(255, 255, 255, 0.6)'
  };
`;

const TestMeta = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const VariantsTable = styled.div`
  display: grid;
  gap: 12px;
`;

const VariantRow = styled.div<{ $isWinner?: boolean }>`
  display: grid;
  grid-template-columns: 200px 100px 120px 1fr;
  align-items: center;
  padding: 16px;
  background: ${({ $isWinner }) => 
    $isWinner ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.02)'
  };
  border: 1px solid ${({ $isWinner }) => 
    $isWinner ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.05)'
  };
  border-radius: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const VariantName = styled.div<{ $isWinner?: boolean }>`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ $isWinner }) => $isWinner ? '#00FF88' : '#fff'};
`;

const VariantStat = styled.div`
  text-align: center;
  
  .value {
    font-size: 18px;
    font-weight: 700;
  }
  
  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
  border-radius: 4px;
`;

const Confidence = styled.div<{ $significant: boolean }>`
  text-align: right;
  
  .value {
    font-size: 24px;
    font-weight: 700;
    color: ${({ $significant }) => $significant ? '#00FF88' : 'rgba(255, 255, 255, 0.5)'};
  }
  
  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const WinnerBadge = styled.span`
  background: #00FF88;
  color: #000;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
`;

interface DashboardData {
  totalTests: number;
  runningTests: number;
  completedTests: number;
  totalAssignments: number;
  testsWithWinner: number;
  tests: Array<{
    id: string;
    name: string;
    status: string;
    assignments: number;
    winner: string | null;
    confidence: number;
    significant: boolean;
    variants: Array<{
      id: string;
      name: string;
      assignments: number;
      conversionRate: number;
    }>;
  }>;
}

export default function ABTestDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/ab/dashboard`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (e) {
        console.error('Failed to fetch A/B dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Container>
        <Header>
          <Title><BarChart3 size={28} /> A/B Testing Dashboard</Title>
        </Header>
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container>
        <Header>
          <Title><BarChart3 size={28} /> A/B Testing Dashboard</Title>
        </Header>
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.5)' }}>
          Failed to load data
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title><BarChart3 size={28} /> A/B Testing Dashboard</Title>
        <Subtitle>Target: 2,000 users across 3 tests (1,000 per variant)</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon $color="#00FF88"><BarChart3 size={20} /></StatIcon>
          <StatValue>{data.totalTests}</StatValue>
          <StatLabel>Total Tests</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $color="#FFC107"><Clock size={20} /></StatIcon>
          <StatValue>{data.runningTests}</StatValue>
          <StatLabel>Running</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $color="#3B82F6"><Users size={20} /></StatIcon>
          <StatValue>{data.totalAssignments.toLocaleString()}</StatValue>
          <StatLabel>Total Assignments</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $color="#8B5CF6"><Trophy size={20} /></StatIcon>
          <StatValue>{data.testsWithWinner}</StatValue>
          <StatLabel>With Winner</StatLabel>
        </StatCard>
      </StatsGrid>

      <TestsGrid>
        {data.tests.map(test => (
          <TestCard key={test.id}>
            <TestHeader>
              <TestInfo>
                <TestName>{test.name}</TestName>
                <TestMeta>
                  <span>ID: {test.id}</span>
                  <span>{test.assignments.toLocaleString()} assignments</span>
                </TestMeta>
              </TestInfo>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TestStatus $status={test.status}>
                  {test.status === 'running' ? <Clock size={12} /> : <CheckCircle size={12} />}
                  {test.status}
                </TestStatus>
                {test.significant && (
                  <Confidence $significant={test.significant}>
                    <div className="value">{test.confidence}%</div>
                    <div className="label">Confidence</div>
                  </Confidence>
                )}
              </div>
            </TestHeader>

            <VariantsTable>
              {test.variants.map(variant => {
                const isWinner = test.winner === variant.id;
                const maxConversion = Math.max(...test.variants.map(v => v.conversionRate));
                
                return (
                  <VariantRow key={variant.id} $isWinner={isWinner}>
                    <VariantName $isWinner={isWinner}>
                      {variant.name}
                      {isWinner && <WinnerBadge>WINNER</WinnerBadge>}
                    </VariantName>
                    <VariantStat>
                      <div className="value">{variant.assignments}</div>
                      <div className="label">Users</div>
                    </VariantStat>
                    <VariantStat>
                      <div className="value">{variant.conversionRate}%</div>
                      <div className="label">Conversion</div>
                    </VariantStat>
                    <ProgressBar>
                      <ProgressFill 
                        $width={(variant.conversionRate / (maxConversion || 1)) * 100}
                        $color={isWinner ? '#00FF88' : '#3B82F6'}
                      />
                    </ProgressBar>
                  </VariantRow>
                );
              })}
            </VariantsTable>
          </TestCard>
        ))}
      </TestsGrid>
    </Container>
  );
}
