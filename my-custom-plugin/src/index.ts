import { registerPlugin } from '@capacitor/core';

import type { JitCallPlugin } from './definitions';

const JitCall = registerPlugin<JitCallPlugin>('JitCall', {
  web: () => import('./web').then((m) => new m.JitCallWeb()),
});

export * from './definitions';
export { JitCall };
