export const $ = (id) => document.getElementById(id);
export function message(text) {
  $("status").textContent = text;
}
export function errorMessage(error) {
  const hints = {
    AUTH_REQUIRED: "관리자 권한이 만료되었습니다. 다시 로그인하세요.",
    ACCESS_DENIED: "컬렉션 공개 범위와 관리자 로그인 등록을 확인하세요.",
    NOT_FOUND: "글이 없거나 컬렉션이 아직 만들어지지 않았습니다.",
    CONFLICT: "다른 곳에서 먼저 바뀌었습니다. 새로고침 후 다시 시도하세요.",
    RATE_LIMITED: "요청이 많습니다. 잠시 후 다시 시도하세요.",
    REDIRECT_NOT_REGISTERED:
      "이 페이지 주소를 제어판의 ‘웹사이트 관리자 로그인’에 등록하세요.",
  };
  return hints[error.code] || error.message || "요청에 실패했습니다.";
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
    : "날짜 없음";
}
