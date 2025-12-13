import { jobQueue } from './queue';
import { logger } from '../utils/logger';
import { config } from '../config/env';

class RPABot {
  private isRunning: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.isRunning) {
      logger.warn('RPA Bot is already running');
      return;
    }

    this.isRunning = true;
    logger.info('RPA Bot started');

    this.processingInterval = setInterval(() => {
      this.processNextJob();
    }, 1000); // Check every 1 second
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    logger.info('RPA Bot stopped');
  }

  private async processNextJob(): Promise<void> {
    const job = jobQueue.getNextJob();

    if (!job) return;

    try {
      logger.info('Processing job', { jobId: job.id, service: job.service_type });

      // TODO: Implement worker selection and execution
      // This will be replaced with actual worker implementation
      // based on service_type

      jobQueue.completeJob(job.id);
    } catch (error) {
      logger.error('Error processing job', error);
      jobQueue.failJob(job.id);
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      queueLength: jobQueue.getQueueLength(),
      activeJobs: jobQueue.getActiveJobCount(),
      maxConcurrent: config.RPA_MAX_CONCURRENT_JOBS,
    };
  }
}

export const rpaBot = new RPABot();
