# Nginx 配置说明

## 文件说明

`nginx-gmij-win.conf` 是用于将 gmij.win 域名（HTTP 80端口）反向代理到万界方舟 wanjiedata.com（HTTPS）的 Nginx 配置文件。

## 配置架构

```
客户端 → HTTP (gmij.win:80) → Nginx → HTTPS (wanjiedata.com:443)
```

## 配置内容

该配置文件包含两个服务器块：

### 1. API 服务反向代理 (maas-openapi.gmij.win)
- 监听 80 端口（HTTP）
- 将请求反向代理到 `https://maas-openapi.wanjiedata.com`
- 配置了适当的代理头和 SSL 设置
- 禁用缓存以确保 API 请求实时性

### 2. 前端服务反向代理 (fangzhou.gmij.win)
- 监听 80 端口（HTTP）
- 将请求反向代理到 `https://fangzhou.wanjiedata.com`
- 为静态资源配置了缓存策略（30天）

## 部署步骤

### 1. 安装配置文件

```bash
# 复制配置文件到 Nginx 配置目录
sudo cp nginx-gmij-win.conf /etc/nginx/sites-available/gmij-win

# 创建符号链接启用站点
sudo ln -s /etc/nginx/sites-available/gmij-win /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx 配置
sudo systemctl reload nginx
```

### 2. 配置 DNS

确保以下域名的 DNS 记录指向您的服务器 IP：
- `maas-openapi.gmij.win` → 您的服务器 IP
- `fangzhou.gmij.win` → 您的服务器 IP

### 3. 验证配置

```bash
# 检查 API 服务（HTTP）
curl http://maas-openapi.gmij.win/health

# 检查前端服务（HTTP）
curl http://fangzhou.gmij.win
```

## 配置说明

### 重要特性

- **HTTP Only**: gmij.win 只提供 HTTP (80端口) 服务
- **HTTPS Upstream**: 后端连接使用 HTTPS 连接到 wanjiedata.com
- **无需 SSL 证书**: gmij.win 服务器不需要配置 SSL 证书
- **代理头设置**: X-Forwarded-Proto 设置为 https，确保后端知道原始请求使用 HTTPS

- API 服务日志：
  - 访问日志: `/var/log/nginx/gmij-win-api-access.log`
  - 错误日志: `/var/log/nginx/gmij-win-api-error.log`

- 前端服务日志：
  - 访问日志: `/var/log/nginx/gmij-win-fangzhou-access.log`
  - 错误日志: `/var/log/nginx/gmij-win-fangzhou-error.log`

### 日志文件

- API 服务日志：
  - 访问日志: `/var/log/nginx/gmij-win-api-access.log`
  - 错误日志: `/var/log/nginx/gmij-win-api-error.log`

- 前端服务日志：
  - 访问日志: `/var/log/nginx/gmij-win-fangzhou-access.log`
  - 错误日志: `/var/log/nginx/gmij-win-fangzhou-error.log`

### 安全设置

配置文件包含以下安全设置：
- 后端 HTTPS 连接使用 SSL 验证
- 安全的代理头设置
- X-Forwarded-Proto 设置为 https

### 缓存策略

- API 请求：禁用缓存，确保实时性
- 静态资源（图片、CSS、JS 等）：缓存 30 天

## 故障排除

### 1. 502 Bad Gateway
- 检查目标服务器（wanjiedata.com）是否可访问
- 检查 DNS 解析是否正确
- 检查防火墙规则

### 2. SSL 证书错误
- 注意：gmij.win 服务器不需要 SSL 证书
- 如果遇到后端 SSL 证书验证错误，检查 `/etc/ssl/certs/ca-certificates.crt` 是否存在
- 可以临时禁用 `proxy_ssl_verify` 进行测试（不推荐在生产环境使用）

### 3. 连接超时
- 调整 `proxy_connect_timeout`、`proxy_send_timeout` 和 `proxy_read_timeout` 参数
- 检查网络连接

### 4. 查看日志
```bash
# 查看访问日志
sudo tail -f /var/log/nginx/gmij-win-api-access.log
sudo tail -f /var/log/nginx/gmij-win-fangzhou-access.log

# 查看错误日志
sudo tail -f /var/log/nginx/gmij-win-api-error.log
sudo tail -f /var/log/nginx/gmij-win-fangzhou-error.log
```

## 维护

### 监控

建议设置监控来跟踪：
- 服务可用性
- 响应时间
- 错误率
- 后端 wanjiedata.com 的连接状态

## 参考

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Nginx 反向代理指南](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
