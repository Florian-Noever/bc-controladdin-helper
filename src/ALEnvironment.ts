/** Device category the BC client is running on. */
export enum DeviceCategory {
    Desktop = 0,
    Tablet = 1,
    Phone = 2,
}

/** Platform / client type. */
export enum Platform {
    WindowsClient = 0,
    Web = 1,
    MobileApp = 2,
    OfficeAddin = 3,
}

/** Primary user input mode. */
export enum UserInteractionMode {
    Mouse = 0,
    Touch = 1,
}

/** The live environment object returned by `Microsoft.Dynamics.NAV.GetEnvironment()`. */
export interface NAVEnvironment {

    /** Logged-in BC user name. */
    readonly UserName: string;

    /** Current BC company name. */
    readonly CompanyName: string;

    /** The device category the client is running on. */
    readonly DeviceCategory: DeviceCategory;

    /** The platform / client type. */
    readonly Platform: Platform;

    /** The primary input mode. */
    readonly UserInteractionMode: UserInteractionMode;

    /** `true` while the client is processing a server round-trip. */
    readonly Busy: boolean;

    /** Assign a callback; BC calls it whenever `Busy` flips. */
    OnBusyChanged: (() => void) | undefined;

    /**
     * Assign a callback; BC calls it when the page is closing.
     * Do NOT call `InvokeExtensibilityMethod` inside this callback — the channel is already closed.
     */
    OnClosed: (() => void) | undefined;
}
