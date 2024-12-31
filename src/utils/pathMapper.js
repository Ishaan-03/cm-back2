// utils/pathMapper.js
const path = require('path');

function mapUnixPathToWindows(unixPath) {
  // Replace the Unix-style root directory with the equivalent Windows drive letter
  let windowsPath = unixPath.replace('/home/grootsadmin/prototype/resume_data');
  
  // Replace forward slashes with backslashes
  windowsPath = windowsPath.split('/').join('\\');
  
  return windowsPath;
}

module.exports = mapUnixPathToWindows;