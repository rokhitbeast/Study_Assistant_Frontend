import dotenv from 'dotenv';
import { validStudyKitFixture } from '../shared/fixtures/studyKitFixtures.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function runLiveTests() {
  console.log('🚀 Starting Express Server Live Integration Tests...\n');

  // Import and spin up Express server dynamically
  const serverModule = await import('../server/index.js');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let exitCode = 0;

  try {
    // ----------------------------------------------------
    // TEST 1: GET /api/health
    // ----------------------------------------------------
    console.log('--- TEST 1: GET /api/health ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    console.log('  Health response status:', healthRes.status);
    console.log('  Health response body:', JSON.stringify(healthJson));
    if (healthRes.status === 200 && healthJson.status === 'ok') {
      console.log('  ✅ PASS: /api/health returned 200 OK');
    } else {
      console.error('  ❌ FAIL: /api/health failed');
      exitCode = 1;
    }

    // ----------------------------------------------------
    // TEST 2: POST /api/generate Input Validation (400)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: POST /api/generate Validation Rejection ---');
    const badGenRes = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceText: 'Too short' }),
    });
    const badGenJson = await badGenRes.json();
    console.log('  Bad generate status:', badGenRes.status);
    console.log('  Validation error response:', JSON.stringify(badGenJson));
    if (badGenRes.status === 400 && badGenJson.error?.code === 'VALIDATION_ERROR') {
      console.log('  ✅ PASS: Rejected payload < 10 chars with HTTP 400 and structured validation issues');
    } else {
      console.error('  ❌ FAIL: Expected 400 VALIDATION_ERROR');
      exitCode = 1;
    }

    // ----------------------------------------------------
    // TEST 3: POST /api/refine Input Validation (400)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: POST /api/refine Validation Rejection ---');
    const badRefineRes = await fetch(`${BASE_URL}/api/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction: 'no study kit provided' }),
    });
    const badRefineJson = await badRefineRes.json();
    console.log('  Bad refine status:', badRefineRes.status);
    if (badRefineRes.status === 400 && badRefineJson.error?.code === 'VALIDATION_ERROR') {
      console.log('  ✅ PASS: Rejected missing currentStudyKit with HTTP 400');
    } else {
      console.error('  ❌ FAIL: Expected 400 VALIDATION_ERROR');
      exitCode = 1;
    }

    // ----------------------------------------------------
    // TEST 4: Live Gemini 2.5 Flash API Test
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Live Gemini 2.5 Flash StudyKit Generation ---');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log('  ⚠️ SKIPPING live Gemini call: No valid GEMINI_API_KEY set in .env');
    } else {
      console.log('  Calling POST /api/generate with study text notes...');
      const sampleNotes = `
      Mitochondria are double-membrane-bound organelles found in most eukaryotic organisms.
      They generate most of the chemical energy needed to power the cell's biochemical reactions through cellular respiration.
      Chemical energy produced by the mitochondria is stored in adenosine triphosphate (ATP).
      The outer membrane contains large numbers of integral membrane proteins called porins.
      The inner membrane is folded into cristae to expand the surface area for ATP synthase.
      Mitochondria possess their own independent circular genome (mtDNA) and replicate via binary fission.
      `.trim();

      const liveGenRes = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: sampleNotes,
          title: 'Cellular Respiration & Mitochondria',
        }),
      });

      const liveGenJson = await liveGenRes.json();
      console.log('  Live Gemini generate status:', liveGenRes.status);

      if (liveGenRes.status === 200 && liveGenJson.success) {
        console.log('  ✅ PASS: Gemini 2.5 Flash successfully generated StudyKit!');
        console.log(`  Title: "${liveGenJson.data.title}"`);
        console.log(`  Checklist items: ${liveGenJson.data.conceptChecklist.length}`);
        console.log(`  Flashcards: ${liveGenJson.data.flashcards.length}`);
        console.log(`  Quiz questions: ${liveGenJson.data.quizQuestions.length}`);
        console.log(`  Topic breakdowns: ${liveGenJson.data.topicBreakdown.length}`);
        console.log(`  Warnings: ${liveGenJson.warnings.length}`);

        // ----------------------------------------------------
        // TEST 5: Live Surgical Refinement with Gemini
        // ----------------------------------------------------
        console.log('\n--- TEST 5: Live Gemini 2.5 Flash Surgical Refinement ---');
        console.log('  Calling POST /api/refine: "Add 2 hard flashcards about mtDNA"...');

        const liveRefineRes = await fetch(`${BASE_URL}/api/refine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStudyKit: liveGenJson.data,
            instruction: 'Add 2 hard flashcards about mtDNA and binary fission',
          }),
        });

        const liveRefineJson = await liveRefineRes.json();
        console.log('  Live Gemini refine status:', liveRefineRes.status);

        if (liveRefineRes.status === 200 && liveRefineJson.success) {
          console.log('  ✅ PASS: Gemini 2.5 Flash successfully executed surgical refinement!');
          console.log(`  Summary: ${liveRefineJson.summary}`);
          console.log(`  Updated flashcard count: ${liveRefineJson.data.flashcards.length}`);
          console.log(`  Preserved checklist count: ${liveRefineJson.data.conceptChecklist.length}`);
        } else {
          console.error('  ❌ Refinement failed:', liveRefineJson);
          exitCode = 1;
        }
      } else {
        console.error('  ❌ Live generation failed:', liveGenJson);
        exitCode = 1;
      }
    }
  } catch (err) {
    console.error('  ❌ Unexpected test error:', err);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}

runLiveTests();

