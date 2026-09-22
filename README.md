# Naru Example

Example static site deployed to Naru with GitHub Actions.

This repository uses `naru-pub/actions/deploy@v1`. The workflow omits `target`, so the action deploys to `/` by default.

## Example blog

`public/blog/` is the Naru Data example blog, live at https://example.naru.pub/blog/.
It is a copy of `control-plane/public/examples/database-blog/` in
[yangnaru/naru-pub](https://github.com/yangnaru/naru-pub), which is the source of truth
and also ships as the ZIP on https://naru.pub/docs/database. Copy changes over from there.

The `example` site needs these collections, created in https://naru.pub/database:

- `posts`: read 누구나, write 관리자만
- `guestbook`: read 누구나, write 누구나 생성만
- `drafts`: read 관리자만, write 관리자만

and `https://example.naru.pub/blog/admin/` registered under 웹사이트 관리자 로그인
with `posts` and `drafts`.
