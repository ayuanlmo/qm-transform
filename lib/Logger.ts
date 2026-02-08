import Logger from "electron-log/main";

Logger.transports.file.fileName = `${getDay()}.log`;
Logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
Logger.transports.file.maxSize = 1048576;

Logger.initialize();

function getDay(f: string = ''): string {
    const d = new Date();

    return `${d.getFullYear()}${f}${d.getMonth() + 1}${f}${d.getDate()}`;
}

export default Logger;
