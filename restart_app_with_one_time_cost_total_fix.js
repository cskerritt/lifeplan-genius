// Script to restart the app with the one-time cost total fix
const { exec } = require('child_process');
const path = require('path');

console.log('Restarting the application with one-time cost total fix...');

// Kill any running instances of the app
exec('pkill -f "node.*vite"', (error) => {
  // Ignore errors from pkill as it will error if no processes are found
  
  // Start the app
  const appProcess = exec('npm run dev', {
    cwd: path.resolve(__dirname)
  });
  
  appProcess.stdout.on('data', (data) => {
    console.log(data);
    
    // When the app is ready, open it in the browser
    if (data.includes('Local:') && data.includes('http://localhost')) {
      console.log('Application started successfully!');
      console.log('Opening in browser...');
      
      // Extract the URL from the output
      const match = data.match(/(http:\/\/localhost:[0-9]+)/);
      if (match && match[1]) {
        const url = match[1];
        
        // Open the URL in the default browser
        const openCommand = process.platform === 'darwin' 
          ? `open "${url}"` 
          : process.platform === 'win32' 
            ? `start "${url}"` 
            : `xdg-open "${url}"`;
            
        exec(openCommand, (err) => {
          if (err) {
            console.error('Failed to open browser:', err);
          } else {
            console.log(`Opened ${url} in your browser`);
          }
        });
      }
    }
  });
  
  appProcess.stderr.on('data', (data) => {
    console.error(data);
  });
  
  appProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`App process exited with code ${code}`);
    }
  });
});
