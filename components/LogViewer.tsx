import React from 'react';
import { DailyWorkUpdate } from '../types';
import { Icons } from '../constants';

interface LogViewerProps {
    updates: DailyWorkUpdate[];
    userName: string;
    onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ updates, userName, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="bg-bg border border-border w-full max-w-4xl max-h-[100vh] md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted">
                    <div>
                        <h3 className="text-xl font-black uppercase text-white">Work Logs</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">{userName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <Icons.X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {updates.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 uppercase font-bold text-sm border-2 border-dashed border-border">
                            No logs found for this user.
                        </div>
                    ) : (
                        updates
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(log => (
                                <div key={log.id} className="bg-muted p-6 border border-border">
                                    <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">{log.date}</p>
                                            <h4 className="text-lg font-black uppercase tracking-tight text-white">{log.tasks.length} Tasks</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-accent">{log.totalTime}h</p>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Score: {log.productivityScore}/10</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Completed Tasks</p>
                                            <ul className="space-y-2">
                                                {log.tasks.map(t => (
                                                    <li key={t.id} className="flex flex-col sm:flex-row justify-between items-start text-sm border-l-2 border-accent pl-3 py-2 bg-bg/50 gap-2">
                                                        <span className="text-gray-300">{t.description}</span>
                                                        <div className="flex items-center space-x-2 shrink-0">
                                                            <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-500">{t.category}</span>
                                                            <span className="font-mono text-xs font-bold text-white">{t.timeSpent}h</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {log.missedTasks.length > 0 && (
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-red-500 mb-2 font-bold">Missed Tasks</p>
                                                <ul className="space-y-2">
                                                    {log.missedTasks.map(m => (
                                                        <li key={m.id} className="text-sm bg-red-500/5 border border-red-500/20 p-2 text-gray-400">
                                                            <span className="text-white font-bold">{m.description}</span> - {m.reason}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {log.blockers.length > 0 && (
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-yellow-500 mb-2 font-bold">Blockers</p>
                                                <ul className="space-y-2">
                                                    {log.blockers.map(b => (
                                                        <li key={b.id} className="text-sm bg-yellow-500/5 border border-yellow-500/20 p-2 text-gray-400">
                                                            <span className="text-white font-bold">{b.description}</span> - {b.reason}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogViewer;
