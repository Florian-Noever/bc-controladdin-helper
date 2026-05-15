import ALHelper from './ALHelper.js';

/**
 * Log levels for ALLogger. Messages logged below the current log level will be ignored.
 *  - `NONE`: No messages will be logged.
 *  - `ERROR`: Only error messages will be logged.
 *  - `WARNING`: Warning and error messages will be logged.
 *  - `INFO`: All messages (info, warning, and error) will be logged.
 */
export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARNING = 2,
    INFO = 3,
}

declare global {
    interface Window {
        /** Browser-console helper — calls {@link ALLogger.setLogLevel} at runtime. Registered by {@link ALLogger.init}. */
        setALLoggerLogLevel: (level: LogLevel) => void;
        
        /** Browser-console helper — calls {@link ALLogger.setIncludeTimestamp} at runtime. Registered by {@link ALLogger.init}. */
        setALLoggerIncludeTimestamp: (value: boolean) => void;
    }
}

/**
 * Lightweight structured logger for Business Central control add-ins.
 *
 * Log level and timestamp output can be changed at runtime — either from
 * code via the static methods, or from the browser dev console via the
 * `setALLoggerLogLevel` / `setALLoggerIncludeTimestamp` globals that
 * are registered on `window` (and `window.top` where accessible) when
 * this module is imported.
 */
export default class ALLogger {
    static #logLevel: LogLevel = LogLevel.WARNING;
    static #includeTimestamp = false;
    static #initialized = false;

    /**
     * Sets the minimum log level. Messages below this level are silently discarded.
     * @param level - The new minimum {@link LogLevel}.
     */
    static setLogLevel(level: LogLevel): void {
        ALLogger.#logLevel = level;
        ALLogger.info('Logger', `Log level set to: ${LogLevel[level]}`);
    }

    /**
     * Controls whether an ISO-8601 timestamp is prepended to every log message.
     * @param value - `true` to include timestamps, `false` to omit them.
     */
    static setIncludeTimestamp(value: boolean): void {
        ALLogger.#includeTimestamp = value;
        ALLogger.info('Logger', `Timestamp logging set to: ${value}`);
    }

    /**
     * Registers `setLogLevel` and `setIncludeTimestamp` as AL-callable
     * functions on `window` via {@link ALHelper.makeFunctionAccessible}.
     * Call this once from the control add-in StartupScript after importing the module.
     */
    static init(): void {
        if (ALLogger.#initialized) {
            return;
        }

        ALHelper.makeFunctionAccessible(ALLogger.setLogLevel);
        ALHelper.makeFunctionAccessible(ALLogger.setIncludeTimestamp);

        ALLogger.#initialized = true;
    }

    /**
     * Logs a message at the `ERROR` level.
     * @param context - A short label identifying the source of the message (e.g. class or module name).
     * @param message - The message to log.
     * @param data - Optional value logged alongside the message (e.g. an error object or payload).
     */
    static error(context: string, message: string, data?: unknown): void {
        ALLogger.#log(LogLevel.ERROR, context, message, data);
    }

    /**
     * Logs a message at the `WARNING` level.
     * @param context - A short label identifying the source of the message (e.g. class or module name).
     * @param message - The message to log.
     * @param data - Optional value logged alongside the message.
     */
    static warning(context: string, message: string, data?: unknown): void {
        ALLogger.#log(LogLevel.WARNING, context, message, data);
    }

    /**
     * Logs a message at the `INFO` level.
     * @param context - A short label identifying the source of the message (e.g. class or module name).
     * @param message - The message to log.
     * @param data - Optional value logged alongside the message.
     */
    static info(context: string, message: string, data?: unknown): void {
        ALLogger.#log(LogLevel.INFO, context, message, data);
    }

    static #log(level: LogLevel, context: string, message: string, data?: unknown): void {
        if (level === LogLevel.NONE || ALLogger.#logLevel < level) {
            return;
        }

        const levelName = LogLevel[level];
        const prefix = ALLogger.#includeTimestamp
            ? `[${new Date().toISOString()}] [${levelName}] [${context}]`
            : `[${levelName}] [${context}]`;
        const formatted = `${prefix} ${message}`;

        switch (level) {
            case LogLevel.ERROR:
                data !== undefined ? console.error(formatted, data) : console.error(formatted);
                break;
            case LogLevel.WARNING:
                data !== undefined ? console.warn(formatted, data) : console.warn(formatted);
                break;
            case LogLevel.INFO:
                data !== undefined ? console.log(formatted, data) : console.log(formatted);
                break;
        }
    }
}

// Register debug controls on window (and window.top where accessible) so they
// can be called from the browser console without importing this module directly.
try {
    window.setALLoggerLogLevel = ALLogger.setLogLevel.bind(ALLogger);
    window.setALLoggerIncludeTimestamp = ALLogger.setIncludeTimestamp.bind(ALLogger);
    if (window.top && window.top !== window) {
        window.top.setALLoggerLogLevel = window.setALLoggerLogLevel;
        window.top.setALLoggerIncludeTimestamp = window.setALLoggerIncludeTimestamp;
    }
} catch { /* Cross-origin window.top access is blocked — ignore silently. */ }
