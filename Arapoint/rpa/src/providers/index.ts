import { providerRegistry } from './ProviderRegistry';

// Identity Providers
import { createNIMCProvider } from './identity/NIMCProvider';
import { createNIBSSProvider } from './identity/NIBSSProvider';
import { createVerifyMeProvider } from './identity/VerifyMeProvider';
import { createPaystackBVNProvider } from './identity/PaystackBVNProvider';

// Education Providers
import { createJAMBProvider } from './education/JAMBProvider';
import { createWAECProvider } from './education/WAECProvider';
import { createNECOProvider } from './education/NECOProvider';
import { createNABTEBProvider } from './education/NABTEBProvider';
import { createNBAISProvider } from './education/NBAISProvider';

// Government Providers
import { createNPCProvider } from './government/NPCProvider';

// VTU Providers
import { createVTBizProvider } from './vtu/VTBizProvider';
import { createReloadlyProvider } from './vtu/ReloadlyProvider';
import { createVTPassProvider } from './vtu/VTPassProvider';

// Utility Providers
import { createBuyPowerProvider } from './utilities/BuyPowerProvider';
import { createBaxiProvider } from './utilities/BaxiProvider';

export function registerAllProviders(): void {
  console.log('[Providers] Registering all providers...');
  
  // Identity Providers
  providerRegistry.registerProvider('nimc_portal', createNIMCProvider);
  providerRegistry.registerProvider('nibss_portal', createNIBSSProvider);
  providerRegistry.registerProvider('verifyme_api', createVerifyMeProvider);
  providerRegistry.registerProvider('paystack_bvn', createPaystackBVNProvider);

  // Education Providers
  providerRegistry.registerProvider('jamb_portal', createJAMBProvider);
  providerRegistry.registerProvider('waec_portal', createWAECProvider);
  providerRegistry.registerProvider('neco_portal', createNECOProvider);
  providerRegistry.registerProvider('nabteb_portal', createNABTEBProvider);
  providerRegistry.registerProvider('nbais_portal', createNBAISProvider);

  // Government Providers
  providerRegistry.registerProvider('npc_portal', createNPCProvider);

  // VTU Providers
  providerRegistry.registerProvider('vtbiz_api', createVTBizProvider);
  providerRegistry.registerProvider('reloadly_api', createReloadlyProvider);
  providerRegistry.registerProvider('vtpass_api', createVTPassProvider);

  // Utility Providers
  providerRegistry.registerProvider('buypower_api', createBuyPowerProvider);
  providerRegistry.registerProvider('baxi_api', createBaxiProvider);

  console.log('[Providers] All providers registered successfully');
  console.log('[Providers] Registered:', providerRegistry.listProviders().join(', '));
  
  // Validate configuration
  const validation = providerRegistry.validateConfiguration();
  if (!validation.valid) {
    console.warn('[Providers] Configuration warnings:');
    validation.errors.forEach(err => console.warn(`  - ${err}`));
  } else {
    console.log('[Providers] Configuration validated successfully');
  }
}

export { providerRegistry };
export * from './types';
