
import React, { useMemo, useState } from 'react';
import { User, DailyWorkUpdate, MonthlyStats, UserRole } from '../types';
import { Icons, CATEGORY_LABELS } from '../constants';
import ReportViewer from './ReportViewer';
import LogViewer from './LogViewer';

interface AdminDashboardProps {
  users: User[];
  updates: DailyWorkUpdate[];
  onGenerateReport: (userId: string, month: string) => Promise<string>;
  onViewDetails: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, updates, onGenerateReport, onViewDetails }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [viewLogsUserId, setViewLogsUserId] = useState<string | null>(null);
  const [reportState, setReportState] = useState<{ isOpen: boolean; content: string; userName: string; month: string; isLoading: boolean; userUpdates: DailyWorkUpdate[] }>({
    isOpen: false,
    content: '',
    userName: '',
    month: '',
    isLoading: false,
    userUpdates: []
  });

  const stats: MonthlyStats[] = useMemo(() => {
    return users
      .filter(u => u.role === UserRole.USER)
      .map(user => {
        const userUpdates = updates.filter(up => up.userId === user.id && up.month === selectedMonth);
        const totalHours = userUpdates.reduce((acc, curr) => acc + curr.totalTime, 0);
        const avgProductivity = userUpdates.length > 0
          ? userUpdates.reduce((acc, curr) => acc + curr.productivityScore, 0) / userUpdates.length
          : 0;

        // Mock "Days Missed" calculation - assumes 22 working days per month
        const daysMissed = Math.max(0, 22 - userUpdates.length);

        return {
          userId: user.id,
          name: user.name,
          updatesSubmitted: userUpdates.length,
          totalHours,
          avgProductivity,
          daysMissed
        };
      });
  }, [users, updates, selectedMonth]);

  const handleGenerateReport = async (userId: string, userName: string) => {
    const userUpdates = updates.filter(up => up.userId === userId && up.month === selectedMonth);
    setReportState({ ...reportState, isOpen: true, isLoading: true, userName, month: selectedMonth, userUpdates });
    try {
      const content = await onGenerateReport(userId, selectedMonth);
      setReportState(prev => ({ ...prev, content, isLoading: false }));
    } catch (err: any) {
      console.error(err);
      alert("Error generating report: " + (err.message || "Unknown error"));
      setReportState(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Executive Dashboard</h2>
          <p className="text-gray-500 mt-2">Operational overview for {selectedMonth}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="w-48">
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-muted border border-border rounded-none p-3 focus:border-accent outline-none text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Total Operational Hours</p>
          <p className="text-4xl font-black text-accent">{stats.reduce((a, b) => a + b.totalHours, 0).toFixed(1)}h</p>
        </div>
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Average Productivity</p>
          <p className="text-4xl font-black text-white">
            {(stats.reduce((a, b) => a + b.avgProductivity, 0) / (stats.filter(s => s.updatesSubmitted > 0).length || 1)).toFixed(1)}
          </p>
        </div>
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Avg. Updates / User</p>
          <p className="text-4xl font-black text-white">
            {(stats.reduce((a, b) => a + b.updatesSubmitted, 0) / (stats.length || 1)).toFixed(1)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-gray-500">
              <th className="py-4 font-bold px-4">User</th>
              <th className="py-4 font-bold px-4">Updates</th>
              <th className="py-4 font-bold px-4">Logged Hours</th>
              <th className="py-4 font-bold px-4">Avg. Score</th>
              <th className="py-4 font-bold px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((stat) => (
              <tr key={stat.userId} className="group hover:bg-muted transition-colors">
                <td className="py-4 px-4 font-bold">{stat.name}</td>
                <td className="py-4 px-4">{stat.updatesSubmitted}</td>
                <td className="py-4 px-4 font-mono">{stat.totalHours.toFixed(1)}h</td>
                <td className="py-4 px-4">
                  <span className={`font-black ${stat.avgProductivity > 7 ? 'text-green-500' : stat.avgProductivity < 4 ? 'text-red-500' : 'text-accent'}`}>
                    {stat.avgProductivity.toFixed(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleGenerateReport(stat.userId, stat.name)}
                      className="px-3 py-1.5 bg-accent text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
                    >
                      AI Report
                    </button>
                    <button
                      onClick={() => setViewLogsUserId(stat.userId)}
                      className="px-3 py-1.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                    >
                      View Logs
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-only Card View */}
      <div className="md:hidden space-y-4">
        {stats.map((stat) => (
          <div key={stat.userId} className="bg-muted p-4 border border-border space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-white">{stat.name}</p>
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                  {stat.updatesSubmitted} Updates this month
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-accent">{stat.totalHours.toFixed(1)}h</p>
                <p className={`text-[10px] font-black uppercase ${stat.avgProductivity > 7 ? 'text-green-500' : stat.avgProductivity < 4 ? 'text-red-500' : 'text-accent'}`}>
                  Score: {stat.avgProductivity.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleGenerateReport(stat.userId, stat.name)}
                className="w-full py-3 bg-accent text-black text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
              >
                AI Report
              </button>
              <button
                onClick={() => setViewLogsUserId(stat.userId)}
                className="w-full py-3 border border-border text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center"
              >
                View Logs
              </button>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="py-10 text-center border border-dashed border-border">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No stats available</p>
          </div>
        )}
      </div>

      {reportState.isOpen && (
        <ReportViewer
          content={reportState.content}
          userName={reportState.userName}
          month={reportState.month}
          isLoading={reportState.isLoading}
          updates={reportState.userUpdates}
          onClose={() => setReportState({ ...reportState, isOpen: false })}
        />
      )}

      {viewLogsUserId && (
        <LogViewer
          updates={updates.filter(u => u.userId === viewLogsUserId)}
          userName={users.find(u => u.id === viewLogsUserId)?.name || 'Unknown User'}
          onClose={() => setViewLogsUserId(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
