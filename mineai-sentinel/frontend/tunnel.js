const localtunnel = require('localtunnel');

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 8000 });
    console.log('ACTIVE_HOST_LINK:', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed, reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.error('Tunnel launch error:', err);
    setTimeout(startTunnel, 3000);
  }
}

startTunnel();
