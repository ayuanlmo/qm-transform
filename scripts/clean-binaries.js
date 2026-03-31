const {existsSync, readdirSync, statSync, accessSync, rmSync, constants} = require('fs');
const {join} = require('path');

const {platform, arch} = process;

const packages = ['ffprobe-static'];
const nodeModulesPath = join(__dirname, 'node_modules');

const removeDir = (dir) => {
    try {
        accessSync(dir, constants.R_OK | constants.W_OK);

        rmSync(dir, {
            recursive: true, force: true
        });
    } catch (e) {
        console.log('e');
        throw e;
    }
};

void (() => {
    packages.forEach((module) => {
        const packagePath = join(nodeModulesPath, module);

        if (existsSync(packagePath)) {
            const dirs = readdirSync(packagePath);

            if (dirs.includes('bin')) {
                const binPath = join(packagePath, 'bin');

                if (existsSync(binPath)) {
                    const dirs = readdirSync(binPath);

                    dirs.forEach((dir) => {
                        const resultPlatform = path.join(binPath, dir);
                        const stat = statSync(resultPlatform);

                        if (stat.isDirectory()) {
                            if (dir !== platform)
                                removeDir(resultPlatform);
                            else {
                                const resultArchs = readdirSync(resultPlatform).filter(i => i !== arch);

                                resultArchs.forEach((i) => {
                                    const p = join(resultPlatform, i);

                                    removeDir(p);
                                });
                            }
                        }
                    });
                }
            }
        }
    });
})();
