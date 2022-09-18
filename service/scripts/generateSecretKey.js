/* eslint-disable @typescript-eslint/no-var-requires */

const sodium = require('sodium-native');
const buf = Buffer.allocUnsafe(sodium.crypto_secretbox_KEYBYTES);
sodium.randombytes_buf(buf);
const str = buf.toString('hex');

console.log(str);
