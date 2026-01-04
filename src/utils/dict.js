// src/utils/dict.js

export const terrainMap = {
    "1": "平原",
    "2": "丘陵",
    "3": "山地"
};

export const typeMap = {
    "1": "任务一",
    "2": "任务二",
    "3": "任务三",
    "4": "任务四",
    "5": "任务五",
    "6": "任务六",
    "7": "任务七"
};

export const weatherMap = {
    "1": "晴天",
    "2": "阴天",
    "3": "雨天",
    "4": "雪天",
    "5": "雾天"
};

export const seaStateMap = {
    "1": "1级",
    "2": "2级",
    "3": "3级",
    "4": "4级"
};

// 如果需要统一导出一个对象，也可以这样：
export default {
    terrainMap,
    typeMap,
    weatherMap,
    seaStateMap
};
