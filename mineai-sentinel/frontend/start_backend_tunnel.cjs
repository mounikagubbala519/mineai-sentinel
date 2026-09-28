const localtunnel = require('localtunnel');

async function start() {
  try {
    const tunnel = await localtunnel({ port: 8000 });
    console.log('--------------------------------------------------');
    console.log('PUBLIC BACKEND TUNNEL LINK:', tunnel.url);
    console.log('--------------------------------------------------');

    tunnel.on('close', () => {
      console.log('Tunnel closed, retrying...');
      setTimeout(start, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      setTimeout(start, 3000);
    });
  } catch (err) {
    console.error('Tunnel error:', err);
    setTimeout(start, 3000);
  }
}

start();
