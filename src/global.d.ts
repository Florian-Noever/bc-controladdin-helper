import type { NAVEnvironment } from './ALEnvironment.js';

declare global {
    interface Window {
        Microsoft?: {
            Dynamics?: {
                NAV?: {
                    /**
                     * Returns the current BC environment, including user/company info, device category, platform, and busy state.
                     * @returns The live {@link NAVEnvironment} object for the current session.
                     */
                    GetEnvironment(): NAVEnvironment;

                    /**
                     * Triggers the AL trigger `name` on the control add-in, passing `arguments` as the payload.
                     * @param name - The AL trigger name to invoke.
                     * @param arguments - Array of values forwarded to the AL trigger's parameters.
                     * @param skipIfBusy - When `true`, the call is silently dropped if BC is already processing a request.
                     * @param successCallback - Called after BC has processed the trigger successfully.
                     * @param errorCallback - Called if BC rejects the invocation.
                     */
                    InvokeExtensibilityMethod(
                        name: string,
                        arguments: unknown[],
                        skipIfBusy?: boolean,
                        successCallback?: () => void,
                        errorCallback?: () => void,
                    ): void;

                    /**
                     * Resolves a named image (declared in the AL `Images` property) to a data/CDN URL.
                     * @param imageName - The name of the image as declared in the AL `Images` property.
                     * @returns A data URI or CDN URL that can be used as an `<img>` `src`.
                     */
                    GetImageResource(imageName: string): string;

                    /**
                     * Opens a URL in a new tab. Prefer this over `window.open()` — it works correctly
                     * in the BC Mobile App where `window.open` behaviour is undefined.
                     * @param url - The URL to open.
                     */
                    OpenWindow(url: string): void;
                };
            };
        };
        
        /**
         * BC calls this with the AL return value just before `successCallback` fires.
         * @param result - The value returned by the AL trigger.
         */
        OnInvokeResult?: (result: unknown) => void;
    }
}

export { };
