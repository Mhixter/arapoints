export const rpaConfig = {
  services: {
    bvn: {
      name: 'bvn_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    nin: {
      name: 'nin_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    jamb: {
      name: 'jamb_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    waec: {
      name: 'waec_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    neco: {
      name: 'neco_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    nabteb: {
      name: 'nabteb_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    nbais: {
      name: 'nbais_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    npc: {
      name: 'npc_service',
      concurrentLimit: 20,
      timeout: 60000,
      rateLimit: '20/minute',
    },
    vtu: {
      name: 'vtu_service',
      concurrentLimit: 20,
      timeout: 30000,
      rateLimit: '20/minute',
    },
    subscription: {
      name: 'subscription_service',
      concurrentLimit: 20,
      timeout: 30000,
      rateLimit: '20/minute',
    },
  },
  jobStatuses: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  priorityLevels: {
    LOW: 0,
    NORMAL: 5,
    HIGH: 8,
    URGENT: 10,
  },
};

export type ServiceType = keyof typeof rpaConfig.services;
export type JobStatus = typeof rpaConfig.jobStatuses[keyof typeof rpaConfig.jobStatuses];
