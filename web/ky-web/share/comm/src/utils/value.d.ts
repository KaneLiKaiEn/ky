/** Positive protocol IDs; explicit zero-valued business sentinels stay at their boundary. */
export declare function id(value: unknown): number | null;
export declare const text: (value: unknown) => string;
export declare const sameId: (a: unknown, b: unknown) => boolean;
