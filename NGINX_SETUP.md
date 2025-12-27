# Nginx 配置说明

## 文件说明

`nginx-gmij-win.conf` 是用于将 gmij.win 域名反向代理到万界方舟（wanjiedata.com）的 Nginx 配置文件。

## 配置内容

该配置文件包含两个服务器块：

### 1. API 服务反向代理 (maas-openapi.gmij.win)
- 监听 80 端口并强制重定向到 HTTPS
- 监听 443 端口（HTTPS）
- 将请求反向代理到 `https://maas-openapi.wanjiedata.com`
- 配置了适当的代理头和 SSL 设置

### 2. 前端服务反向代理 (fangzhou.gmij.win)
- 监听 80 端口并强制重定向到 HTTPS
- 监听 443 端口（HTTPS）
- 将请求反向代理到 `https://fangzhou.wanjiedata.com`
- 为静态资源配置了缓存策略

## 部署步骤

### 1. 准备 SSL 证书

在部署前，需要为 `gmij.win` 域名准备 SSL 证书。可以使用以下方式：

#### 使用 Let's Encrypt (推荐)

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot certonly --nginx -d maas-openapi.gmij.win -d fangzhou.gmij.win
```

证书会被保存到 `/etc/letsencrypt/live/gmij.win/` 目录。

#### 自定义证书

如果使用自定义证书，请将证书文件放置到 `/etc/nginx/ssl/gmij.win/` 目录：
- `fullchain.pem` - 完整证书链
- `privkey.pem` - 私钥文件

### 2. 安装配置文件

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

### 3. 配置 DNS

确保以下域名的 DNS 记录指向您的服务器 IP：
- `maas-openapi.gmij.win` → 您的服务器 IP
- `fangzhou.gmij.win` → 您的服务器 IP

### 4. 验证配置

```bash
# 检查 API 服务
curl https://maas-openapi.gmij.win/health

# 检查前端服务
curl https://fangzhou.gmij.win
```

## 配置说明

### SSL 证书路径

配置文件中默认的 SSL 证书路径为：
```
ssl_certificate /etc/nginx/ssl/gmij.win/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/gmij.win/privkey.pem;
```

如果使用 Let's Encrypt，请修改为：
```
ssl_certificate /etc/letsencrypt/live/gmij.win/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/gmij.win/privkey.pem;
```

### 日志文件

- API 服务日志：
  - 访问日志: `/var/log/nginx/gmij-win-api-access.log`
  - 错误日志: `/var/log/nginx/gmij-win-api-error.log`

- 前端服务日志：
  - 访问日志: `/var/log/nginx/gmij-win-fangzhou-access.log`
  - 错误日志: `/var/log/nginx/gmij-win-fangzhou-error.log`

### 安全设置

配置文件包含以下安全设置：
- 强制 HTTPS 重定向
- TLS 1.2 和 1.3 支持
- 安全的加密套件
- SSL 会话缓存
- 代理 SSL 验证

### 缓存策略

- API 请求：禁用缓存，确保实时性
- 静态资源（图片、CSS、JS 等）：缓存 30 天

## 故障排除

### 1. 502 Bad Gateway
- 检查目标服务器（wanjiedata.com）是否可访问
- 检查 DNS 解析是否正确
- 检查防火墙规则

### 2. SSL 证书错误
- 确认证书文件路径正确
- 确认证书文件权限正确（通常为 600）
- 确认证书有效期

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

### 更新 SSL 证书

如果使用 Let's Encrypt，证书会自动更新。也可以手动更新：

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### 监控

建议设置监控来跟踪：
- 服务可用性
- 响应时间
- 错误率
- SSL 证书到期时间

## 参考

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Nginx 反向代理指南](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
