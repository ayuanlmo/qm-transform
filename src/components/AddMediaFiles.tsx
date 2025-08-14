import * as React from "react";
import {useState} from "react";
import {Button} from "@fluentui/react-components";
import {AddSquare20Filled, Delete20Filled} from "@fluentui/react-icons";
import {selectMediaFiles} from "../utils";
import {useTranslation} from "react-i18next";
import Dialog from "./FluentTemplates/Dialog";
import YExtendTemplate from "./YExtendTemplate";

export interface IAddMediaFilesProps {
    showClearAll: boolean;
    onClearAll?: () => void;
}

const AddMediaFiles: React.FC<IAddMediaFilesProps> = (
    {
        showClearAll,
        onClearAll
    }: IAddMediaFilesProps
): React.JSX.Element => {
    const {t} = useTranslation();
    const [clearAllStatus, setClearAllStatus] = useState<boolean>(false);

    return (
        <div className={'add-media-files app_flex_box'}>
            <Button
                appearance={"primary"}
                size={'large'}
                icon={<AddSquare20Filled/>}
                onClick={selectMediaFiles}
            >
                {t('mediaFile.options.add')}
            </Button>
            <Dialog
                title={t('tips')}
                open={clearAllStatus}
                footerCloseTriggerLabel={t('cancel')}
                footer={
                    <Button
                        appearance={"primary"}
                        onClick={(): void => {
                            setClearAllStatus(false);
                            onClearAll?.();
                        }}
                    >
                        {t('confirm')}
                    </Button>
                }
                onClose={
                    (): void => setClearAllStatus(false)
                }
                surface={
                    <div>
                        {
                            t('mediaFile.options.clearAllConfirmMessage')
                        }
                    </div>
                }
            />
            <YExtendTemplate show={showClearAll}>
                <Button
                    size={'large'}
                    icon={<Delete20Filled/>}
                    onClick={
                        (): void => setClearAllStatus(true)
                    }
                >
                    {t('mediaFile.options.clearAll')}
                </Button>
            </YExtendTemplate>
        </div>
    );
};

export default AddMediaFiles;
