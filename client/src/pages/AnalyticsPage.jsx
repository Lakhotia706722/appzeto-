import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { useBoard } from '../hooks/useBoards';

const AnalyticsPage = () => {
  const { boardId } = useParams();
  const { data: board } = useBoard(boardId);
  const [range, setRange] = useState(30);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)]">
      <Navbar title={`${board?.title || 'Board'} — Analytics`} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 px-6 pt-4 pb-2">
            <Link
              to={`/boards/${boardId}`}
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft size={14} />
              Back to board
            </Link>
          </div>
          <AnalyticsDashboard boardId={boardId} range={range} setRange={setRange} />
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage;
