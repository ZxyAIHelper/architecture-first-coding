import { RunSession } from './application.mjs';

// Interface translates player intent and displays results; it never edits combat.
const session = new RunSession();
session.execute('start');
console.log('Opening:', session.view());
session.execute('step', { damage: 10, earned: 8 });
console.log('Defeated:', session.view());
console.log('Restart:', session.execute('restart_wave'));
console.log('Restored:', session.view());
console.log('Duplicate restart:', session.execute('restart_wave'));
