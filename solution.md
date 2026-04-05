# Fix: Quill Table Support with `quill-better-table`

## Problem Summary

The current code uses `table: true` in Quill's module config, but Quill v2 does not ship with a built-in table module. As a result:

- The **Table** and **Row+** toolbar buttons are invisible or non-functional.
- Clicking them triggers `"Table support is not available right now."` because `quill.getModule("table")` returns `undefined`.

---

## Step 1 — Install the Package

```bash
npm install quill-better-table
```

Also install its type definitions if you're using TypeScript:

```bash
npm install --save-dev @types/quill-better-table
# If types aren't available, you can declare the module manually (see Step 3)
```

---

## Step 2 — Add the CSS Import

In your component file (at the very top, alongside the existing Quill CSS import):

```ts
import "quill/dist/quill.snow.css";
import "quill-better-table/dist/quill-better-table.css"; // ← ADD THIS
```

---

## Step 3 — Add a TypeScript Module Declaration (if needed)

If TypeScript complains that `quill-better-table` has no type declarations, create a file at the root of your project:

**`quill-better-table.d.ts`**

```ts
declare module "quill-better-table" {
  import Quill from "quill";

  interface BetterTableModule {
    insertTable(rows: number, columns: number): void;
    insertRowBelow(): void;
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
```

---

## Step 4 — Update the `QuillTableModule` Type

In your component, replace the existing `QuillTableModule` type:

```ts
// BEFORE
type QuillTableModule = {
  getTable: (
    range?: QuillRange | null
  ) => [unknown | null, unknown | null, unknown | null, number];
  insertRowBelow: () => void;
  insertTable: (rows: number, columns: number) => void;
};

// AFTER — same shape, no change needed here.
// The module key changes from "table" to "better-table" (see Step 6).
```

---

## Step 5 — Register `quill-better-table` Inside `initialize()`

Inside the `initialize` async function, **after** importing Quill and **before** creating the Quill instance, add the registration inside the `if (!quillFormattingRegistered)` block:

```ts
const initialize = async () => {
  const { default: Quill } = await import("quill");
  const { default: QuillBetterTable } = await import("quill-better-table"); // ← ADD

  if (!isMounted || !containerRef.current) {
    return;
  }

  if (!quillFormattingRegistered) {
    // ← ADD THIS LINE (must come before other Quill.register calls)
    Quill.register({ "modules/better-table": QuillBetterTable }, true);

    const Font = Quill.import("attributors/style/font");
    // ... rest of your existing registration code unchanged
  }

  // ... rest of initialize unchanged until the Quill instantiation
};
```

---

## Step 6 — Update the Quill Instance Config

Replace the `new Quill(...)` call:

```ts
// BEFORE
quillInstance = new Quill(containerRef.current, {
  theme: "snow",
  modules: {
    table: true,                    // ← REMOVE
    toolbar: {
      container: toolbarOptions,
      handlers: toolbarHandlers
    }
  }
});

// AFTER
quillInstance = new Quill(containerRef.current, {
  theme: "snow",
  modules: {
    "better-table": {               // ← REPLACE "table: true" with this
      operationMenu: {
        items: {
          unmergeCells: { text: "Unmerge cells" }
        },
        color: {
          colors: ["#fff", "#e8e8e8", "#0e2f75"],
          text: "Background Colors"
        }
      }
    },
    keyboard: {
      bindings: QuillBetterTable.keyboardBindings  // ← ADD keyboard bindings
    },
    toolbar: {
      container: toolbarOptions,
      handlers: toolbarHandlers
    }
  }
});
```

---

## Step 7 — Update the Toolbar Handlers

Replace both `insertTable` and `tableRow` handlers to use the `"better-table"` module key:

```ts
const toolbarHandlers = {
  // ... customColor and image handlers unchanged ...

  insertTable(this: { quill: any }) {
    const quill = this.quill;
    const tableModule = quill.getModule("better-table") as  // ← "better-table" not "table"
      | QuillTableModule
      | undefined;

    if (!tableModule) {
      toast.error("Table support is not available right now.");
      return;
    }

    quill.focus();
    const currentRange = quill.getSelection(true);
    if (currentRange) {
      quill.setSelection(currentRange.index, currentRange.length, "silent");
    } else {
      quill.setSelection(quill.getLength(), 0, "silent");
    }

    tableModule.insertTable(DEFAULT_TABLE_ROWS, DEFAULT_TABLE_COLUMNS);

    window.requestAnimationFrame(() => {
      enforceEditorContentStyles(quill.root);
    });
  },

  tableRow(this: { quill: any }) {
    const quill = this.quill;
    const tableModule = quill.getModule("better-table") as  // ← "better-table" not "table"
      | QuillTableModule
      | undefined;

    if (!tableModule) {
      toast.error("Table support is not available right now.");
      return;
    }

    const [table] = tableModule.getTable();
    if (!table) {
      toast.info("Place the cursor inside a table to add a row.");
      return;
    }

    tableModule.insertRowBelow();

    window.requestAnimationFrame(() => {
      enforceEditorContentStyles(quill.root);
    });
  }
};
```

---

## Step 8 — Verify `toolbarOptions` (No Change Needed)

Your existing `toolbarOptions` array already includes the custom buttons correctly:

```ts
["link", "image", "blockquote", "code-block", "insertTable", "tableRow"],
```

These are custom handler names, not Quill built-ins, so no change is needed here.

---

## Step 9 — Cleanup: Remove the Stale `QuillTableModule` Import Reference

In the `initialize()` cleanup/return block, nothing changes — the existing cleanup correctly removes `text-change` listeners and the custom color input, which are unrelated to the table module.

---

## Summary of All Changes

| Location | Change |
|---|---|
| Top of file | Add `import "quill-better-table/dist/quill-better-table.css"` |
| `initialize()` | Dynamic import `QuillBetterTable` from `"quill-better-table"` |
| `if (!quillFormattingRegistered)` | Add `Quill.register({ "modules/better-table": QuillBetterTable }, true)` |
| `new Quill(...)` modules | Replace `table: true` → `"better-table": { ... }` and add `keyboard` bindings |
| `toolbarHandlers.insertTable` | Change `getModule("table")` → `getModule("better-table")` |
| `toolbarHandlers.tableRow` | Change `getModule("table")` → `getModule("better-table")` |
| Project root (if needed) | Add `quill-better-table.d.ts` for TypeScript type declaration |

---

## Notes

- `quill-better-table` requires Quill **1.x**. If you are on Quill 2.x, check compatibility before upgrading — there are known issues and you may need to pin `quill` to `1.3.7`.
- The `operationMenu` in the `better-table` config adds a right-click context menu inside tables for operations like inserting/deleting rows and columns.
- The `keyboard.bindings` from `QuillBetterTable.keyboardBindings` enables Tab key navigation between table cells.
