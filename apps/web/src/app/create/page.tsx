'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  useAssignmentStore 
} from '@/store/assignmentStore';
import { useJobSocket } from '@/hooks/useJobSocket';
import { 
  UploadCloud, 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { QuestionType, QuestionTypeConfig } from '@vedaai/types';

// Zod form validation schema
const questionTypeRowSchema = z.object({
  type: z.enum(['mcq', 'short', 'diagram', 'numerical', 'long']),
  label: z.string(),
  count: z.number().int().min(1, 'Count must be at least 1').max(50, 'Maximum 50 questions of this type allowed'),
  marksEach: z.number().int().min(1, 'Marks must be at least 1').max(20, 'Maximum 20 marks per question allowed'),
});

const createFormSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters long'),
  subject: z.string().min(2, 'Subject is required'),
  dueDate: z.string().refine((dateStr) => {
    if (!dateStr) return false;
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, { message: 'Due date cannot be in the past' }),
  questionTypes: z.array(questionTypeRowSchema)
    .min(1, 'At least one question type is required')
    .refine((types) => {
      const totalQ = types.reduce((sum, item) => sum + (item.count || 0), 0);
      return totalQ <= 100;
    }, { message: 'Total questions across all types cannot exceed 100' })
    .refine((types) => {
      const totalM = types.reduce((sum, item) => sum + ((item.count || 0) * (item.marksEach || 0)), 0);
      return totalM <= 200;
    }, { message: 'Total marks for the assessment cannot exceed 200' }),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof createFormSchema>;

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions',
  short: 'Short Questions',
  diagram: 'Diagram/Graph-Based',
  numerical: 'Numerical Problems',
  long: 'Long Answer',
};

const DEFAULT_MARKS: Record<QuestionType, number> = {
  mcq: 1,
  short: 2,
  diagram: 3,
  numerical: 5,
  long: 5,
};

export default function CreateAssignmentPage() {
  const router = useRouter();

  // Zustand Store states
  const {
    formData,
    setFormData,
    createAssignment,
    generationStatus,
    setGenerationStatus,
    currentJobAssignmentId,
    setCurrentJobAssignmentId,
    resetForm,
  } = useAssignmentStore();

  // Initialize WS listener for running background job
  useJobSocket(currentJobAssignmentId);

  // Component local states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      title: formData.title,
      subject: formData.subject,
      dueDate: formData.dueDate,
      questionTypes: formData.questionTypes,
      additionalInfo: formData.additionalInfo,
    },
  });

  const watchedQuestionTypes = watch('questionTypes') || [];

  // Recalculate totals dynamically
  const totalQuestions = watchedQuestionTypes.reduce((sum, item) => sum + (item?.count || 0), 0);
  const totalMarks = watchedQuestionTypes.reduce((sum, item) => sum + ((item?.count || 0) * (item?.marksEach || 0)), 0);

  // Sync Zustand store state on component load or changes
  useEffect(() => {
    return () => {
      // Clean up search details, do not persist active generation hooks
      if (generationStatus === 'done' || generationStatus === 'failed') {
        setGenerationStatus('draft');
        setCurrentJobAssignmentId(null);
      }
    };
  }, [generationStatus, setGenerationStatus, setCurrentJobAssignmentId]);

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedExtensions = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedExtensions.includes(file.type)) {
      setErrorMessage('Invalid file format. Only PDF, PNG and JPEG files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
    // Sync into Zustand
    setFormData({ file });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFormData({ file: null });
  };

  // Stepper count updates
  const updateStepper = (index: number, field: 'count' | 'marksEach', change: number) => {
    const currentTypes = [...watchedQuestionTypes];
    const currentValue = currentTypes[index][field] || 0;
    const maxVal = field === 'count' ? 50 : 20;
    const newValue = Math.min(maxVal, Math.max(1, currentValue + change));
    
    currentTypes[index][field] = newValue;
    setValue('questionTypes', currentTypes, { shouldValidate: true });
    setFormData({ questionTypes: currentTypes });
  };

  // Add configuration row
  const addQuestionRow = () => {
    const currentTypes = [...watchedQuestionTypes];
    
    // Find next available type to avoid duplicate validation trigger
    const usedTypes = currentTypes.map(t => t.type);
    const allTypes: QuestionType[] = ['mcq', 'short', 'diagram', 'numerical', 'long'];
    const nextAvailable = allTypes.find(t => !usedTypes.includes(t)) || 'mcq';

    const newRow: QuestionTypeConfig = {
      type: nextAvailable,
      label: QUESTION_TYPE_LABELS[nextAvailable],
      count: 3,
      marksEach: DEFAULT_MARKS[nextAvailable],
    };

    const updated = [...currentTypes, newRow];
    setValue('questionTypes', updated, { shouldValidate: true });
    setFormData({ questionTypes: updated });
  };

  // Remove configuration row
  const removeQuestionRow = (index: number) => {
    const currentTypes = [...watchedQuestionTypes];
    if (currentTypes.length <= 1) {
      setErrorMessage('At least one question type config is required.');
      return;
    }
    currentTypes.splice(index, 1);
    setValue('questionTypes', currentTypes, { shouldValidate: true });
    setFormData({ questionTypes: currentTypes });
    setErrorMessage(null);
  };

  // Question Type selection drop-down handler
  const handleTypeSelect = (index: number, val: QuestionType) => {
    const currentTypes = [...watchedQuestionTypes];
    
    // Prevent duplicate entries
    const duplicateExists = currentTypes.some((t, idx) => t.type === val && idx !== index);
    if (duplicateExists) {
      setErrorMessage(`You have already configured "${QUESTION_TYPE_LABELS[val]}" row.`);
      return;
    }

    currentTypes[index].type = val;
    currentTypes[index].label = QUESTION_TYPE_LABELS[val];
    currentTypes[index].marksEach = DEFAULT_MARKS[val];
    
    setValue('questionTypes', currentTypes, { shouldValidate: true });
    setFormData({ questionTypes: currentTypes });
    setErrorMessage(null);
  };

  // On Form submit
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Assert duplicate check
    const types = values.questionTypes.map(t => t.type);
    const duplicates = types.filter((item, index) => types.indexOf(item) !== index);
    if (duplicates.length > 0) {
      setErrorMessage('Duplicate question types are not allowed. Please remove redundant configurations.');
      setIsSubmitting(false);
      return;
    }

    // Sync metadata to store
    setFormData({
      title: values.title,
      subject: values.subject,
      dueDate: values.dueDate,
      additionalInfo: values.additionalInfo || '',
      questionTypes: values.questionTypes,
    });

    try {
      // Trigger submission (uploads file + enqueues BullMQ task)
      await createAssignment();
      // Socket hook takes over and starts monitoring the queued job!
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
      setIsSubmitting(false);
    }
  };

  // WS progress overlay step components
  const getWSOverlay = () => {
    if (generationStatus === 'draft') return null;

    return (
      <div className="fixed inset-0 bg-[#1A1A1A]/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in no-print">
        <div className="max-w-md w-full text-center text-white">
          
          {generationStatus !== 'failed' ? (
            <div className="relative inline-flex mb-8">
              <Loader2 className="w-16 h-16 text-brand animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-light" />
              </div>
            </div>
          ) : (
            <AlertCircle className="w-16 h-16 text-danger mx-auto mb-8 animate-bounce" />
          )}

          <h2 className="text-xl font-bold mb-2">
            {generationStatus === 'queued' && 'Queuing Assessment request...'}
            {generationStatus === 'processing' && 'AI Teacher is generating questions...'}
            {generationStatus === 'done' && 'Assessment complete! Saving details...'}
            {generationStatus === 'failed' && 'Generation Failed'}
          </h2>
          <p className="text-xs text-text-secondary mb-8">
            {generationStatus === 'queued' && 'We are assigning a background worker to execute your structured assessment config.'}
            {generationStatus === 'processing' && 'Prompting LLM, compiling Sections, forming student fields, and formatting answer keys.'}
            {generationStatus === 'failed' && 'The AI engine encountered an error while formulating questions. Check your configurations and retry.'}
          </p>

          {/* Workflow progress pipeline visualizer */}
          <div className="space-y-4 text-left bg-[#2A2A2A] rounded-lg p-5 border border-border/10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Generation Stages</span>
              <span className="text-[10px] text-text-secondary bg-[#1A1A1A] px-2 py-0.5 rounded">Real-time</span>
            </div>
            
            <hr className="border-[#3A3A3A] my-1" />

            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand" />
              <span className="text-xs font-medium">Assignment configured and saved</span>
            </div>

            <div className="flex items-center gap-3">
              {generationStatus === 'queued' && <Loader2 className="w-5 h-5 text-brand animate-spin" />}
              {(generationStatus === 'processing' || generationStatus === 'done') && <CheckCircle2 className="w-5 h-5 text-brand" />}
              {generationStatus === 'failed' && <AlertCircle className="w-5 h-5 text-danger" />}
              <span className={`text-xs ${generationStatus === 'queued' ? 'font-semibold text-brand' : 'text-text-secondary'}`}>
                Enqueued in background worker pipeline
              </span>
            </div>

            <div className="flex items-center gap-3">
              {generationStatus === 'processing' && <Loader2 className="w-5 h-5 text-brand animate-spin" />}
              {generationStatus === 'done' && <CheckCircle2 className="w-5 h-5 text-brand" />}
              {generationStatus === 'failed' && <AlertCircle className="w-5 h-5 text-danger" />}
              {generationStatus === 'queued' && <div className="w-5 h-5 rounded-full border border-text-disabled"></div>}
              <span className={`text-xs ${generationStatus === 'processing' ? 'font-semibold text-brand' : 'text-text-secondary'}`}>
                Structured AI generation and Zod parsing
              </span>
            </div>

            <div className="flex items-center gap-3">
              {generationStatus === 'done' && <Loader2 className="w-5 h-5 text-brand animate-spin" />}
              {(generationStatus === 'failed' || generationStatus === 'queued' || generationStatus === 'processing') && <div className="w-5 h-5 rounded-full border border-text-disabled"></div>}
              <span className="text-xs text-text-secondary">
                Render and save exam document output
              </span>
            </div>
          </div>

          {/* Fallback control on failure */}
          {generationStatus === 'failed' && (
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => {
                  setGenerationStatus('draft');
                  setCurrentJobAssignmentId(null);
                  setIsSubmitting(false);
                }}
                className="bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white px-5 py-2.5 rounded-md text-xs font-semibold"
              >
                Go back to Form
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-md text-xs font-semibold"
              >
                Retry Request
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto select-none">
      {/* WS Loader Overlay */}
      {getWSOverlay()}

      {/* Progressive Step wizard bar */}
      <div className="flex items-center justify-between mb-8 px-2 no-print">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center text-[11px] font-bold">
            1
          </div>
          <span className="text-xs font-bold text-text-primary">Assignment Details</span>
        </div>
        <div className="h-px bg-border flex-1 mx-4"></div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white text-text-secondary border border-border flex items-center justify-center text-[11px] font-bold">
            2
          </div>
          <span className="text-xs font-medium text-text-secondary">Generating Assessment</span>
        </div>
      </div>

      {/* Main card panel */}
      <div className="bg-white border border-border rounded-xl p-6 md:p-8 shadow-card">
        <div className="mb-6">
          <h2 className="text-md font-semibold text-text-primary">Assignment Details</h2>
          <p className="text-[12px] text-text-secondary">Basic information, question weights and reference attachments.</p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 leading-normal">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 1. Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary block">Assignment Title *</label>
            <input
              type="text"
              placeholder="e.g. Science Quiz Chapter 14"
              {...register('title')}
              className={`w-full bg-white border rounded-md px-3 py-2.5 text-[13px] placeholder-text-disabled focus:outline-none shadow-sm ${
                errors.title ? 'border-danger focus:border-danger' : 'border-border focus:border-brand'
              }`}
            />
            {errors.title && (
              <p className="text-[11px] text-danger font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* 2. Grid for Subject & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">Subject *</label>
              <select
                {...register('subject')}
                className="w-full bg-white border border-border rounded-md px-3 py-2.5 text-[13px] focus:outline-none focus:border-brand shadow-sm cursor-pointer"
              >
                <option value="Science">Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Social Studies">Social Studies</option>
                <option value="History">History</option>
                <option value="English">English</option>
                <option value="General Studies">General Studies</option>
              </select>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary block">Due Date *</label>
              <div className="relative">
                <input
                  type="date"
                  {...register('dueDate')}
                  className={`w-full bg-white border rounded-md pl-9 pr-3 py-2.5 text-[13px] focus:outline-none shadow-sm cursor-pointer ${
                    errors.dueDate ? 'border-danger focus:border-danger' : 'border-border focus:border-brand'
                  }`}
                />
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
              {errors.dueDate && (
                <p className="text-[11px] text-danger font-medium">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* 3. Drag and Drop File zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary block">Reference Material (Optional)</label>
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center bg-[#FAFAFA] transition-colors ${
                  dragActive ? 'border-brand bg-brand-light' : 'border-border'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                <p className="text-[13px] text-text-secondary font-medium mb-1">
                  Choose a file or drag & drop it here
                </p>
                <p className="text-[11px] text-text-disabled mb-4">
                  Acceptable types: PDF, PNG, JPEG. Less than 10MB limit.
                </p>
                <label className="cursor-pointer bg-white border border-border hover:bg-surface text-text-primary text-[12px] font-semibold py-2 px-4 rounded-md shadow-sm active:scale-95 transition-all inline-block select-none">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </label>
              </div>
            ) : (
              <div className="border border-border rounded-lg p-3 bg-brand-light flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-brand flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-text-secondary">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 text-text-secondary hover:text-danger hover:bg-white rounded-md active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Question Configurator Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-primary block">
                Question Configuration Table *
              </label>
              <button
                type="button"
                onClick={addQuestionRow}
                disabled={watchedQuestionTypes.length >= 5}
                className="text-[11px] font-bold text-brand hover:text-brand-dark flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question Type</span>
              </button>
            </div>

            {/* Config rows */}
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
              {watchedQuestionTypes.map((config, idx) => (
                <div key={idx} className="p-3 bg-[#FCFCFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Dropdown Selector */}
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={config.type}
                      onChange={(e) => handleTypeSelect(idx, e.target.value as QuestionType)}
                      className="w-full bg-white border border-border rounded-md px-2.5 py-1.5 text-[12px] text-text-primary focus:outline-none cursor-pointer"
                    >
                      <option value="mcq">MCQ (Multiple Choice)</option>
                      <option value="short">Short Questions</option>
                      <option value="diagram">Diagram/Graph-Based</option>
                      <option value="numerical">Numerical Problems</option>
                      <option value="long">Long Answer</option>
                    </select>
                  </div>

                  {/* Steppers */}
                  <div className="flex items-center justify-end gap-6">
                    {/* Count Stepper */}
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-[11px] text-text-secondary w-10">Count:</span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => updateStepper(idx, 'count', -1)}
                          className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-l hover:bg-surface text-text-secondary active:bg-border"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-8 h-7 flex items-center justify-center border-t border-b border-border bg-white text-xs font-semibold text-text-primary">
                          {config.count}
                        </div>
                        <button
                          type="button"
                          onClick={() => updateStepper(idx, 'count', 1)}
                          className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-r hover:bg-surface text-text-secondary active:bg-border"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Marks Stepper */}
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-[11px] text-text-secondary w-9">Marks:</span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => updateStepper(idx, 'marksEach', -1)}
                          className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-l hover:bg-surface text-text-secondary active:bg-border"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="w-8 h-7 flex items-center justify-center border-t border-b border-border bg-white text-xs font-semibold text-text-primary">
                          {config.marksEach}
                        </div>
                        <button
                          type="button"
                          onClick={() => updateStepper(idx, 'marksEach', 1)}
                          className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-r hover:bg-surface text-text-secondary active:bg-border"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove row */}
                    <button
                      type="button"
                      onClick={() => removeQuestionRow(idx)}
                      className="p-1.5 text-text-secondary hover:text-danger rounded-md hover:bg-white active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Running Totals Summary */}
            <div className="flex justify-end px-1 text-xs font-semibold text-text-secondary">
              <div className="flex items-center gap-4">
                <span>Total Questions : <span className="text-text-primary">{totalQuestions}</span></span>
                <span>Total Marks : <span className="text-brand">{totalMarks}</span></span>
              </div>
            </div>
          </div>

          {/* 5. Additional Instructions Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary block">
              Additional Instructions (Optional)
            </label>
            <textarea
              placeholder="e.g. Generate a question paper for a 3-hour exam duration. Cover chemical bonding concepts."
              {...register('additionalInfo')}
              rows={3}
              className="w-full bg-white border border-border rounded-md px-3 py-2 text-[13px] placeholder-text-disabled focus:outline-none focus:border-brand shadow-sm resize-none"
            />
          </div>

          {/* 6. Form Footer Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-8">
            <button
              type="button"
              onClick={() => {
                resetForm();
                router.push('/assignments');
              }}
              className="border border-border hover:bg-surface text-text-primary font-semibold py-2 px-5 rounded-md text-[13px] shadow-sm active:scale-95 transition-all"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1A1A1A] hover:bg-[#333333] active:scale-95 transition-all text-white font-semibold py-2 px-6 rounded-md text-[13px] shadow-md flex items-center gap-2 disabled:opacity-50 select-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>Next →</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
