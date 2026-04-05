declare module "quill-better-table" {
  interface BetterTableModule {
    insertTable(rows: number, columns: number): void;
    getTable(
      range?: { index: number; length: number } | null
    ): [unknown | null, unknown | null, unknown | null, number];
  }

  const QuillBetterTable: {
    new (...args: unknown[]): BetterTableModule;
    keyboardBindings: Record<string, unknown>;
    register(): void;
  };

  export default QuillBetterTable;
}
