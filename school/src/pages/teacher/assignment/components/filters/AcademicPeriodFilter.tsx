import React from "react";
import Card from "../../../../../components/common/Card";
import { Calendar as CalendarIcon, ChevronDown, Loader2 } from "lucide-react";
import { type TermOption, type AcademicYear } from "../../types/assignment.types";

interface AcademicPeriodFilterProps {
  selectedAcademicYear: string;
  selectedTerm: string;
  academicYears: AcademicYear[];
  terms: TermOption[];
  loadingYears: boolean;
  loadingTerms: boolean;
  onAcademicYearChange: (year: string) => void;
  onTermChange: (term: string) => void;
}

const AcademicPeriodFilter: React.FC<AcademicPeriodFilterProps> = ({
  selectedAcademicYear,
  selectedTerm,
  academicYears,
  terms,
  loadingYears,
  loadingTerms,
  onAcademicYearChange,
  onTermChange
}) => {
  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-6 space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <CalendarIcon size={14} /> Academic Period
      </h3>
      <div className="space-y-3">
        {/* Academic Year */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Academic Year</label>
          <div className="relative">
            <select
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              value={selectedAcademicYear}
              onChange={(e) => onAcademicYearChange(e.target.value)}
              disabled={loadingYears || academicYears.length === 0}
            >
              <option value="">Select Academic Year</option>
              {loadingYears ? (
                <option value="" disabled>Loading years...</option>
              ) : academicYears.length === 0 ? (
                <option value="" disabled>No years available</option>
              ) : (
                academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_name} {year.is_current && '(Current)'}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {loadingYears && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader2 size={14} className="animate-spin text-violet-600" />
              </div>
            )}
          </div>
        </div>

        {/* Term */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600">Term</label>
          <div className="relative">
            <select
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              value={selectedTerm}
              onChange={(e) => onTermChange(e.target.value)}
              disabled={loadingTerms || !selectedAcademicYear || terms.length === 0}
            >
              <option value="">Select Term</option>
              {loadingTerms ? (
                <option value="" disabled>Loading terms...</option>
              ) : terms.length === 0 ? (
                <option value="" disabled>No terms available</option>
              ) : (
                terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.term_name} {term.is_current && '(Current)'}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {loadingTerms && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <Loader2 size={14} className="animate-spin text-violet-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AcademicPeriodFilter;