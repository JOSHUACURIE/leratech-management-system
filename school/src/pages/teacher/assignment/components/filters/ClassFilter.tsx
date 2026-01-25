import React from "react";
import Card from "../../../../../components/common/Card";
import { Users } from "lucide-react";
import { type ClassOption, type StreamOption } from "../../types/assignment.types";

interface ClassFilterProps {
  selectedClass: string;
  selectedStream: string;
  classes: ClassOption[];
  streams: StreamOption[];
  loading: boolean;
  onClassChange: (classId: string) => void;
  onStreamChange: (streamId: string) => void;
}

const ClassFilter: React.FC<ClassFilterProps> = ({
  selectedClass,
  selectedStream,
  classes,
  streams,
  loading,
  onClassChange,
  onStreamChange
}) => {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Users size={14} /> Target Audience
      </h3>
      <div className="space-y-3">
        <select
          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
          value={selectedClass}
          onChange={(e) => onClassChange(e.target.value)}
          disabled={loading || classes.length === 0}
        >
          <option value="">Select Class</option>
          {classes.length === 0 ? (
            <option value="" disabled>No classes available</option>
          ) : (
            classes.map((c) => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))
          )}
        </select>
        
        <select
          className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
          value={selectedStream}
          onChange={(e) => onStreamChange(e.target.value)}
          disabled={!selectedClass || loading || streams.length === 0}
        >
          <option value="">Select Stream</option>
          {streams.length === 0 ? (
            <option value="" disabled>No streams available</option>
          ) : (
            streams.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))
          )}
        </select>
      </div>
    </Card>
  );
};

export default ClassFilter;