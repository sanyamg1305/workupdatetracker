
import React, { useMemo, useState, useEffect } from 'react';
import { User, DailyWorkUpdate, MonthlyStats, UserRole, ProjectTask } from '../types';
import { Icons } from '../constants';
import ReportViewer from './ReportViewer';
import LogViewer from './LogViewer';
import { storageService } from '../services/storageService';

interface AdminDashboardProps {
  users: User[];
  updates: DailyWorkUpdate[];
  onGenerateReport: (userId: string, month: string) => Promise<string>;
  onViewDetails: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, updates, onGenerateReport, onViewDetails }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [viewTab, setViewTab] = useState<'USERS' | 'CLIENTS' | 'TASKS'>('USERS');
  const [viewLogsUserId, setViewLogsUserId] = useState<string | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  
  const [reportState, setReportState] = useState<{ isOpen: boolean; content: string; userName: string; month: string; isLoading: boolean; userUpdates: DailyWorkUpdate[] }>({
    isOpen: false,
    content: '',
    userName: '',
    month: '',
    isLoading: false,
    userUpdates: []
  });

  useEffect(() => {
    storageService.getTasks().then(setProjectTasks);
  }, []);

  const monthUpdates = useMemo(() => (updates || []).filter(u => u.month === selectedMonth), [updates, selectedMonth]);
  const monthTasksMap = useMemo(() => {
      const map = new Map<string, number>();
      monthUpdates.forEach(u => {
          u.tasks.forEach(t => {
              if (t.projectTaskId) {
                  map.set(t.projectTaskId, (map.get(t.projectTaskId) || 0) + (t.timeSpent || 0));
              }
          });
      });
      return map;
  }, [monthUpdates]);

  const userStats = useMemo(() => {
    return (users || [])
      .filter(u => u.role === UserRole.USER)
      .map(user => {
        const userUpdates = monthUpdates.filter(up => up.userId === user.id);
        const totalHours = userUpdates.reduce((acc, curr) => acc + (curr.totalTime || 0), 0);
        const avgProductivity = userUpdates.length > 0
          ? userUpdates.reduce((acc, curr) => acc + (curr.productivityScore || 0), 0) / userUpdates.length
          : 0;

        const allUserTasks = projectTasks.filter(pt => (pt.assignedUserIds || []).includes(user.id));
        const multiAssigneeCount = allUserTasks.filter(pt => (pt.assignedUserIds || []).length > 1).length;

        let plannedHours = 0;
        let unplannedHours = 0;
        let totalVariance = 0; // Negative means under budget, positive means overrun

        userUpdates.forEach(u => {
            u.tasks.forEach(t => {
                if (t.isScheduled) {
                    plannedHours += (t.timeSpent || 0);
                    if (t.variance) totalVariance += t.variance;
                } else {
                    unplannedHours += (t.timeSpent || 0);
                }
            });
        });

        return {
          userId: user.id,
          name: user.name,
          updatesSubmitted: userUpdates.length,
          totalHours,
          avgProductivity,
          assignedTaskCount: allUserTasks.length,
          multiAssigneeCount,
          plannedHours,
          unplannedHours,
          totalVariance
        };
      });
  }, [users, monthUpdates, projectTasks]);

  const clientStats = useMemo(() => {
     const clients = Array.from(new Set(projectTasks.map(pt => pt.client)));
     return clients.map(client => {
         const cTasks = projectTasks.filter(pt => pt.client === client);
         const totalEst = cTasks.reduce((acc, t) => acc + t.timeEstimate, 0);
         const totalAct = cTasks.reduce((acc, t) => acc + (monthTasksMap.get(t.id) || 0), 0);
         const variance = totalAct - totalEst;
         return {
             client,
             totalTasks: cTasks.length,
             totalEst,
             totalAct,
             variance
         };
     }).sort((a, b) => b.variance - a.variance); // most overruns first
  }, [projectTasks, monthTasksMap]);

  const taskStats = useMemo(() => {
      return projectTasks.map(pt => {
          const actual = monthTasksMap.get(pt.id) || 0;
          return {
              id: pt.id,
              title: pt.title,
              client: pt.client,
              assigneeCount: (pt.assignedUserIds || []).length,
              est: pt.timeEstimate,
              act: actual,
              variance: actual - pt.timeEstimate,
              status: pt.status
          }
      }).sort((a, b) => b.variance - a.variance);
  }, [projectTasks, monthTasksMap]);

  const handleGenerateReport = async (userId: string, userName: string) => {
    const userUpdates = monthUpdates.filter(up => up.userId === userId);
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Total Operational Hours</p>
          <p className="text-4xl font-black text-accent">{userStats.reduce((a, b) => a + b.totalHours, 0).toFixed(1)}h</p>
        </div>
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Avg Productivity</p>
          <p className="text-4xl font-black text-white">
            {(userStats.reduce((a, b) => a + b.avgProductivity, 0) / (userStats.filter(s => s.updatesSubmitted > 0).length || 1)).toFixed(1)}
          </p>
        </div>
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Planned Hours</p>
          <p className="text-4xl font-black text-white">{userStats.reduce((a, b) => a + b.plannedHours, 0).toFixed(1)}h</p>
        </div>
        <div className="bg-muted p-6 border border-border">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Unplanned Hours</p>
          <p className="text-4xl font-black text-gray-400">{userStats.reduce((a, b) => a + b.unplannedHours, 0).toFixed(1)}h</p>
        </div>
      </div>

      <div className="border-b border-border flex space-x-8">
          <button onClick={() => setViewTab('USERS')} className={`pb-2 uppercase text-xs font-black tracking-widest ${viewTab === 'USERS' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-white'}`}>Team Performance</button>
          <button onClick={() => setViewTab('CLIENTS')} className={`pb-2 uppercase text-xs font-black tracking-widest ${viewTab === 'CLIENTS' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-white'}`}>Client Margins</button>
          <button onClick={() => setViewTab('TASKS')} className={`pb-2 uppercase text-xs font-black tracking-widest ${viewTab === 'TASKS' ? 'text-accent border-b-2 border-accent' : 'text-gray-500 hover:text-white'}`}>Task Execution</button>
      </div>

      {viewTab === 'USERS' && (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[9px] uppercase tracking-widest text-gray-500">
              <th className="py-4 font-bold px-4">User</th>
              <th className="py-4 font-bold px-4">Score</th>
              <th className="py-4 font-bold px-4">Active Tasks (Multi)</th>
              <th className="py-4 font-bold px-4">Planned vs Unplanned</th>
              <th className="py-4 font-bold px-4">Est. Variance</th>
              <th className="py-4 font-bold px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {userStats.map((stat) => (
              <tr key={stat.userId} className="group hover:bg-muted transition-colors">
                <td className="py-4 px-4 font-bold">{stat.name}</td>
                <td className="py-4 px-4">
                  <span className={`font-black ${stat.avgProductivity > 7 ? 'text-green-500' : stat.avgProductivity < 4 ? 'text-red-500' : 'text-accent'}`}>
                    {stat.avgProductivity.toFixed(1)}
                  </span>
                </td>
                <td className="py-4 px-4 font-mono text-xs">{stat.assignedTaskCount} ({stat.multiAssigneeCount} Shared)</td>
                <td className="py-4 px-4 font-mono text-xs">
                    <span className="text-white">{stat.plannedHours.toFixed(1)}h</span> / <span className="text-gray-500">{stat.unplannedHours.toFixed(1)}h</span>
                </td>
                <td className="py-4 px-4 font-mono text-xs">
                    <span className={stat.totalVariance > 0 ? 'text-red-500' : stat.totalVariance < 0 ? 'text-green-500' : 'text-gray-500'}>
                        {stat.totalVariance > 0 ? '+' : ''}{stat.totalVariance.toFixed(1)}h
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
                      Logs
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {viewTab === 'CLIENTS' && (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[9px] uppercase tracking-widest text-gray-500">
              <th className="py-4 font-bold px-4">Client</th>
              <th className="py-4 font-bold px-4">Total Tasks</th>
              <th className="py-4 font-bold px-4">Total Estimated</th>
              <th className="py-4 font-bold px-4">Total Actual Logged</th>
              <th className="py-4 font-bold px-4">Variance (Overruns)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clientStats.map((stat, i) => (
              <tr key={i} className="group hover:bg-muted transition-colors">
                <td className="py-4 px-4 font-bold uppercase">{stat.client}</td>
                <td className="py-4 px-4 font-mono text-xs">{stat.totalTasks}</td>
                <td className="py-4 px-4 font-mono text-xs">{stat.totalEst.toFixed(1)}h</td>
                <td className="py-4 px-4 font-mono text-xs">{stat.totalAct.toFixed(1)}h</td>
                <td className="py-4 px-4 font-mono text-xs">
                    <span className={stat.variance > 0 ? 'text-red-500 font-bold' : stat.variance < 0 ? 'text-green-500' : 'text-gray-500'}>
                        {stat.variance > 0 ? '+' : ''}{stat.variance.toFixed(1)}h
                    </span>
                </td>
              </tr>
            ))}
            {clientStats.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-xs tracking-widest uppercase">No Client Data</td></tr>}
          </tbody>
        </table>
      </div>
      )}

      {viewTab === 'TASKS' && (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[9px] uppercase tracking-widest text-gray-500">
              <th className="py-4 font-bold px-4">Task</th>
              <th className="py-4 font-bold px-4">Client</th>
              <th className="py-4 font-bold px-4">Assignees</th>
              <th className="py-4 font-bold px-4">Est / Actual</th>
              <th className="py-4 font-bold px-4">Variance</th>
              <th className="py-4 font-bold px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {taskStats.map((stat, i) => (
              <tr key={i} className="group hover:bg-muted transition-colors">
                <td className="py-4 px-4 font-bold truncate max-w-[200px]">{stat.title}</td>
                <td className="py-4 px-4 text-xs font-bold text-gray-400 uppercase">{stat.client}</td>
                <td className="py-4 px-4 font-mono text-xs">{stat.assigneeCount} Users</td>
                <td className="py-4 px-4 font-mono text-xs">{stat.est.toFixed(1)}h / {stat.act.toFixed(1)}h</td>
                <td className="py-4 px-4 font-mono text-xs">
                    <span className={stat.variance > 0 ? 'text-red-500 font-bold' : stat.variance < 0 ? 'text-green-500' : 'text-gray-500'}>
                        {stat.variance > 0 ? '+' : ''}{stat.variance.toFixed(1)}h
                    </span>
                </td>
                <td className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-gray-500">{stat.status.replace('_', ' ')}</td>
              </tr>
            ))}
            {taskStats.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-xs tracking-widest uppercase">No Task Data</td></tr>}
          </tbody>
        </table>
      </div>
      )}

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
