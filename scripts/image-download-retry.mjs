import fs from 'node:fs/promises';
import path from 'node:path';

const folder = path.resolve('GeneaTree/test-artifacts/image-review');
await fs.mkdir(folder, { recursive: true });
const statusPath = path.join(folder, 'download-status.json');
let previous = {};
try { previous = JSON.parse((await fs.readFile(statusPath, 'utf8')).replace(/^\uFEFF/, '')); } catch {}
if (['running', 'waiting'].includes(previous.status) && previous.pid !== process.pid) {
  try { process.kill(previous.pid, 0); throw Error(`Worker ${previous.pid} already running`); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
}
let resumeAt = Date.parse(previous.nextRetryAt) || 0;
const maxAttempts = Number(process.env.IMAGE_MAX_ATTEMPTS || 60);
let state = { status: 'running', pid: process.pid, startedAt: new Date().toISOString(), maxAttempts };
async function save(update = {}) {
  Object.assign(state, update, { updatedAt: new Date().toISOString() });
  await fs.writeFile(`${statusPath}.tmp`, JSON.stringify(state, null, 2));
  await fs.rename(`${statusPath}.tmp`, statusPath);
}
export async function checkpoint(update) { await save(update); }
export async function finish(update) { await save(update); }
await save();
async function pause(milliseconds) {
  const until = Date.now() + milliseconds;
  await save({ status: 'waiting', nextRetryAt: new Date(until).toISOString() });
  while (Date.now() < until) {
    await new Promise(resolve => setTimeout(resolve, Math.min(15000, until - Date.now())));
    try { await fs.access(path.join(folder, 'download.stop')); throw new Error('STOP_REQUESTED'); }
    catch (error) { if (error.message === 'STOP_REQUESTED') throw error; }
    await save();
  }
  await save({ status: 'running', nextRetryAt: null });
}
export async function resilientRequest(url, headers) {
  if (resumeAt > Date.now()) await pause(resumeAt - Date.now());
  resumeAt = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await save({ currentUrl: url, attempt });
    let response;
    let reason;
    let serverDelay = 0;
    try {
      response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
      if (![408, 425, 429, 500, 502, 503, 504].includes(response.status)) return response;
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) serverDelay = /^\d+(\.\d+)?$/.test(retryAfter.trim())
        ? Number(retryAfter) * 1000 : Math.max(0, Date.parse(retryAfter) - Date.now()) || 0;
      const body = (await response.text()).slice(0, 12000);
      const match = body.match(/(?:retry|try again|wait)[\s\S]{0,40}?(\d+)\s*(seconds?|minutes?|hours?)/i);
      if (match) serverDelay = Math.max(serverDelay, Number(match[1]) * (/hour/i.test(match[2]) ? 3600000 : /minute/i.test(match[2]) ? 60000 : 1000));
      reason = `HTTP ${response.status}${retryAfter ? `; Retry-After: ${retryAfter}` : ''}`;
    } catch (error) { reason = error.message; }
    if (attempt === maxAttempts) throw Error(`${reason}; exhausted ${maxAttempts} attempts`);
    const delay = Math.max(serverDelay, Math.min(1800000, 30000 * 2 ** Math.min(attempt - 1, 6))) + Math.floor(Math.random() * 5000);
    console.log(JSON.stringify({ event: 'retry', attempt, reason, waitSeconds: Math.ceil(delay / 1000), url }));
    await save({ lastError: reason });
    // Sequential downloads also stop here: a host-wide rejection is never bypassed by moving to the next file.
    await pause(delay);
  }
}
process.on('uncaughtException', async error => { await save({ status: 'failed', lastError: error.stack }); process.exit(1); });
process.on('unhandledRejection', async error => { await save({ status: 'failed', lastError: String(error?.stack || error) }); process.exit(1); });
