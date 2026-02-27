import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, LabelList
} from 'recharts';
import { Icons } from '../constants';
import { DailyWorkUpdate } from '../types';

interface ReportViewerProps {
  content: string;
  userName: string;
  month: string;
  isLoading: boolean;
  updates: DailyWorkUpdate[];
  onClose: () => void;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ content, userName, month, isLoading, updates, onClose }) => {
  // Data preparation for charts
  const chartData = useMemo(() => {
    // 1. Category Data for Bar Chart
    const categories = { HPA: 0, CTA: 0, LPA: 0 };
    updates.forEach(u => {
      u.tasks.forEach(t => {
        if (t.category in categories) {
          categories[t.category as keyof typeof categories] += t.timeSpent;
        }
      });
    });

    const barData = Object.entries(categories).map(([name, hours]) => ({
      name,
      hours: Number(hours.toFixed(1)),
      fill: name === 'HPA' ? '#FFC947' : name === 'CTA' ? '#FFFFFF' : '#444444',
      labelColor: name === 'CTA' ? '#000000' : '#FFFFFF'
    }));

    // 2. Trend Data for Line Chart
    const trendData = [...updates]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(u => ({
        date: u.date.split('-').slice(2).join('/'), // Just DD/MM
        score: u.productivityScore,
        hours: u.totalTime
      }));

    return { barData, trendData, totalHours: updates.reduce((acc, u) => acc + u.totalTime, 0) };
  }, [updates]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="w-full max-w-5xl bg-muted border border-border h-[90vh] flex flex-col shadow-2xl overflow-hidden print:h-auto print:border-none print:shadow-none print:static print:bg-white">
        <div className="p-6 border-b border-border flex items-center justify-between bg-bg print:bg-white print:border-black/10">
          <div>
            <div className="flex items-center space-x-2 text-accent text-[10px] font-black uppercase tracking-widest mb-1 print:text-black">
              <Icons.Sparkles /> <span>AI Generated Intelligence</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter print:text-black">
              Executive Report: {userName}
            </h3>
            <p className="text-gray-500 text-xs print:text-gray-600">{month}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition-colors print:hidden"
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print:overflow-visible print:h-auto print:p-0">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-accent animate-pulse">
                Normalizing Tasks & Analyzing Impact...
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Visual Analytics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-bg border border-border p-4 print:border-black/10">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Total Hours</p>
                    <p className="text-2xl font-black text-white print:text-black">{chartData.totalHours.toFixed(1)}h</p>
                  </div>
                  <div className="bg-bg border border-border p-4 print:border-black/10">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Avg Score</p>
                    <p className="text-2xl font-black text-accent">
                      {(updates.reduce((a, b) => a + b.productivityScore, 0) / (updates.length || 1)).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-bg border border-border p-4 print:border-black/10">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Days Logged</p>
                    <p className="text-2xl font-black text-white print:text-black">{updates.length}</p>
                  </div>
                  <div className="bg-bg border border-border p-4 print:border-black/10">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Efficiency</p>
                    <p className="text-2xl font-black text-white print:text-black">
                      {Math.round((chartData.barData.find(b => b.name === 'HPA')?.hours || 0) / (chartData.totalHours || 1) * 100)}%
                    </p>
                  </div>
                </div>

                {/* Bar Chart: Time Allocation */}
                <div className="bg-bg border border-border p-6 md:col-span-1 print:border-black/10">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-6">Time Allocation (Hours)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.barData} layout="vertical" margin={{ right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} width={40} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', fontSize: '12px' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          formatter={(value: number) => [`${value} hours`, 'Time']}
                        />
                        <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={40}>
                          {chartData.barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <LabelList
                            dataKey="hours"
                            position="insideRight"
                            style={{ fill: 'currentColor', fontSize: '12px', fontWeight: '900' }}
                            formatter={(value: number) => `${value}h`}
                            content={(props: any) => {
                              const { x, y, width, height, value, index } = props;
                              const entry = chartData.barData[index];
                              return (
                                <text
                                  x={x + width - 10}
                                  y={y + height / 2}
                                  fill={entry.labelColor}
                                  textAnchor="end"
                                  dominantBaseline="middle"
                                  className="font-black text-[12px] print:fill-black"
                                >
                                  {value}h
                                </text>
                              );
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart: Productivity Trend */}
                <div className="bg-bg border border-border p-6 md:col-span-2 print:border-black/10">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-6">Productivity Flow (Month)</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} tickMargin={10} />
                        <YAxis stroke="#666" fontSize={10} domain={[0, 10]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#FFC947" strokeWidth={3} dot={{ fill: '#FFC947', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="prose prose-invert prose-sm max-w-none overflow-x-auto
                prose-headings:text-white 
                prose-headings:uppercase 
                prose-headings:tracking-widest 
                prose-headings:font-black 
                prose-headings:border-b 
                prose-headings:border-border 
                prose-headings:pb-3 
                prose-headings:mt-16
                prose-p:text-gray-400 
                prose-p:leading-relaxed
                prose-p:text-xs
                prose-strong:text-accent
                prose-li:text-gray-300 
                prose-table:w-full
                prose-table:border-collapse
                prose-table:border
                prose-table:border-border/50
                prose-th:bg-muted prose-th:text-accent prose-th:text-[9px] prose-th:uppercase prose-th:tracking-widest prose-th:p-3 prose-th:border prose-th:border-border/50
                prose-td:p-3 prose-td:border prose-td:border-border/30 prose-td:text-[11px]
                prose-hr:border-border prose-hr:my-12
                font-inter
                print:prose-headings:text-black print:prose-headings:border-black/20 print:prose-p:text-black print:prose-li:text-black print:text-black">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-bg flex justify-between items-center print:hidden">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Confidential Internal Intelligence - Powered by Gemini
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-accent text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center"
            >
              <Icons.Download className="mr-2 w-3 h-3" /> Export Intelligence PDF
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 15mm;
            size: auto;
          }
          body {
            background: white !important;
            color: black !important;
          }
          body > * {
            display: none !important;
          }
          body > div#root {
            display: block !important;
          }
          .fixed.inset-0 {
            display: block !important;
            position: relative !important;
            background: white !important;
            padding: 0 !important;
            z-index: auto !important;
          }
          .w-full.max-w-5xl {
            max-width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
          }
          .flex-1.overflow-y-auto {
            height: auto !important;
            overflow: visible !important;
          }
          * {
            color: black !important;
            border-color: rgba(0,0,0,0.1) !important;
            background-color: transparent !important;
          }
          .bg-muted, .bg-bg {
            background-color: white !important;
          }
          /* Ensure charts are visible in print */
          .recharts-cartesian-grid-line {
            stroke: #ddd !important;
          }
          .recharts-text {
            fill: #666 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportViewer;
