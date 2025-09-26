// Simple structured logger wrapper. In production you could swap to pino or another lib.
// Usage: logger.info('message', { context });
type Level = 'debug' | 'info' | 'warn' | 'error';

const appName = 'boleka';
const enabledDebug = process.env.FORCE_LOG_LEVEL === 'debug' || process.env.NODE_ENV !== 'production';

function log(level: Level, msg: string, meta?: Record<string, any>) {
  if (level === 'debug' && !enabledDebug) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    app: appName,
    msg,
    ...(meta || {})
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export const logger = {
  debug: (m: string, meta?: Record<string, any>) => log('debug', m, meta),
  info: (m: string, meta?: Record<string, any>) => log('info', m, meta),
  warn: (m: string, meta?: Record<string, any>) => log('warn', m, meta),
  error: (m: string, meta?: Record<string, any>) => log('error', m, meta),
};

export default logger;