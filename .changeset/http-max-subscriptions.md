---
"@xmcp-dev/compiler": minor
"xmcp": minor
---

Add `http.maxSubscriptions`, which caps how many `subscriptions/listen` streams
a server holds open at once. A `subscriptions/listen` stream is long lived by
design, which a platform that caps request duration cannot serve: on a Vercel
Function the stream is held until the invocation hits its maximum duration and
is killed with a runtime timeout error, having billed the whole window. Setting
it to `0` refuses subscriptions in band instead; a stateless server builds its
tools per request, so a client that asks for the list again is never served a
stale one.
