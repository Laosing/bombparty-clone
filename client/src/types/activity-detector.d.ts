declare module 'activity-detector' {
    interface ActivityDetectorOptions {
        timeToIdle?: number;
        inactivityEvents?: string[];
    }

    interface ActivityDetector {
        on(event: 'idle' | 'active', callback: () => void): void;
        stop(): void;
    }

    function createActivityDetector(options?: ActivityDetectorOptions): ActivityDetector;
    export = createActivityDetector;
}
