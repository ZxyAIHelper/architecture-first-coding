import { RetailSession } from './application.mjs';

// Interface retains a preview for display, then submits intent and its revision.
const session = new RetailSession();
const proposal = session.quote(0);
console.log('Quote:', proposal);
console.log('Confirm:', session.command('build', proposal));
console.log('Duplicate:', session.command('build', proposal));
console.log('After confirmation:', session.view());
