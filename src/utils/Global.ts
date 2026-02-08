export const __G = global || window;

const Global = {
    requireNodeModule: <T>(moduleName: string): T => {
        return __G['require'](moduleName);
    }
};

export const pathParse = (path: string): string => {
    return path.replace(/\\/g, '\\\\');
};

export default Global;
