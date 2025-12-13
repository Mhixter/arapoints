import { RPAJob } from '../types';
import { logger } from '../utils/logger';

interface QueuedJob {
  job: RPAJob;
  priority: number;
  createdAt: Date;
}

class JobQueue {
  private jobs: Map<string, QueuedJob> = new Map();
  private activeJobs: Set<string> = new Set();
  private maxConcurrent: number = 20;

  addJob(job: RPAJob): void {
    this.jobs.set(job.id, {
      job,
      priority: job.priority,
      createdAt: new Date(),
    });
    logger.info('Job added to queue', { jobId: job.id, service: job.service_type });
  }

  getNextJob(): RPAJob | null {
    if (this.activeJobs.size >= this.maxConcurrent) {
      return null;
    }

    let nextJob: QueuedJob | null = null;
    let maxPriority = -1;

    for (const [jobId, queued] of this.jobs) {
      if (!this.activeJobs.has(jobId) && queued.priority > maxPriority) {
        nextJob = queued;
        maxPriority = queued.priority;
      }
    }

    if (nextJob) {
      this.activeJobs.add(nextJob.job.id);
      return nextJob.job;
    }

    return null;
  }

  completeJob(jobId: string): void {
    this.jobs.delete(jobId);
    this.activeJobs.delete(jobId);
    logger.info('Job completed', { jobId });
  }

  failJob(jobId: string): void {
    this.activeJobs.delete(jobId);
    logger.warn('Job failed', { jobId });
  }

  getQueueLength(): number {
    return this.jobs.size;
  }

  getActiveJobCount(): number {
    return this.activeJobs.size;
  }
}

export const jobQueue = new JobQueue();
