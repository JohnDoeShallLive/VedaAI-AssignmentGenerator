import { Worker, Job } from 'bullmq';
import { connectionOptions } from '../config/redis';
import { QUEUE_NAME } from './paper.queue';
import { Assignment } from '../models/assignment.model';
import { GeneratedPaper } from '../models/paper.model';
import { User } from '../models/user.model';
import { Notification } from '../models/notification.model';
import { generatePaperFromLLM } from '../services/ai.service';
import { broadcastJobEvent } from '../services/websocket.service';
import { redisClient } from '../config/redis';

export function initializePaperWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job<{ assignmentId: string; userId?: string }>) => {
      const { assignmentId, userId } = job.data;
      console.log(`[worker]: Processing job ${job.id} for assignment ${assignmentId}`);

      // 1. Fetch assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      // 2. Set status to processing
      assignment.status = 'processing';
      await assignment.save();

      // 3. Broadcast WebSocket event
      broadcastJobEvent(assignmentId, { event: 'job.processing' });

      // 4. Fetch User profile to extract custom institution name dynamically
      const ownerId = userId || assignment.userId;
      let institutionName = (assignment as any).institutionName || 'Your Institution';
      let logoUrl = '';
      if (ownerId) {
        try {
          const user = await User.findById(ownerId);
          if (user) {
            if (user.institution?.name) {
              institutionName = user.institution.name;
            }
            if (user.institution?.logoUrl) {
              logoUrl = user.institution.logoUrl;
            }
          }
        } catch (err: any) {
          console.error('[worker-error]: Failed to retrieve user profile institution:', err.message);
        }
      }

      // 5. Build paper using LLM or fallback
      let extractedText = '';
      if (assignment.filePath || assignment.fileUrl) {
        extractedText = `Extracted reference material from file: ${assignment.fileUrl || assignment.filePath}. Focus questions heavily around the concepts discussed in this material.`;
      }

      const paperData = await generatePaperFromLLM(assignment, extractedText);

      // 6. Calculate total marks from question config
      const totalMarks = assignment.questionTypes.reduce(
        (sum, q) => sum + q.count * q.marksEach,
        0
      );

      // 7. Save GeneratedPaper Document
      const paper = new GeneratedPaper({
        assignmentId: assignment._id,
        userId: ownerId || undefined,
        institutionName: institutionName,
        schoolName: institutionName, // legacy fallback compatibility
        logoUrl: logoUrl || undefined, // snapshot school crest logo URL!
        className: assignment.className || 'General',
        subject: assignment.subject,
        timeAllowed: paperData.timeAllowed,
        totalMarks: totalMarks,
        sections: paperData.sections,
      });
      await paper.save();

      // 8. Update assignment details
      assignment.status = 'done';
      assignment.resultId = String(paper._id);
      await assignment.save();

      // 9. Invalidate Redis Cache for results
      await redisClient.del(`paper:${assignmentId}`);

      // 10. Store job completed notification (MVP Notifications)
      if (ownerId) {
        try {
          const notif = new Notification({
            userId: ownerId,
            message: `Your assignment "${assignment.title}" is ready`,
            type: 'success',
            read: false,
            assignmentId: assignment._id,
          });
          await notif.save();
          console.log(`[worker]: Stored success notification for user ${ownerId}`);
        } catch (notifErr: any) {
          console.error('[worker-error]: Failed to save success notification:', notifErr.message);
        }
      }

      // 11. Broadcast WS job.done event
      broadcastJobEvent(assignmentId, {
        event: 'job.done',
        resultId: paper._id.toString(),
      });

      console.log(`[worker]: Job completed successfully for assignment ${assignmentId}`);
      return { paperId: paper._id.toString() };
    },
    {
      connection: connectionOptions,
      concurrency: 2,
    }
  );

  worker.on('failed', async (job, error) => {
    if (!job) return;
    const { assignmentId, userId } = job.data;
    console.error(`[worker]: Job ${job.id} failed:`, error.message);

    // Check if we have remaining attempts
    const maxAttempts = job.opts.attempts || 3;
    const currentAttempt = job.attemptsMade;

    if (currentAttempt >= maxAttempts) {
      console.log(`[worker]: Job failed finally after ${currentAttempt} attempts. Marking assignment as failed.`);
      try {
        const assignment = await Assignment.findByIdAndUpdate(
          assignmentId, 
          { status: 'failed' },
          { new: true }
        );
        
        // Store job failed notification (MVP Notifications)
        const ownerId = userId || assignment?.userId;
        if (ownerId && assignment) {
          const notif = new Notification({
            userId: ownerId,
            message: `Generation failed for "${assignment.title}" — retry`,
            type: 'error',
            read: false,
            assignmentId: assignment._id,
          });
          await notif.save();
          console.log(`[worker]: Stored failure notification for user ${ownerId}`);
        }

        broadcastJobEvent(assignmentId, { event: 'job.failed' });
      } catch (err) {
        console.error('[worker]: Failed to update assignment status on failure:', err);
      }
    } else {
      console.log(`[worker]: Job will be retried (Attempt ${currentAttempt + 1} of ${maxAttempts})`);
    }
  });

  worker.on('error', (err) => {
    console.error('[worker]: Worker general error:', err);
  });

  console.log(`[worker]: BullMQ Worker registered for queue "${QUEUE_NAME}"`);
  return worker;
}
