import * as React from "react";
import {Popover as MSPopover, PopoverSurface, PopoverTrigger} from "@fluentui/react-components";

export interface IPopoverProps {
    open?: boolean;
    children: React.ReactElement;
    surface: React.ReactElement;
    footerSurface?: React.ReactElement;
}

const Popover: React.FC<IPopoverProps> = ({open, children, surface, footerSurface}: IPopoverProps): React.JSX.Element =>
    <MSPopover open={open} withArrow>
        <PopoverTrigger>
            {children}
        </PopoverTrigger>
        <PopoverSurface>
            <>
                {surface}
                {footerSurface && <div>{footerSurface}</div>}
            </>
        </PopoverSurface>
    </MSPopover>

;

export default Popover;
