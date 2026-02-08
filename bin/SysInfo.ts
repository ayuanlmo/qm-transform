import {graphics, Systeminformation} from "systeminformation";
import {arch, platform as pf} from "node:os";
import Logger from "../lib/Logger";

const platform: NodeJS.Platform = pf();
const gpuVendors: Map<string, TGPUVendors> = new Map<string, TGPUVendors>([
    ['Advanced Micro Devices, Inc.', 'AMD'],
    ['ATI Technologies Inc', 'AMD'],
    ['Intel Corporation', 'Intel'],
    ['Apple', 'Apple'],
    ['NVIDIA', 'NVIDIA']
]);

/**
 * @class SysInfo
 * @static
 * @author ayuanlmo
 * @description 系统信息
 * **/
class SysInfo {
    /**
     * @method gpuInfo
     * @return {Promise<TGPUVendors>}
     * @author ayuanlmo
     * @description 获取gpu信息 （厂商
     * **/
    public static async gpuInfo(): Promise<TGPUVendors> {
        try {
            const data: Systeminformation.GraphicsData = await graphics();
            const getVendor = (gpus: Systeminformation.GraphicsControllerData[]): TGPUVendors => gpus.length > 0
                ? gpuVendors.get(gpus[0].vendor) ?? 'unknown' : 'unknown';

            if (platform === 'win32') {
                // Windows 平台：过滤出有显存和总线信息的实际GPU，并按显存大小排序（优先独立显卡）
                const physicalGPUs: Systeminformation.GraphicsControllerData[] = data.controllers.filter(
                    (controller: Systeminformation.GraphicsControllerData) =>
                        controller.vram != null && controller.vram > 0 && controller.bus !== ''
                ).sort((a, b) => (b.vram || 0) - (a.vram || 0));

                return getVendor(physicalGPUs);
            }

            // Apple Silicon平台的macOS。GPU必然是Apple
            if (arch() === 'arm64' && platform === 'darwin')
                return 'Apple';

            if (platform === 'darwin') {
                // macOS 平台：查找内置总线且有核心数的GPU
                const physicalGPUs: Systeminformation.GraphicsControllerData[] = data.controllers.filter(
                    (controller: Systeminformation.GraphicsControllerData) =>
                        controller.bus === 'Built-In' && !!controller.cores
                );

                return getVendor(physicalGPUs);
            }

            return 'unknown';

        } catch (error) {
            Logger.error(error);
            return 'unknown';
        }
    }
}

export default SysInfo;
