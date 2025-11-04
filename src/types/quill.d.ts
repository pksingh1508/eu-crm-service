declare module "quill" {
  import type { DeltaStatic, RangeStatic } from "quill/core";

  export default class Quill {
    constructor(
      element: Element | string,
      options?: {
        theme?: string;
        modules?: Record<string, any>;
        placeholder?: string;
        readOnly?: boolean;
      }
    );

    root: HTMLElement;
    clipboard: {
      dangerouslyPasteHTML: (html: string) => void;
    };

    getSelection(): RangeStatic | null;
    setSelection(index: number | RangeStatic, length?: number): void;

    on(eventName: string, handler: (...args: any[]) => void): void;
    off(eventName: string, handler: (...args: any[]) => void): void;
  }

  export type { DeltaStatic, RangeStatic };
}
