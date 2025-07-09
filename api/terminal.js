const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

// Helper to change directory safely
function resolveDirectory(currentCwd, target) {
  const resolved = path.resolve(currentCwd, target);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return { success: true, cwd: resolved };
  } else {
    return { success: false, message: `cd: no such directory: ${target}` };
  }
}

app.post('/run', (req, res) => {
  let { command, cwd } = req.body;

  if (!cwd || typeof cwd !== 'string') cwd = '/';

  if (!command.trim()) {
    return res.json({ output: '', cwd });
  }

  // Handle cd manually
  if (command.startsWith('cd ')) {
    const targetDir = command.slice(3).trim();
    const result = resolveDirectory(cwd, targetDir);
    if (result.success) {
      return res.json({ output: `Changed directory to ${result.cwd}`, cwd: result.cwd });
    } else {
      return res.json({ output: result.message, cwd });
    }
  }

  // Run other commands
  exec(command, { cwd }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ output: stderr || err.message, cwd });
    }
    res.json({ output: stdout, cwd });
  });
});

module.exports = serverless(app);
