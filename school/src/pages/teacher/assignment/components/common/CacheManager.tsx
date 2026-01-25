import React from "react";
import { Database, RefreshCw } from "lucide-react";

interface CacheManagerProps {
  cacheStats: { totalItems: number; expiredItems: number };
  refreshing: boolean;
  onRefresh: () => void;
  onClearCache: () => void;
}

const CacheManager: React.FC<CacheManagerProps> = ({
  cacheStats,
  refreshing,
  onRefresh,
  onClearCache
}) => {
  return (
    <>
      <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
        <Database size={14} className="text-slate-500" />
        <span className="text-xs font-bold text-slate-600">
          Cache: {cacheStats.totalItems} items
        </span>
      </div>
      
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
      
      <button
        onClick={onClearCache}
        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors"
      >
        Clear Cache
      </button>
    </>
  );
};

export default CacheManager;