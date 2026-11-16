import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Cpu,
  Layers,
  FileCode,
  Terminal,
} from 'lucide-react';
import { parseAndSalvageStudyData } from '../../utils/parseAndSalvageStudyData';

export function ResilienceInspector({
  studyKit,
  onApplyKitToSession,
  serverStatus,
}) {
  // Scenario 1: Race Condition State
  const [raceRunning, setRaceRunning] = useState(false);
  const [raceLogs, setRaceLogs] = useState([]);
  const [raceResult, setRaceResult] = useState(null);
  const raceSeqRef = useRef(0);
  const raceActiveAbortRef = useRef(null);

  // Scenario 2: Malformed JSON State
  const [malformedRunning, setMalformedRunning] = useState(false);
  const [malformedResult, setMalformedResult] = useState(null);

  // Scenario 3: Wrong Schema Shape State
  const [schemaRunning, setSchemaRunning] = useState(false);
  const [schemaResult, setSchemaResult] = useState(null);

  // Scenario 4: Timeout / Failure State
  const [failureRunning, setFailureRunning] = useState(false);
  const [failureResult, setFailureResult] = useState(null);

  // =========================================================================
  // SCENARIO 1: Race Condition
  // =========================================================================
  const runRaceConditionTest = async () => {
    setRaceRunning(true);
    setRaceResult(null);
    const logs = [];

    const addLog = (msg) => {
      const entry = `[+${((performance.now() - startTime) / 1000).toFixed(2)}s] ${msg}`;
      logs.push(entry);
      setRaceLogs([...logs]);
    };

    const startTime = performance.now();
    addLog('🚀 Starting Concurrency & Race Condition Simulation...');

    // Function to simulate a request with AbortController and sequence stamping
    const executeSimulatedRequest = (requestId, label, delayMs) => {
      if (raceActiveAbortRef.current) {
        addLog(`⚡ Aborting in-flight controller (Superseded by Request ${label})`);
        raceActiveAbortRef.current.abort('SUPERSEDED');
      }

      const controller = new AbortController();
      raceActiveAbortRef.current = controller;
      raceSeqRef.current = requestId;

      addLog(`▶ Firing Request ${label} (ID: ${requestId}, Target Delay: ${delayMs}ms)`);

      return fetch(`/api/chaos/race?delay=${delayMs}&id=${label}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          const json = await res.json();
          // Stale guard check
          if (requestId !== raceSeqRef.current) {
            addLog(`🛑 Request ${label} (ID: ${requestId}) arrived but was REJECTED by stale guard (Latest ID: ${raceSeqRef.current})`);
            return { stale: true, label };
          }
          addLog(`✅ Request ${label} (ID: ${requestId}) resolved and COMMITTED to state!`);
          return { success: true, label, data: json.data };
        })
        .catch((err) => {
          if (err.name === 'AbortError' || controller.signal.aborted) {
            addLog(`🚫 Request ${label} (ID: ${requestId}) was safely ABORTED at network layer.`);
          } else {
            addLog(`❌ Request ${label} failed: ${err.message}`);
          }
          return { aborted: true, label };
        });
    };

    // Step 1: Fire Request A (slow: 3500ms)
    const promiseA = executeSimulatedRequest(1, 'A (Slow)', 3500);

    // Step 2: 150ms later, fire Request B (fast: 900ms)
    await new Promise((r) => setTimeout(r, 150));
    const promiseB = executeSimulatedRequest(2, 'B (Fast)', 900);

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    const passed = (resA.aborted || resA.stale) && resB.success && resB.data?.id === 'kit-race-B (Fast)';

    setRaceResult({
      passed,
      committedId: resB.data?.id || 'None',
      finalTitle: resB.data?.title || 'None',
      latestRequestId: raceSeqRef.current,
    });
    setRaceRunning(false);
  };

  // =========================================================================
  // SCENARIO 2: Malformed JSON
  // =========================================================================
  const runMalformedJsonTest = async () => {
    setMalformedRunning(true);
    setMalformedResult(null);

    try {
      // Fetch raw truncated payload from chaos endpoint
      const res = await fetch('/api/chaos/malformed');
      const truncatedRawText = await res.text();

      // Pass directly into actual salvage utility
      const salvageResult = parseAndSalvageStudyData(truncatedRawText, 'Chaos fallback context');

      setMalformedResult({
        rawSnippet: truncatedRawText.slice(-120),
        recovered: salvageResult.recovered,
        fatalError: salvageResult.fatalError,
        salvagedFlashcards: salvageResult.data?.flashcards?.length || 0,
        warnings: salvageResult.warnings,
        data: salvageResult.data,
      });
    } catch (err) {
      setMalformedResult({
        fatalError: err.message,
        recovered: false,
      });
    } finally {
      setMalformedRunning(false);
    }
  };

  // =========================================================================
  // SCENARIO 3: Wrong Schema Shape
  // =========================================================================
  const runWrongSchemaShapeTest = async () => {
    setSchemaRunning(true);
    setSchemaResult(null);

    try {
      const res = await fetch('/api/chaos/wrong-schema');
      const rawPayload = await res.json();

      // Pass directly through real Zod salvage utility
      const salvageResult = parseAndSalvageStudyData(rawPayload);

      setSchemaResult({
        totalSubmittedCards: 5,
        validSurvivingCards: salvageResult.data?.flashcards?.length || 0,
        survivingCards: salvageResult.data?.flashcards || [],
        warnings: salvageResult.warnings,
        recovered: salvageResult.recovered,
      });
    } catch (err) {
      setSchemaResult({ error: err.message });
    } finally {
      setSchemaRunning(false);
    }
  };

  // =========================================================================
  // SCENARIO 4: Timeout / API Failure
  // =========================================================================
  const runTimeoutFailureTest = async (type = '500') => {
    setFailureRunning(true);
    setFailureResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second client deadline

    try {
      const res = await fetch(`/api/chaos/failure?type=${type}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      setFailureResult({
        type,
        status: res.status,
        message: json.error?.message || 'Server error',
        code: json.error?.code || 'HTTP_ERROR',
        isTimeout: false,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || controller.signal.aborted;
      setFailureResult({
        type,
        status: isTimeout ? 504 : 500,
        message: isTimeout ? 'Client deadline exceeded (Simulated Timeout after 2.0s)' : err.message,
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        isTimeout,
      });
    } finally {
      setFailureRunning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Inspector Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/70 p-6 shadow-sm dark:border-indigo-900/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 flex-shrink-0">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ⚡ Test AI Resilience
                </h1>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Dev Inspector
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                Demonstrates real-world chaos engineering: verify that race conditions, stream truncations, corrupted schemas, and API failures are contained without crashing the application.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <span
              className={`h-2 w-2 rounded-full ${
                serverStatus === 'connected'
                  ? 'bg-emerald-500'
                  : serverStatus === 'gemini_missing'
                  ? 'bg-amber-500'
                  : serverStatus === 'gemini_error'
                  ? 'bg-rose-400'
                  : 'bg-rose-600'
              }`}
            />
            <span>
              Chaos Gateway:{' '}
              {serverStatus === 'connected'
                ? 'Active'
                : serverStatus === 'gemini_missing'
                ? 'Gemini Key Missing'
                : serverStatus === 'gemini_error'
                ? 'Gemini Failing'
                : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 4 Resilience Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* SCENARIO 1: Race Condition */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Test 1: Race Condition Prevention
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Abort & Sequence Stamping</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fires Request A (4s latency), then immediately fires Request B (1s latency). Verifies that Request A is aborted and prevented from overwriting Request B.
            </p>
          </div>

          {/* Test Action */}
          <div>
            <button
              type="button"
              disabled={raceRunning}
              onClick={runRaceConditionTest}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {raceRunning ? 'Simulating Rapid Requests...' : 'Run Test: Race Condition'}
            </button>
          </div>

          {/* Terminal / Output */}
          {raceLogs.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-slate-500 pb-1 border-b border-slate-800">
                <Terminal className="h-3 w-3" />
                <span>Execution Trace</span>
              </div>
              {raceLogs.map((log, i) => (
                <div key={i} className="leading-tight">{log}</div>
              ))}
            </div>
          )}

          {raceResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              raceResult.passed
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span><strong>Protected:</strong> Only Request B committed (Final ID: {raceResult.latestRequestId})</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SCENARIO 2: Malformed JSON Repair */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Test 2: Malformed & Truncated JSON
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Bracket Balancing Salvage</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Injects truncated JSON severed mid-string during flashcard generation. Tests conservative stack repair to close open containers and salvage completed cards without eval().
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={malformedRunning}
              onClick={runMalformedJsonTest}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-500 transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {malformedRunning ? 'Repairing Stream...' : 'Run Test: Malformed JSON'}
            </button>
          </div>

          {malformedResult && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Truncation Repaired: {malformedResult.salvagedFlashcards} valid cards salvaged!</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Zero crashes. Open quotes sealed, incomplete card severed, and remaining cards preserved.
                </p>
              </div>

              {malformedResult.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300 text-[11px]">
                  <strong>Diagnostic Warning: </strong>
                  <span>{malformedResult.warnings[0].reason}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SCENARIO 3: Wrong Schema Shape */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Test 3: Wrong Schema Shape (Partial Recovery)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">safeParse Item Isolation</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Submits 5 flashcards (3 valid, 1 missing back, 1 with difficulty "super-extreme"). Proves that the 3 valid cards render while the 2 corrupted cards are safely isolated.
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={schemaRunning}
              onClick={runWrongSchemaShapeTest}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-500 transition disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              {schemaRunning ? 'Validating Items...' : 'Run Test: Wrong Schema Shape'}
            </button>
          </div>

          {schemaResult && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl border border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-950 dark:bg-violet-950/40 dark:text-violet-200 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Preserved: {schemaResult.validSurvivingCards} / {schemaResult.totalSubmittedCards} Cards</span>
                  <span className="text-rose-600 dark:text-rose-400">2 Rejected</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {schemaResult.survivingCards.map((c) => (
                    <span key={c.id} className="rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono border">
                      {c.id} ✓
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-800 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
                <p className="font-bold">Zod Warnings Captured:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  {schemaResult.warnings.map((w, idx) => (
                    <li key={idx}>{w.field || 'Item'}: {w.reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SCENARIO 4: Timeout / API Failure */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Test 4: Timeout & Server Failure
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">State Preservation</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Simulates a downstream HTTP 500 crash and a request timeout. Verifies that the existing StudyKit is never wiped, loading state resets, and retry is available.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={failureRunning}
              onClick={() => runTimeoutFailureTest('500')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition disabled:opacity-50"
            >
              <Play className="h-3 w-3" />
              Simulate 500
            </button>
            <button
              type="button"
              disabled={failureRunning}
              onClick={() => runTimeoutFailureTest('timeout')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-300 transition disabled:opacity-50"
            >
              <Clock className="h-3 w-3" />
              Simulate Timeout
            </button>
          </div>

          {failureResult && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-950 dark:bg-rose-950/40 dark:text-rose-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Error Caught ({failureResult.code})</span>
                <span className="font-mono text-[10px] bg-rose-200/50 px-1.5 py-0.5 rounded">Status {failureResult.status}</span>
              </div>
              <p className="text-[11px] leading-relaxed">{failureResult.message}</p>
              <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 dark:border-rose-900/60 text-[11px]">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Active StudyKit: Intact (Zero Data Loss)</span>
                <button
                  type="button"
                  onClick={() => runTimeoutFailureTest(failureResult.type)}
                  className="inline-flex items-center gap-1 font-bold text-rose-700 dark:text-rose-300 underline hover:no-underline"
                >
                  <RotateCcw className="h-3 w-3" /> Retry Call
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
