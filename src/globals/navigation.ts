import { createBrowserHistory } from '../../lib/history.js';
import { createHistoryLogger } from '../../lib/logger.js';

export const appHistory = createBrowserHistory();
export const logger = createHistoryLogger(appHistory);
