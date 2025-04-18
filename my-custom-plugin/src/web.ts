import { WebPlugin } from '@capacitor/core';

import type { JitCallPlugin } from './definitions';

export class JitCallWeb extends WebPlugin implements JitCallPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }

  async testPluginMethod(options: { msg: string }): Promise<{ value: string }> {
  
    alert(options.msg);
    return { value: options.msg };
  }
}
