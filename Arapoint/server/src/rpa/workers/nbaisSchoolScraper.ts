import { Browser, Page } from 'puppeteer';
import { db } from '../../config/database';
import { nbaisSchools } from '../../db/schema';
import { eq } from 'drizzle-orm';

interface SchoolRow {
  schoolName: string;
  schoolValue: string | null;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

interface SchoolData {
  state: string;
  schoolName: string;
  schoolValue: string;
}

export async function scrapeNbaisSchools(browser: Browser): Promise<{ success: boolean; message: string; count: number }> {
  let page: Page | null = null;
  const allSchools: SchoolData[] = [];

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('[NBAIS Scraper] Starting school scraping...');
    
    for (const state of NIGERIAN_STATES) {
      try {
        console.log(`[NBAIS Scraper] Fetching schools for ${state}...`);
        
        await page.goto('https://resultchecker.nbais.com.ng/', {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        await page.waitForSelector('select', { timeout: 10000 });

        const allSelects = await page.$$('select');
        console.log(`[NBAIS Scraper] Found ${allSelects.length} select elements on page`);

        const stateFound = await page.evaluate((stateName: string) => {
          const selects = Array.from(document.querySelectorAll('select'));
          for (const select of selects) {
            const sel = select as HTMLSelectElement;
            for (let i = 0; i < sel.options.length; i++) {
              const opt = sel.options[i];
              if (opt.text.toLowerCase().includes(stateName.toLowerCase()) || 
                  opt.value.toLowerCase().includes(stateName.toLowerCase())) {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
                return { found: true, selectIndex: Array.from(selects).indexOf(sel) };
              }
            }
          }
          return { found: false, selectIndex: -1 };
        }, state);

        if (!stateFound.found) {
          console.log(`[NBAIS Scraper] State ${state} not found in any dropdown`);
          continue;
        }

        console.log(`[NBAIS Scraper] State ${state} found in select at index ${stateFound.selectIndex}`);

        await new Promise(resolve => setTimeout(resolve, 3000));

        const schools = await page.evaluate((stateSelectIdx: number) => {
          const selects = Array.from(document.querySelectorAll('select'));
          const schoolList: { name: string; value: string }[] = [];
          
          for (let s = 0; s < selects.length; s++) {
            if (s === stateSelectIdx) continue;
            
            const sel = selects[s] as HTMLSelectElement;
            if (sel.options.length > 5) {
              for (let i = 0; i < sel.options.length; i++) {
                const opt = sel.options[i];
                if (opt.value && opt.value !== '' && 
                    !opt.text.toLowerCase().includes('select') &&
                    !opt.text.toLowerCase().includes('choose')) {
                  schoolList.push({
                    name: opt.text.trim(),
                    value: opt.value
                  });
                }
              }
              if (schoolList.length > 0) break;
            }
          }
          return schoolList;
        }, stateFound.selectIndex);

        for (const school of schools) {
          allSchools.push({
            state: state,
            schoolName: school.name,
            schoolValue: school.value
          });
        }

        console.log(`[NBAIS Scraper] Found ${schools.length} schools in ${state}`);
        
      } catch (stateError) {
        console.error(`[NBAIS Scraper] Error processing state ${state}:`, stateError);
      }
    }

    if (allSchools.length > 0) {
      await db.delete(nbaisSchools);
      
      const batchSize = 100;
      for (let i = 0; i < allSchools.length; i += batchSize) {
        const batch = allSchools.slice(i, i + batchSize);
        await db.insert(nbaisSchools).values(
          batch.map(s => ({
            state: s.state,
            schoolName: s.schoolName,
            schoolValue: s.schoolValue,
            isActive: true
          }))
        );
      }
      
      console.log(`[NBAIS Scraper] Saved ${allSchools.length} schools to database`);
    }

    return {
      success: true,
      message: `Successfully scraped ${allSchools.length} schools from ${NIGERIAN_STATES.length} states`,
      count: allSchools.length
    };

  } catch (error) {
    console.error('[NBAIS Scraper] Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

export async function getSchoolsByState(state: string): Promise<{ schoolName: string; schoolValue: string }[]> {
  const schools: SchoolRow[] = await db
    .select({
      schoolName: nbaisSchools.schoolName,
      schoolValue: nbaisSchools.schoolValue
    })
    .from(nbaisSchools)
    .where(eq(nbaisSchools.state, state));

  return schools.map((s: SchoolRow) => ({
    schoolName: s.schoolName,
    schoolValue: s.schoolValue || s.schoolName
  }));
}

export async function getSchoolsCount(): Promise<number> {
  const result = await db.select().from(nbaisSchools);
  return result.length;
}
