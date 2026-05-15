import type { NAVEnvironment } from './ALEnvironment.js';

/**
 * Helper class for invoking AL events and making functions accessible in AL.
 */
export default class ALHelper {
    /**
     * Invokes an AL event with the specified event name. Optionally, data can be passed to the event.
     * @param eventName - The name of the AL event to invoke.
     */
    static invokeEvent(eventName: string): void;

    /**
     * Invokes an AL event with the specified event name. Optionally, data can be passed to the event.
     * @param eventName - The name of the AL event to invoke.
     * @param [data] - Optional array of arguments to pass to the AL event.
     */
    static invokeEvent(eventName: string, ...data: unknown[]): void;

    static invokeEvent(eventName: string, ...data: unknown[]): void {
        if (data && data.length != 0) {
            this.getALMethod(eventName, false)(...data); // Call the AL method with the given name and data
        } else {
            this.getALMethod(eventName, false)(); // Call the AL method with the given name without data
        }
    }

    /**
     * Invokes an AL event with the specified event name. Optionally, data can be passed to the event,
     * and the invocation will be skipped if the NAV environment is busy.
     * @param eventName - The name of the AL event to invoke.
     */
    static invokeEventSkipBusy(eventName: string): void;

    /**
     * Invokes an AL event with the specified event name. Optionally, data can be passed to the event,
     * and the invocation will be skipped if the NAV environment is busy.
     * @param eventName - The name of the AL event to invoke.
     * @param [data] - Optional array of arguments to pass to the AL event.
     */
    static invokeEventSkipBusy(eventName: string, ...data: unknown[]): void;

    static invokeEventSkipBusy(eventName: string, ...data: unknown[]): void {
        if (data && data.length != 0) {
            this.getALMethod(eventName, true)(...data); // Call the AL method with the given name and data
        } else {
            this.getALMethod(eventName, true)(); // Call the AL method with the given name without data
        }
    }

    /**
     * Retrieves an AL method by name and returns a function that, when invoked, will
     * call the corresponding AL procedure with the provided arguments. If the NAV environment
     * is busy and `SKIP_IF_BUSY` is true, the promise resolves immediately with `SKIP_IF_BUSY`.
     * @template T
     * @param name - The name of the AL method to retrieve.
     * @param SKIP_IF_BUSY - A value to resolve the promise with if the NAV environment is busy.
     * @returns A function that, when invoked, will execute the AL method.
     */
    private static getALMethod<T>(name: string, SKIP_IF_BUSY: T): (...args: unknown[]) => Promise<T | unknown> {
        const nav = window.Microsoft?.Dynamics?.NAV?.GetEnvironment();
        if (!nav) {
            console.warn('NAV environment is not available.');
            return async (): Promise<unknown> => console.warn(`Cannot invoke AL method '${name}' because NAV environment is not available.`);
        }

        return (...args: unknown[]): Promise<T | unknown> => {
            let result: unknown;

            // Define the OnInvokeResult event handler
            window.OnInvokeResult = function (alResult: unknown): void {
                result = alResult;
            };

            return new Promise<T | unknown>(resolve => {
                // If nav is busy and skip if busy is true: return
                if (SKIP_IF_BUSY && nav.Busy) {
                    resolve(SKIP_IF_BUSY);
                    return;
                }

                // Invoke the AL method with the given name and arguments
                window.Microsoft!.Dynamics!.NAV!.InvokeExtensibilityMethod(name, args, false, () => {
                    delete window.OnInvokeResult;
                    resolve(result);
                });
            });
        };
    }

    /**
     * Makes a specified function accessible in the AL environment by adding it to
     * the global `window` object with a capitalized name.
     * @param func - The function to make accessible in AL.
     * @param context - Optional object to bind as `this` when the function is called.
     *                  Use this when passing a class method that relies on `this`.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static makeFunctionAccessible<T extends (...args: any[]) => any>(func: T, context?: object): void {
        const functionName = func.name; // Get the name of the function
        const capitalizedFunctionName = functionName.charAt(0).toUpperCase() + functionName.slice(1); // Capitalize the first letter of the function name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any)[capitalizedFunctionName] = context == null ? func : func.bind(context); // Make the function available in the window object to be called in AL
    }

    /**
     * Returns the Business Central control add-in host element (`<div id="controlAddIn">`).
     * Throws if the element is not found, which causes the StartupScript execution to
     * fail with a clear error rather than silently producing a broken add-in.
     * @returns The host HTMLElement.
     * @throws {Error} When the element with id `controlAddIn` does not exist in the document.
     */
    static ensureHostElement(): HTMLElement {
        const element = document.getElementById('controlAddIn');
        if (!element) {
            throw new Error(
                'Control add-in host element not found. ' +
                'Ensure this script is running as a BC StartupScript and that the controlAddIn element is present.',
            );
        }
        console.log('Control add-in host element found:', element);
        return element;
    }

    /**
     * Returns the live BC environment object, or `undefined` if the NAV object is not available.
     * The returned object stays live — `Busy`, `OnBusyChanged`, and `OnClosed` reflect the
     * current client state and can be assigned at any time.
     * @returns The live {@link NAVEnvironment} object, or `undefined` when running outside the BC client.
     */
    static getEnvironment(): NAVEnvironment | undefined {
        return window.Microsoft?.Dynamics?.NAV?.GetEnvironment();
    }

    /**
     * Registers a callback that BC calls whenever the client's `Busy` state changes.
     * @param callback - Function to invoke on each `Busy` transition.
     */
    static onBusyChanged(callback: () => void): void {
        const env = ALHelper.getEnvironment();
        if (env) {
            env.OnBusyChanged = callback;
        } else {
            console.warn('NAV environment is not available. onBusyChanged callback not registered.');
        }
    }

    /**
     * Registers a callback that BC calls when the page is closing.
     * Do NOT call `invokeEvent` inside this callback — the channel is already closed by then.
     * @param callback - Function to invoke when the page closes.
     */
    static onClosed(callback: () => void): void {
        const env = ALHelper.getEnvironment();
        if (env) {
            env.OnClosed = callback;
        } else {
            console.warn('NAV environment is not available. onClosed callback not registered.');
        }
    }

    /**
     * Opens a URL in a new tab. Prefer this over `window.open()` — it works correctly
     * in the BC Mobile App where `window.open` behaviour is undefined.
     * Falls back to `window.open` outside of the BC environment.
     * @param url - The URL to open.
     */
    static openWindow(url: string): void {
        if (window.Microsoft?.Dynamics?.NAV?.OpenWindow) {
            window.Microsoft.Dynamics.NAV.OpenWindow(url);
        } else {
            window.open(url);
        }
    }

    /**
     * Resolves a named image resource declared in the AL `Images` property to a data/CDN URL.
     * @param imageName - The name of the image as declared in AL.
     * @returns The resolved URL, or `undefined` if the NAV object is not available.
     */
    static getImageResource(imageName: string): string | undefined {
        return window.Microsoft?.Dynamics?.NAV?.GetImageResource(imageName);
    }
}
