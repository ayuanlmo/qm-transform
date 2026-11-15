import "./lib/Dir";
import Logger from "./lib/Logger";
import MainApp from './app';

// 主进程里任何逃逸的异常都会直接终止应用，用户看到的只是"窗口关了"。
// 兜底记录后继续运行，让已经发生的失败至少可诊断。
process.on('uncaughtException', (error: Error): void => {
    Logger.error('[main] uncaughtException:', error?.stack ?? error);
});

process.on('unhandledRejection', (reason: unknown): void => {
    Logger.error('[main] unhandledRejection:', (reason as Error)?.stack ?? reason);
});

((): void => {
    new MainApp();
})();
