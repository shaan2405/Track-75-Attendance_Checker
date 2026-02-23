import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useNavigate } from 'react-router-dom';
import { Timetable, BaselineAttendance, DAYS_OF_WEEK } from '../types';
import { toast } from 'react-hot-toast';
import { Check, ChevronRight, ChevronLeft, Clock, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Setup() {
  const { userData, updateTimetable, updateBaseline, completeSetup } = useAttendance();
  const [step, setStep] = useState(1);
  const [timetable, setTimetable] = useState<Timetable>(userData?.timetable || {} as Timetable);
  const [baseline, setBaseline] = useState<BaselineAttendance>(userData?.baseline || { conducted: 0, attended: 0, isSet: false });
  const navigate = useNavigate();

  const handleTogglePeriod = (day: keyof Timetable, index: number) => {
    const newDay = [...timetable[day]];
    newDay[index] = !newDay[index];
    setTimetable({ ...timetable, [day]: newDay });
  };

  const handleNext = async () => {
    if (step === 1) {
      await updateTimetable(timetable);
      setStep(2);
    } else {
      if (baseline.attended > baseline.conducted) {
        toast.error('Attended periods cannot be more than conducted periods');
        return;
      }
      await updateBaseline({ ...baseline, isSet: true });
      await completeSetup();
      toast.success('Setup completed!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-2xl font-bold">Initial Setup</h1>
          <p className="text-indigo-100 mt-2">Configure your timetable and baseline attendance to get started.</p>
          
          <div className="flex gap-4 mt-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-indigo-400'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-indigo-400'}`} />
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-zinc-900">Weekly Timetable</h2>
                </div>
                <p className="text-sm text-zinc-500 mb-6">
                  Mark periods as <span className="text-indigo-600 font-medium">Class ✅</span> or <span className="text-zinc-400 font-medium">Free ❌</span>. 
                  Free periods are never counted in your attendance.
                </p>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="border border-zinc-100 rounded-xl p-4">
                      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">{day}</h3>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {timetable[day]?.map((isActive, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleTogglePeriod(day, idx)}
                            className={`h-10 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                              isActive 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                            }`}
                          >
                            <span>P{idx + 1}</span>
                            {isActive ? <Check className="w-3 h-3 mt-0.5" /> : <span className="text-[10px] mt-0.5">FREE</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-zinc-900">Baseline Attendance</h2>
                </div>
                <p className="text-sm text-zinc-500 mb-6">
                  Since the semester has already started, enter your current attendance stats. 
                  This will be added to your daily logs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Total Periods Conducted</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={baseline.conducted}
                      onChange={(e) => setBaseline({ ...baseline, conducted: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Total Periods Attended</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={baseline.attended}
                      onChange={(e) => setBaseline({ ...baseline, attended: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mt-8">
                  <p className="text-sm text-amber-800 flex gap-2">
                    <span className="font-bold">Note:</span> 
                    Baseline can only be edited once or with strong confirmation later. Ensure these numbers are accurate.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-10">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-2 text-zinc-600 font-medium hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {step === 1 ? 'Next' : 'Complete Setup'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}