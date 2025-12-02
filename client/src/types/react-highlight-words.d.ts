declare module 'react-highlight-words' {
    import * as React from 'react';

    export interface HighlighterProps {
        autoEscape?: boolean;
        activeClassName?: string;
        activeStyle?: React.CSSProperties;
        activeIndex?: number;
        caseSensitive?: boolean;
        className?: string;
        findChunks?: (options: {
            autoEscape?: boolean;
            caseSensitive?: boolean;
            sanitize?: (text: string) => string;
            searchWords: string[];
            textToHighlight: string;
        }) => { start: number; end: number }[];
        highlightClassName?: string | ((options: { highlightIndex: number }) => string);
        highlightStyle?: React.CSSProperties;
        highlightTag?: string | React.ComponentType<any>;
        sanitize?: (text: string) => string;
        searchWords: string[];
        textToHighlight: string;
        unhighlightClassName?: string;
        unhighlightStyle?: React.CSSProperties;
        [key: string]: any;
    }

    export default class Highlighter extends React.Component<HighlighterProps> {}
}
