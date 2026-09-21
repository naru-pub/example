export const $ = (id) => document.getElementById(id);
export function message(text) {
  $("status").textContent = text;
}
export function errorMessage(error) {
  const hints = {
    AUTH_REQUIRED: "로그인이 끝났습니다. 다시 로그인하세요.",
    ACCESS_DENIED: "권한이 없습니다.",
    NOT_FOUND: "찾을 수 없습니다.",
    CONFLICT: "다른 곳에서 먼저 고쳤습니다. 새로고침하세요.",
    RATE_LIMITED: "잠시 후 다시 시도하세요.",
    // Seen only by the site owner while setting the example up.
    REDIRECT_NOT_REGISTERED:
      "나루 제어판의 ‘웹사이트 관리자 로그인’에 이 페이지를 등록하세요.",
  };
  if (hints[error.code]) return hints[error.code];
  // SDK errors carry a code; plain errors are this site's own messages.
  return error.code || !error.message
    ? "문제가 생겼습니다. 잠시 후 다시 시도하세요."
    : error.message;
}
export function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
export function element(tag, content, className) {
  const node = document.createElement(tag);
  node.textContent = content;
  if (className) node.className = className;
  return node;
}
export function date(value) {
  const d = new Date(value);
  return typeof value === "string" && Number.isFinite(d.getTime())
    ? d.toLocaleDateString("ko-KR")
    : "";
}
