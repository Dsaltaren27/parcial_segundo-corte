export interface JitCallPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
