'use strict';

const mode = (process.argv[2] || 'local').toLowerCase();

if (!process.env.PORT) {
  process.env.PORT = '5173';
}

if (mode === 'share') {
  process.env.HOST = '0.0.0.0';
  process.env.SHARE_MODE = '1';
} else {
  process.env.HOST = '127.0.0.1';
  process.env.SHARE_MODE = '0';
}

require('../server');
