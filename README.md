# BC ControlAddIn Helper

Helper for invoking AL events or making JS/TS functions available for AL ControlAddIns to call.

## How to use the package

1. Install via `npm install --save @floriannoever/bc-controladdin-helper`
2. Import the ALHelper class `import ALHelper from '@floriannoever/bc-controladdin-helper';`
3. Use the available function as mentioned below

## How to Call Functions from AL code

The template supports making functions public to be callable from the BC ControlAddIn. For this you need to follow these steps:

1. Have a function that you want to make accessible for AL Code:
    ```javascript
    function someGlobalFunction() {
        window.alert('Hello from the control add-in!');
    }
    ```
2. Make that function accessible using the `ALHelper` class:
    ```javascript
    ALHelper.makeFunctionAccessible(someGlobalFunction);
    ```
3. In the ControlAddIn of your BC Project, define the Function *(Note that first letter is capital)*:
    ```c#
    controladdin "PTE MyControlAddIn"
    {
        Scripts = './addins/myproject.js';

        procedure SomeGlobalFunction();
    }
    ```
4. Call the procedure like you would normally do using the ControlAddIn

> [!NOTE]
> If the function relies on `this` (e.g. a class method), pass the class instance or the class itself as the second argument so it is correctly bound when called from AL:
> ```javascript
> ALHelper.makeFunctionAccessible(myInstance.someMethod, myInstance);
> ```

## How to call an AL Event from Typescript

The template supports calling Events that are defined in the ControlAddIn file in the BC Project. For this you need to follow these steps:

1. Add the event you want to the ControlAddIn in your BC Project:
    ```c#
    controladdin "PTE MyControlAddIn"
    {
        Scripts = './addins/myproject.js';

        event OnControlReady(Message: Text; CurrDateTime: Text);
    }
    ```
2. Invoke the event in your Project:
    ```javascript
    const datetime = new Date(Date.now());
    ALHelper.invokeEvent('OnControlReady', 'Control Ready Event. Time: ', datetime.toLocaleTimeString());

    // or skipping event if BC Environment is busy (operation is running)
    ALHelper.invokeEventSkipBusy('OnControlReady', 'Control Ready Event. Time: ', datetime.toLocaleTimeString());
    ```
> [!NOTE]
> The first parameter of `invokeEvent` is the name of the event in your BC project. All further parameters are forwarded to the AL event's parameters: `invokeEvent('name', param1, param2)`. If your data is already in an array, use the spread operator: `invokeEvent('name', ...yourArray)`.

## Logging with ALLogger

The package includes a lightweight structured logger for use in control add-ins.

1. Import `ALLogger` and `LogLevel`:
    ```javascript
    import ALLogger, { LogLevel } from '@floriannoever/bc-controladdin-helper/ALLogger';
    ```
2. Call `ALLogger.init()` once in your StartupScript. This registers `SetALLoggerLogLevel` and `SetALLoggerIncludeTimestamp` as AL-callable procedures so the log level can be changed at runtime from AL code:
    ```javascript
    ALLogger.init();
    ```
3. Log messages using the appropriate level method. The `context` parameter is a short label identifying the source (e.g. the class or module name):
    ```javascript
    ALLogger.error('MyComponent', 'Something went wrong', errorObject);
    ALLogger.warning('MyComponent', 'Unexpected state encountered');
    ALLogger.info('MyComponent', 'Control ready');
    ```

The default log level is `WARNING`, so only warnings and errors are shown. Change it in code:

```javascript
ALLogger.setLogLevel(LogLevel.INFO); // show all messages
ALLogger.setLogLevel(LogLevel.NONE); // silence all messages
```

> [!NOTE]
> After calling `ALLogger.init()`, the log level can also be changed at runtime directly from the browser dev console (`setALLoggerLogLevel(2)`) or from AL code via the registered procedures, without redeploying (in AL `SetLogLevel(logLevel: int)`).
> Where NONE = 0, ERROR = 1, WARNING = 2, INFO = 3
