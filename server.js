const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initial shell state
let shellState = {
  cwd: '/'
};

// Helper to validate & change directory
function changeDirectory(newPath) {
  const resolvedPath = path.resolve(shellState.cwd, newPath);
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    shellState.cwd = resolvedPath;
    return `Directory changed to ${resolvedPath}`;
  } else {
    return `cd: no such directory: ${newPath}`;
  }
}

app.post('/run', (req, res) => {
  const { command } = req.body;

  // If command is empty
  if (!command.trim()) {
    return res.json({ output: '', cwd: shellState.cwd });
  }

  // Handle 'cd' manually
  if (command.startsWith('cd ')) {
    const dir = command.slice(3).trim();
    const result = changeDirectory(dir);
    return res.json({ output: result, cwd: shellState.cwd });
  }

  // Run command in current directory
  exec(command, { cwd: shellState.cwd }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ output: stderr || error.message, cwd: shellState.cwd });
    }
    res.json({ output: stdout, cwd: shellState.cwd });
  });
});

app.listen(PORT, () => {
  console.log(`Shell server running at http://localhost:${PORT}`);
});
