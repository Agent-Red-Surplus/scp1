import { SCPFoundation } from './scpFoundation.js';

const app = new SCPFoundation();
window.app = app; // expose for inline handlers (e.g., onclick="app.viewSCP(...)")