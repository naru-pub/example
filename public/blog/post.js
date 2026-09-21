import { connect } from "./client.js";
import { $, message, errorMessage, text, date } from "./utils.js";
try {
  const id = new URL(location.href).searchParams.get("id");
  if (!id) throw new Error("글을 찾을 수 없습니다.");
  const db = await connect();
  const { data, createdAt } = await db.public.collection("posts").get(id);
  $("title").textContent = text(data?.title, "제목 없음");
  $("body").textContent = text(data?.body);
  $("date").textContent = date(createdAt);
  document.title = `${text(data?.title, "제목 없음")} · 작은 기록`;
  message("");
} catch (e) {
  message(errorMessage(e));
}
