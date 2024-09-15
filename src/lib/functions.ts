import dayjs from "dayjs";

export function formatDateForChatMsg(time?: string | Date) {
  return time ? dayjs(time).format("hh:mm") : dayjs().format("hh:mm");
}
