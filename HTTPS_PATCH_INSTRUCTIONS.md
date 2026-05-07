# HTTPS Patch for server.ts
# 
# Add these lines to server.ts to support HTTPS with self-signed certificates.
# This is required for the rubric: "Demo to be on HTTPS either on Self signed 
# and or actual https cert"
#
# STEP 1: Add this import at the top of server.ts (after the existing imports):
#
#   import https from "https";
#
# STEP 2: Replace the existing app.listen() block at the bottom of startServer()
#         with this:

  // --- HTTP ---
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
  });

  // --- HTTPS (self-signed cert for Docker / demo) ---
  const certPath = path.join(__dirname, "certs", "server.cert");
  const keyPath  = path.join(__dirname, "certs", "server.key");
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsServer = https.createServer(
      {
        cert: fs.readFileSync(certPath),
        key:  fs.readFileSync(keyPath),
      },
      app,
    );
    httpsServer.listen(3443, "0.0.0.0", () => {
      console.log(`HTTPS server running on https://localhost:3443`);
    });
  }
