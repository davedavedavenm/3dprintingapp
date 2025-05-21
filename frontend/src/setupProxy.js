const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: function(proxyReq, req, res) {
        console.log('Proxying request to:', req.method, req.path);
      },
      onProxyRes: function(proxyRes, req, res) {
        console.log('Received proxy response from:', req.method, req.path, 'with status:', proxyRes.statusCode);
      },
      onError: function(err, req, res) {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Proxy error: Could not connect to backend server');
      }
    })
  );
};
