export const strToArray = (str) => {
  // 处理所有边界情况：null/undefined/空字符串/'null' 都返回空数组
  if (!str || str === 'null' || str.trim() === '') return [];
  // 如果本身就是数组，直接返回；如果是字符串，分割+去空格
  return typeof str === 'string' ? str.split(',').map(item => item.trim()) : [str];
};
