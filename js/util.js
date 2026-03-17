function getFormattedUrl(path) {
  if (!path) return "";
  if (path.startsWith('http')) {
    return path;
  }
  var formattedBaseUrl = baseurl.replace(/\/+$/, ''); // 移除 baseurl 末尾的斜杠
  var formattedPath = path.replace(/^\/+/, ''); // 移除 path 开头的斜杠
  return `${formattedBaseUrl}/${formattedPath}`;
}