import * as React from "react";
import {Select} from "@fluentui/react-components";
import {audioFormatType, IFormatType, videoFormatType} from "../../const/formatType";

export type ITaskFormatsProps = {
    type: 'video' | 'audio';
    isH264?: boolean;
    isH265?: boolean;
    onChange?: (value: string) => void;
}

const TaskFormats: React.FC<ITaskFormatsProps> = (props: ITaskFormatsProps): React.JSX.Element => {
    const {type} = props;
    let types: IFormatType[] = [];

    if (type === 'video')
        types = videoFormatType;

    if (type === 'audio')
        types = audioFormatType;

    return (
        <Select onChange={(ev, {value}): void => props.onChange?.(value)}>
            {
                types.map((i, k) => {
                    return (
                        <option
                            key={i.type + k.toString()}
                            value={i.label}
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
