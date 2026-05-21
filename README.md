# Vault of Vör

Hide encrypted messages inside any image. AES-GCM 256-bit encryption, zero servers, entirely in your browser.

**[vault-of-vor.vercel.app](https://vault-of-vor.vercel.app)**

---

## What it does

Vault of Vör combines steganography and strong cryptography to conceal messages inside ordinary image files. The encoded image is visually indistinguishable from the original. Only someone with the correct password and the Vault of Vör tool can reveal what's hidden inside.

- **Encrypt** — Text or voice notes, encrypted with AES-GCM 256-bit
- **Hide** — Encrypted bytes written into the least-significant bits of each pixel's RGB channels
- **Reveal** — Upload the PNG, enter the password, decrypt

## Use cases

- **Cold storage** — Store seed phrases as image files. Anyone who finds them sees noise.
- **Private comms** — Bypass keyword filters on monitored networks. The network sees an image.
- **Dead drops** — Post publicly. Only your recipient knows it carries a message.

## How it works

| Layer | Detail |
|---|---|
| Encryption | AES-GCM (256-bit) |
| Key derivation | PBKDF2-SHA256, 100,000 iterations |
| Steganography | LSB encoding across RGB pixel channels |
| Processing | 100% client-side, zero network requests |

## The golden rules

- Always save and share as **PNG**. Never convert to JPG, WEBP, or AVIF — lossy compression destroys the hidden data.
- Never screenshot the encoded image — screenshots re-compress pixels.
- Send image and password via **different channels**.

## Running locally

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

Produces a single self-contained `dist/index.html` with all assets inlined — no server required. Open it directly from disk for fully offline use.

## Stack

- [Vite](https://vitejs.dev/) + [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)
- [Lucide](https://lucide.dev/) icons
- Web Crypto API (native browser)
- No frameworks, no dependencies beyond build tooling

## About Vör

In Norse mythology, **Vör** is the goddess of awareness — *"so wise and searching that nothing can be concealed from her."* Her name means *aware* or *careful*. This tool is named in her honour: a vault that hides information in plain sight, revealing it only to those with the awareness to look — and a key.

---

MIT License · By [Emīl Blūm](https://emilblum.com) with Gemini & Claude
