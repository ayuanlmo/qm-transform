/**
 * 节日元素
 * @author ayuanlmo
 * **/

/**
 * @method isInChristmasPeriod
 * @return {boolean}
 * @description 当前是否处于圣诞节的期间
 * **/
export const isInChristmasPeriod = (): boolean => {
    const now: Date = new Date();
    const startChristmasPeriod: Date = new Date(now.getFullYear(), 11, 24);
    const endChristmasPeriod: Date = new Date(now.getFullYear() + (now.getMonth() === 11 && now.getDate() > 6 ? 1 : 0), 0, 7);

    return now >= startChristmasPeriod && now < endChristmasPeriod;
};
