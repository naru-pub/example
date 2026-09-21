// One transaction: the post is published and its draft removed, or neither.
export function publishPost(owner, id, data, hasDraft) {
  return owner.transaction([
    { collection: "posts", set: { id, data } },
    ...(hasDraft ? [{ collection: "drafts", delete: { id } }] : []),
  ]);
}
