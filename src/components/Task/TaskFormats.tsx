import * as React from "react";
import {Select} from "@fluentui/react-components";
import {audioFormatType, IFormatType, videoFormatType} from "../../const/formatType";

export type ITaskFormatsProps = {
    type: 'video' | 'audio';
    value?: string;
    defaultValue?: string;
    // 当前选择的目标视频编解码器（如 'h264' | 'hevc'），用于过滤不支持的封装格式
    codec?: string;
    disabled?: boolean;
    onChange?: (format: IFormatType) => void;
}

const TaskFormats: React.FC<ITaskFormatsProps> = (props: ITaskFormatsProps): React.JSX.Element => {
    const {type, value, defaultValue, codec, disabled} = props;
    let types: IFormatType[] = [];

    if (type === 'video') {
        types = videoFormatType.filter((item) => {
            if (!codec || !item.supportedCodecs)
                return true;
            return item.supportedCodecs.includes(codec);
        });
    }

    if (type === 'audio')
        types = audioFormatType;

    const selectProps: { value?: string; defaultValue?: string } = {};

    if (value !== undefined) {
        selectProps.value = value;
    } else if (defaultValue !== undefined) {
        selectProps.defaultValue = defaultValue;
    }

    return (
        <Select
            {...selectProps}
            disabled={disabled}
            onChange={(ev, data): void => {
                const current = types.find(i => i.name === data.value) || types[0];

                if (!current) return;
                props.onChange?.(current);
            }}
        >
            {
                types.map((i, k) => {
                    return (
                        <option
                            key={i.type + k.toString()}
                            value={i.name}
                        >
                            {i.label}
                        </option>
                    );
                })
            }
        </Select>
    );
};

export default TaskFormats;
