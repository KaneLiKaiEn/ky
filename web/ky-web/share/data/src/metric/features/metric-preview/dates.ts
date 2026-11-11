import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";

const iso = (value: Dayjs) => value.format("YYYY-MM-DD");
function checked(value: string) {
  const date = dayjs(value);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !date.isValid() ||
    iso(date) !== value
  )
    throw new Error("日期格式无效");
  return date;
}
export function dateBounds(value: string): { start: string; end: string } {
  const raw = value.trim();
  if (raw.split("~").length > 2) throw new Error("日期格式无效");
  let start: Dayjs, end: Dayjs;
  if (/^\d{4}$/.test(raw)) {
    start = checked(`${raw}-01-01`);
    end = start.endOf("year");
  } else if (/^\d{4}-[HQ][1-4]$/.test(raw)) {
    const size = raw[5] === "H" ? 6 : 3,
      n = Number(raw[6]);
    if (n > 12 / size) throw new Error("日期周期无效");
    start = checked(
      `${raw.slice(0, 4)}-${String((n - 1) * size + 1).padStart(2, "0")}-01`,
    );
    end = start.add(size - 1, "month").endOf("month");
  } else if (/^\d{4}-\d{2}(~\d{2})?$/.test(raw)) {
    const [first, last] = raw.split("~");
    start = checked(`${first}-01`);
    end = checked(`${first.slice(0, 4)}-${last ?? first.slice(5)}-01`).endOf(
      "month",
    );
  } else {
    const [first, last = first] = raw.split("~");
    start = checked(first);
    let fullEnd = last;
    if (/^\d{2}-\d{2}$/.test(last)) {
      const year =
        start.year() + (last.slice(0, 2) < first.slice(5, 7) ? 1 : 0);
      fullEnd = `${year}-${last}`;
    }
    end = checked(fullEnd);
  }
  if (end.isBefore(start, "day")) throw new Error("结束日期不能早于开始日期");
  return { start: iso(start), end: iso(end) };
}
export function previousWeek(now = dayjs()) {
  const monday = now.startOf("day").subtract(((now.day() + 6) % 7) + 7, "day");
  return `${iso(monday)}~${iso(monday.add(6, "day"))}`;
}
export function defaultDate(type = "MONTH", now = dayjs()) {
  const yesterday = now.subtract(1, "day"),
    lastMonth = now.subtract(1, "month");
  switch (type) {
    case "DAY":
      return iso(yesterday);
    case "DAYS":
      return `${yesterday.year()}-01-01~${iso(yesterday)}`;
    case "WEEK":
      return previousWeek(now);
    case "MONTHS":
      return `${lastMonth.year()}-01~${lastMonth.format("MM")}`;
    case "QUARTER": {
      const last = now
        .startOf("month")
        .subtract((now.month() % 3) + 1, "month");
      return `${last.year()}-Q${Math.floor(last.month() / 3) + 1}`;
    }
    case "YEAR":
      return String(now.year() - 1);
    default:
      return lastMonth.format("YYYY-MM");
  }
}
export function groupDate(name: string, fallback: string, now = dayjs()) {
  switch (name) {
    case "今天":
      return iso(now);
    case "昨天":
      return iso(now.subtract(1, "day"));
    case "上周":
      return previousWeek(now);
    case "上月":
      return defaultDate("MONTH", now);
    case "今年":
      return defaultDate("DAYS", now);
    case "去年":
      return String(now.year() - 1);
    case "前年":
      return String(now.year() - 2);
    default:
      return fallback;
  }
}
export function groupLabel(name: string, date: string) {
  const bounds = dateBounds(date);
  if (name === "昨天")
    return `${name}：${bounds.start}（${dayjs(bounds.start).locale("zh-cn").format("dddd")}）`;
  if (!["今天", "上周", "上月", "今年", "去年", "前年"].includes(name))
    return "";
  const end = name === "上周" ? bounds.end : bounds.end.slice(5);
  return `${name}：${bounds.start}${bounds.end === bounds.start ? "" : `~${end}`}`;
}
export function seriesDates(date: string, frequency: string, count: number) {
  const bounds = dateBounds(date);
  const base = /^\d{4}$|^\d{4}-\d{2}~\d{2}$/.test(date)
    ? dayjs(bounds.end).startOf("month")
    : dayjs(bounds.start);
  return Array.from({ length: count }, (_, index) => {
    const offset = count - index - 1;
    if (frequency === "Y") return String(base.year() - offset);
    if (frequency === "H" || frequency === "Q") {
      const size = frequency === "H" ? 6 : 3,
        d = base.subtract(offset * size, "month");
      return `${d.year()}-${frequency}${Math.floor(d.month() / size) + 1}`;
    }
    if (frequency === "M")
      return base.subtract(offset, "month").format("YYYY-MM");
    if (frequency === "W") {
      const monday = base
        .subtract((base.day() + 6) % 7, "day")
        .subtract(offset * 7, "day");
      return `${iso(monday)}~${iso(monday.add(6, "day"))}`;
    }
    return iso(base.subtract(offset, "day"));
  });
}
export function periodOptions(year: number, now = dayjs()) {
  const options: {
    label: string;
    value: string;
    children?: { label: string; value: string }[];
  }[] = [];
  if (year === now.year())
    options.push(
      {
        label: `${now.subtract(1, "day").format("MM-DD")}（昨天）`,
        value: defaultDate("DAY", now),
      },
      {
        label: `${defaultDate("DAYS", now)}（今年）`,
        value: defaultDate("DAYS", now),
      },
      { label: `${previousWeek(now)}（上周）`, value: previousWeek(now) },
    );
  const monthNames = [
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
    "十一",
    "十二",
  ];
  for (let month = 1; month <= 12; month++)
    options.push({
      label: `${monthNames[month - 1]}月`,
      value: `${year}-${String(month).padStart(2, "0")}`,
    });
  for (let month = 2; month <= 12; month++)
    options.push({
      label: `1~${month}月`,
      value: `${year}-01~${String(month).padStart(2, "0")}`,
    });
  for (let quarter = 1; quarter <= 4; quarter++)
    options.push({
      label: `${["一", "二", "三", "四"][quarter - 1]}季度`,
      value: `${year}-Q${quarter}`,
    });
  options.push(
    { label: "上半年", value: `${year}-H1` },
    { label: "下半年", value: `${year}-H2` },
    { label: "年度", value: String(year) },
  );
  const weeks = [];
  let monday = dayjs(`${year}-01-01`);
  monday = monday.subtract((monday.day() + 6) % 7, "day");
  while (monday.year() <= year) {
    const value = `${iso(monday)}~${iso(monday.add(6, "day"))}`;
    weeks.push({
      label: `第${weeks.length + 1}周(${iso(monday).slice(5)}~${iso(monday.add(6, "day")).slice(5)})`,
      value,
    });
    monday = monday.add(7, "day");
  }
  options.push({ label: "周", value: "week", children: weeks });
  return options;
}
