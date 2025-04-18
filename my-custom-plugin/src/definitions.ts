declare module '@capacitor/core' {
  interface PluginRegistry {
    JitCall: JitCallPlugin;
  }
}
export interface JitCallPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;

  testPluginMethod(options: { msg: string }): Promise<{ value: string }>;

}
