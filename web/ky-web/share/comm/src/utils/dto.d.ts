export declare function decodeTags(value: unknown): string[];
export declare function encodeTags(value: unknown): string;
export declare function dateString(value: unknown): string;
/** Remove presentation metadata while retaining IDs and unknown server fields. */
export declare function cleanRow<T extends object>(row: T): T;
export declare function withBaseline<T extends object>(baseline: T, changes: Partial<T>): T;
/** Submit only fields declared by the selected wire protocol. */
export declare function pickRow<T extends object>(row: T, fields: readonly string[]): T;
