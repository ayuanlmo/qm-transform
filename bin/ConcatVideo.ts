import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from 'electron';
import {mkdirSync} from 'node:fs';
import {getLocalConfigAsMain} from './Conf';
import Media from './Media';
import taskManager from './TaskManager';
import {discardEmptyOutput, isEmptyOutput, resolveConcatEncoder} from './TransformVideo';
import Logger from '../lib/Logger';

export interface IConcatOptions {
    optFormat: string;
    codec: string;
    width: number;
    height: number;
}

export interface IConcatPayload {
    concatTaskId: string;
    items: IMediaInfo[];
    options: IConcatOptions;
}

const getOutputExt = (optFormat: string): string => {
    const lower = (optFormat || 'mp4').toLowerCase();
    const known = ['mp4', 'mkv', 'mov', 'webm', 'ts', 'avi', 'flv', 'wmv'];

    return known.includes(lower) ? lower : 'mp4';
};

class ConcatVideo {
    public static async concat(payload: IConcatPayload, ctx: IpcMainEvent): Promise<void> {
        const {concatTaskId, items, options} = payload;

        if (!items || items.length < 2) {
            ctx.reply('main:on:task-end', {
                id: concatTaskId,
                baseName: '',
                path: null,
                error: true,
                errorMessage: 'At least 2 videos required for concat'
            });
            return;
        }

        const appConf = getLocalConfigAsMain();
        const outputExt = getOutputExt(options.optFormat);
        const fullPaths = items.map((i): string => i.fullPath);
        const outputBaseName = Media.getConcatOutputMediaFileName(fullPaths, outputExt);
        const confOutputPath = appConf?.output?.outputPath?.trim();
        const outputDir = confOutputPath && path.isAbsolute(confOutputPath)
            ? confOutputPath
            : path.dirname(items[0].fullPath);

        mkdirSync(outputDir, {recursive: true});
        const outputPath = Media.buildOutputPath(outputDir, outputBaseName, outputExt);

        const w = options.width || 1920;
        const h = options.height || 1080;
        const n = items.length;

        let ffmpegCommand: FfmpegCommand = ffmpeg();

        items.forEach((item): void => {
            ffmpegCommand = ffmpegCommand.input(item.fullPath);
        });

        const videoScaleFilter = `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p`;
        const audioResample = 'aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo';

        const hasAudio = items.map((item): boolean => {
            const streams = item.mediaInfo?.streams || [];

            return streams.some((s: { codec_type?: string }): boolean => s.codec_type === 'audio');
        });

        const videoFilters: string[] = [];
        const audioFilters: string[] = [];
        const concatInputs: string[] = [];

        for (let i = 0; i < n; i += 1) {
            videoFilters.push(`[${i}:v]${videoScaleFilter}[v${i}]`);

            if (hasAudio[i]) {
                audioFilters.push(`[${i}:a]${audioResample}[a${i}]`);
                concatInputs.push(`[v${i}][a${i}]`);
            } else {
                const rawDuration = items[i].mediaInfo?.format?.duration;
                const duration = (typeof rawDuration === 'number' ? rawDuration : parseFloat(String(rawDuration || 10))) || 10;

                audioFilters.push(`anullsrc=r=44100:cl=stereo,atrim=0:${duration},asetpts=PTS-STARTPTS[a${i}]`);
                concatInputs.push(`[v${i}][a${i}]`);
            }
        }

        const filterComplex = [
            ...videoFilters,
            ...audioFilters,
            `${concatInputs.join('')}concat=n=${n}:v=1:a=1[outv][outa]`
        ].join(';');

        taskManager.registerTask(concatTaskId, items[0], items.map((i): string => i.fullPath).join('|'), outputPath, ctx, {totalSeconds: 0});

        const encoderName = await resolveConcatEncoder(
            (options.codec || 'h264').toLowerCase(), appConf, outputPath, ctx);

        ffmpegCommand
            .outputOptions(['-filter_complex', filterComplex])
            .outputOptions(['-map', '[outv]', '-map', '[outa]'])
            .outputOptions(['-c:v', encoderName])
            .outputOptions(['-c:a', 'aac', '-b:a', '192k'])
            .output(outputPath);

        if (encoderName.endsWith('_videotoolbox'))
            ffmpegCommand.outputOptions(['-q:v', '30']);
        else if (encoderName.endsWith('_nvenc'))
            ffmpegCommand.outputOptions(['-preset', 'p4', '-rc', 'vbr', '-cq', '23', '-b:v', '0']);
        else if (encoderName.endsWith('_qsv'))
            ffmpegCommand.outputOptions(['-preset', 'medium', '-crf', '23']);
        else if (encoderName.endsWith('_amf'))
            ffmpegCommand.outputOptions(['-quality', 'balanced', '-rc', 'cqp', '-qp_i', '23', '-qp_p', '23']);
        else
            ffmpegCommand.outputOptions(['-preset', 'faster', '-crf', '23']);

        ffmpegCommand
            .on('start', (): void => {
                Logger.info(`Concat task ${concatTaskId} ffmpeg start`);
                const proc = (ffmpegCommand as any).ffmpegProc;

                if (proc?.pid)
                    taskManager.attachPid(concatTaskId, proc.pid, proc);
            })
            .on('progress', (progress): void => {
                if (taskManager.isPaused(concatTaskId)) return;
                const percent = Math.round(progress.percent || 0);

                ctx.reply('main:on:video-concat-progress', {id: concatTaskId, progress: percent});
            })
            .on('end', (): void => {
                if (taskManager.isPaused(concatTaskId)) return;
                taskManager.cleanup(concatTaskId);

                if (isEmptyOutput(outputPath)) {
                    Logger.error(`Concat task ${concatTaskId} finished without writing ${outputPath}`);
                    discardEmptyOutput(outputPath);
                    ctx.reply('main:on:video-concat-progress', {id: concatTaskId, progress: 0, error: true});
                    ctx.reply('main:on:task-end', {
                        id: concatTaskId,
                        progress: 100,
                        path: null,
                        baseName: outputBaseName,
                        error: true,
                        errorMessage: 'ffmpeg wrote nothing to the output file.'
                    });
                    return;
                }

                ctx.reply('main:on:video-concat-progress', {id: concatTaskId, progress: 100});
                ctx.reply('main:on:task-end', {
                    id: concatTaskId,
                    progress: 100,
                    path: outputPath,
                    baseName: outputBaseName
                });
            })
            .on('error', (err): void => {
                if (taskManager.isPaused(concatTaskId)) return;
                taskManager.cleanup(concatTaskId);
                discardEmptyOutput(outputPath);
                ctx.reply('main:on:video-concat-progress', {
                    id: concatTaskId,
                    progress: 0,
                    error: true,
                    errorMessage: err.message
                });
                ctx.reply('main:on:task-end', {
                    id: concatTaskId,
                    baseName: outputBaseName,
                    path: null,
                    error: true,
                    errorMessage: err.message
                });
            });

        ffmpegCommand.run();
    }
}

export default ConcatVideo;
