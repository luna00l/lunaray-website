# LunaRay High-Performance Static Web Server
$ErrorActionPreference = "Stop"

$port = 3000
if ($args.Count -gt 0) {
    $port = [int]$args[0]
}

$webRoot = $PSScriptRoot
if (-not $webRoot) {
    $webRoot = (Get-Location).Path
}

Write-Host "LunaRay Server starting on port $port serving $webRoot..." -ForegroundColor Cyan

Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

public class LunaServer
{
    private TcpListener _listener;
    private string _root;
    private bool _running;

    public void Start(string root, int port)
    {
        _root = Path.GetFullPath(root);
        _listener = new TcpListener(IPAddress.Loopback, port);
        _listener.Start();
        _running = true;
        Console.WriteLine("[LunaServer] Listening at http://localhost:" + port);
        Task.Run(() => AcceptLoop());
    }

    public void Stop()
    {
        _running = false;
        try { _listener.Stop(); } catch {}
    }

    private async Task AcceptLoop()
    {
        while (_running)
        {
            try
            {
                var client = await _listener.AcceptTcpClientAsync();
                Task.Run(() => HandleClient(client));
            }
            catch
            {
                if (!_running) break;
            }
        }
    }

    private void HandleClient(TcpClient client)
    {
        try
        {
            using (client)
            using (var stream = client.GetStream())
            {
                byte[] buffer = new byte[4096];
                int bytesRead = stream.Read(buffer, 0, buffer.Length);
                if (bytesRead <= 0) return;

                string reqText = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                string[] lines = reqText.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
                if (lines.Length == 0) return;

                string[] parts = lines[0].Split(' ');
                if (parts.Length < 2) return;

                string method = parts[0];
                string rawUrl = parts[1];
                if (rawUrl.Contains("?")) rawUrl = rawUrl.Substring(0, rawUrl.IndexOf("?"));
                string url = Uri.UnescapeDataString(rawUrl);

                if (url == "/" || string.IsNullOrEmpty(url)) url = "/index.html";

                string relPath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                string fullPath = Path.Combine(_root, relPath);

                if (!File.Exists(fullPath))
                {
                    byte[] notFound = Encoding.UTF8.GetBytes("<!DOCTYPE html><html><body><h1>404 Not Found</h1></body></html>");
                    string resHeader = "HTTP/1.1 404 Not Found\r\n" +
                                       "Content-Type: text/html; charset=utf-8\r\n" +
                                       "Content-Length: " + notFound.Length + "\r\n" +
                                       "Connection: close\r\n\r\n";
                    byte[] hb = Encoding.UTF8.GetBytes(resHeader);
                    stream.Write(hb, 0, hb.Length);
                    if (method != "HEAD") stream.Write(notFound, 0, notFound.Length);
                    stream.Flush();
                    return;
                }

                string ext = Path.GetExtension(fullPath).ToLower();
                string mime = "application/octet-stream";
                switch (ext)
                {
                    case ".html": case ".htm": mime = "text/html; charset=utf-8"; break;
                    case ".js": mime = "application/javascript; charset=utf-8"; break;
                    case ".css": mime = "text/css; charset=utf-8"; break;
                    case ".jpg": case ".jpeg": mime = "image/jpeg"; break;
                    case ".png": mime = "image/png"; break;
                    case ".gif": mime = "image/gif"; break;
                    case ".svg": mime = "image/svg+xml"; break;
                    case ".webp": mime = "image/webp"; break;
                    case ".json": mime = "application/json; charset=utf-8"; break;
                    case ".woff2": mime = "font/woff2"; break;
                    case ".woff": mime = "font/woff"; break;
                    case ".ttf": mime = "font/ttf"; break;
                    case ".ico": mime = "image/x-icon"; break;
                    case ".mp3": mime = "audio/mpeg"; break;
                    case ".wav": mime = "audio/wav"; break;
                    case ".mp4": mime = "video/mp4"; break;
                    case ".webm": mime = "video/webm"; break;
                }

                byte[] fileBytes = File.ReadAllBytes(fullPath);
                string cacheControl = (ext == ".jpg" || ext == ".png" || ext == ".webp" || ext == ".mp4") ? "public, max-age=86400" : "no-cache";

                string headers = "HTTP/1.1 200 OK\r\n" +
                                 "Content-Type: " + mime + "\r\n" +
                                 "Content-Length: " + fileBytes.Length + "\r\n" +
                                 "Cache-Control: " + cacheControl + "\r\n" +
                                 "Access-Control-Allow-Origin: *\r\n" +
                                 "Connection: close\r\n\r\n";

                byte[] headBytes = Encoding.UTF8.GetBytes(headers);
                stream.Write(headBytes, 0, headBytes.Length);
                if (method != "HEAD") stream.Write(fileBytes, 0, fileBytes.Length);
                stream.Flush();
            }
        }
        catch {}
    }
}
"@ -IgnoreWarnings

$server = New-Object LunaServer
$server.Start($webRoot, $port)

Write-Host "Server running at http://localhost:$port" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop..." -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    $server.Stop()
    Write-Host "Server stopped." -ForegroundColor Red
}
