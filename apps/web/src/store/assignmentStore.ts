import { create } from 'zustand';
import axios from 'axios';
import { Assignment, AssignmentStatus, QuestionTypeConfig } from '@vedaai/types';

interface CreateAssignmentForm {
  title: string;
  subject: string;
  dueDate: string;
  questionTypes: QuestionTypeConfig[];
  additionalInfo: string;
  file: File | null;
}

const initialFormState: CreateAssignmentForm = {
  title: '',
  subject: 'Science',
  dueDate: '',
  questionTypes: [
    { type: 'mcq', label: 'Multiple Choice Questions', count: 5, marksEach: 1 },
    { type: 'short', label: 'Short Questions', count: 3, marksEach: 2 },
  ],
  additionalInfo: '',
  file: null,
};

interface AssignmentState {
  // Form State
  formData: CreateAssignmentForm;
  setFormData: (data: Partial<CreateAssignmentForm>) => void;
  resetForm: () => void;

  // Assignment List
  assignments: Assignment[];
  loadingList: boolean;
  errorList: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  subjectFilter: string;
  setSubjectFilter: (filter: string) => void;
  
  // Actions
  fetchAssignments: () => Promise<void>;
  createAssignment: () => Promise<string>; // returns created assignmentId
  deleteAssignment: (id: string) => Promise<void>;

  // WS Generation State
  generationStatus: AssignmentStatus;
  setGenerationStatus: (status: AssignmentStatus) => void;
  currentJobAssignmentId: string | null;
  setCurrentJobAssignmentId: (id: string | null) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  // Form state init
  formData: initialFormState,
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: initialFormState }),

  // Listings state init
  assignments: [],
  loadingList: false,
  errorList: null,
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  subjectFilter: 'All',
  setSubjectFilter: (subjectFilter) => set({ subjectFilter }),

  // Websocket state init
  generationStatus: 'draft',
  setGenerationStatus: (generationStatus) => set({ generationStatus }),
  currentJobAssignmentId: null,
  setCurrentJobAssignmentId: (currentJobAssignmentId) => set({ currentJobAssignmentId }),

  // Actions
  fetchAssignments: async () => {
    set({ loadingList: true, errorList: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/assignments`);
      if (response.data && response.data.success) {
        set({ assignments: response.data.data });
      } else {
        set({ errorList: response.data?.error || 'Failed to retrieve assignments' });
      }
    } catch (err: any) {
      set({ errorList: err.response?.data?.error || err.message || 'An error occurred' });
    } finally {
      set({ loadingList: false });
    }
  },

  createAssignment: async () => {
    const { formData } = get();
    
    // Use FormData for file upload support
    const postData = new FormData();
    postData.append('title', formData.title);
    postData.append('subject', formData.subject);
    postData.append('dueDate', formData.dueDate);
    postData.append('additionalInfo', formData.additionalInfo);
    postData.append('questionTypes', JSON.stringify(formData.questionTypes));
    
    if (formData.file) {
      postData.append('file', formData.file);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/assignments`, postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        const createdId = response.data.data._id;
        // Set queue monitor states
        set({
          currentJobAssignmentId: createdId,
          generationStatus: response.data.data.status || 'queued',
        });
        
        // Refresh the main dashboard view
        get().fetchAssignments();
        
        return createdId;
      } else {
        throw new Error(response.data?.error || 'Failed to submit assignment');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Submission failed';
      throw new Error(errMsg);
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/v1/assignments/${id}`);
      if (response.data && response.data.success) {
        // Remove locally from state list
        set((state) => ({
          assignments: state.assignments.filter((asg) => asg._id !== id),
        }));
      } else {
        throw new Error(response.data?.error || 'Failed to delete assignment');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Deletion failed';
      throw new Error(errMsg);
    }
  },
}));
