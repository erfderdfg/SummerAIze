export interface Summary {
    id: string;
    text: string;
    summary: string;
    timestamp: Date;
    wordCount: number;
    source?: string;
}