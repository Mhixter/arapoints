import { registerAllProviders, providerRegistry } from './providers';

async function main() {
  console.log('='.repeat(50));
  console.log('  Arapoint RPA Robot - Starting...');
  console.log('='.repeat(50));

  // Register all providers
  registerAllProviders();

  // Log service status
  console.log('\nRegistered Providers:');
  console.log(providerRegistry.listProviders());

  console.log('\nService Configuration:');
  console.log(JSON.stringify(providerRegistry.getServiceStatus(), null, 2));

  console.log('\n[RPA] Robot initialized and ready for jobs');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[RPA] Shutting down...');
    await providerRegistry.cleanupAll();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[RPA] Received SIGTERM, shutting down...');
    await providerRegistry.cleanupAll();
    process.exit(0);
  });
}

main().catch(console.error);

export { providerRegistry, registerAllProviders };
