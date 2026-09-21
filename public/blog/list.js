import { connect } from "./client.js";
import { $, message, errorMessage, element, text, date } from "./utils.js";
const guestbook = document.body.dataset.page === "guestbook";
let db,
  cursor,
  category = "",
  loading = false;
async function load(reset = false) {
  if (loading) return false;
  loading = true;
  $("more").disabled = true;
  if (!guestbook) $("filter-submit").disabled = true;
  if (reset) {
    cursor = undefined;
    $("entries").replaceChildren();
    $("more").hidden = true;
  }
  try {
    db ??= await connect();
    const page = await db.public
      .collection(guestbook ? "guestbook" : "posts")
      .list({
        filter: category ? { category } : {},
        sort: [[{ metadata: "createdAt" }, "desc"]],
        page: { size: 20, after: cursor },
      });
    if (reset) $("entries").replaceChildren();
    for (const doc of page.documents) {
      const data = doc.data && typeof doc.data === "object" ? doc.data : {};
      const card = element("article", "", "entry");
      if (guestbook) {
        card.append(
          element("h2", text(data.name, "방문자")),
          element("p", text(data.message), "body"),
        );
      } else {
        const link = element("a", text(data.title, "제목 없음"));
        link.href = `./post.html?id=${encodeURIComponent(doc.id)}`;
        const heading = element("h2", "");
        heading.append(link);
        card.append(
          heading,
          element("p", text(data.body).slice(0, 160), "excerpt"),
        );
      }
      const category = guestbook ? "" : text(data.category);
      card.append(
        element(
          "p",
          [date(doc.createdAt), category].filter(Boolean).join(" · "),
          "meta",
        ),
      );
      $("entries").append(card);
    }
    cursor = page.nextCursor;
    $("more").hidden = !cursor;
    message(
      $("entries").children.length
        ? ""
        : guestbook
          ? "아직 아무도 남기지 않았습니다."
          : category
            ? "이 분류에는 글이 없습니다."
            : "아직 글이 없습니다.",
    );
    return true;
  } catch (e) {
    message(errorMessage(e));
    return false;
  } finally {
    loading = false;
    $("more").disabled = false;
    if (!guestbook) $("filter-submit").disabled = false;
  }
}
$("more").addEventListener("click", () => load());
if (!guestbook)
  $("filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (loading) return;
    category = $("filter-category").value.trim();
    await load(true);
  });
if (guestbook)
  $("entry-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = $("name").value.trim(),
      body = $("message").value.trim();
    if (!name || !body) return message("이름과 한마디를 입력하세요.");
    $("submit").disabled = true;
    try {
      db ??= await connect();
      await db.public.collection("guestbook").add({ name, message: body });
      $("entry-form").reset();
      // The SDK keeps this collection fresh after the write.
      const refreshed = await load(true);
      message(
        refreshed
          ? "남겼습니다."
          : "저장되었지만 목록을 불러오지 못했습니다. 다시 남기지 말고 새로고침하세요.",
      );
    } catch (e) {
      message(
        `${errorMessage(e)} 목록에 이미 올라왔는지 확인한 뒤 다시 남기세요.`,
      );
    } finally {
      $("submit").disabled = false;
    }
  });
await load(true);
