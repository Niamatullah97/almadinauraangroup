import { ParticipantResultRow, ResultSummaryCounts, ResultWinner } from '@kabootar/shared';
import { ReactNode } from 'react';

import { RankingTable, ResultSummary, WinnerCard } from '@/components/ui/ResultCards';

interface ResultPageContentProps {
  title: string;
  subtitle?: string;
  summary: ResultSummaryCounts;
  loftsCount: number;
  firstWinner: ResultWinner | null;
  lastWinner: ResultWinner | null;
  averageWinner: ResultWinner | null;
  rankings: ParticipantResultRow[];
  compactPigeonColumns?: boolean;
  doubleStampView?: boolean;
  nominatedView?: 'double-stamp' | 'single-nominated';
  showWinners?: boolean;
  rankingsContent?: ReactNode;
}

export function ResultPageContent({
  title,
  subtitle,
  summary,
  loftsCount,
  firstWinner,
  lastWinner,
  averageWinner,
  rankings,
  compactPigeonColumns = false,
  doubleStampView = false,
  nominatedView,
  showWinners = true,
  rankingsContent,
}: ResultPageContentProps) {
  return (
    <>
      <div className="result-page-heading">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <ResultSummary summary={summary} loftsCount={loftsCount} />

      {showWinners && (
        <>
          <h2 className="section-title">Winners</h2>
          <div className="winners-grid">
            <WinnerCard title="First Winner" winner={firstWinner} />
            <WinnerCard title="Last Winner" winner={lastWinner} />
            <WinnerCard title="Average Winner" winner={averageWinner} />
          </div>
        </>
      )}

      <h2 className="section-title">Rankings</h2>
      {rankingsContent ?? (
        <RankingTable
          rows={rankings}
          compactPigeonColumns={compactPigeonColumns}
          doubleStampView={doubleStampView}
          nominatedView={nominatedView}
          firstWinner={firstWinner}
          lastWinner={lastWinner}
          averageWinner={averageWinner}
        />
      )}
    </>
  );
}
