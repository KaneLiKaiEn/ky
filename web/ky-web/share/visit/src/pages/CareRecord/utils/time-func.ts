//（格式为yy-mm-dd）
// 获取今日日期
function getFormattedDate() {
  let today = new Date();
  let year = today.getFullYear();
  let month = String(today.getMonth() + 1).padStart(2, "0");
  let day = String(today.getDate()).padStart(2, "0");
  let formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

// 将提供的时间转换为前一天的日期
function getPreviousDayDate(inputDate: string) {
  var currentDate = new Date(inputDate);
  currentDate.setDate(currentDate.getDate() - 1);
  var previousYear = currentDate.getFullYear();
  var previousMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  var previousDay = ("0" + currentDate.getDate()).slice(-2);
  var previousDateString =
    previousYear + "-" + previousMonth + "-" + previousDay;
  return previousDateString;
}

// 将提供的时间转换为下一天的日期
function getNextDayDate(inputDate: string) {
  var currentDate = new Date(inputDate);
  currentDate.setDate(currentDate.getDate() + 1);
  var nextYear = currentDate.getFullYear();
  var nextMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  var nextDay = ("0" + currentDate.getDate()).slice(-2);
  var nextDateString = nextYear + "-" + nextMonth + "-" + nextDay;
  return nextDateString;
}

// 获取当前时间，精确到时分秒
function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDateTime;
}

// 获取当前时间，精确到时分
function getCurrentDateTime2() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:00`;
  return formattedDateTime;
}

/** 连续保存后的下一时间：取 max(当前时刻, 已保存时间 + 1 分钟) */
function getNextContinuousCareTime(savedTime: string) {
  const now = getCurrentDateTime2();
  if (!savedTime) return now;

  const savedDate = new Date(savedTime.replace(/-/g, "/"));
  if (isNaN(savedDate.getTime())) return now;

  savedDate.setSeconds(0, 0);
  savedDate.setMinutes(savedDate.getMinutes() + 1);

  const year = savedDate.getFullYear();
  const month = String(savedDate.getMonth() + 1).padStart(2, "0");
  const day = String(savedDate.getDate()).padStart(2, "0");
  const hours = String(savedDate.getHours()).padStart(2, "0");
  const minutes = String(savedDate.getMinutes()).padStart(2, "0");
  const savedPlusOne = `${year}-${month}-${day} ${hours}:${minutes}:00`;

  return now > savedPlusOne ? now : savedPlusOne;
}

/** 护理时间加 1 分钟，格式 YYYY-MM-DD HH:mm:00 */
function getCareTimePlusOneMinute(time: string) {
  if (!time) return getCurrentDateTime2();
  const date = new Date(time.replace(/-/g, "/"));
  if (isNaN(date.getTime())) return getCurrentDateTime2();

  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

// 获取指定时间后1个小时的时间，向后取整到下一个小时
function getTimeAfterTwoHours(inputTime: string) {
  const inputDate = new Date(inputTime);

  // Add 1 hours to the specified time
  const afterTwoHours = new Date(inputDate.getTime() + 1 * 60 * 60 * 1000);

  // Round up to the next hour
  afterTwoHours.setMinutes(0, 0, 0);

  const year = afterTwoHours.getFullYear();
  const month = String(afterTwoHours.getMonth() + 1).padStart(2, "0");
  const day = String(afterTwoHours.getDate()).padStart(2, "0");

  const hours = String(afterTwoHours.getHours()).padStart(2, "0");
  const minutes = String(afterTwoHours.getMinutes()).padStart(2, "0");

  const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  return formattedDateTime;
}

// 格式化时间 只保留 时:分
function formatTime(dateTimeString: string) {
  const fullDateTime = new Date(dateTimeString);
  const hours = ("0" + fullDateTime.getHours()).slice(-2); // 获取小时部分并补零
  const minutes = ("0" + fullDateTime.getMinutes()).slice(-2); // 获取分钟部分并补零

  return `${hours}:${minutes}`; // 格式化后的时分部分
}

// 格式化时间
// 如果是当天 保留 时:分, 不在当天 月/日 时:分, 不在当年 年:月:日 时:分
function formatTime2(dateTimeString: string) {
  const fullDateTime = new Date(dateTimeString);

  // 检查 Date 对象是否有效
  if (isNaN(fullDateTime.getTime())) {
    throw new Error("Invalid date-time string");
  }

  const now = new Date();
  const isToday = fullDateTime.toDateString() === now.toDateString();
  const isThisYear = fullDateTime.getFullYear() === now.getFullYear();

  const hours = ("0" + fullDateTime.getHours()).slice(-2);
  const minutes = ("0" + fullDateTime.getMinutes()).slice(-2);

  if (isToday) {
    return `${hours}:${minutes}`; // 如果是今天，只返回时分
  } else {
    const month = ("0" + (fullDateTime.getMonth() + 1)).slice(-2); // 获取月份并补零
    const day = ("0" + fullDateTime.getDate()).slice(-2); // 获取日期并补零
    const year = fullDateTime.getFullYear(); // 获取年份

    return isThisYear
      ? `${month}/${day} ${hours}:${minutes}` // 如果是今年，返回月日和时分
      : `${year}-${month}-${day} ${hours}:${minutes}`; // 如果不是今年，返回年月日和时分
  }
}

// 获取当前时间后一段时间间隔的时间（分钟）
function getCurrentTimeAfterInterval(minutesToAdd: number) {
  let currentDate = new Date();
  currentDate.setMinutes(currentDate.getMinutes() + minutesToAdd);

  let year = currentDate.getFullYear();
  let month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 月份从0开始，需要+1，并且保证两位数显示
  let day = currentDate.getDate().toString().padStart(2, "0"); // 保证两位数显示的日期
  let hours = currentDate.getHours().toString().padStart(2, "0"); // 保证两位数显示的小时
  let minutes = currentDate.getMinutes().toString().padStart(2, "0"); // 保证两位数显示的分钟
  let seconds = currentDate.getSeconds().toString().padStart(2, "0"); // 保证两位数显示的秒钟

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取特定时间后一段时间间隔的时间（分钟）
function getTimeAfterInterval(startTime: string, intervalTime: string) {
  const currentDate = new Date(startTime); // 转换传入的时间为 Date 对象
  const minutesToAdd = parseInt(intervalTime, 10); // 将 intervalTime 转换为数字

  currentDate.setMinutes(currentDate.getMinutes() + minutesToAdd);

  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");
  const hours = currentDate.getHours().toString().padStart(2, "0");
  const minutes = currentDate.getMinutes().toString().padStart(2, "0");
  const seconds = currentDate.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取特定时间后一段时间间隔的时间（天）
function getDateAfterDays(startDate: string, daysToAdd: number) {
  // 确保 daysToAdd 是一个数字
  daysToAdd = parseInt(daysToAdd.toString());

  // 将传入的 yyyy-mm-dd 字符串转换为 Date 对象
  let currentDate = new Date(startDate);

  // 检查 startDate 是否为有效的日期
  if (isNaN(currentDate.getTime())) {
    throw new Error("Invalid startDate format. Please use yyyy-mm-dd.");
  }

  // 将天数加到日期上
  currentDate.setDate(currentDate.getDate() + daysToAdd);

  // 获取年、月、日，并格式化为两位数
  let year = currentDate.getFullYear();
  let month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 月份从0开始，所以需要+1
  let day = currentDate.getDate().toString().padStart(2, "0");

  // 返回格式化后的日期 yyyy-mm-dd
  return `${year}-${month}-${day}`;
}

// 根据一个标准时间，转化为yy:mm:dd hh:mm:ss
function formatDate(date: Date) {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 展示年月日时分，不含秒  例如 2024-02-26 17:15:00 -> 2024-02-26 17:15
function formatDateTimeMinute(timeString: string) {
  if (!timeString) return "";
  const date = new Date(timeString);
  if (isNaN(date.getTime())) {
    return timeString.replace(/:\d{2}$/, "").slice(0, 16);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 接收一个string类型的时间格式 转化为 mm-dd hh-mm  例如2024-02-26 17:15:00 -> 02-26 17:12
function formatTimePlus(timeString: string) {
  const date = new Date(timeString);
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从0开始，需要加1，并且补零
  const day = String(date.getDate()).padStart(2, "0"); // 补零
  const hours = String(date.getHours()).padStart(2, "0"); // 补零
  const minutes = String(date.getMinutes()).padStart(2, "0"); // 补零
  return `${month}-${day} ${hours}:${minutes}`;
}
// 接收一个时间戳（单位：秒），返回格式化后的时间字符串 mm:ss
function formatTimeFromTimestamp(timestamp: number) {
  const date = new Date(timestamp * 1000); // 将时间戳转换为毫秒
  const minutes = date.getMinutes().toString().padStart(2, "0"); // 获取分钟，并确保是两位数
  const seconds = date.getSeconds().toString().padStart(2, "0"); // 获取秒钟，并确保是两位数
  return `${minutes}:${seconds}`; // 返回格式化后的时间字符串
}

// 对其到整分
function alignMinutesToNearestMultiple(dateTime: string, multiple = 5) {
  const alignedDateTime = new Date(dateTime);
  const minutes = alignedDateTime.getMinutes();
  const alignedMinutes = Math.round(minutes / multiple) * multiple;
  alignedDateTime.setMinutes(alignedMinutes);

  return formatDate(alignedDateTime);
}

// 展示5个小时的数据
function adjustMaxDateTime(minDateTime: number, maxDateTime: number) {
  // 计算时间间隔（单位：毫秒）
  let interval = maxDateTime - minDateTime;

  // 计算需要展示的小时数
  let hoursToShow = Math.ceil(interval / (5 * 60 * 60 * 1000)) * 5;

  // 调整最大日期时间，确保展示5个小时的时间间隔
  maxDateTime = minDateTime + hoursToShow * 60 * 60 * 1000;

  return maxDateTime;
}

// 获取2个时间的时间间隔（分钟）
function calculateTimeInterval(startTime: string, endTime: string) {
  // 将字符串形式的时间转换为 Date 对象
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // 计算时间间隔（单位：毫秒）
  const interval = endDate.getTime() - startDate.getTime();

  // 将时间间隔转换为分钟
  const intervalInMinutes = interval / (1000 * 60);

  return intervalInMinutes;
}

// 获取2个时间的时间间隔（小时）
function calculateHoursBetweenTimes(time1: string, time2: string) {
  // 将时间字符串转换为 Date 对象
  const startTime = new Date(time1);
  const endTime = new Date(time2);

  // 检查 Date 对象是否有效
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error("Invalid time string");
  }

  // 计算两个时间之间的毫秒差
  const timeDifference = Math.abs(endTime.getTime() - startTime.getTime());

  // 将毫秒差转换为小时差
  const hourDifference = timeDifference / (1000 * 60 * 60);

  return hourDifference;
}

// 获取2个时间的时间间隔（天）
function calculateDaysBetweenDates(date1: string, date2: string) {
  // 将日期字符串转换为Date对象
  const startDate = new Date(date1);
  const endDate = new Date(date2);

  // 计算两个日期之间的毫秒差
  const timeDifference = Math.abs(endDate.getTime() - startDate.getTime());

  // 将毫秒差转换为天数差
  const dayDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  return dayDifference;
}

// 生成开始时间和结束时间之间每隔5分钟的时间数组
function generateTimeArray(startTime: string, endTime: string) {
  const timeArray = [];
  const current = new Date(startTime);
  const end = new Date(endTime);

  while (current <= end) {
    timeArray.push(formatDate(current)); // 这里的 formatDate 是假设的格式化函数，如果你需要不同格式请修改
    current.setMinutes(current.getMinutes() + 5);
  }

  return timeArray;
}

export {
  getFormattedDate,
  getNextDayDate,
  getPreviousDayDate,
  getCurrentDateTime,
  getCurrentDateTime2,
  getNextContinuousCareTime,
  getCareTimePlusOneMinute,
  getTimeAfterTwoHours,
  getTimeAfterInterval,
  getDateAfterDays,
  formatTime,
  formatTime2,
  getCurrentTimeAfterInterval,
  formatDate,
  formatTimePlus,
  formatDateTimeMinute,
  formatTimeFromTimestamp,
  alignMinutesToNearestMultiple,
  adjustMaxDateTime,
  calculateTimeInterval,
  calculateHoursBetweenTimes,
  calculateDaysBetweenDates,
  generateTimeArray,
};
