import { config } from "./config.js";
import { connect } from "./client.js";
import { $, message, errorMessage, element, text, date } from "./utils.js";
import { publishPost } from "./editor.js";
let db,
  owner = null,
  busy = false,
  cursor,
  listKind = "posts";
let state = { id: null, kind: null, hasDraft: false, extra: {} };
let dirty = false;
const draftKey = `naru:blog-draft:${config.site}:${location.pathname}`;
function data() {
  return {
    ...state.extra,
    title: $("title").value.trim(),
    body: $("body").value.trim(),
    category: $("category").value.trim(),
  };
}
function saveLocal() {
  state.id ??= crypto.randomUUID();
  sessionStorage.setItem(
    draftKey,
    JSON.stringify({
      ...state,
      title: $("title").value,
      body: $("body").value,
      category: $("category").value,
    }),
  );
}
function updateUI() {
  for (const id of [
    "publish",
    "save-draft",
    "reload-list",
    "manage-kind",
    "manage-more",
  ])
    $(id).disabled = busy || !owner;
  $("delete-post").disabled = busy || !owner || !state.kind;
  $("new-post").disabled = busy;
  $("login").hidden = !!owner;
  $("login").disabled = busy;
  $("logout").hidden = !owner;
  $("logout").disabled = busy;
  for (const id of ["title", "body", "category"]) $(id).readOnly = busy;
  $("manage-list").disabled = busy || !owner;
  $("auth").textContent = owner ? "로그인됨" : "주인만 쓸 수 있습니다.";
  $("editing").textContent =
    state.kind === "posts"
      ? "공개한 글 고치는 중"
      : state.kind === "drafts"
        ? "초안 고치는 중"
        : "새 글";
  $("publish").textContent = state.kind === "posts" ? "저장" : "공개";
  if (!owner) {
    $("manage-list").replaceChildren();
    $("manage-more").hidden = true;
  }
}
async function run(action) {
  if (busy) return;
  busy = true;
  updateUI();
  try {
    await action();
  } catch (e) {
    if (e.code === "AUTH_REQUIRED") owner = null;
    message(errorMessage(e));
  } finally {
    busy = false;
    updateUI();
  }
}
function canLeave() {
  return !dirty || window.confirm("저장하지 않은 내용을 버릴까요?");
}
function clearEditor() {
  state = { id: null, kind: null, hasDraft: false, extra: {} };
  $("post-form").reset();
  dirty = false;
  sessionStorage.removeItem(draftKey);
  $("view-post").hidden = true;
}
async function loadList(reset = true) {
  if (!owner) return;
  const kind = $("manage-kind").value;
  if (reset || kind !== listKind) {
    cursor = undefined;
    $("manage-list").replaceChildren();
  }
  listKind = kind;
  const page = await owner.collection(kind).list({
    sort: [[{ metadata: "updatedAt" }, "desc"]],
    page: { size: 20, after: cursor },
  });
  for (const doc of page.documents) {
    const row = element("div", "", "manage-row");
    const button = element("button", text(doc.data?.title, "제목 없음"));
    button.type = "button";
    button.id = `edit-${kind}-${doc.id}`;
    button.addEventListener("click", () =>
      run(async () => {
        if (!canLeave()) return;
        const latest = await owner.collection(kind).get(doc.id);
        const content =
          latest.data &&
          typeof latest.data === "object" &&
          !Array.isArray(latest.data)
            ? latest.data
            : {};
        state = {
          id: latest.id,
          kind,
          hasDraft: kind === "drafts",
          extra: content,
        };
        $("title").value = text(content.title);
        $("body").value = text(content.body);
        $("category").value = text(content.category);
        dirty = false;
        saveLocal();
        $("view-post").hidden = kind !== "posts";
        $("view-post").href = `./post.html?id=${encodeURIComponent(latest.id)}`;
        message("");
      }),
    );
    row.append(button, element("span", date(doc.updatedAt), "meta"));
    $("manage-list").append(row);
  }
  cursor = page.nextCursor;
  $("manage-more").hidden = !cursor;
  if (!$("manage-list").children.length)
    $("manage-list").append(element("p", "없습니다.", "hint"));
}
async function refreshAfterWrite(notice) {
  try {
    await loadList(true);
    message(notice);
  } catch (e) {
    if (e.code === "AUTH_REQUIRED") owner = null;
    message(`${notice} 목록은 불러오지 못했습니다. ${errorMessage(e)}`);
  }
}
try {
  db = await connect();
  owner = await db.auth.session();
  message("");
} catch (e) {
  message(errorMessage(e));
}
try {
  const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
  if (
    saved &&
    typeof saved.title === "string" &&
    typeof saved.body === "string"
  ) {
    state = {
      id:
        typeof saved.id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(saved.id)
          ? saved.id
          : null,
      kind: ["posts", "drafts"].includes(saved.kind) ? saved.kind : null,
      hasDraft: saved.hasDraft === true,
      extra:
        saved.extra &&
        typeof saved.extra === "object" &&
        !Array.isArray(saved.extra)
          ? saved.extra
          : {},
    };
    $("title").value = saved.title;
    $("body").value = saved.body;
    $("category").value = text(saved.category);
    dirty = true;
  }
} catch {
  message("쓰던 글을 되살리지 못했습니다.");
}
updateUI();
$("login").addEventListener("click", () =>
  run(async () => {
    saveLocal();
    db ??= await connect();
    await db.auth.signIn({ collections: ["posts", "drafts"] });
  }),
);
$("logout").addEventListener("click", () =>
  run(async () => {
    if (!canLeave()) return;
    const previous = owner;
    owner = null;
    clearEditor();
    updateUI();
    try {
      await previous?.signOut();
      message("로그아웃했습니다.");
    } catch (e) {
      message(
        `이 기기에서는 로그아웃했지만 나루에 알리지 못했습니다. ${errorMessage(e)}`,
      );
    }
  }),
);
$("post-form").addEventListener("input", () => {
  dirty = true;
  try {
    saveLocal();
  } catch {
    message("자동 저장이 되지 않습니다. 떠나기 전에 글을 복사해 두세요.");
  }
});
$("new-post").addEventListener("click", () =>
  run(async () => {
    if (canLeave()) {
      clearEditor();
      message("");
    }
  }),
);
$("save-draft").addEventListener("click", () =>
  run(async () => {
    if (!owner) throw new Error("먼저 로그인하세요.");
    if (!$("title").value.trim()) throw new Error("제목을 입력하세요.");
    saveLocal();
    await owner.collection("drafts").set(state.id, data());
    state.kind = "drafts";
    state.hasDraft = true;
    dirty = false;
    saveLocal();
    await refreshAfterWrite("초안을 저장했습니다.");
  }),
);
$("post-form").addEventListener("submit", (event) => {
  event.preventDefault();
  return run(async () => {
    if (!owner) throw new Error("먼저 로그인하세요.");
    if (!$("title").value.trim() || !$("body").value.trim())
      throw new Error("제목과 본문을 입력하세요.");
    saveLocal();
    await publishPost(owner, state.id, data(), state.hasDraft);
    state.kind = "posts";
    state.hasDraft = false;
    dirty = false;
    saveLocal();
    $("view-post").href = `./post.html?id=${encodeURIComponent(state.id)}`;
    $("view-post").hidden = false;
    await refreshAfterWrite("공개했습니다.");
  });
});
$("delete-post").addEventListener("click", () =>
  run(async () => {
    if (!owner || !state.kind) return;
    if (
      !window.confirm(
        `‘${$("title").value}’을(를) 지울까요? 되돌릴 수 없습니다.`,
      )
    )
      return;
    await owner.collection(state.kind).delete(state.id);
    clearEditor();
    await refreshAfterWrite("지웠습니다.");
  }),
);
$("reload-list").addEventListener("click", () => run(() => loadList(true)));
$("manage-kind").addEventListener("change", () => run(() => loadList(true)));
$("manage-more").addEventListener("click", () => run(() => loadList(false)));
// Explicit loading also lets the editor recover its local draft when the network is unavailable.
