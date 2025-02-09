/*
 * Copyright (c) 2022 RethinkDNS and its authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Buffer } from "buffer";
import * as util from "./util.js";

export function bytesToBase64Url(b) {
  return btoa(String.fromCharCode(...new Uint8Array(b)))
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=/g, "");
}

function binaryStringToBytes(bs) {
  const len = bs.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = bs.charCodeAt(i);
  }

  return bytes;
}

function regularBase64(b64url) {
  if (util.emptyString(b64url)) return b64url;

  return b64url.replace(/_/g, "/").replace(/-/g, "+");
}

function base64ToUint8(b64uri) {
  b64uri = normalizeb64(b64uri);
  const b64url = decodeURI(b64uri);
  const binaryStr = atob(regularBase64(b64url));
  return binaryStringToBytes(binaryStr);
}

export function base64ToUint16(b64uri) {
  b64uri = normalizeb64(b64uri);
  const b64url = decodeURI(b64uri);
  const binaryStr = atob(regularBase64(b64url));
  return decodeFromBinary(binaryStr);
}

export function base64ToBytes(b64uri) {
  return base64ToUint8(b64uri).buffer;
}

export function decodeFromBinary(b, u8) {
  // if b is a u8 array, simply u16 it
  if (u8) return new Uint16Array(b.buffer);

  // if b is a binary-string, convert it to u8
  const bytes = binaryStringToBytes(b);
  // ...and then to u16
  return new Uint16Array(bytes.buffer);
}

export function decodeFromBinaryArray(b) {
  const u8 = true;
  return decodeFromBinary(b, u8);
}

export function emptyBuf(b) {
  return !b || b.byteLength <= 0;
}

// stackoverflow.com/a/31394257
export function arrayBufferOf(buf) {
  if (emptyBuf(buf)) return null;

  const offset = buf.byteOffset;
  const len = buf.byteLength;
  return buf.buffer.slice(offset, offset + len);
}

// stackoverflow.com/a/17064149
export function bufferOf(arrayBuf) {
  if (emptyBuf(arrayBuf)) return null;

  return Buffer.from(new Uint8Array(arrayBuf));
}

export function recycleBuffer(b) {
  b.fill(0);
  return 0;
}

export function createBuffer(size) {
  return Buffer.allocUnsafe(size);
}

/**
 * Encodes a number to an Uint8Array of length `n` in Big Endian byte order.
 * https://stackoverflow.com/questions/55583037/
 * @param {Number} n - Number to encode
 * @param {Number} len - Length of Array required
 * @return {Uint8Array}
 */
export function encodeUint8ArrayBE(n, len) {
  const o = n;

  // all zeros...
  if (!n) return new Uint8Array(len);

  const a = [];
  a.unshift(n & 255);
  while (n >= 256) {
    n = n >>> 8;
    a.unshift(n & 255);
  }

  if (a.length > len) {
    throw new RangeError(`Cannot encode ${o} in ${len} len Uint8Array`);
  }

  let fill = len - a.length;
  while (fill--) a.unshift(0);

  return new Uint8Array(a);
}

// stackoverflow.com/a/40108543/
// Concatenate a mix of typed arrays
export function concat(arraybuffers) {
  const sz = arraybuffers.reduce((sum, a) => sum + a.byteLength, 0);
  const buf = new ArrayBuffer(sz);
  const cat = new Uint8Array(buf);
  let offset = 0;
  for (const a of arraybuffers) {
    // github: jessetane/array-buffer-concat/blob/7d79d5ebf/index.js#L17
    const v = new Uint8Array(a);
    cat.set(v, offset);
    offset += a.byteLength;
  }
  return buf;
}

export function concatBuf(these) {
  return Buffer.concat(these);
}

function normalizeb64(s) {
  // beware: atob(null) => \u009eée
  // and: decodeURI(null) => "null"
  // but: atob("") => ""
  // and: atob(undefined) => exception
  // so: convert null to empty str
  if (util.emptyString(s)) return "";
  else return s;
}
