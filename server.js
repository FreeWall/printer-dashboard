const express = require('express');
const app = express();
const { proxy } = require('rtsp-relay')(app);

const RTSP_URL = process.env.RTSP_URL || 'rtsp://192.168.0.121/live';
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.ws('/api/stream', (ws, req) => {
  return proxy({
    url: RTSP_URL,
    verbose: false,
    additionalFlags: ['-q', '1']
  })(ws);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Relaying stream from: ${RTSP_URL}`);
});
