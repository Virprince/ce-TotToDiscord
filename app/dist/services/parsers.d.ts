import { ParsedParams } from '../types';
type Parser = (params: string) => ParsedParams | null;
/**
 * Map des parsers par eventId
 */
export declare const PARSERS: Record<string, Parser>;
/**
 * Parse les paramètres selon l'eventId
 */
export declare function parseParams(eventId: string, params: string): ParsedParams | null;
export {};
//# sourceMappingURL=parsers.d.ts.map