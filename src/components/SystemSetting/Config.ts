export const GlobalPlayer = [
    {
        name: 'VLC media player',
        value: 'vlc'
    },
    {
        name: 'ffplay',
        value: 'ffplay'
    }
];

export const MediaPlayerForWindows = [
    {
        name: 'Windows Media Player',
        value: 'wmp'
    },
    ...GlobalPlayer,
    {
        name: 'PotPlayer',
        value: 'potplayer'
    }
];

export const MediaPlayerForMacOS = [
    {
        name: 'QuickTime Player',
        value: 'qtp'
    },
    ...GlobalPlayer
];
